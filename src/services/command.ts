import SlashCommanderPlugin from "@/main";
import { SlashCommand, isValidSuggestItem } from "@/data/models/SlashCommand";
import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import { CommanderSettings } from "@/data/models/Settings";
import { useSettingStore } from "@/data/stores/useSettingStore";

/**
 * SlashCommand-related service functions
 * These functions handle pure business logic without state management
 */

/**
 * Generate a unique ID that doesn't conflict with existing commands
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
 * Get valid commands that should be displayed
 */
export function getValidCommands(
    plugin: SlashCommanderPlugin,
    commands: SlashCommand[]
): SlashCommand[] {
    if (!plugin) return [];

    // Filter and clone root commands
    const validRootCommands = commands
        .filter((cmd) => isValidSuggestItem(plugin, cmd))
        .map((cmd) => ({ ...cmd }));

    // Process and filter child commands
    validRootCommands.forEach((cmd) => {
        if (cmd.children && cmd.children.length > 0) {
            const validChildren = cmd.children
                .filter((child) => isValidSuggestItem(plugin, child))
                .map((child) => ({ ...child }));

            cmd.children = validChildren;
        }
    });

    return validRootCommands;
}

/**
 * Validate command structure and check for duplicate IDs
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
 * Check if a command ID is unique across the entire command structure
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
 * Find a command by ID with optional parent context
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

/**
 * Get default commands
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
 * Migrate old SlashCommand data format to new format
 * Old format: id stores Obsidian command ID
 * New format: id is a unique identifier, action stores Obsidian command ID
 */
export async function migrateCommandData(
    data: CommanderSettings,
    saveCallback: (settings: CommanderSettings) => Promise<void>
): Promise<CommanderSettings> {
    if (!data.bindings || data.bindings.length === 0) return data;

    // Check if migration is needed
    const needsMigration = data.bindings.some(
        (cmd) =>
            !("action" in cmd) ||
            cmd.action === undefined ||
            !("isGroup" in cmd) ||
            cmd.isGroup === undefined
    );

    if (!needsMigration) {
        console.log("SlashCommander: data is already in the new format, no migration needed");
        return data;
    }

    console.log("SlashCommander: start migrating data to the new format");

    // First scan the entire command structure to identify duplicate IDs
    const idUsageCount = new Map<string, number>();

    const countIds = (commands: SlashCommand[]) => {
        for (const cmd of commands) {
            idUsageCount.set(cmd.id, (idUsageCount.get(cmd.id) || 0) + 1);

            if (cmd.children && cmd.children.length > 0) {
                countIds(cmd.children);
            }
        }
    };

    // Count usage of all IDs in the original data
    countIds(data.bindings);

    // Track newly assigned IDs to prevent conflicts
    const assignedIds = new Set<string>();

    // Recursive migration function
    const migrateCommand = (cmd: SlashCommand): SlashCommand => {
        // If no action field, copy id to action
        if (!("action" in cmd) || cmd.action === undefined) {
            cmd.action = cmd.id;
        }

        // Set isGroup field
        if (!("isGroup" in cmd) || cmd.isGroup === undefined) {
            // Determine if it's a command group by checking for child commands
            cmd.isGroup = cmd.children && cmd.children.length > 0;

            // Special handling for IDs with old group prefix format
            if (cmd.id.startsWith("slash-commander:group-")) {
                cmd.isGroup = true;
            }
        }

        // Only replace IDs that appear multiple times in the original data
        if ((idUsageCount.get(cmd.id) || 0) > 1) {
            // Generate a new ID that doesn't conflict with existing or already assigned IDs
            let newId;
            do {
                newId = generateUniqueId();
            } while (idUsageCount.has(newId) || assignedIds.has(newId));

            assignedIds.add(newId);
            cmd.id = newId;
        }

        // Recursively process child commands
        if (cmd.children && cmd.children.length > 0) {
            cmd.children = cmd.children.map(migrateCommand);
        }

        return cmd;
    };

    // Migrate all root commands
    data.bindings = data.bindings.map(migrateCommand);

    // Save migrated data
    await saveCallback(data);
    console.log("SlashCommander: data migrated");

    return data;
}
