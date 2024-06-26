const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    deleted: true,

    name: 'send',
    description: 'Send your message via bot',

    options: [
        {
            name: 'message',
            description: 'Message you want to send',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    developmentServerOnly: true,

    callback: async (client, interaction) => {
        const reply = await interaction.options.get('message').value;
        interaction.reply({ content: 'Done :)', ephemeral: true });
        await interaction.channel.send(reply);
    },
};
