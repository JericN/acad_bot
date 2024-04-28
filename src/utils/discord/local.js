const path = require('path');
const { getAllFiles } = require('./index');

function getLocalCommands(exceptions = []) {
    const localCommands = [];

    const commandCategories = getAllFiles(path.join(__dirname, '..', '..', 'commands'), true);

    for (const commandCategory of commandCategories) {
        const commandFiles = getAllFiles(commandCategory);

        for (const commandFile of commandFiles) {
            if (exceptions.includes(commandFile)) continue;

            const commandFunction = require(commandFile);
            localCommands.push(commandFunction);
        }
    }
    return localCommands;
}

module.exports = getLocalCommands;