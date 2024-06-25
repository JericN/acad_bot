import { devs, devServers } from '../../../config.json';
import { getLocalCommands } from '../../utils/discord';
import type { Client, CommandInteraction } from 'discord.js';

module.exports = async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.isCommand()) return;

    const localCommands = getLocalCommands();
    const commandObject = localCommands.find((cmd) => cmd.name === interaction.commandName);

    if (!commandObject) return;

    if (commandObject.devOnly && !devs.includes(interaction.user.id)) {
        await interaction.reply({
            content: 'This command is only available to developers.',
            ephemeral: true,
        });
        return;
    }

    if (commandObject.devServerOnly && interaction.guild && !devServers.includes(interaction.guild.id)) {
        await interaction.reply({
            content: 'This command is only available in the development server.',
            ephemeral: true,
        });
        return;
    }

    // TODO: add role restrictions here

    try {
        console.log(`🚀 Running command "${commandObject.name}"`);
        await commandObject.callback(client, interaction);
    } catch (error) {
        console.log(`🆘 Error in running ${commandObject.name}: ${error}`);
    }
};