// import DB from "./db";
// import {Eurobot} from "../../types/index";
import {IntentsBitField, Partials, Message, User, Client, Guild, GuildMember, Role, MessageReaction, ActivityType} from "discord.js";
import * as fs from "fs";
// import * as Conf from "../../conf/discord.json";

class Discord {

    private static instance:Discord;

    public Client:Client

    public Timers:NodeJS.Timeout[] = [];

    // public Config:Eurobot.Config = {};

    private Roles:string[] = [];

    private key:string = process.env.FGD_SCHENGENBOT_DISCORD_KEY || "";

    // Service Instance Initialization
    static getInstance() {
        
        if (!Discord.instance) {
            Discord.instance = new Discord();
        }
        return Discord.instance;

    }

    constructor() {

        try {

            //
            // CONFIG
            //

            // INIT DISCORD CLIENT
            this.Client = new Client({ 
                intents: [
                    IntentsBitField.Flags.MessageContent,
                    IntentsBitField.Flags.Guilds,
                    IntentsBitField.Flags.GuildMessages,
                    IntentsBitField.Flags.GuildMessageReactions,
                ],partials: [
                    Partials.Message,
                    Partials.Channel,
                    Partials.Reaction
                ]
            });

            // // FILL CONFIG

            // get events and set client on/once for each event
            const eventFiles = fs.readdirSync(`${__dirname}/../events`).filter(file=>!file.endsWith('.map'));

            for (const file of eventFiles) {
                const event = require(`${__dirname}/../events/${file}`);
                if (event.once) {
                    this.Client.once(event.name, (...args) => event.execute(...args));
                } else {
                    this.Client.on(event.name, (...args) => event.execute(...args));
                }
            }

            console.log('Events Created');

            // error
            this.Client.on("error",e=>{

                console.log("!! Discord Service Client Error",e);

            });

            // disconnect
            this.Client.on('disconnect',(message:Message)=>{

                if(message) console.log("!! Disconnected from Discord",message);
            
            });

            // login
            this.Client.login(this.key).then(() => {
                console.log("SchengenBot Logged In");

                // // set presence
                // this.Client.user?.setPresence({
                //     activities: [{
                //         name: 'Helmut Kohl',
                //         type: ActivityType.Watching
                //     }],
                //     status: 'online'

                // });

            }).catch((e) => {
                console.error("!! Discord Service Client Login Error", e);
            });

        } catch(e) {

            throw e;
        
        }

    }

}

export default Discord.getInstance();