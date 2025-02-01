import { calendar_v3, google } from "googleapis";
import config from "./config";
import fs from "fs";

const calendarId = config.GOOGLE_CALENDAR_ID;

const oauth2Client = new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID, 
    config.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
);

// Load the token and refresh it if necessary
function loadToken() {
    const creds = JSON.parse(fs.readFileSync('google-credentials.json', 'utf8'));
    oauth2Client.setCredentials(creds);

    // Check if the access token is expired
    if (creds.expiry_date && creds.expiry_date <= Date.now()) {
        // Refresh the token
        oauth2Client.refreshAccessToken((err, creds) => {
            if (err || !creds)
                return console.error('Error refreshing access token:', err);

            oauth2Client.setCredentials(creds);
            // Save the refreshed token
            fs.writeFileSync('google-credentials.json', JSON.stringify(creds));
        });
    }
}

export async function getEvents(params: Omit<calendar_v3.Params$Resource$Events$List, 'auth' | 'calendarId'>) {
    loadToken();

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
        calendarId,
        ...params
    });

    return response.data.items
}

export async function createEvent(event: calendar_v3.Schema$Event) {
    loadToken();

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
    });

    return response.data
}

export async function removeEvent(eventId: string) {
    loadToken();

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
        calendarId,
        eventId,
    });
}