import { ApplicationCommandOptionType, type Client, type CommandInteraction } from 'discord.js';
import { CommandOption, ListOptions } from '../../utils/schema';
import { calculateSearchInterval, extractUserOptions } from '../../utils/commands';
import { filterEvents, groupEvents } from '../../utils/calendar';
import {
    generateCommandScript,
    generateDateScript,
    generateInvalidEventScript,
    generateValidEventScript,
} from '../../utils/scripts';
import { fetchGoogleCalendarEvents } from '../../database/calendar';

// Slash command options
const commandOptions = [
    {
        name: 'span',
        description: 'Number of weeks to show. [ default : 1 week]',
        type: ApplicationCommandOptionType.Number,
        required: false,
        choices: [
            { name: '1 week', value: 1 },
            { name: '2 weeks', value: 2 },
            { name: '3 weeks', value: 3 },
            { name: '4 weeks', value: 4 },
        ],
        default: 1,
    },
    {
        name: 'start',
        description: 'Start date of the search. [ default : monday ]',
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
            { name: 'monday', value: 'monday' },
            { name: 'today', value: 'today' },
        ],
        default: 'monday',
    },
    {
        name: 'group',
        description: 'Set how the events are grouped. [ default : date ]',
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
            { name: 'date', value: 'date' },
            { name: 'subject', value: 'subject' },
        ],
        default: 'subject',
    },
] as CommandOption[];

// Function to handle the command execution
async function commandCallback(client: Client, interaction: CommandInteraction) {
    // Defer replying to let the user know that the bot has received the interaction
    await interaction.deferReply();

    // Extract user options from the interaction
    const options = extractUserOptions<ListOptions>(interaction, commandOptions);

    // Determine the search interval based on the user-provided options
    const date = calculateSearchInterval(options.span.value, options.start.value);

    // Fetch events from Google Calendar
    const calendarEvents = await fetchGoogleCalendarEvents(date.start, date.end);

    // Separate valid and invalid events
    const { validEvents, invalidEvents } = filterEvents(calendarEvents);

    // Apply grouping to valid events
    const groupedEvents = groupEvents(validEvents, options.group.value);

    // Generate the response script
    const commandScript = generateCommandScript<ListOptions>('list', options);
    const dateScript = generateDateScript(date);
    const validScript = generateValidEventScript(groupedEvents);
    const invalidScript = generateInvalidEventScript(invalidEvents);

    // Send the response script as a reply
    const responseScript = `${commandScript}${dateScript}${validScript}${invalidScript}`;
    await interaction.editReply(responseScript);
}

module.exports = {
    deleted: false,
    devOnly: true,
    allowedServerOnly: true,
    name: 'list',
    description: 'List events from google calendar.',
    options: commandOptions,
    callback: commandCallback,
};
