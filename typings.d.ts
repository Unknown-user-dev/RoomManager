import * as Discord from "discord.js";
export interface LegacyCommand {
	name: string;
	aliases?: string[];
	description?: string;
	usage?: string;
	permissions?: Discord.PermissionResolvable;
	guildOnly?: boolean;
	args?: boolean;
	cooldown?: number;
	ownerOnly?: boolean;
	execute(
		message: Discord.Message & { client: Client },
		args: string[]
	): void | Promise<void>;
}

export interface SlashInteractionCommand {
	data: Discord.SlashCommandBuilder;
	options: Array<
		| Discord.SlashCommandStringOption
		| Discord.SlashCommandNumberOption
		| Discord.SlashCommandRoleOption
		| Discord.SlashCommandUserOption
		| Discord.SlashCommandBooleanOption
		| Discord.SlashCommandChannelOption
		| Discord.SlashCommandIntegerOption
	>;

	execute(
		interaction: Discord.ChatInputCommandInteraction & { client: Client }
	): void | Promise<void>;
}

export interface ButtonInteractionCommand {
	id: string;
	execute(
		interaction: Discord.ButtonInteraction & { client: Client }
	): void | Promise<void>;
}
export interface SelectInteractionCommand {
	id: string;
	execute(
		interaction: Discord.SelectMenuInteraction & { client: Client }
	): void | Promise<void>;
}
export interface ContextInteractionCommandData {
	name: string;
	type: 2 | 3;
}

export interface ContextInteractionCommand {
	data: ContextInteractionCommandData;
	execute(
		interaction: Discord.ContextMenuCommandInteraction & { client: Client }
	): void | Promise<void>;
}

export interface ModalInteractionCommand {
	id: string;
	execute(
		interaction: Discord.ModalSubmitInteraction & { client: Client }
	): void | Promise<void>;
}
export interface TriggerCommand {
	name: string[];
	execute(
		message: Discord.Message & { client: Client },
		args: string[]
	): void | Promise<void>;
}

export interface AutocompleteInteraction {
	name: string;
	execute(
		interaction: Discord.AutocompleteInteraction & { client: Client }
	): void | Promise<void>;
}

export interface Client extends Discord.Client {
	commands: Discord.Collection<string, LegacyCommand>;
	slashCommands: Discord.Collection<string, SlashInteractionCommand>;
	buttonCommands: Discord.Collection<string, ButtonInteractionCommand>;
	selectCommands: Discord.Collection<string, SelectInteractionCommand>;
	contextCommands: Discord.Collection<string, ContextInteractionCommand>;
	modalCommands: Discord.Collection<string, ModalInteractionCommand>;
	cooldowns: Discord.Collection<string, Discord.Collection<string, number>>;
	triggers: Discord.Collection<string, TriggerCommand>;
	autocompleteInteractions: Discord.Collection<string, AutocompleteInteraction>;
}
