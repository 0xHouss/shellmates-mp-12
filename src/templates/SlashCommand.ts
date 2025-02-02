import type {
    ChatInputCommandInteraction,
    SlashCommandBuilder
} from 'discord.js'

export default class SlashCommand {
    data: SlashCommandBuilder
    execute: (interaction: ChatInputCommandInteraction) => any

    constructor(options: {
        data: SlashCommandBuilder
        execute: (interaction: ChatInputCommandInteraction) => any
    }) {
        this.data = options.data
        this.execute = options.execute
    }
}