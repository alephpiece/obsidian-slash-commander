export type DeviceMode = "any" | "desktop" | "mobile" | string;
export type TriggerMode = "anywhere" | "newline" | "inline" | string;

/**
 * Optional command visibility rules.
 *
 * Path patterns are vault-relative minimatch patterns. Include patterns allow a
 * command only in matching files, while exclude patterns always take precedence.
 */
export interface SlashCommandVisibility {
    pathPatterns?: {
        include?: string[];
        exclude?: string[];
    };
}

export interface SlashCommand {
    name: string;
    icon: string;
    id: string;
    action?: string;
    mode?: DeviceMode;
    triggerMode?: TriggerMode;
    visibility?: SlashCommandVisibility;
    color?: string;
    isGroup?: boolean;

    // Parent command ID, undefined means root command
    parentId?: string;

    // Directly reference child commands (tree structure)
    children?: SlashCommand[];
}
