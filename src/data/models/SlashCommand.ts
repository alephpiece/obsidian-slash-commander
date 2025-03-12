import { Command } from "obsidian";
import SlashCommanderPlugin from "@/main";

export type DeviceMode = "any" | "desktop" | "mobile" | string;
export type TriggerMode = "anywhere" | "newline" | "inline" | string;

export interface SlashCommand {
	name: string;
	icon: string;
	id: string;
	mode?: DeviceMode;
	triggerMode?: TriggerMode;
	color?: string;
	isChild?: boolean;
	children?: SlashCommand[];
}

export function getCommandFromId(plugin: SlashCommanderPlugin, id: string): Command | null {
	return plugin.app.commands.commands[id] ?? null;
}

export function isValidSuggestItem(plugin: SlashCommanderPlugin, scmd: SlashCommand): boolean {
	return (
		isCommandActive(plugin, scmd) &&
		(!!getCommandFromId(plugin, scmd.id) || isCommandGroup(scmd))
	);
}

export function isCommandActive(plugin: SlashCommanderPlugin, scmd: SlashCommand): boolean {
	const { isMobile, appId } = plugin.app;
	return (
		scmd.mode === undefined ||
		scmd.mode === "any" ||
		scmd.mode === appId ||
		(scmd.mode === "mobile" && isMobile) ||
		(scmd.mode === "desktop" && !isMobile)
	);
}

export function isDeviceValid(plugin: SlashCommanderPlugin, mode = "any"): boolean {
	return !!mode.match(/desktop|mobile|any/) || mode === plugin.app.appId;
}

export function getCommandSourceName(plugin: SlashCommanderPlugin, cmd: Command): string {
	const owningPluginID = cmd.id.split(":").first();
	const owningPlugin = plugin.app.plugins.manifests[owningPluginID!];
	return owningPlugin ? owningPlugin.name : "Obsidian";
}

export function isCommandActiveUnique(plugin: SlashCommanderPlugin, scmd: SlashCommand): boolean {
	const settings = plugin.settingsStore.getSettings();
	let commands = settings.bindings.filter(binding => isCommandActive(plugin, binding));

	commands = commands.flatMap(binding => [binding, ...(binding.children ?? [])]);

	const matches = commands.filter(({ name }) => name === scmd.name);

	return matches.length === 1;
}

export function isParentCommand(scmd: SlashCommand): boolean {
	return scmd.isChild !== true;
}

export function isCommandGroup(scmd: SlashCommand): boolean {
	return isParentCommand(scmd) && (scmd.children?.length ?? 0) > 0;
}
