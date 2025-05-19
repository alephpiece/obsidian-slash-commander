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
