import { ApplicationCommandOptionType, type Client, type CommandInteraction } from 'discord.js';
import type { CommandOption, SendOptions } from '../../utils/schema';
import {
    applySubjectFilter,
    calculateSearchInterval,
    extractUserOptions,
    fetchActiveRoles,
    fetchActiveThreads,
    filterSendableEvents,
    findMissingRoles,
    findMissingThreads,
    saveSendLogs,
    sendEventsToChannels,
    validateInputSubjects,
} from '../../utils/commands';
import { filterEvents, groupEvents } from '../../utils/calendar';
import {
    generateCommandScript,
    generateDateScript,
    generateSendOutputScript,
    generateSendWarningScript,
} from '../../utils/scripts';
import { fetchGoogleCalendarEvents } from '../../database/calendar';

const commandOptions = [
    {
        name: 'steps',
        description: 'Number of send command to unsend. [ default : 1 ]',
        type: ApplicationCommandOptionType.Number,
        required: false,
        default: 1,
    },
    {
        name: 'preview',
        description: 'Preview the unsend command without executing it. [ default : false ]',
        type: ApplicationCommandOptionType.Number,
        required: false,
        choices: [
            { name: 'yes', value: 1 },
            { name: 'no', value: 0 },
        ],
        default: 0,
    },
] as CommandOption[];

// Asynchronously handles the execution of a command interaction
async function commandCallback(client: Client, interaction: CommandInteraction) {
    // Defer replying to let the user know that the bot has received the interaction
    await interaction.deferReply();

    // Extract user options from the interaction
    const userOptions = extractUserOptions<SendOptions>(interaction, commandOptions);

    // Determine the search interval based on the user-provided options
    const searchInterval = calculateSearchInterval(userOptions.span.value, userOptions.start.value);

    // Validate the user input subjects
    const invalidSubjects = validateInputSubjects(userOptions.subjects.value);
    if (invalidSubjects.length) {
        await interaction.editReply(`Invalid Input (subjects) : ${invalidSubjects.join(', ')}`);
        return;
    }

    // Fetch events from Google Calendar
    const calendarEvents = await fetchGoogleCalendarEvents(searchInterval.start, searchInterval.end);

    // Separate valid and invalid events
    const { validEvents, invalidEvents } = filterEvents(calendarEvents);

    // Apply subject filter to valid events
    const filteredValidEvents = applySubjectFilter(validEvents, userOptions.subjects.value);
    const validEventSubjects = [...new Set(filteredValidEvents.map((event) => event.subject))];
    const invalidEventSummaries = invalidEvents.map((event) => event.summary);

    // Fetch and verify the existence of threads
    const activeThreads = await fetchActiveThreads('acads', interaction);
    const missingThreads = findMissingThreads(activeThreads, validEventSubjects);

    // Fetch and verify the existence of roles
    const activeRoles = fetchActiveRoles(interaction);
    const missingRoles = findMissingRoles(activeRoles, validEventSubjects);

    // Generate the command script and date script
    const commandScript = generateCommandScript('send', userOptions);
    const dateScript = generateDateScript(searchInterval);

    // End the program if force is not enabled and there are warnings
    const warningFlag = invalidEvents.length || missingThreads.length || missingRoles.length;
    if (!userOptions.force.value && warningFlag) {
        const warningScript = generateSendWarningScript(invalidEventSummaries, missingThreads, missingRoles);
        await interaction.editReply(commandScript + dateScript + warningScript);
        return;
    }

    // Filter out events that are impossible to send
    const sendableEvents = filterSendableEvents(filteredValidEvents, missingThreads, missingRoles);

    // Group the sendable events by subject
    const groupedEvents = groupEvents(sendableEvents, 'subject');

    // Send the grouped events
    const { successfulEvents, failedEvents } = await sendEventsToChannels(
        groupedEvents,
        searchInterval,
        activeThreads,
        activeRoles,
    );

    // Generate the output script
    const outputScript = generateSendOutputScript(successfulEvents, failedEvents);
    const responseScript = commandScript + dateScript + outputScript;

    // Save logs
    await saveSendLogs(successfulEvents);

    // Send the output script
    await interaction.editReply(responseScript);
}

module.exports = {
    deleted: false,
    devOnly: true,
    allowedServerOnly: true,
    name: 'unsend',
    description: 'unsend requirements from threads',
    options: commandOptions,
    callback: commandCallback,
};
