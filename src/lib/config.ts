import fs from 'fs';
import { z } from 'zod';

const configFile = JSON.parse(fs.readFileSync("config.json", 'utf-8'));

const configSchema = z.object({
    // Bot
    TOKEN: z.string(),
    CLIENT_ID: z.string(),

    // Database
    MONGODB_URI: z.string(),
    DB_NAME: z.string(), 

    // Google Calendar
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_CALENDAR_ID: z.string(),
})

export default configSchema.parse(configFile);