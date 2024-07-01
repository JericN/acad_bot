import { toBlue, toRed, wrap } from '../discordColor';
import { AcadEvent } from '../schema';
import { listAcadEvents } from '../textFormat';

export function generateInvalidEventScript(invalidEvents: AcadEvent[]): string {
    // Format the events into a script
    const eventScript = listAcadEvents(invalidEvents);

    // Add a header to the script
    const script = eventScript.length
        ? `${toRed('List of Invalid Events', 'b')} \n${eventScript}`
        : toBlue('No Invalid Event Found.', 'b');

    // Return the formatted script
    return wrap(script);
}
