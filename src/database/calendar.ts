import { calendar_v3, google } from 'googleapis';
import { AcadEvent } from '../utils/schema';
import path from 'path';

// FIXME: secure the keyFile
function getAuth() {
    return new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, '..', '..', 'googlekey.json'),
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });
}

function parseData(data: calendar_v3.Schema$Event[] | undefined): AcadEvent[] {
    if (!data) return [] as AcadEvent[];
    const res = data.map((event) => {
        return {
            calendarId: event.id!,
            subject: 'None',
            summary: event.summary!,
            startDate: new Date(event.start!.date!),
            endDate: new Date(event.end!.date!),
        };
    });

    return res.map((event) => AcadEvent.parse(event)) as AcadEvent[];
}

export async function fetchGoogleCalendarEvents(startDate: Date, endDate: Date): Promise<AcadEvent[]> {
    // REMOVE: For testing purposes
    startDate.setDate(startDate.getDate() - 30);
    endDate.setDate(endDate.getDate() - 30);
    // ================================

    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    // Retrieve events from the calendar
    const response = await calendar.events.list(
        {
            calendarId: process.env.CALENDAR_CURSOR_ID!,
            orderBy: 'startTime',
            singleEvents: true,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            timeZone: 'Asia/Singapore',
        },
        {},
    );

    return parseData(response.data.items);
}
