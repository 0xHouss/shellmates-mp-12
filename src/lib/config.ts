import fs from 'fs';
import { z } from 'zod';

const configFile = JSON.parse(fs.readFileSync("config.json", 'utf-8'));

const configSchema = z.object({
    TOKEN: z.string(),
    CLIENT_ID: z.string(),
    MONGODB_URI: z.string(),
    GOOGLE_CALENDAR_ID: z.string(),
    DB_NAME: z.string(), 
})

export default configSchema.parse(configFile);