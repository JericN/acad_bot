
const fs = require('fs');
const path = require('path');

const { ApplicationCommandOptionType } = require('discord.js');
const getCalendarEvents = require('../../utils/google/getCalendarEvents.js');
const { channel } = require('diagnostics_channel');

const listOfSubjects = fs.readFileSync(path.join(__dirname, '../../data/subjects.txt'), 'utf-8').split(/\r?\n/);
const messageScript = fs.readFileSync(path.join(__dirname, '../../data/scripts/event_message.txt'), 'utf-8');

// Format date to <month> <day>


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



module.exports = {
    deleted: false,
    name: "reqs",
    description: "send list of requirements to their respective channels",
    options: [
        {
            name: 'span',
            description: 'Query search span',
            type: ApplicationCommandOptionType.Number,
            required: true,
            choices: [
                { name: '1 week', value: 1 },
                { name: '2 weeks', value: 2 },
                { name: '3 weeks', value: 3 },
                { name: '4 weeks', value: 4 },
            ]
        },
        {
            name: 'align',
            description: 'Align to first day of the week (sunday)',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'yes', value: 'yes' },
                { name: 'no', value: 'no' },
            ]
        },
        {
            name: 'supress',
            description: 'Force send valid events to channels while ignoring invalid subjects',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'yes', value: 'yes' },
                { name: 'no', value: 'no' },
            ]
        },
        {
            name: 'subjects',
            description: 'Subject(s) to query ex."21 33 132"',
            type: ApplicationCommandOptionType.String,
            required: false,
        }
    ],


    callback: async (client, interaction) => {
        await interaction.deferReply();

        // variables
        let errorWarning = '';
        let eventWarning = '';
        let channelWarning = '';
        let nonoScript = '';
        let okkeScript = '';
        let WARNINGFLAG = false;

        // get query values
        const options = interaction.options;
        const optSpan = options.get('span').value;
        const optAlign = options.get('align')?.value || 'yes';
        const optSupress = options.get('supress')?.value || 'no';
        const optSubjects = options.get('subjects')?.value.split(' ').map(subj => { return 'cs' + subj; }) || [];

        // set search span
        const startDate = (optAlign == 'yes') ? getFirstDayOfWeek() : new Date();
        const endDate = new Date(new Date().setDate(startDate.getDate() + optSpan * 7 - 1));

        const vars = {
            'span': optSpan,
            'align': optAlign,
            'supress': optSupress,
            'subjects': optSubjects,
            'start': startDate,
            'end': endDate
        };

        // Parse subjects
        const invalidSubjects = validateSubjects(optSubjects);

        // check invalid subject input
        if (invalidSubjects.length != 0) {
            errorWarning = `[ERROR] Invalid Subject(s) : ${invalidSubjects.join(', ')}`;
            await interaction.editReply(makeErrorScript(vars, errorWarning));
            return;
        }


        // Get list of events from google calendar
        try {
            var { validEvents, invalidEvents } = await getCalendarEvents(startDate, endDate);
        } catch (error) {
            errorWarning = `[ERROR] Calendar Request Failed}`;
            await interaction.editReply(makeErrorScript(vars, errorWarning));
            return;
        }

        // filter events by queried subjects
        filterSubjects(optSubjects, validEvents);

        // check for invalid events
        if (!optSubjects.length && invalidEvents.length != 0) {
            eventWarning = makeEventScript(objectToList(invalidEvents));
            WARNINGFLAG = true;
        }

        // get subject channels
        let { channels, missingChannels } = getSubjectChannels(validEvents, interaction);

        // check for missing channels
        if (missingChannels.length != 0) {
            missingChannels.forEach(subject => {
                channelWarning += `${subject.replace('cs', 'CS ')}\n`;
            });
            WARNINGFLAG = true;
        }

        // make and send error script


        // End program if warning flag is raised unless supressed
        if (optSupress == 'no' && WARNINGFLAG) {
            const script = makeErrorScript(vars, errorWarning, eventWarning, channelWarning);
            await interaction.editReply(script);
            return;
        }

        // Find the correct channel for each subject and send the message
        const logs = await sendEvents(startDate, endDate, channels, validEvents);

        if (logs['okke'].length != 0) {
            logs['okke'].forEach((log) => {
                okkeScript += log['subject'].replace('cs', '[SENT] CS ') + '\n';
            });
        }

        if (logs['nono'].length != 0) {
            logs['nono'].forEach((log) => {
                nonoScript += log['subject'].replace('cs', '[FAILED] CS ') + '\n';
            });
        }

        const script = makeErrorScript(vars, errorWarning, eventWarning, channelWarning, okkeScript, nonoScript);
        await interaction.editReply(script);

        saveLogs(logs);
    }
};





function formatDate(date) {
    return date.toLocaleString('default', { month: 'short', day: 'numeric' });
}


function getFirstDayOfWeek() {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day;

    return new Date(date.setDate(diff));
}


function makeEventScript(events, script = '') {
    const makeScript = (event) => {
        let eventDate = formatDate(new Date(event['start']['date']));
        eventDate = eventDate.concat(' '.repeat(6 - eventDate.length));
        return (`${eventDate} - ${event.summary} \n`);
    };

    events.forEach((event) => {
        script = script.concat(makeScript(event));
    });
    return script;
}


function validateSubjects(subjects) {
    const invalidSubjects = new Array();

    subjects.forEach((subject) => {
        if (!listOfSubjects.includes(subject)) {
            invalidSubjects.push(subject);
        }
    });

    return invalidSubjects;
}


function objectToList(object) {
    array = new Array();
    Object.values(object).forEach((events) => {
        array.push(...events);
    });
    return array;
}


function filterSubjects(subjects, events) {
    if (subjects.length) {
        for (const subject in events) {
            if (!subjects.includes(subject)) {
                delete events[subject];
            }
        }
    }
}


function getSubjectChannels(events, interaction) {
    const channels = new Object();
    const missingChannels = new Array();
    const eventSubjects = Object.keys(events);

    interaction.guild.channels.cache.forEach((channel) => {
        if (channel.type != '0') return;

        const name = channel.name.replaceAll(/[\s_-]/g, '');
        if (listOfSubjects.includes(name)) {
            channels[name] = channel;
        }
    });

    for (const subject of eventSubjects) {
        const channel = channels[subject];
        if (!channel) {
            missingChannels.push(subject);
            delete events[subject];
        }
    };

    return { channels, missingChannels };
}


function makeErrorScript(vars, errorWarning = '', eventWarning = '', channelWarning = '', okkeScript = '', nonoScript = '') {

    const command = '```' + `Command: reqs [span] ${vars.span} week(s), [align] ${vars.align}, [supress] ${vars.supress}, [subjects] ${vars.subjects.length ? vars.subjects : 'all'}` + '```';

    const supressed = vars.supress == 'yes';
    if (eventWarning.length != 0) eventWarning = `[WARNING${supressed ? ' @Supress' : ''}] Unrecognized Events:\n` + eventWarning + '\n';
    if (channelWarning.length != 0) channelWarning = `[WARNING${supressed ? ' @Supress' : ''}] Missing Channels:\n` + channelWarning + '\n';

    let warnings = errorWarning + eventWarning + channelWarning;
    if (warnings.length != 0) warnings = '```' + warnings + '```';

    const date = `[Events from ${formatDate(vars.start)} to ${formatDate(vars.end)}]\n\n`;

    let logs = okkeScript + nonoScript;
    if (logs.length != 0) logs = '```' + date + logs + '```';

    const consoleScript = command + warnings + logs;

    return consoleScript;
}


async function sendEvents(startDate, endDate, channels, events) {
    const logs = new Object({ 'okke': [], 'nono': [] });

    for (const subject in events) {
        let reqScript = new String();
        events[subject].forEach((req) => {
            reqScript = reqScript.concat(`📍 **${formatDate(new Date(req['start']['date']))}**  ${req['summary']}\n`);
        });

        const msg = messageScript
            .replace('[<start>]', formatDate(startDate))
            .replace('[<end>]', formatDate(endDate))
            .replaceAll('[<subject>]', subject.toUpperCase())
            .replace('[<requirements>]', reqScript);

        try {
            const sent = await channels[subject].send(msg);
            console.log(`[LOGS] Event is sent to <${subject}> channel`);
            logs['okke'].push({ 'subject': subject, 'data': sent });
        } catch (error) {
            console.log(`[ERROR] Failed to send event to <${subject}> channel`);
            logs['nono'].push({ 'subject': subject, 'data': sent });
        }
    }

    return logs;
};


function saveLogs(logs) {
    let msg = '[x]' + new Date() + '\n';
    for (const log of logs['okke']) {
        const subject = log['subject'];
        const channelId = log.data.channel.id;
        const messageId = log.data.id;

        msg += `${subject} ${channelId} ${messageId}\n`;
    }
    fs.appendFileSync(path.join(__dirname, '../../data/history/922844835931643967.txt'), msg);
}





// const startDate = new Date(new Date().setDate(new Date().getDate() - 24 * 7 - 1));
// const endDate = new Date(new Date().setDate(new Date().getDate() - 20 * 7 - 1));


//  =================== DEBUG ===================
// for (const event in validEvents)
//     validEvents[event].forEach(subj => console.log(subj['summary']));
//  =================== DEBUG ===================