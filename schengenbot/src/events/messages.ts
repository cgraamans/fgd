import discord from "../services/discord";
import {Message,EmbedBuilder, TextChannel, ChannelType, BaseMessageOptions, MessageType, MessageReplyOptions, MessageCreateOptions} from "discord.js";
import db from "../services/db";
import urlMetadata from "url-metadata";
import { mkdirSync } from "fs";
import { T } from "../../types/index";
import { RowDataPacket, ResultSetHeader } from "mysql2";

module.exports = {

	name: 'messageCreate',

	/**
	 * Handle replacfement of messages on Discord.
	 * @param {Message} message - The message that is to be replaced.
	 * @return {Promise<void>}
	 * @description This function replaces Discord messages with bot generated messages.
	 */
	async replaceMessageLink(message:Message,payload:MessageCreateOptions|MessageReplyOptions): Promise<void> {

		if(!message.guild) return;
		if(!message.channel) return;
		if(!message.channel.isTextBased()) return;

		if(message.type === MessageType.Reply) {

			const parentMsg = await message.fetchReference();
			await parentMsg.reply(payload);

		} else {

			await (message.channel as TextChannel).send(payload);

		}

		await message.delete();

		return;

	},

	/**
	 * Get metadata for a link and insert it into the database.
	 * @param linkId - The ID of the link in the database.
	 * @param url - The URL to fetch metadata from.
	 * @returns A promise that resolves to the metadata object or null if an error occurs.
	 */
	async setLinkMetaData(linkId:number,url:string):Promise<urlMetadata.Result|null> {

		console.log("Fetching metadata for URL:", url);

		try {

			// get metadata
			const metadata:urlMetadata.Result|null = await urlMetadata(url).catch((err: any): null => {
				console.error(`Error fetching metadata for ${url}:`, err);
				return null;
			});

			console.log("Metadata fetched:", metadata);


			if(!metadata) {
				console.warn(`No metadata found for ${url}`);
				return null;
			}

			if(metadata) {

				let image = metadata["og:image"] || metadata["twitter:image"] || metadata["image"];
				let title = metadata["og:title"] || metadata["twitter:title"] || metadata["title"];
				let description = metadata["og:description"] || metadata["twitter:description"] || metadata["description"];
				let video = metadata["og:video"] || metadata["twitter:player"] || metadata["video"];
				if(url.includes("tenor.com")){
					video = metadata["og:video:secure_url"] || metadata["twitter:player:secure_url"];
				}

				const [media] = await db.connection.query<ResultSetHeader>("INSERT INTO i_metadata (link_id,title,description,image,video) VALUES (?,?,?,?,?)", [
					linkId,
					title || null,
					description || null,
					image || null,
					video || null
				]);

				console.log("Metadata Inserted:", media);

				if(description|title) 
					await this.setMetaDataTags({linkId,description:description,title:title});

			}


			return metadata;

		} catch (error) {
			console.error(`Error fetching metadata for ${url}:`, error);
			return null;
		}
	},



	async setMetaDataTags(metadata:{linkId:number,description?:string,title?:string}):Promise<void> {

		if(!metadata || !metadata.linkId) return;
		if(!metadata.description && !metadata.title) return;

		if(!metadata.title) metadata.title = "";
		if(!metadata.description) metadata.description = "";

		const text = metadata.title + " " + metadata.description;

		if(metadata.description && metadata.description.length < 1) return;

		// get tags from description and title

		const tagResults = await db.connection.query<ResultSetHeader>(`

            	SELECT id, tag, countryId, cityId, capitalId, orgId, pplId
            	FROM tags
            	WHERE BINARY ? LIKE CONCAT('%', tag, '%')
            	ORDER by LENGTH(tag) DESC;
			`, [text]);

		console.log("Tag Results:", tagResults);

		return;

	},
	

	// Main Execution Function
	//
	async execute(message:Message) {

		// only messages in guilds
		if (!message.guild) return;

		let itemId:null|number = null;

		// get messages with links
		if (message.content.includes('http') || message.content.includes('https')) {

			if(message.author === discord.Client.user) return;

			// check if channel is in categories
			const [categoryIds] = await db.connection.query<T.itemId[]>("SELECT id FROM i_categories WHERE channel_id = ? AND isIgnored = 0", [message.channel.id]);
			if (categoryIds.length > 0) {

				// get all links in the message
				const links = message.content.match(/https?:\/\/(www.)?[a-zA-Z]+(\.[a-zA-Z]+)+(\/(\w|[-_%.#?=&+])+)+/g);
				if(links && links.length > 0) {

					// Make unique links
					let uniqueLinks:string[] = [];

					for (let link of links) {

						//
						// remove custom discord redirect links
						//
						if(link.includes("fxtwitter.com")) {
							link = link.replace(/(fxtwitter\.com)/gm,"x.com");
						}

						if(link.includes("vxtwitter.com")) {
							link = link.replace(/(vxtwitter\.com)/gm,"x.com");
						}

						// if(link.includes("xbsky.app")) {
						// 	link = link.replace(/(https:\/\/xbsky\.app)/gm,"https://bsky.app");
						// }

						if(link.includes("kknstagram.com")) {
							link = link.replace(/(kkinstagram\.com)/gm,"instagram.com");
						}

						if(link.includes("rxddit.com")) {
							link = link.replace(/(rxddit\.com)/gm,"reddit.com");
						}

						if(link.includes("player.spotify.com")) {
							link = link.replace(/(player\.spotify\.com)/gm,"open.spotify.com");
						}

						// check if link already exists in the database
						const [linkExists] = await db.connection.query<any[]>("SELECT url FROM i_links WHERE url = ?", [link])
						if (linkExists.length < 1) {
						
							uniqueLinks.push(link);
						
						}

					}
					if(uniqueLinks.length > 0) {

						// if is a reply, get the parent item id
						let replyTo:null|number = null;
						if(message.type === MessageType.Reply) {
						
							const parentMsg = await message.fetchReference();
							if(parentMsg.id) {
								
								const [parentItem] = await db.connection.query<T.itemId[]>("SELECT id FROM items WHERE message_id = ?", [parentMsg.id]);
								if(parentItem.length > 0) {
									replyTo = parentItem[0].id;
								}
							}
						
						}

						// if the message author is a bot, check if it mentions users and use that
						let author = message.author.username;
						if(message.author.bot && message.mentions.users.size > 0) {
						
							// if the message is from a bot and mentions users, use the first mentioned user as author
							author = message.mentions.users.first().username;

						}

						// insert item
						const [item] = await db.connection.query<ResultSetHeader>("INSERT INTO items (message_id,reply_to,user,category_id,dt,content) VALUES (?,?,?,?,?,?)", [
							message.id,
							replyTo,
							author,
							categoryIds[0].id,
							Math.floor(new Date().getTime() / 1000),
							message.content
						]);
						itemId = item.insertId;

						// insert links into the database
						for(const url of uniqueLinks) {

							const [link] = await db.connection.query<ResultSetHeader>("INSERT INTO i_links (url,item_id) VALUES (?,?)", [url,itemId]);
							const linkId = link.insertId;

							// if the url is not an image, get metadata
							if(!url.endsWith(".png") 
								|| !url.endsWith(".jpg") 
								|| !url.endsWith(".jpeg") 
								|| !url.endsWith(".gif") 
								|| !url.endsWith(".webp") 
								|| !url.endsWith(".svg")) {

								const metadata = await this.setLinkMetaData(linkId,url);

							}

						}

					}
				
				}

			}
		
		}

		//get messages with images
		if (message.attachments.size > 0) {

			// check if channel is in categories
			const [categoryIds] = await db.connection.query<T.itemId[]>("SELECT id FROM i_categories WHERE channel_id = ?", [message.channel.id]);
			if (categoryIds.length > 0) {

				if(!itemId) {



				}
				
			}

		}
		
		//
		// URL REPLACERS FOR SOCIAL MEDIA LINKS
		//

		// check if channel is in categories
		const [categoryIds] = await db.connection.query<T.itemId[]>("SELECT id FROM i_categories WHERE channel_id = ? AND isIgnored = 1", [message.channel.id]);
		if (categoryIds.length < 1) {

			//
			// Twitter Replace
			//
			// Regex:
			// https:\/\/(www\.)?((twitter)|(x))(\.com)\/\w*\/status\/[0-9]*
			if(message.content.match(/https:\/\/(www\.)?((twitter)|(x))(\.com)\/\w*\/status\/[0-9]*/gm)) {

				const cleaned = message.content.replace(/(twitter|x)(\.com)/gm,"fxtwitter.com");

				const payload = {
					content:`By ${message.author.toString()} in ${message.channel.toString()}\n${cleaned}`,
					flags:[4096]
				};

				await this.replaceMessageLink(message,payload);

				return;

			}

			//
			// Reddit Replace
			if(message.content.includes('https://reddit.com') || message.content.includes('https://www.reddit.com')) {
			
				const cleaned = message.content.replace(/(reddit\.com)/gm,"redditez.com");
			
				const payload = {
					content:`By ${message.author.toString()} in ${message.channel.toString()}\n${cleaned}`,
					flags:[4096]
				};

				await this.replaceMessageLink(message,payload);

				return;

			}

			//
			// Instagram Replace
			if(message.content.includes('https://instagram.com') || message.content.includes('https://www.instagram.com')) {
				
				const cleaned = message.content.replace(/(instagram\.com)/gm,"kkinstagram.com");
				const payload = {
					content:`By ${message.author.toString()} in ${message.channel.toString()}\n${cleaned}`,
					flags:[4096]
				};

				await this.replaceMessageLink(message,payload);

				return;
			
			}

			//
			// Bluesky Replace
			// if(message.content.includes('https://bsky.app')) {

			// 	const cleaned = message.content.replace(/(https\:\/\/bsky\.app)/gm,"https://xbsky.app");
			// 	const payload = {
			// 		content:`By ${message.author.toString()} in ${message.channel.toString()}\n${cleaned}`,
			// 		flags:[4096]
			// 	};

			// 	await this.replaceMessageLink(message,payload);

			// 	return;
			// }

			//
			// Spotify Replace
			if(message.content.includes('https://open.spotify.com/')) {

				const cleaned = message.content.replace(/(open\.spotify)/gm,"player.spotify");
				const payload = {
					content:`By ${message.author.toString()} in ${message.channel.toString()}\n${cleaned}`,
					flags:[4096]
				};

				await this.replaceMessageLink(message,payload);

				return;

			}

		}

    }

};
