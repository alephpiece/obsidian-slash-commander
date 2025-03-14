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

	// Depth level in command hierarchy (0 = root level)
	depth?: number;

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
	
	// Find all active commands with matching name
	const matches: SlashCommand[] = [];
	
	function findMatches(cmds: SlashCommand[]): void {
		for (const cmd of cmds) {
			if (isCommandActive(plugin, cmd) && cmd.name === scmd.name) {
				matches.push(cmd);
			}
			
			if (cmd.children?.length) {
				findMatches(cmd.children);
			}
		}
	}
	
	findMatches(commands);
	return matches.length === 1;
}

export function isParentCommand(scmd: SlashCommand): boolean {
	return scmd.depth === 0 || scmd.depth === undefined;
}

export function isCommandGroup(scmd: SlashCommand): boolean {
	return isParentCommand(scmd) && (scmd.children?.length ?? 0) > 0;
}

export function getChildCommands(commands: SlashCommand[], parentId: string): SlashCommand[] {
	const parentCmd = commands.find(cmd => cmd.id === parentId);
	return parentCmd?.children || [];
}

/**
 * Generates a new command with default values and optional overrides
 */
export function generateNewCommand(options: Partial<SlashCommand> = {}): SlashCommand {
	return {
		id: crypto.randomUUID(),
		name: "New Command",
		icon: "command",
		depth: 0,
		children: [],
		...options
	};
}
