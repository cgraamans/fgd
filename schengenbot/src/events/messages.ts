import discord from "../services/discord";
import reddit from "../services/reddit";
import {Message,EmbedBuilder, TextChannel, ChannelType, BaseMessageOptions, MessageType, MessageReplyOptions, MessageCreateOptions} from "discord.js";
import db from "../services/db";
import urlMetadata from "url-metadata";
import { mkdirSync } from "fs";
import { T } from "../../types/index";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { text } from "stream/consumers";

module.exports = {

	name: 'messageCreate',

	// /**
	//  * Handle replacfement of messages on Discord.
	//  * @param {Message} message - The message that is to be replaced.
	//  * @return {Promise<void>}
	//  * @description This function replaces Discord messages with bot generated messages.
	//  */
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

	cleanMessageContent(message:Message):string|undefined {

		let cleaned:string|undefined;

		if(message.content.startsWith("!")) {
			return;
		}

		// No Eurobot replacements
		if(message.author.id === "673969077319892992") {
			return;
		}

		// Twitter/X Replace
		if(message.content.match(/https:\/\/(www\.)?((twitter)|(x))(\.com)\/\w*\/status\/[0-9]*/gm)) {

			cleaned = message.content.replace(/(twitter|x)(\.com)/gm,"fxtwitter.com");
		
		}

		// Instagram Replace
		if(message.content.includes('https://instagram.com') || message.content.includes('https://www.instagram.com')) {
			
			cleaned = message.content.replace(/(instagram\.com)/gm,"kkinstagram.com");

		}

		// Threads Replace
		if(message.content.includes('https://threads.com') || message.content.includes('https://www.threads.com')) {
				
			cleaned = message.content.replace(/(threads\.com)/gm,"fzthreads.com");

		}

		// Spotify Replace
		if(message.content.includes('https://open.spotify.com/')) {

			cleaned = message.content.replace(/(open\.spotify)/gm,"player.spotify");

		}

		// Reddit Replace
		if(message.content.includes('https://reddit.com') || message.content.includes('https://www.reddit.com')) {
			
			const match = message.content.match(/\/(?:s|comments)\/([a-z0-9]+)/i);

			if (match.length > 0) {
		
				cleaned = message.content.replace(/(reddit\.com)/gm,"vxreddit.com");

			}
		}

		return cleaned;

	},

	// /**
	//  * Get metadata for a link and insert it into the database.
	//  * @param linkId - The ID of the link in the database.
	//  * @param url - The URL to fetch metadata from.
	//  * @returns A promise that resolves to the metadata object or null if an error occurs.
	//  */
	// async setLinkMetaData(linkId:number,url:string):Promise<urlMetadata.Result|null> {

	// 	console.log("Fetching metadata for URL:", url);

	// 	try {

	// 		// get metadata
	// 		const metadata:urlMetadata.Result|null = await urlMetadata(url).catch((err: any): null => {
	// 			console.error(`Error fetching metadata for ${url}:`, err);
	// 			return null;
	// 		});

	// 		console.log("Metadata fetched:", metadata);


	// 		if(!metadata) {
	// 			console.warn(`No metadata found for ${url}`);
	// 			return null;
	// 		}

	// 		if(metadata) {

	// 			let image = metadata["og:image"] || metadata["twitter:image"] || metadata["image"];
	// 			let title = metadata["og:title"] || metadata["twitter:title"] || metadata["title"];
	// 			let description = metadata["og:description"] || metadata["twitter:description"] || metadata["description"];
	// 			let video = metadata["og:video"] || metadata["twitter:player"] || metadata["video"];
	// 			if(url.includes("tenor.com")){
	// 				video = metadata["og:video:secure_url"] || metadata["twitter:player:secure_url"];
	// 			}

	// 			const [media] = await db.connection.query<ResultSetHeader>("INSERT INTO i_metadata (link_id,title,description,image,video) VALUES (?,?,?,?,?)", [
	// 				linkId,
	// 				title || null,
	// 				description || null,
	// 				image || null,
	// 				video || null
	// 			]);

	// 			console.log("Metadata Inserted:", media);

	// 			if(description|title) 
	// 				await this.setMetaDataTags({linkId,description:description,title:title});

	// 		}


	// 		return metadata;

	// 	} catch (error) {
	// 		console.error(`Error fetching metadata for ${url}:`, error);
	// 		return null;
	// 	}
	// },



	// async setMetaDataTags(metadata:{linkId:number,description?:string,title?:string}):Promise<void> {

	// 	if(!metadata || !metadata.linkId) return;
	// 	if(!metadata.description && !metadata.title) return;

	// 	if(!metadata.title) metadata.title = "";
	// 	if(!metadata.description) metadata.description = "";

	// 	const text = metadata.title + " " + metadata.description;

	// 	if(metadata.description && metadata.description.length < 1) return;

	// 	// get tags from description and title

	// 	const tagResults = await db.connection.query<ResultSetHeader>(`

    //         	SELECT id, tag, countryId, cityId, capitalId, orgId, pplId
    //         	FROM tags
    //         	WHERE BINARY ? LIKE CONCAT('%', tag, '%')
    //         	ORDER by LENGTH(tag) DESC;
	// 		`, [text]);

	// 	console.log("Tag Results:", tagResults);

	// 	return;

	// },
	

	// Main Execution Function
	//
	async execute(message:Message) {

		if(!message) return;

		// only messages in guilds
		if (!message.guild) return;
		
		//
		// URL REPLACERS FOR SOCIAL MEDIA LINKS
		//

		// check if channel is in categories
		const [categoryIds] = await db.connection.query<T.itemId[]>("SELECT id FROM i_categories WHERE channel_id = ? AND isIgnored = 1", [message.channel.id]);
		if (categoryIds.length < 1) {

			const cleaned = this.cleanMessageContent(message);

			if(cleaned) {

				const payload = {
					content:`By ${message.author.toString()} in ${message.channel.toString()}\n${cleaned}`,
					flags:[4096]
				};

				await this.replaceMessageLink(message,payload);

			}

			return;

		}

    }

};
