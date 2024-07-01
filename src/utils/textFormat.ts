import { AcadEvent, DiscordEvent } from './types';

function formatDate(date: Date): string {
    return date.toLocaleString('default', { month: 'short', day: 'numeric' });
}

function formatEvent({ startDate, summary }: AcadEvent, isIndent = true): string {
    const eventDate = formatDate(new Date(startDate)).padEnd(6);
    const indent = isIndent ? ' '.repeat(1) : '';
    return `${indent}${eventDate} - ${summary}`;
}

function listAcadEvents(acadEvents: AcadEvent[], isIndent = true) {
    return acadEvents.map((event) => formatEvent(event, isIndent)).join('\n');
}

function listDiscordEvents(discordEvents: DiscordEvent[], isIndented = true): string {
    return discordEvents.map(({ events }) => listAcadEvents(events, isIndented)).join('\n');
}

export { formatDate, listAcadEvents, listDiscordEvents };
