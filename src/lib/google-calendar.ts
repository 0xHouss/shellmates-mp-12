import { calendar_v3, google } from "googleapis";
import config from "./config";

const calendar = google.calendar('v3');
const calendarId = config.GOOGLE_CALENDAR_ID;

// Authenticate with the service account
const auth = new google.auth.GoogleAuth({
    keyFile: "google-service-account.json",
    scopes: ['https://www.googleapis.com/auth/calendar'],
});

export async function getEvents(params: Omit<calendar_v3.Params$Resource$Events$List, 'auth' | 'calendarId'>) {
    const response = await calendar.events.list({
        auth,
        calendarId,
        ...params
    });

    return response.data.items
}

export async function createEvent(event: calendar_v3.Schema$Event) {
    const response = await calendar.events.insert({
        auth,
        calendarId,
        requestBody: event,
    });

    return response.data
}

export async function removeEvent(eventId: string) {
    await calendar.events.delete({
        auth,
        calendarId,
        eventId,
    });
}