import { CommandInteraction, ButtonInteraction, SelectMenuInteraction, ModalSubmitInteraction, Client } from 'discord.js';

/**
 * @type {string}
 */
export const name = 'radio_removequeue';

/**
 * @type {string}
 */
export const description = 'Remove a song from the queue by its position';

/**
 * @type {Command.commandArgs[]}
 */
export const args = [
    {
        name: 'index',
        description: 'Position of the song in the queue (starts at 1)',
        type: 'number',
        required: true
    }
];

/**
 * @param {CommandInteraction} interaction
 * @param {Command[]} commands
 * @param {Client} client
 */
export const execute = async (interaction, commands, client) => {
    const index = interaction.options.getNumber('index');
    const queue = client.radio.getQueue();

    if (index < 1 || index > queue.length) {
        return interaction.reply({
            content: `Invalid position. The queue contains ${queue.length} song(s).`,
            ephemeral: true
        });
    }

    const removed = client.radio.removeFromQueue(index - 1);

    let reply = await interaction.reply({
        content: `**${removed.item.Name}** was removed from the queue.`
    });
    setTimeout(()=>{
        if (reply != null) reply.delete().catch(()=>{});
    }, 3000);
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
