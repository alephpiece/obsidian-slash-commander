import { Command } from "obsidian";
import SlashCommanderPlugin from "@/main";
import { generateUniqueId } from "@/services/utils/util";
import { useSettingStore } from "@/data/stores/useSettingStore";

export type DeviceMode = "any" | "desktop" | "mobile" | string;
export type TriggerMode = "anywhere" | "newline" | "inline" | string;

export interface SlashCommand {
	name: string;
	icon: string;
	id: string;
	action?: string;
	mode?: DeviceMode;
	triggerMode?: TriggerMode;
	color?: string;
	isGroup?: boolean;

	// Parent command ID, undefined means root command
	parentId?: string;

	// Directly reference child commands (tree structure)
	children?: SlashCommand[];
}

export function getObsidianCommand(plugin: SlashCommanderPlugin, scmd: SlashCommand): Command | null {
	return plugin.app.commands.commands[scmd.action ?? ""] ?? null;
}

export function isValidSuggestItem(plugin: SlashCommanderPlugin, scmd: SlashCommand): boolean {
	return (
		isCommandActive(plugin, scmd) &&
		(!!getObsidianCommand(plugin, scmd) || isCommandGroup(scmd))
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
	const settings = useSettingStore.getState().settings;
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

export function isRootCommand(scmd: SlashCommand): boolean {
	// Command without parent is a root command
	return !scmd.parentId;
}

export function isCommandGroup(scmd: SlashCommand): boolean {
	// Prioritize explicit isGroup field, compatible with old data that has child commands
	return scmd.isGroup === true || (!scmd.parentId && (scmd.children?.length ?? 0) > 0);
}

export function getChildCommands(commands: SlashCommand[], parentId: string): SlashCommand[] {
	const parentCmd = commands.find(cmd => cmd.id === parentId);
	return parentCmd?.children || [];
}

/**
 * Generates a new command with default values and optional overrides
 */
export function generateNewCommand(options: Partial<SlashCommand> = {}): SlashCommand {
	// Determine if it's a group by children existence or explicit isGroup setting
	const isGroup = options.isGroup !== undefined ? options.isGroup : !!options.children?.length;
	
	return {
		id: options.id || generateUniqueId(), // Generate a unique ID
		name: "New Command",
		icon: "command",
		action: options.action,
		parentId: undefined, // Default to root command
		children: [],
		isGroup, // Set the flag indicating whether it's a command group
		...options
	};
}
