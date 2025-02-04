import { bot } from "../.."
import MessageCommand from "../../templates/MessageCommand"

export default new MessageCommand({
    name: 'deploy',
    description: 'Deploys the slash commands',
    async execute(message, args) {
        const reply = await message.reply('Deploying...')

        await Promise.all([
            bot.importEvents,
            bot.importSlashCommands,
            bot.importMessageCommands
        ])
        await bot.registerCommands()

        await reply.edit('Deployed !')
    }
})