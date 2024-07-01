import { AcadEvent, GroupedEvents } from '../schema';
import { formatDate } from '../commands/formatDate';

function groupBySubject(events: AcadEvent[]): GroupedEvents {
    const groupedEvents: GroupedEvents = {};

    // Group events by subject
    events.forEach((event) => {
        const { subject } = event;
        if (subject === 'None') throw new Error('Event missing subject');
        if (!groupedEvents[subject]) groupedEvents[subject] = [];
        groupedEvents[subject].push(event);
    });

    // Sort events by date
    for (const subjects of Object.values(groupedEvents)) {
        subjects.sort((a, b) => Number(a.startDate) - Number(b.startDate));
    }

    return groupedEvents;
}

function groupByDate(events: AcadEvent[]): GroupedEvents {
    const groupedEvents: GroupedEvents = {};

    // Group events by date
    events.forEach((event) => {
        const date = formatDate(event.startDate);
        if (!groupedEvents[date]) groupedEvents[date] = [];
        groupedEvents[date].push(event);
    });

    // Sort events by subject
    for (const subjects of Object.values(groupedEvents)) {
        subjects.sort((a, b) => a.subject.localeCompare(b.subject));
    }

    return groupedEvents;
}

export function groupEvents(events: AcadEvent[], type: string): GroupedEvents {
    if (type === 'subject') return groupBySubject(events);
    if (type === 'date') return groupByDate(events);
    throw new Error('Invalid group type');
}
