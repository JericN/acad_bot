import { toBlue, toRed, wrap } from '../discordColor';
import { GroupedEvents } from '../schema';
import { listAcadEvents } from '../textFormat';

export function generateValidEventScript(validGroups: GroupedEvents): string {
    // Format the events into a script
    const eventScript = Object.values(validGroups)
        .map((events) => listAcadEvents(events))
        .join('\n');

    // Add a header to the script
    const script = eventScript.length
        ? `${toBlue('List of Valid Events', 'b')}\n${eventScript}`
        : toRed('No Valid Event Found.', 'b');

    // Return the formatted script
    return wrap(script);
}
