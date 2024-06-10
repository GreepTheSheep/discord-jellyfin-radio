require('dotenv').config();
const Command = require('./structures/Command'),
    { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js'),
    client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
        partials: [Partials.Channel]
    });

client.login().catch(err=>{
    console.error("❌ Connexion to Discord failed: " + err);
    process.exit(1);
});

/**
 * The list of commands the bot will use
 * @type {Command[]}
 */
let commands=[];


client.on('ready', async () => {
    console.log(`🤖 Logged in as ${client.user.tag}!`);
    client.user.setActivity({name: 'Bot is starting up...', type: ActivityType.Custom});

    commands = require('./fetchAllCommands')();

    // Register commands
    await require('./registerCommandsScript')(null, client.user.id, commands);
    // client.guilds.cache.forEach(async (guild) => {
    //     await require('./registerCommandsScript')(guild.id, client.user.id, commands);
    // });
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            const command = commands.find(c => c.name === interaction.commandName);
            if (!command) return;

            await command.execute(interaction, commands);

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