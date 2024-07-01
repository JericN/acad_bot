import { AcadEvent } from '../schema';

export function filterSendableEvents(events: AcadEvent[], missingThreads: string[], missingRoles: string[]) {
    const filteredEvents: AcadEvent[] = [];
    for (const event of events) {
        if (missingThreads.includes(event.subject)) continue;
        if (missingRoles.includes(event.subject)) continue;
        filteredEvents.push(event);
    }
    return filteredEvents;
}
