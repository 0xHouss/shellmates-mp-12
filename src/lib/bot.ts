import { Client, Collection, REST, Routes } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { reminderHandler } from '..';
import config from './config';
import { connectToDatabase } from './db';

export default class Bot {
    public commands = new Collection<string, any>();
    public config = config;
    private commandsArray: any[] = [];

    constructor(public readonly client: Client) {
        this.client.login(config.TOKEN);

        this.client.on('warn', console.log);
        this.client.on('error', console.error);

        this.client.once("ready", async () => {
            console.log(`Logged in as ${client.user!.tag} !`);

            await connectToDatabase(); // Ensure DB is connected
            await this.importEvents();
            await this.importSlashCommands();
            await this.registerCommands();
            reminderHandler.initReminders();
        });
    }

    private async importEvents() {
        const eventsDir = path.join(__dirname, '../events');

        const eventFiles = await fs.readdir(eventsDir);
        eventFiles.filter(file => !file.endsWith('.map'));

        for (const file of eventFiles) {
            const filePath = path.join(eventsDir, file);
            const event = await import(filePath);

            const currentEvent = event.default;

            if (currentEvent.once)
                this.client.once(currentEvent.name, (...args) =>
                    currentEvent.execute(...args)
                );
            else
                this.client.on(currentEvent.name, (...args) =>
                    currentEvent.execute(...args)
                );
        }
    }

    private async importSlashCommands() {
        const commandsDir = path.join(__dirname, '../commands');

        const commandFiles = await fs.readdir(commandsDir);
        commandFiles.filter(file => !file.endsWith('.map'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsDir, file);
            const command = await import(filePath);
            const currentCommand = command.default;

            this.commands.set(currentCommand.data.name, currentCommand);
            console.log(`Loaded command ${currentCommand.data.name}.`);

            const commandData = currentCommand.data.toJSON();
            this.commandsArray.push(commandData);
        }
    }

    private async registerCommands() {
        const rest = new REST({ version: '9' }).setToken(config.TOKEN);

        try {
            await rest.put(
                Routes.applicationCommands(config.CLIENT_ID),
                { body: this.commandsArray }
            );

            console.log('Successfully registered application commands !');
        } catch (error) {
            console.error(error);
        }
    }
}
