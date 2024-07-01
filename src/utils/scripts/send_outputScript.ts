import { toBlue, toRed, wrap } from '../discordColor';
import { DiscordEvent } from '../schema';
import { listDiscordEvents } from '../textFormat';

export function generateSendOutputScript(sentEvents: DiscordEvent[], failedEvents: DiscordEvent[]) {
    const script = {
        sentEvents: '',
        failedEvents: '',
    };

    if (sentEvents?.length > 0) {
        const title = toBlue('List of Successful Events', 'b');
        script.sentEvents = wrap(`${title}\n${listDiscordEvents(sentEvents)}`);
    }

    if (failedEvents?.length > 0) {
        const title = toRed('List of Failed Events', 'b');
        script.failedEvents = wrap(`${title}\n${listDiscordEvents(failedEvents)}`);
    }

    const output = script.sentEvents + script.failedEvents;
    return output ? output : wrap(`${toRed('No Events are sent', 'b')}`);
}
