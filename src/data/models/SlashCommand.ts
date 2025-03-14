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
	
	// Field for command groups
	parentId?: string;
	
	// Direct reference to child commands for tree structure
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
	const commands = settings.bindings;
	
	// Get all active commands including children
	const activeCommands = commands.filter(cmd => isCommandActive(plugin, cmd));
	const activeCommandsWithChildren = activeCommands.flatMap(cmd => 
		[cmd, ...getChildCommands(commands, cmd.id)]
	);
	
	const matches = activeCommandsWithChildren.filter(cmd => cmd.name === scmd.name);
	return matches.length === 1;
}

export function isParentCommand(scmd: SlashCommand): boolean {
	return scmd.parentId === undefined;
}

export function isCommandGroup(scmd: SlashCommand): boolean {
	return isParentCommand(scmd) && (scmd.children?.length ?? 0) > 0;
}

export function getChildCommands(commands: SlashCommand[], parentId: string): SlashCommand[] {
	return commands.filter(cmd => cmd.parentId === parentId);
}

export function getDescendantCommands(commands: SlashCommand[], parentId: string): SlashCommand[] {
	const children = getChildCommands(commands, parentId);
	return children.concat(
		...children.flatMap(child => getDescendantCommands(commands, child.id))
	);
}
