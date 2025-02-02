import { Events, Message } from 'discord.js';
import { bot } from '..';
import config from '../lib/config';
import Event from '../templates/Event';

export default new Event({
    name: Events.MessageCreate,
    async execute(message: Message) {
        // filters out bots and non-prefixed messages
        if (!message.content.startsWith(config.BOT_PREFIX) || message.author.bot)
            return

        try {
            // get the arguments and the actual command name for the inputted command
            const args = message.content
                .slice(config.BOT_PREFIX.length)
                .trim()
                .split(/ +/)
            const commandName = (<string>args.shift()).toLowerCase()

            const command = bot.messageCommands.get(commandName)

            if (!command) return

            await command.execute(message, args)
        } catch (error) {
            console.error("There was an error while executing this command:", error)

            await message.reply('There was an error while executing this command !')
        }
    }
})