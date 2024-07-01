import type { APIApplicationCommandOption, ApplicationCommand, Client } from 'discord.js';
import { areCommandsDifferent, getClientCommands, getLocalCommands } from '../../utils/discord';
import { type LocalCommand } from '../../utils/schema';

function handleExistingCommand(existingCommand: ApplicationCommand, localCommand: LocalCommand) {
    if (localCommand.deleted) {
        existingCommand.delete();
        console.log(`🚮 Deleted command "${localCommand.name}".`);
        return;
    }

    if (areCommandsDifferent(existingCommand, localCommand)) {
        existingCommand.edit(localCommand);
        console.log(`🔁 Edited command "${localCommand.name}".`);
        return;
    }

    console.log(`🆗 Command "${localCommand.name}" is up to date.`);
}

module.exports = async (client: Client) => {
    try {
        const localCommands = getLocalCommands();
        const clientCommands = await getClientCommands(client);

        for (const localCommand of localCommands) {
            const existingCommand = clientCommands.cache.find((cmd) => cmd.name === localCommand.name);

            if (existingCommand) {
                handleExistingCommand(existingCommand, localCommand);
                continue;
            }

            if (localCommand.deleted) {
                console.log(`⏩ Skipped command "${localCommand.name}"`);
                continue;
            }

            clientCommands.create({
                name: localCommand.name,
                description: localCommand.description,
                // TODO: Fix this ugly type cast
                options: localCommand.options as APIApplicationCommandOption[],
            });

            console.log(`🆕 Registered command "${localCommand.name}".`);
        }
    } catch (error) {
        console.log(`🆘 Error registering commands: ${error}`);
    }
};
