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


		// ignore bot messages
		// if (message.author.bot) return;

		if (!message.guild) return;

		// // whitelist channels
		// if (discord.config.whitelistChannels && !discord.config.whitelistChannels.includes(message.channel.id)) {
		// 	return;
		// }

		// get the message_id if it already ex
		let itemId:null|number = null;

		// get messages with links
		if (message.content.includes('http') || message.content.includes('https')) {

			if(message.author === discord.Client.user) return;

			// check if channel is in categories
			const [categoryIds] = await db.connection.query<T.itemId[]>("SELECT id FROM i_categories WHERE channel_id = ?", [message.channel.id]);
			if (categoryIds.length > 0) {
			
				const links = message.content.match(/\bhttps?:\/\/\S+/gi);
				let uniqueLinks = [];

				// Make unique links
				for (const link of links) {

					const [linkExists] = await db.connection.query<any[]>("SELECT url FROM i_links WHERE url = ?", [link])
					if (linkExists.length < 1) {
					
						uniqueLinks.push(link);
					
					}

				}

				console.log(`Unique Links: ${uniqueLinks.length}`);

				const [item] = await db.connection.query<ResultSetHeader>("INSERT INTO items (message_id,user,category_id,dt) VALUES (?,?,?,?)", [
					message.id,
					message.author.username,
					categoryIds[0].id,
					Math.floor(new Date().getTime() / 1000)
				]);
				itemId = item.insertId;

				for(const url of uniqueLinks) {

					await db.connection.query<ResultSetHeader>("INSERT INTO i_links (url,item_id) VALUES (?,?)", [url,itemId]);

					// get metadata
					const metadata = await urlMetadata(url).catch((err) => {
						console.error(`Error fetching metadata for ${url}:`, err);
						return null;
					});
					console.log(`Metadata for ${url}:`, metadata);
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
