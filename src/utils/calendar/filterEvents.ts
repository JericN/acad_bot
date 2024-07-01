import { AcadEvent, FilteredEvents } from '../schema';
import fs from 'fs';
import path from 'path';

const listOfSubjects = fs
    .readFileSync(path.join(__dirname, '..', '..', 'data', 'subjects.txt'), 'utf-8')
    .split(/\r?\n/)
    .map((subject) => subject.trim().toLowerCase());

function extractSubjectCode(event: AcadEvent): string | null {
    // TODO: add support for non-CS subjects
    const subjectMatch = event.summary.match(/\bCS?\s*[-_]?\s*\d{2,3}\b/i);
    return subjectMatch ? subjectMatch[0].replace(/[^a-z0-9]/gi, '').toLowerCase() : null;
}

export function filterEvents(events: AcadEvent[]): FilteredEvents {
    const validEvents: AcadEvent[] = [];
    const invalidEvents: AcadEvent[] = [];

    for (const event of events) {
        const subject = extractSubjectCode(event);
        if (subject && listOfSubjects.includes(subject)) {
            validEvents.push({ ...event, subject });
        } else {
            invalidEvents.push(event);
        }
    }

    return { validEvents, invalidEvents };
}
