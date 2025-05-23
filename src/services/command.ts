import { Command } from "obsidian";

import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import { SlashCommand } from "@/data/models/SlashCommand";
import { useSettingStore } from "@/data/stores/useSettingStore";
import SlashCommanderPlugin from "@/main";

/**
 * Get default SlashCommands
 */
export function getDefaultCommands(): SlashCommand[] {
    return DEFAULT_SETTINGS.bindings.map((cmd) => {
        const newCmd = { ...cmd };
        newCmd.children = [];
        newCmd.parentId = undefined;
        return newCmd;
    });
}

/**
 * Get Obsidian command by SlashCommand action
 */
export function getObsidianCommand(
    plugin: SlashCommanderPlugin,
    scmd: SlashCommand
): Command | null {
    return plugin.app.commands.commands[scmd.action ?? ""] ?? null;
}

/**
 * Check if a command is valid for suggestions
 */
export function isValidSuggestItem(plugin: SlashCommanderPlugin, scmd: SlashCommand): boolean {
    return (
        isCommandActive(plugin, scmd) &&
        (!!getObsidianCommand(plugin, scmd) || isCommandGroup(scmd))
    );
}

/**
 * Check if a command is active on the current device
 */
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

/**
 * Check if a device mode is valid
 */
export function isDeviceValid(plugin: SlashCommanderPlugin, mode = "any"): boolean {
    return !!mode.match(/desktop|mobile|any/) || mode === plugin.app.appId;
}

/**
 * Get the source name of a SlashCommand
 */
export function getCommandSourceName(plugin: SlashCommanderPlugin, cmd: Command): string {
    const owningPluginID = cmd.id.split(":").first();
    const owningPlugin = plugin.app.plugins.manifests[owningPluginID!];
    return owningPlugin ? owningPlugin.name : "Obsidian";
}

/**
 * Check if a SlashCommand has a unique name among active commands.
 * This is used to determine if the suggester should show the source name of a command.
 */
export function isActiveCommandNameUnique(
    plugin: SlashCommanderPlugin,
    scmd: SlashCommand
): boolean {
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

/**
 * A SlashCommand without parent is a root command
 */
export function isRootCommand(scmd: SlashCommand): boolean {
    return typeof scmd.parentId === "undefined";
}

/**
 * Check if a SlashCommand is a group
 */
export function isCommandGroup(scmd: SlashCommand): boolean {
    return scmd.isGroup === true;
}

/**
 * Generate a unique ID that doesn't conflict with existing SlashCommands
 */
export function generateUniqueId(prefix = ""): string {
    const settingStore = useSettingStore.getState();

    let id: string;
    do {
        id = prefix + crypto.randomUUID();
    } while (!settingStore.isIdUnique(id));

    return id;
}

/**
 * Returns a flattened array of all SlashCommands
 * For group commands, their children will be placed right after them
 */
export function getFlattenedCommands(commands: SlashCommand[]): SlashCommand[] {
    const result: SlashCommand[] = [];

    // Recursive function to flatten the command structure
    const flattenCommands = (cmds: SlashCommand[]) => {
        for (const cmd of cmds) {
            // Add the current command
            result.push(cmd);

            // If it's a group with children, add children immediately after
            if (cmd.isGroup && cmd.children && cmd.children.length > 0) {
                flattenCommands(cmd.children);
            }
        }
    };

    flattenCommands(commands);
    return result;
}

/**
 * Returns a flattened array of valid SlashCommands
 * For group commands, their children will be placed right after them
 */
export function getFlatValidCommands(
    plugin: SlashCommanderPlugin,
    commands: SlashCommand[]
): SlashCommand[] {
    if (!plugin) return [];

    const flattenedCommands = getFlattenedCommands(commands);
    return flattenedCommands.filter((cmd) => isValidSuggestItem(plugin, cmd));
}

/**
 * Validate SlashCommand structure and check for duplicate IDs
 */
export function validateCommandStructure(commands: SlashCommand[]): void {
    // Check for duplicate IDs at root level
    const rootIds = new Set<string>();
    for (const cmd of commands) {
        if (rootIds.has(cmd.id)) {
            throw new Error(`Duplicate root command ID: ${cmd.id}`);
        }
        rootIds.add(cmd.id);

        // Check for duplicate IDs in each parent's children
        if (cmd.children && cmd.children.length > 0) {
            const childIds = new Set<string>();
            for (const child of cmd.children) {
                if (childIds.has(child.id)) {
                    throw new Error(`Duplicate child command ID: ${child.id} in parent ${cmd.id}`);
                }
                childIds.add(child.id);
            }
        }
    }
}

/**
 * Check if a SlashCommand ID is unique across the entire command structure
 */
export function isIdUnique(id: string, commands: SlashCommand[]): boolean {
    // Check root level
    if (commands.some((cmd) => cmd.id === id)) {
        return false;
    }

    // Check all child commands
    for (const cmd of commands) {
        if (cmd.children && cmd.children.length > 0) {
            if (cmd.children.some((child) => child.id === id)) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Find a SlashCommand by ID with optional parent context
 */
export function findCommand(
    commands: SlashCommand[],
    id: string,
    parentId?: string
): SlashCommand | undefined {
    if (parentId) {
        // Find within a specific parent
        const parent = commands.find((cmd) => cmd.id === parentId);
        return parent?.children?.find((child) => child.id === id);
    } else {
        // Find at root level
        return commands.find((cmd) => cmd.id === id);
    }
}
