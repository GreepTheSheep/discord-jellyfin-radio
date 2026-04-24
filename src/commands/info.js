import { EmbedBuilder, CommandInteraction, ButtonInteraction, SelectMenuInteraction, ModalSubmitInteraction, Client } from 'discord.js';
import { execSync } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * Set the command here, it's what we'll type in the message
 * @type {string}
 */
export const name = 'radio_info';

/**
 * Set the description here, this is what will show up when you need help for the command
 * @type {string}
 */
export const description = 'Bot informations';

/**
 * Set the command arguments here, this is what will show up when you type the command
 * @type {Command.commandArgs[]}
 */
export const args = [];

/**
 * Set the usage here, this is what will show up when you type the command
 * This part is executed as slash command
 * @param {CommandInteraction} interaction
 * @param {Command[]} commands
 * @param {Client} client
 */
export const execute = async (interaction, commands, client) => {
    let packageJson = require('../../package.json'),
        version = packageJson.version,
        jellyfinVersion = packageJson.dependencies['@jellyfin/sdk'].replace('^', ''),
        djsVersion = packageJson.dependencies['discord.js'].replace('^', ''),
        djsVoiceVersion = packageJson.dependencies['@discordjs/voice'].replace('^', ''),
        gitCommit = execSync('git rev-parse --short HEAD').toString().trim(),
        gitCommitDate = new Date(execSync('git show -s --format=%ci HEAD').toString().trim());

    let uptimeTotalSeconds = (interaction.client.uptime) / 1000,
        uptimeWeeks = Math.floor(uptimeTotalSeconds / 604800),
        uptimeDays = Math.floor(uptimeTotalSeconds / 86400),
        uptimeHours = Math.floor(uptimeTotalSeconds / 3600);
    uptimeTotalSeconds %= 3600;
    let uptimeminutes = Math.floor(uptimeTotalSeconds / 60);

    const embed = new EmbedBuilder()
        .setColor("#9C01C4")
        .setTitle('About ' + interaction.client.user.tag)
        .addFields([
            {name:'Version', value:`v${version}\nGit commit: \`${gitCommit}\`\nBuilt at: <t:${gitCommitDate.getTime() / 1000}>`, inline:true},
            {name:'Uptime:', value:`${uptimeWeeks} weeks, ${uptimeDays} days, ${uptimeHours} hours, ${uptimeminutes} minutes`, inline:true},
            {name:'Technical informations', value:`Node.js version ${process.version}\n[Discord.js](https://discord.js.org) version ${djsVersion}\n[Jellyfin SDK](https://github.com/jellyfin/jellyfin-sdk-typescript) version ${jellyfinVersion}\n[Discord.js Voice](https://discord.js.org/docs/packages/voice/main) version ${djsVoiceVersion}`}
        ])
        .setThumbnail(interaction.client.user.displayAvatarURL({size:512}))
        .setFooter({
            text: interaction.client.user.tag,
            iconURL: interaction.client.user.displayAvatarURL({size:128})
        });

    interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
};

/**
 * This method is executed when an a button is clicked in the message
 * @param {ButtonInteraction} interaction
 * @param {string} buttonId
 * @param {string} argument
 * @param {Command[]} commands
 */
export const executeButton = async (interaction, buttonId, argument, commands) => {};

/**
 * This method is executed when an update is made in a selectMenu
 * @param {SelectMenuInteraction} interaction
 * @param {string} categoryId
 * @param {string} argument
 * @param {Command[]} commands
 */
export const executeSelectMenu = async (interaction, categoryId, argument, commands) => {};

/**
 * This method is executed when a modal dialog is submitted
 * @param {ModalSubmitInteraction} interaction
 * @param {string} modalId
 * @param {string} argument
 * @param {Command[]} commands
 */
export const executeModal = async (interaction, modalId, argument, commands) => {};
