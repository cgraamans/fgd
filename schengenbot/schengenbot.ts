import * as fs from "fs";
import { Collection, EmbedBuilder, TextChannel} from "discord.js";
import discord from "./src/services/discord";
import db from "./src/services/db";
import * as T from "./types"
// import * as schedule from "node-schedule";

import * as path from 'path';
// SET COMMANDS
try {

    discord.Client.commands = new Collection();

    const foldersPath = path.join(__dirname,'/src/commands');
    const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {

        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
    
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ('data' in command && 'execute' in command) {
                discord.Client.commands.set(command.data.name, command);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }

	}

} catch(e) {

    console.log(e);

}

// INTERACTIONS
discord.Client.on("interactionCreate", async (interaction)=>{

    if (!interaction.isCommand()) return;

    const command = discord.Client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`>> ${interaction.commandName} by ${interaction.user.username}`,error,`\n`);
        await interaction.reply({ content: 'Eurobot errored while executing this command!', ephemeral: true });
    }

});
