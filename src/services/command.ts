import { minimatch } from "minimatch";
import { Command } from "obsidian";

import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import { SlashCommand } from "@/data/models/SlashCommand";
import { useSettingStore } from "@/data/stores/useSettingStore";
import SlashCommanderPlugin from "@/main";

export interface CommandVisibilityContext {
    /**
     * Vault-relative file path for the editor context where suggestions are shown.
     */
    filePath?: string | null;

    /**
     * Whether the trigger starts at the beginning of the current editor line.
     * Undefined means trigger mode should not be considered.
     */
    onNewLine?: boolean;
}

// Match Obsidian vault paths after normalizing separators to forward slashes.
// Negation and comments are disabled because include/exclude lists model those
// concerns explicitly.
const PATH_PATTERN_OPTIONS = {
    dot: true,
    nocomment: true,
    nonegate: true,
    windowsPathsNoEscape: true,
} as const;

function normalizePathPattern(pattern: string): string {
    return pattern.trim().replace(/\\/g, "/").replace(/^\/+/, "");
}

function normalizeFilePath(filePath?: string | null): string | null {
    if (!filePath) return null;
    const normalized = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    return normalized || null;
}

function getPathPatterns(scmd: SlashCommand): { include: string[]; exclude: string[] } {
    const pathPatterns = scmd.visibility?.pathPatterns;
    return {
        include: (pathPatterns?.include ?? []).map(normalizePathPattern).filter(Boolean),
        exclude: (pathPatterns?.exclude ?? []).map(normalizePathPattern).filter(Boolean),
    };
}

function matchesAnyPathPattern(filePath: string, patterns: string[]): boolean {
    return patterns.some((pattern) => minimatch(filePath, pattern, PATH_PATTERN_OPTIONS));
}

/**
 * Check if a command has path-based visibility rules.
 */
export function hasPathVisibilityRules(scmd: SlashCommand): boolean {
    const { include, exclude } = getPathPatterns(scmd);
    return include.length > 0 || exclude.length > 0;
}

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
 * Check if a command is visible for the active file path.
 *
 * Commands with path rules require a file path. Exclude patterns take precedence
 * over include patterns.
 */
export function isCommandPathVisible(
    scmd: SlashCommand,
    context: CommandVisibilityContext = {}
): boolean {
    const { include, exclude } = getPathPatterns(scmd);
    const hasPathRules = include.length > 0 || exclude.length > 0;

    if (!hasPathRules) return true;

    const filePath = normalizeFilePath(context.filePath);
    if (!filePath) return false;

    if (matchesAnyPathPattern(filePath, exclude)) return false;
    if (include.length > 0 && !matchesAnyPathPattern(filePath, include)) return false;

    return true;
}

/**
 * Check if a command is visible for the current trigger position.
 *
 * When the caller does not provide trigger context, the command remains visible.
 */
export function isCommandTriggerVisible(
    scmd: SlashCommand,
    context: CommandVisibilityContext = {}
): boolean {
    if (context.onNewLine === undefined) return true;

    return (
        (context.onNewLine && scmd.triggerMode != "inline") ||
        (!context.onNewLine && scmd.triggerMode != "newline")
    );
}

/**
 * Check if a command is active on the current device and visible in the current context.
 */
export function isCommandVisible(
    plugin: SlashCommanderPlugin,
    scmd: SlashCommand,
    context: CommandVisibilityContext = {}
): boolean {
    return (
        isCommandActive(plugin, scmd) &&
        isCommandPathVisible(scmd, context) &&
        isCommandTriggerVisible(scmd, context)
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
 * Check if a command name is unique among the currently visible command suggestions.
 */
export function isCommandNameUniqueInItems(scmd: SlashCommand, items: SlashCommand[]): boolean {
    return items.filter((item) => !isCommandGroup(item) && item.name === scmd.name).length === 1;
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
 * For group commands, their children will be placed right after them.
 *
 * Visibility is applied recursively. A group is returned only when the group
 * itself is visible and at least one child remains visible.
 */
export function getFlatValidCommands(
    plugin: SlashCommanderPlugin,
    commands: SlashCommand[],
    context: CommandVisibilityContext = {}
): SlashCommand[] {
    if (!plugin) return [];

    const collectVisibleCommands = (cmds: SlashCommand[]): SlashCommand[] => {
        const result: SlashCommand[] = [];

        for (const cmd of cmds) {
            if (!isCommandVisible(plugin, cmd, context)) {
                continue;
            }

            if (isCommandGroup(cmd)) {
                const visibleChildren = collectVisibleCommands(cmd.children ?? []);

                if (visibleChildren.length > 0) {
                    result.push(cmd, ...visibleChildren);
                }

                continue;
            }

            if (isValidSuggestItem(plugin, cmd)) {
                result.push(cmd);
            }
        }

        return result;
    };

    return collectVisibleCommands(commands);
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
