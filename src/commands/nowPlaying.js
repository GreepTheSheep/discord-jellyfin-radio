const Command = require('../structures/Command'),
    {MessageEmbed, CommandInteraction, SelectMenuInteraction, Message, MessageActionRow, MessageButton, MessageSelectMenu, ButtonStyle, Client, EmbedBuilder } = require('discord.js');

/**
 * Set the command here, it's what we'll type in the message
 * @type {string}
 */
exports.name = 'radio_nowplaying';


/**
 * Set the description here, this is what will show up when you need help for the command
 * @type {string}
 */
exports.description = 'Shows the current song playing';


/**
 * Set the command arguments here, this is what will show up when you type the command
 * @type {Command.commandArgs[]}
 */
exports.args = [];

/**
 * Set the usage here, this is what will show up when you type the command
 * This part is executed as slash command
 * @param {CommandInteraction} interaction
 * @param {Command[]} commands
 * @param {Client} client
 */
exports.execute = async (interaction, commands, client) => {
    let nowPlayingItem = client.radio.nowPlayingItem;
    let channel = interaction.guild.members.me.voice.channel;
    let embed = new EmbedBuilder();

    embed.setTitle(`Now playing ${channel != null ? `on https://discord.com/channels/${channel.guild.id}/${channel.id}` : ""}`);
    embed.addFields([
        {
            name: "Title",
            value: nowPlayingItem.name
        },
        {
            name: `Artist${nowPlayingItem.artists.length > 1 ? "s" : ""}`,
            value: nowPlayingItem.artists.join(", ")
        },
        {
            name: "Album",
            value: nowPlayingItem.album
        }
    ]);
    embed.setThumbnail(client.radio.jellyfin.options.baseUrl + "Items/" + nowPlayingItem.id + "/Images/Primary");

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
exports.executeButton = async (interaction, buttonId, argument, commands) => {};

/**
 * This method is executed when an update is made in a selectMenu
 * @param {SelectMenuInteraction} interaction
 * @param {string} categoryId
 * @param {string} argument
 * @param {Command[]} commands
 */
exports.executeSelectMenu = async (interaction, categoryId, argument, commands) => {};

/**
 * This method is executed when a modal dialog is submitted
 * @param {ModalSubmitInteraction} interaction
 * @param {string} modalId
 * @param {string} argument
 * @param {Command[]} commands
 */
exports.executeModal = async (interaction, modalId, argument, commands) => {};