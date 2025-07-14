import discord from "../services/discord";
import {Message,EmbedBuilder, TextChannel, ChannelType, BaseMessageOptions, MessageType, MessageReplyOptions, MessageCreateOptions} from "discord.js";
import db from "../services/db";
import urlMetadata from "url-metadata";
import { mkdirSync } from "fs";
import { T } from "../../types/index";
import { RowDataPacket, ResultSetHeader } from "mysql2";

module.exports = {

	name: 'messageCreate',

	async replaceMessageLink(message:Message,payload:MessageCreateOptions|MessageReplyOptions) {

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

	//
	// Main Execution Function
	//
	async execute(message:Message) {

		// only messages in guilds
		if (!message.guild) return;

		// get the message_id if it already ex
		let itemId:null|number = null;

		// get messages with links
		if (message.content.includes('http') || message.content.includes('https')) {

			if(message.author === discord.Client.user) return;

			// check if channel is in categories
			const [categoryIds] = await db.connection.query<T.itemId[]>("SELECT id FROM i_categories WHERE channel_id = ?", [message.channel.id]);
			if (categoryIds.length > 0) {
			
				// get all links in the message
				const links = message.content.match(/\bhttps?:\/\/\S+/gi);
				let uniqueLinks = [];

				// Make unique links
				for (let link of links) {

					// remove archive.ph ending if it's a )
					if( link.includes("archive.ph") && link.endsWith(')')) {
						link = link.slice(0, -1);
					}

					// remove embedded urls ending if it's a >)
					if(link.endsWith('>)')) {
						link = link.slice(0, -2);
					}

					//
					// remove custom discord redirect links
					//
					if(link.includes("fxtwitter.com")) {
						link = link.replace(/(fxtwitter\.com)/gm,"x.com");
					}

					if(link.includes("vxtwitter.com")) {
						link = link.replace(/(vxtwitter\.com)/gm,"x.com");
					}

					if(link.includes("xbsky.app")) {
						link = link.replace(/(https:\/\/xbsky\.app)/gm,"https://bsky.app");
					}

					if(link.includes("ddinstagram.com")) {
						link = link.replace(/(ddinstagram\.com)/gm,"instagram.com");
					}

					if(link.includes("rxddit.com")) {
						link = link.replace(/(rxddit\.com)/gm,"reddit.com");
					}

					// check if link already exists in the database
					const [linkExists] = await db.connection.query<any[]>("SELECT url FROM i_links WHERE url = ?", [link])
					if (linkExists.length < 1) {
					
						uniqueLinks.push(link);
					
					}

				}

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

					await db.connection.query<ResultSetHeader>("INSERT INTO i_links (url,item_id) VALUES (?,?)", [url,itemId]);

					// if the url is not an image, get metadata
					if(!url.endsWith(".png") 
						|| !url.endsWith(".jpg") 
						|| !url.endsWith(".jpeg") 
						|| !url.endsWith(".gif") 
						|| !url.endsWith(".webp") 
						|| !url.endsWith(".svg")) {

						// get metadata
						const metadata = await urlMetadata(url).catch((err) => {
							console.error(`Error fetching metadata for ${url}:`, err);
							return null;
						});
						console.log(`Metadata for ${url}:`, metadata);

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

		//
		// Twitter Replace
		//
		// Regex:
		// https:\/\/(www\.)?((twitter)|(x))(\.com)\/\w*\/status\/[0-9]*
		if(message.content.match(/https:\/\/(www\.)?((twitter)|(x))(\.com)\/\w*\/status\/[0-9]*/gm)) {

			const cleaned = message.content.replace(/(twitter|x)(\.com)/gm,"vxtwitter.com");

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
		
			const cleaned = message.content.replace(/(reddit\.com)/gm,"rxddit.com");
		
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
			
			const cleaned = message.content.replace(/(instagram\.com)/gm,"ddinstagram.com");
			const payload = {
				content:`By ${message.author.toString()} in ${message.channel.toString()}\n${cleaned}`,
				flags:[4096]
			};

			await this.replaceMessageLink(message,payload);

			return;
		
		}

		//
		// Bluesky Replace
		if(message.content.includes('https://bsky.app')) {

			const cleaned = message.content.replace(/(https\:\/\/bsky\.app)/gm,"https://xbsky.app");
			const payload = {
				content:`By ${message.author.toString()} in ${message.channel.toString()}\n${cleaned}`,
				flags:[4096]
			};

			await this.replaceMessageLink(message,payload);

			return;
		}

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

};
