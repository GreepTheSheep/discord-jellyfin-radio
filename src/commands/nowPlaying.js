import { EmbedBuilder, CommandInteraction, ButtonInteraction, SelectMenuInteraction, ModalSubmitInteraction, Client } from 'discord.js';

/**
 * Set the command here, it's what we'll type in the message
 * @type {string}
 */
export const name = 'radio_nowplaying';

/**
 * Set the description here, this is what will show up when you need help for the command
 * @type {string}
 */
export const description = 'Shows the current song playing';

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
    let nowPlayingItem = client.radio.nowPlayingItem;
    let channel = interaction.guild.members.me.voice.channel;
    let embed = new EmbedBuilder();

    embed.setTitle(`Now playing ${channel != null ? `on https://discord.com/channels/${channel.guild.id}/${channel.id}` : ""}`);
    embed.addFields([
        {
            name: "Title",
            value: nowPlayingItem.Name
        },
        {
            name: `Artist${nowPlayingItem.Artists?.length > 1 ? "s" : ""}`,
            value: nowPlayingItem.Artists?.join(", ") ?? "Unknown"
        },
        {
            name: "Album",
            value: nowPlayingItem.Album ?? "Unknown"
        }
    ]);
    embed.setThumbnail(client.radio.jellyfin.basePath + "/Items/" + nowPlayingItem.Id + "/Images/Primary");

    interaction.reply({
        embeds: [embed]
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
