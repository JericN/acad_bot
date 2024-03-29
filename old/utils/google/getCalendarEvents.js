require('dotenv/config');
const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

const listOfSubjects = fs.readFileSync(path.join(__dirname, '../../data/subjects.txt'), 'utf-8').split(/\r?\n/);

module.exports = async (startDate, endDate) => {
	const auth = new google.auth.GoogleAuth({
		keyFile: path.join(__dirname, '../../../googlekey.json'),
		scopes: ['https://www.googleapis.com/auth/calendar'],
	});

	const calendar = google.calendar({ version: 'v3', auth });
	const response = await calendar.events.list({
		calendarId: process.env.CALENDAR_CURSOR_ID,
		orderBy: 'startTime',
		timeMin: startDate,
		timeMax: endDate,
		timeZone: 'Asia/Singapore',
		singleEvents: 'true',
	});

	const calendarEvents = response['data']['items'];
	const validEvents = new Object();
	const invalidEvents = new Object();

	for (const event of calendarEvents) {
		const subject = event.summary.split(' ').slice(0, 2).join('').toLowerCase();
		if (listOfSubjects.includes(subject)) {
			if (validEvents[subject]) {
				validEvents[subject].push(event);
			} else {
				validEvents[subject] = [event];
			}
		} else {
			if (invalidEvents[subject]) {
				invalidEvents[subject].push(event);
			} else {
				invalidEvents[subject] = [event];
			}
		}
	}

	return { validEvents, invalidEvents };
};
