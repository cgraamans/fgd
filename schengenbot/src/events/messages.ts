import discord from "../services/discord";
import {Message,EmbedBuilder, TextChannel, ChannelType, BaseMessageOptions, MessageType, MessageReplyOptions, MessageCreateOptions} from "discord.js";
import db from "../services/db";
import urlMetadata from "url-metadata";
import { mkdirSync } from "fs";

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

		if(message.content.includes('https://twitter.com')) return;
		if(message.content.includes('https://bsky.app')) return;


		// get messages with links
		if (message.content.includes('http') || message.content.includes('https')) {
			db.query("SELECT * FROM links WHERE url = ?", [message.content]).then(async (rows:any) => {

				if (rows.length > 0) {
					// link already exists
					return;
				} else {
					// link does not exist, add it
					// const metadata = await urlMetadata(message.content).catch((e:any) => {
					// 	console.error("Error fetching metadata for URL:", e);
					// 	return null;
					// });

				}

			}).catch((error:any) => {
				console.error("Error querying database for links:", error);
			});
		}

		//get messages with images
		if (message.attachments.size > 0) {	
			
		
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
