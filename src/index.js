import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, Partials, ActivityType } from 'discord.js';
import { Jellyfin } from '@jellyfin/sdk';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api.js';
import packageJson from '../package.json' with { type: 'json' };
import Command from './structures/Command.js';
import Radio from './radio.js';
import fetchAllCommands from './fetchAllCommands.js';
import registerCommandsScript from './registerCommandsScript.js';
import crypto from 'node:crypto';

const jellyfin = new Jellyfin({
    clientInfo: {
        name: packageJson.name,
        version: packageJson.version
    },
    deviceInfo: {
        name: packageJson.name,
        id: packageJson.name
    }
});

const api = jellyfin.createApi(process.env.JELLYFIN_URL);

const authResult = await getUserApi(api).authenticateUserByName({
    authenticateUserByName: {
        Username: process.env.JELLYFIN_USERNAME,
        Pw: process.env.JELLYFIN_PASSWORD
    }
});

console.log("Connected to Jellyfin as", authResult.data.User.Name, "on", api.deviceInfo.name);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
    partials: [Partials.Channel]
});

let radio = null;

/**
 * The list of commands the bot will use
 * @type {Command[]}
 */
let commands = [];

client.on('ready', async () => {
    console.log(`🤖 Logged in as ${client.user.tag}!`);
    /** @type {Radio} */
    radio = new Radio(client, api, authResult.data.User);
    /** @type {Radio} */
    client.radio = radio;

    commands = await fetchAllCommands();

    // Register commands
    await registerCommandsScript(null, client.user.id, commands);
    // client.guilds.cache.forEach(async (guild) => {
    //     await registerCommandsScript(guild.id, client.user.id, commands);
    // });

    // Check for aes-256-gcm support
    if (!crypto.getCiphers().includes('aes-256-gcm')) {
        console.error("❌ AES-256-GCM is not supported on your system. Voice connections will not work.");
        process.exit(1);
    } else {
        console.log("✅ AES-256-GCM is supported on your system.");
    }

    try {
        await client.radio.connectToVoiceChannel();
        client.radio.connection.subscribe(radio.player);
        client.radio.playToPlayer();
    } catch (err) {
        console.error("Error detected on voice connect and play audio: " + err);
        process.exit(1);
    }
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            const command = commands.find(c => c.name === interaction.commandName);
            if (!command) return;

            await command.execute(interaction, commands, client);

        } else if (interaction.isStringSelectMenu()) {

            const command = commands.find(c => interaction.customId.startsWith(c.name + '_'));
            if (!command) return;

            let rest = interaction.customId.substring(command.name.length + 1);
            let categoryId = rest;
            let argument = null;
            let secondUnderscore = rest.indexOf('_');
            if (secondUnderscore !== -1) {
                categoryId = rest.substring(0, secondUnderscore);
                argument = rest.substring(secondUnderscore + 1);
            }

            await command.executeSelectMenu(interaction, categoryId, argument, commands);

        } else if (interaction.isButton()) {

            const command = commands.find(c => interaction.customId.startsWith(c.name + '_'));
            if (!command) return;

            let rest = interaction.customId.substring(command.name.length + 1);
            let buttonId = rest;
            let argument = null;
            let secondUnderscore = rest.indexOf('_');
            if (secondUnderscore !== -1) {
                buttonId = rest.substring(0, secondUnderscore);
                argument = rest.substring(secondUnderscore + 1);
            }

            await command.executeButton(interaction, buttonId, argument, commands);

        } else if (interaction.isModalSubmit()) {
            const command = commands.find(c => interaction.customId.startsWith(c.name + '_'));
            if (!command) return;

            let rest = interaction.customId.substring(command.name.length + 1);
            let modalId = rest;
            let argument = null;
            let secondUnderscore = rest.indexOf('_');
            if (secondUnderscore !== -1) {
                modalId = rest.substring(0, secondUnderscore);
                argument = rest.substring(secondUnderscore + 1);
            }

            await command.executeModal(interaction, modalId, argument, commands);
        }
    } catch (err) {
        interaction.reply({
            content: '❌ An error occurred while executing the command: ' + err,
            ephemeral: true
        });
        console.error(err);
    }
});

client.on('guildCreate', guild=>{
    console.log('📌 New guild joined: ' + guild.name);
    // registerCommandsScript(guild.id, client.user.id, commands);
});

client.on('guildDelete', guild=>{
    console.log('📌 Guild left: ' + guild.name);
});

process.on('SIGINT', exit);  // CTRL+C
process.on('SIGQUIT', exit); // Keyboard quit
process.on('SIGTERM', kill); // `kill` command
process.on('SIGWINCH', exit); // docker down or else

function exit() {
    if (radio != null && radio.connection != null) {
        radio.connection.disconnect();
        radio.connection.destroy();
    }
    process.exit(0);
}

function kill() {
    if (radio != null && radio.connection != null) {
        radio.connection.disconnect();
        radio.connection.destroy();
    }
    process.exit(0);
}

await client.login().catch(err => {
    console.error("❌ Connexion to Discord failed: " + err);
    process.exit(1);
});
