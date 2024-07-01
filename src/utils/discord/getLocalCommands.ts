import { LocalCommand } from '../schema';
import { getDirectoryContent } from './index';
import path from 'path';

export function getLocalCommands(exceptions = [] as string[]): LocalCommand[] {
    const localCommands: LocalCommand[] = [];

    const commandCategories = getDirectoryContent(path.join(__dirname, '..', '..', 'commands'), true);

    for (const commandCategory of commandCategories) {
        const commandFiles = getDirectoryContent(commandCategory);

        for (const commandFile of commandFiles) {
            if (exceptions.includes(commandFile)) continue;

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const commandFunction = LocalCommand.parse(require(commandFile));
            localCommands.push(commandFunction);
        }
    }
    return localCommands;
}
