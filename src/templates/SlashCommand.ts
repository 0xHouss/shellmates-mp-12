import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandsOnlyBuilder
} from 'discord.js'

export default class SlashCommand {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder
    execute: (interaction: ChatInputCommandInteraction) => any
    autocomplete?: (interaction: AutocompleteInteraction) => any

    constructor(options: {
        data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder
        execute: (interaction: ChatInputCommandInteraction) => any
    autocomplete?: (interaction: AutocompleteInteraction) => any

    }) {
        if (options.autocomplete) this.autocomplete = options.autocomplete

        this.data = options.data
        this.execute = options.execute
    }
}