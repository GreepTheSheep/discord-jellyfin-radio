import { EmbedBuilder, CommandInteraction, ButtonInteraction, SelectMenuInteraction, ModalSubmitInteraction, Client } from 'discord.js';

/**
 * @type {string}
 */
export const name = 'radio_queue';

/**
 * @type {string}
 */
export const description = 'Show the queue and the current song';

/**
 * @type {Command.commandArgs[]}
 */
export const args = [];

/**
 * @param {CommandInteraction} interaction
 * @param {Command[]} commands
 * @param {Client} client
 */
export const execute = async (interaction, commands, client) => {
    const queue = client.radio.getQueue();

    const embed = new EmbedBuilder()
        .setColor('#9C01C4')
        .setTitle('Queue');

    if (queue.length === 0) {
        embed.setDescription('The queue is empty. The bot is currently playing in random radio mode.');
    } else {
        const queueLines = queue.map((entry, index) => {
            return `**${index + 1}.** ${entry.item.Name} — ${entry.item.Artists?.join(', ') ?? 'Unknown'} (added by **${entry.userName}**)`;
        });
        embed.setDescription(queueLines.join('\n'));
    }

    await interaction.reply({
        embeds: [embed]
    });
};

/**
 * @param {ButtonInteraction} interaction
 * @param {string} buttonId
 * @param {string} argument
 * @param {Command[]} commands
 */
export const executeButton = async (interaction, buttonId, argument, commands) => {};

/**
 * @param {SelectMenuInteraction} interaction
 * @param {string} categoryId
 * @param {string} argument
 * @param {Command[]} commands
 */
export const executeSelectMenu = async (interaction, categoryId, argument, commands) => {};

/**
 * @param {ModalSubmitInteraction} interaction
 * @param {string} modalId
 * @param {string} argument
 * @param {Command[]} commands
 */
export const executeModal = async (interaction, modalId, argument, commands) => {};
