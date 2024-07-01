import { AcadEvent, DiscordEvent } from '../schema';
import { Role, ThreadChannel } from 'discord.js';
import { formatDate } from '../textFormat';
import fs from 'fs';
import path from 'path';

type EventRecord = Record<string, AcadEvent[]>;
type ThreadRecord = Record<string, ThreadChannel>;
type RoleRecord = Record<string, Role>;
type DateSpan = { start: Date; end: Date };
type DispatchedDiscordEvent = { successfulEvents: DiscordEvent[]; failedEvents: DiscordEvent[] };

const messageScript = fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'send_script.txt'), 'utf-8');

export async function sendEventsToChannels(
    groupedEvents: EventRecord,
    dates: DateSpan,
    threads: ThreadRecord,
    roles: RoleRecord,
): Promise<DispatchedDiscordEvent> {
    const successfulEvents: DiscordEvent[] = [];
    const failedEvents: DiscordEvent[] = [];

    for (const [subject, events] of Object.entries(groupedEvents)) {
        const reqsScript = events
            .map(({ startDate, summary }) => `📍 **${formatDate(new Date(startDate))}**  ${summary}`)
            .join('\n');

        const msg = messageScript
            .replace('[<start>]', formatDate(dates.start))
            .replace('[<end>]', formatDate(dates.end))
            .replace('[<role>]', `<@&${roles[subject].id}>`)
            .replaceAll('[<subject>]', subject.toUpperCase())
            .replace('[<requirements>]', reqsScript);

        try {
            const response = await threads[subject].send(msg);
            successfulEvents.push({
                events,
                text: msg,
                messageId: response.id,
                threadId: response.channel.id,
                guildId: response.guild.id,
            });
        } catch {
            failedEvents.push({ events, text: msg, messageId: '', threadId: '', guildId: '' });
        }
    }

    return { successfulEvents, failedEvents };
}
