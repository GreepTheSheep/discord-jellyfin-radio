require('dotenv').config();
const Command = require('./structures/Command'),
    { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js'),
    Jellyfin = require("jellyfin"),
    client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
        partials: [Partials.Channel]
    }),
    package = require("../package.json"),
    jf = new Jellyfin.Client({
        clientInfo: {
            name: package.name,
            version: package.version
        }
    }),
    Radio = require("./radio");


jf.login().then(()=>{
    console.log("Connected to Jellyfin as", jf.user.name, "on", jf.options.deviceInfo.name);
    client.login().catch(err=>{
        console.error("❌ Connexion to Discord failed: " + err);
        process.exit(1);
    });
});

/**
 * The list of commands the bot will use
 * @type {Command[]}
 */
let commands=[];


client.on('ready', async () => {
    console.log(`🤖 Logged in as ${client.user.tag}!`);
    /** @type {Radio} */
    const radio = new Radio(client, jf);
    /** @type {Radio} */
    client.radio = radio;

    commands = require('./fetchAllCommands')();

    // Register commands
    await require('./registerCommandsScript')(null, client.user.id, commands);
    // client.guilds.cache.forEach(async (guild) => {
    //     await require('./registerCommandsScript')(guild.id, client.user.id, commands);
    // });

    await client.radio.connectToVoiceChannel();
    client.radio.connection.subscribe(radio.player);
    client.radio.playToPlayer();
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            const command = commands.find(c => c.name === interaction.commandName);
            if (!command) return;

            await command.execute(interaction, commands, client);

        } else if (interaction.isStringSelectMenu()) {

            const command = commands.find(c => c.name === interaction.customId.split('_')[0]);
            if (!command) return;

            let idIndexOf = interaction.customId.indexOf('_')+1,
                categoryId = interaction.customId.substring(idIndexOf, interaction.customId.indexOf('_', idIndexOf)),
                argument = null;

            if (categoryId === command.name+'_') categoryId = interaction.customId.substring(idIndexOf);
            else argument = interaction.customId.substring(interaction.customId.indexOf('_', idIndexOf)+1);

            await command.executeSelectMenu(interaction, categoryId, argument, commands);

        } else if (interaction.isButton()) {

            const command = commands.find(c => c.name === interaction.customId.split('_')[0]);
            if (!command) return;

            let idIndexOf = interaction.customId.indexOf('_')+1,
                buttonId = interaction.customId.substring(idIndexOf, interaction.customId.indexOf('_', idIndexOf)),
                argument = null;

            if (buttonId === command.name+'_') buttonId = interaction.customId.substring(idIndexOf);
            else argument = interaction.customId.substring(interaction.customId.indexOf('_', idIndexOf)+1);

            await command.executeButton(interaction, buttonId, argument, commands);

        } else if (interaction.isModalSubmit()) {
            const command = commands.find(c => c.name === interaction.customId.split('_')[0]);
            if (!command) return;

            let idIndexOf = interaction.customId.indexOf('_')+1,
                modalId = interaction.customId.substring(idIndexOf, interaction.customId.indexOf('_', idIndexOf)),
                argument = null;

            if (modalId === command.name+'_') modalId = interaction.customId.substring(idIndexOf);
            else argument = interaction.customId.substring(interaction.customId.indexOf('_', idIndexOf)+1);

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
    // require('./registerCommandsScript')(guild.id, client.user.id, commands);
});

client.on('guildDelete', guild=>{
    console.log('📌 Guild left: ' + guild.name);
});