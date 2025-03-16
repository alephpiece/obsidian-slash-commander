import type { UniqueIdentifier } from '@dnd-kit/core';
import type { SlashCommand } from '@/data/models/SlashCommand';
import SlashCommanderPlugin from '@/main';

/**
 * Extended TreeItem interface that includes SlashCommand properties
 */
export interface CommandTreeItem {
    id: UniqueIdentifier;
    command: SlashCommand;
    children: CommandTreeItem[];
    collapsed?: boolean;
}

export type CommandTreeItems = CommandTreeItem[];

/**
 * Flattened representation of a CommandTreeItem for dnd-kit's internal use
 */
export interface FlattenedCommandItem extends CommandTreeItem {
    parentId: UniqueIdentifier | null;
    depth: number;
    index: number;
}

/**
 * Props for the CommandViewer component
 */
export interface CommandViewerProps {
    plugin: SlashCommanderPlugin;
    collapsible?: boolean;
    indentationWidth?: number;
    indicator?: boolean;
    removable?: boolean;
}

/**
 * Props for CommandViewerItem component
 */
export interface CommandViewerItemProps {
    id: UniqueIdentifier;
    command: SlashCommand;
    depth: number;
    indentationWidth: number;
    indicator?: boolean;
    collapsed?: boolean;
    onCollapse?: () => void;
    onRemove?: () => void;
    plugin: SlashCommanderPlugin;
    childCount?: number;
    clone?: boolean;
} 