import fs from "fs";
import { Auth, calendar_v3, google } from "googleapis";
import config from "./config";

export class GoogleCalendar {
    private oauth2Client: Auth.OAuth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            config.GOOGLE_CLIENT_ID,
            config.GOOGLE_CLIENT_SECRET,
            'urn:ietf:wg:oauth:2.0:oob'
        );

        this.loadToken();
    }

    // Load the token and refresh it if necessary
    private loadToken() {
        const creds = JSON.parse(fs.readFileSync('google-credentials.json', 'utf8'));
        this.oauth2Client.setCredentials(creds);

        // Check if the access token is expired
        if (creds.expiry_date && creds.expiry_date <= Date.now()) {
            // Refresh the token
            this.oauth2Client.refreshAccessToken((err, creds) => {
                if (err || !creds)
                    return console.error('Error refreshing access token:', err);

                this.oauth2Client.setCredentials(creds);

                // Save the refreshed token
                fs.writeFileSync('google-credentials.json', JSON.stringify(creds));
            });
        }
    }

    async createEvent(event: calendar_v3.Schema$Event) {
        this.loadToken();

        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        const response = await calendar.events.insert({
            calendarId: config.GOOGLE_CALENDAR_ID,
            requestBody: event,
        });

        return response.data
    }

    async removeEvent(eventId: string) {
        this.loadToken();

        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        await calendar.events.delete({
            calendarId: config.GOOGLE_CALENDAR_ID,
            eventId,
        });
    }
}