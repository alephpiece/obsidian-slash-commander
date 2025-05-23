import { Notice } from "obsidian";

import { DEFAULT_SETTINGS } from "@/data/constants/defaultSettings";
import { DATA_VERSION } from "@/data/constants/version";
import { CommanderSettings } from "@/data/models/Settings";
import { SlashCommand } from "@/data/models/SlashCommand";

import { generateUniqueId } from "./command";

/**
 * Migrate and update settings data to current version
 * Handles both data structure changes and configuration updates
 */
export async function migrateSettings(
    loadedData: any,
    saveCallback: (settings: CommanderSettings) => Promise<void>
): Promise<CommanderSettings> {
    // Start with loaded data or empty object
    const data = loadedData || {};

    // Initialize version if not present
    if (!data.version) data.version = 1;

    // If already up to date, still need to ensure all fields are present
    if (data.version >= DATA_VERSION) {
        return ensureAllFieldsPresent(data);
    }

    new Notice(`SlashCommander: detected data version ${data.version}`);

    let migratedData = { ...data };

    // Version 1 to 2 migration
    if (migratedData.version < 2) {
        new Notice("SlashCommander: migrating data to version 2");
        migratedData = await migrateDataToV2(migratedData);
        new Notice("SlashCommander: data migrated");
    }

    // Add future version migrations here
    // if (migratedData.version < 3) {
    //     migratedData = await migrateFromV2ToV3(migratedData);
    // }

    // Ensure all current fields are present with appropriate defaults
    migratedData = ensureAllFieldsPresent(migratedData);

    // Update version to current
    migratedData.version = DATA_VERSION;

    // Save migrated data
    await saveCallback(migratedData);

    return migratedData;
}

/**
 * Ensure all required fields are present in settings
 * Only adds missing fields, never overwrites existing user values
 * Handles field migrations and type conversions
 */
export function ensureAllFieldsPresent(data: any): CommanderSettings {
    const result: CommanderSettings = {
        version: data.version ?? DATA_VERSION,
        confirmDeletion: data.confirmDeletion ?? DEFAULT_SETTINGS.confirmDeletion,
        showDescriptions: data.showDescriptions ?? DEFAULT_SETTINGS.showDescriptions,
        showSourcesForDuplicates:
            data.showSourcesForDuplicates ?? DEFAULT_SETTINGS.showSourcesForDuplicates,
        debug: data.debug ?? DEFAULT_SETTINGS.debug,
        mainTrigger: data.mainTrigger ?? DEFAULT_SETTINGS.mainTrigger,
        extraTriggers: Array.isArray(data.extraTriggers)
            ? data.extraTriggers
            : DEFAULT_SETTINGS.extraTriggers,
        useExtraTriggers: data.useExtraTriggers ?? DEFAULT_SETTINGS.useExtraTriggers,
        triggerOnlyOnNewLine: data.triggerOnlyOnNewLine ?? DEFAULT_SETTINGS.triggerOnlyOnNewLine,
        // queryPattern will be rebuilt later, so use a placeholder
        queryPattern: DEFAULT_SETTINGS.queryPattern,
        bindings: Array.isArray(data.bindings) ? data.bindings : DEFAULT_SETTINGS.bindings,
    };

    // Example of handling field renames (for future use)
    // if ('oldFieldName' in data && !('newFieldName' in data)) {
    //     result.newFieldName = data.oldFieldName;
    // }

    // Example of handling type conversions (for future use)
    // if (typeof data.someField === 'string' && data.someField === 'true') {
    //     result.someField = true;
    // }

    return result;
}

/**
 * Migrate data to version 2
 * Handles command structure changes and ID conflicts
 */
export async function migrateDataToV2(data: any): Promise<any> {
    const migratedData = { ...data };

    // Handle command bindings migration
    if (migratedData.bindings && migratedData.bindings.length > 0) {
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
        countIds(migratedData.bindings);

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
        migratedData.bindings = migratedData.bindings.map(migrateCommand);
    }

    return migratedData;
}
