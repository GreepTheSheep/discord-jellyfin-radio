import { CommandInteraction, ButtonInteraction, SelectMenuInteraction, ModalSubmitInteraction, Client } from 'discord.js';

/**
 * @type {string}
 */
export const name = 'radio_clearqueue';

/**
 * @type {string}
 */
export const description = 'Clear the entire queue';

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
    client.radio.clearQueue();

    let reply = await interaction.reply({
        content: 'The queue has been cleared.'
    });
    setTimeout(()=>{
        if (reply != null) reply.delete().catch(()=>{});
    }, 20000);
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
