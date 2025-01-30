import { Message } from 'discord.js';
import scheduleCommand from '../prefixCommands/schedule';

export default {
    name: 'messageCreate',
    once: false,
    async execute(message: Message) {
        if (message.content.startsWith('!schedule')) {
            await scheduleCommand(message);
        }
    }
};