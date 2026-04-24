import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ButtonInteraction, SelectMenuInteraction, ModalSubmitInteraction, Client } from 'discord.js';

/**
 * @type {string}
 */
export const name = 'radio_addqueue';

/**
 * @type {string}
 */
export const description = 'Search a song and add it to the queue';

/**
 * @type {Command.commandArgs[]}
 */
export const args = [
    {
        name: 'query',
        description: 'Song title or artist to search for',
        type: 'string',
        required: true
    }
];

/**
 * @param {CommandInteraction} interaction
 * @param {Command[]} commands
 * @param {Client} client
 */
export const execute = async (interaction, commands, client) => {
    const query = interaction.options.getString('query');
    await interaction.deferReply({ ephemeral: true });

    const results = await client.radio.searchItems(query);

    if (results.length === 0) {
        return interaction.editReply({
            content: 'No results found for this search.'
        });
    }

    client.radio.searchCache.set(interaction.user.id, {
        timestamp: Date.now(),
        results: results
    });

    const embed = new EmbedBuilder()
        .setColor('#0166c4')
        .setTitle('Search results')
        .setDescription('Click a button to add the song to the queue.');

    const fields = results.map((item, index) => ({
        name: `${index + 1}. ${item.Name}`,
        value: `Artist(s): ${item.Artists?.join(', ') ?? 'Unknown'}`
    }));
    embed.addFields(fields);

    const rows = [];
    for (let i = 0; i < results.length; i += 5) {
        const row = new ActionRowBuilder();
        for (let j = i; j < Math.min(i + 5, results.length); j++) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`radio_addqueue_select_${results[j].Id}`)
                    .setLabel(`${j + 1}`)
                    .setStyle(ButtonStyle.Primary)
            );
        }
        rows.push(row);
    }

    await interaction.editReply({
        embeds: [embed],
        components: rows
    });
};

/**
 * @param {ButtonInteraction} interaction
 * @param {string} buttonId
 * @param {string} argument
 * @param {Command[]} commands
 */
export const executeButton = async (interaction, buttonId, argument, commands) => {
    if (!buttonId.startsWith('select')) return;

    const cached = interaction.client.radio.searchCache.get(interaction.user.id);
    if (!cached) {
        return interaction.reply({
            content: 'Search results have expired, please search again.',
            ephemeral: true
        });
    }

    const item = cached.results.find(r => r.Id === argument);
    if (!item) {
        return interaction.reply({
            content: 'Song not found in results.',
            ephemeral: true
        });
    }

    interaction.client.radio.addToQueue(item, interaction.user.id, interaction.user.username);

    await interaction.reply({
        content: `**${item.Name}** was added to the queue by **${interaction.user.username}**.`,
        ephemeral: false
    });
};

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
