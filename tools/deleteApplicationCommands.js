require('dotenv').config();
const botId = '1047033806298816533';
const serverId = '922844835931643967';
const { REST, Routes } = require('discord.js');

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// ...

// for guild-based commands
rest.put(Routes.applicationGuildCommands(botId, serverId), { body: [] })
    .then(() => console.log('Successfully deleted all guild commands.'))
    .catch(console.error);

// for global commands
rest.put(Routes.applicationCommands(botId), { body: [] })
    .then(() => console.log('Successfully deleted all application commands.'))
    .catch(console.error);
