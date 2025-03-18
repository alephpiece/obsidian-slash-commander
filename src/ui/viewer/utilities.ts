import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { SlashCommand } from "@/data/models/SlashCommand";
import type { CommandTreeItem, CommandTreeItems, FlattenedCommandItem } from "./types";

/**
 * Convert SlashCommand array to CommandTreeItems for dnd-kit
 */
export function commandsToTreeItems(commands: SlashCommand[]): CommandTreeItems {
    return commands.map((command) => ({
        id: command.id,
        command,
        children: command.children ? commandsToTreeItems(command.children) : [],
        collapsed: false,
    }));
}

/**
 * Convert CommandTreeItems back to SlashCommand array
 */
export function treeItemsToCommands(items: CommandTreeItems): SlashCommand[] {
    return items.map((item) => {
        const command = { ...item.command };

        if (item.children && item.children.length > 0) {
            command.children = treeItemsToCommands(item.children);
        } else {
            command.children = [];
        }

        return command;
    });
}

/**
 * Calculate the appropriate drag depth based on horizontal offset
 */
function getDragDepth(offset: number, indentationWidth: number) {
    return Math.round(offset / indentationWidth);
}

/**
 * Get projection information for the dragged item
 */
export function getProjection(
    items: FlattenedCommandItem[],
    activeId: UniqueIdentifier,
    overId: UniqueIdentifier,
    dragOffset: number,
    indentationWidth: number
) {
    const overItemIndex = items.findIndex(({ id }) => id === overId);
    const activeItemIndex = items.findIndex(({ id }) => id === activeId);
    const activeItem = items[activeItemIndex];
    const newItems = arrayMove(items, activeItemIndex, overItemIndex);
    const previousItem = newItems[overItemIndex - 1];
    const nextItem = newItems[overItemIndex + 1];
    const dragDepth = getDragDepth(dragOffset, indentationWidth);
    const projectedDepth = activeItem.depth + dragDepth;
    const maxDepth = getMaxDepth({
        previousItem,
    });
    const minDepth = getMinDepth({ nextItem });
    let depth = projectedDepth;

    if (projectedDepth >= maxDepth) {
        depth = maxDepth;
    } else if (projectedDepth < minDepth) {
        depth = minDepth;
    }

    return { depth, maxDepth, minDepth, parentId: getParentId() };

    function getParentId() {
        if (depth === 0 || !previousItem) {
            return null;
        }

        if (depth === previousItem.depth) {
            return previousItem.parentId;
        }

        if (depth > previousItem.depth) {
            return previousItem.id;
        }

        const newParentId = findParentWithDepth(previousItem, depth);
        return newParentId;
    }

    /**
     * Find parent with the specified depth
     */
    function findParentWithDepth(
        item: FlattenedCommandItem,
        depth: number
    ): UniqueIdentifier | null {
        if (!item.parentId) {
            return null;
        }

        const parent = items.find(({ id }) => id === item.parentId);

        if (!parent) {
            return null;
        }

        if (parent.depth === depth - 1) {
            return parent.id;
        }

        return findParentWithDepth(parent, depth);
    }
}

/**
 * Get maximum allowed depth based on previous item
 */
function getMaxDepth({ previousItem }: { previousItem?: FlattenedCommandItem }) {
    if (!previousItem) {
        return 0;
    }

    return previousItem.depth + 1;
}

/**
 * Get minimum allowed depth based on next item
 */
function getMinDepth({ nextItem }: { nextItem?: FlattenedCommandItem }) {
    if (!nextItem) {
        return 0;
    }

    return nextItem.depth;
}

/**
 * Flatten a tree structure for dnd-kit internal use
 */
function flatten(
    items: CommandTreeItems,
    parentId: UniqueIdentifier | null = null,
    depth = 0
): FlattenedCommandItem[] {
    return items.flatMap((item, index) => {
        const flattenedItem: FlattenedCommandItem = {
            ...item,
            parentId,
            depth,
            index,
        };

        if (item.children.length > 0 && !item.collapsed) {
            return [flattenedItem, ...flatten(item.children, item.id, depth + 1)];
        }

        return [flattenedItem];
    });
}

/**
 * Flatten a tree structure for dnd-kit internal use
 */
export function flattenTree(items: CommandTreeItems): FlattenedCommandItem[] {
    return flatten(items);
}

/**
 * Build a tree structure from flattened items
 */
export function buildTree(flattenedItems: FlattenedCommandItem[]): CommandTreeItems {
    const root: CommandTreeItems = [];
    const itemMap = new Map<UniqueIdentifier, CommandTreeItem>();
    const items = flattenedItems.map((item) => ({
        id: item.id,
        command: item.command,
        children: [],
        collapsed: item.collapsed,
    }));

    // First pass: create all items and store in map
    for (const item of items) {
        itemMap.set(item.id, item);
    }

    // Second pass: build the tree
    for (const flatItem of flattenedItems) {
        const item = itemMap.get(flatItem.id);
        if (!item) continue;

        if (flatItem.parentId === null) {
            root.push(item);
        } else {
            const parent = itemMap.get(flatItem.parentId);
            parent?.children.push(item);
        }
    }

    return root;
}

/**
 * Find an item by ID in a tree structure
 */
export function findItemDeep(
    items: CommandTreeItems,
    itemId: UniqueIdentifier
): CommandTreeItem | undefined {
    for (const item of items) {
        if (item.id === itemId) {
            return item;
        }

        if (item.children.length) {
            const child = findItemDeep(item.children, itemId);
            if (child) {
                return child;
            }
        }
    }

    return undefined;
}

/**
 * Remove an item from a tree structure
 */
export function removeItem(items: CommandTreeItems, id: UniqueIdentifier): CommandTreeItems {
    const newItems = [];

    for (const item of items) {
        if (item.id === id) {
            continue;
        }

        if (item.children.length) {
            newItems.push({
                ...item,
                children: removeItem(item.children, id),
            });
        } else {
            newItems.push(item);
        }
    }

    return newItems;
}

/**
 * Set a property on an item in a tree structure
 */
export function setProperty<T extends keyof CommandTreeItem>(
    items: CommandTreeItems,
    id: UniqueIdentifier,
    property: T,
    setter: (value: CommandTreeItem[T]) => CommandTreeItem[T]
): CommandTreeItems {
    return items.map((item) => {
        if (item.id === id) {
            return {
                ...item,
                [property]: setter(item[property]),
            };
        }

        if (item.children.length) {
            return {
                ...item,
                children: setProperty(item.children, id, property, setter),
            };
        }

        return item;
    });
}

/**
 * Count the children of an item in a tree structure
 */
function countChildren(items: CommandTreeItem[], count = 0): number {
    return items.reduce((acc, item) => {
        if (item.children.length) {
            return countChildren(item.children, acc + 1);
        }

        return acc + 1;
    }, count);
}

/**
 * Get the total count of children for an item
 */
export function getChildCount(items: CommandTreeItems, id: UniqueIdentifier): number {
    const item = findItemDeep(items, id);
    return item ? countChildren(item.children) : 0;
}

/**
 * Remove children of specified items from a flattened tree
 */
export function removeChildrenOf(
    items: FlattenedCommandItem[],
    ids: UniqueIdentifier[]
): FlattenedCommandItem[] {
    const excludeParentIds = new Set(ids);

    return items.filter((item) => {
        if (item.parentId && excludeParentIds.has(item.parentId)) {
            excludeParentIds.add(item.id);
            return false;
        }

        return true;
    });
}
