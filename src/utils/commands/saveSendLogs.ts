import { DiscordEvent } from '../types/types';
import { assert } from '../assert';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

async function appendLinesToFile(filePath: string, lines: string[]): Promise<void> {
    try {
        if (!fs.existsSync(filePath)) {
            await fs.promises.writeFile(filePath, '', 'utf8');
        }

        const data = lines.join('\n') + '\n';

        await fs.promises.appendFile(filePath, data, 'utf8');
    } catch (error) {
        assert(error instanceof Error, 'Error should be an instance of Error');
        // eslint-disable-next-line no-console
        console.error(`Error appending lines to file: ${error.message}`);
        throw error;
    }
}

async function readLastNLines(filePath: string, n: number): Promise<string[]> {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
        // FIXME: The type definition here is incorrect, force-case for now
        input: fileStream as unknown as NodeJS.ReadableStream,
        crlfDelay: Infinity,
    });

    const buffer: string[] = [];

    // Read the file line by line
    for await (const line of rl) {
        buffer.push(line);
        if (buffer.length > n) {
            buffer.shift();
        }
    }

    rl.close();

    return buffer;
}

type EventLog = {
    subject: string;
    summary: string;
    calendarId: string;
    messageId: string;
    threadId: string;
    guildId: string;
};

function formatDiscordEvent(event: DiscordEvent): string[] {
    const { events, messageId, threadId, guildId } = event;
    const eventLogs: EventLog[] = events.map((event) => {
        const { calendarId, subject, summary } = event;
        return { subject, summary, calendarId, messageId, threadId, guildId };
    });

    return eventLogs.map((event) => JSON.stringify(event));
}
export async function saveSendLogs(successfulEvents: DiscordEvent[]) {
    const logs: string[][] = successfulEvents.map(formatDiscordEvent);
    const logFilePath = path.join(__dirname, '../../data/sendLogs.txt');
    await appendLinesToFile(logFilePath, logs.flat());
}
