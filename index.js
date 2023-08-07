const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token } = require('./config.json');
const { DeployCommands } = require('./deploy-commands');
const mongoose = require('mongoose');
const { DisTube } = require('distube');
const fs = require('fs');
require('colors');
require("dotenv").config();
const process = require ('node:process');

process.on('unhandledRejection', (reason, promise) =>{
console.log ('unhandeledRejection at:', promise, 'reason', reason)
})


const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
] });
client.distube = new DisTube(client, {
    emitNewSongOnly: false,
    leaveOnEmpty: true,
    leaveOnFinish: true,
    leaveOnStop: false,
    savePreviousSongs: true,
    emitAddSongWhenCreatingQueue: false,
    searchSongs: 10,
    nsfw: false,
    emptyCooldown: 25
});

(async () => {
    await DeployCommands(); // Deploy commands

    // متحكم ب event
    const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js')); 
    for (const file of eventFiles) {
        const event = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }

    // المتحكم ب جميع الكومداندات
    client.commands = new Collection();
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
    }

    let commandNameLength = 0;
    for (const command of client.commands) {
        if (command[0].length > commandNameLength) {
            commandNameLength = command[0].length;
        }
    }

    for (const command of client.commands) {
        console.log(`[COMMAND] ${command[0].padEnd(commandNameLength)} | ${'Loaded!'.green}`.gray); 
    }

    if (!fs.existsSync('./errors')) {
        fs.mkdirSync('./errors');
    }

    if (!fs.existsSync('./database')) {
        fs.mkdirSync('./database');
    	};

	mongoose.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}).then(() => {
		console.log('Connected to MongoDB')
	}).catch((error) => console.error(error));
 
    client.login(token); // bot log in 
})();
