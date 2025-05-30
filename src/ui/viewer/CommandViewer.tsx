import {
    Announcements,
    closestCenter,
    DndContext,
    DragEndEvent,
    DragMoveEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    MeasuringStrategy,
    PointerSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { useCommands, useSettingStore } from "@/data/stores/useSettingStore";
import {
    buildTree,
    commandsToTreeItems,
    CommandTreeItems,
    CommandViewerItem,
    CommandViewerProps,
    CommandViewerToolsBottom,
    FlattenedCommandItem,
    flattenTree,
    getChildCount,
    getProjection,
    removeChildrenOf,
    removeItem,
    setProperty,
    treeItemsToCommands,
} from "@/ui/viewer";

// Measuring configuration
const measuring = {
    droppable: {
        strategy: MeasuringStrategy.Always,
    },
};

// Drop animation configuration
const dropAnimationConfig = {
    keyframes({ transform }: any) {
        return [
            { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
            {
                opacity: 0,
                transform: CSS.Transform.toString({
                    ...transform.final,
                    x: transform.final.x + 5,
                    y: transform.final.y - 20,
                }),
            },
        ];
    },
    easing: "ease-out",
    duration: 150,
};

/**
 * Component for viewing and sorting the command tree structure.
 * Integrates with dndkit for drag-and-drop functionality.
 */
export function CommandViewer({
    plugin,
    collapsible = true,
    indicator = false,
    indentationWidth = 20,
    removable = true,
}: CommandViewerProps) {
    const { t } = useTranslation();
    const commands = useCommands();
    const { updateSettings } = useSettingStore();

    // Convert SlashCommand array to dndkit-compatible tree structure
    const [items, setItems] = useState<CommandTreeItems>(() => commandsToTreeItems(commands));

    // Track active drag state
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
    const [offsetLeft, setOffsetLeft] = useState(0);
    const [, setCurrentPosition] = useState<{
        parentId: UniqueIdentifier | null;
        overId: UniqueIdentifier;
    } | null>(null);

    // Keep tree in sync with commands from store
    useEffect(() => {
        setItems(commandsToTreeItems(commands));
    }, [commands]);

    // Create flattened version of tree for dndkit
    const flattenedItems = useMemo(() => {
        const flattenedTree = flattenTree(items);
        const collapsedItems = flattenedTree.reduce<string[]>(
            (acc, { children, collapsed, id }) =>
                collapsed && children.length ? [...acc, id as string] : acc,
            []
        );

        return removeChildrenOf(
            flattenedTree,
            activeId != null ? [activeId as string, ...collapsedItems] : collapsedItems
        );
    }, [activeId, items]);

    // Calculate projection for drag operations
    const projected =
        activeId && overId
            ? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth)
            : null;

    // Setup dnd sensors - only pointer sensor
    const sensors = useSensors(useSensor(PointerSensor));

    // Get sorted IDs for SortableContext
    const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems]);

    // Get active item for drag overlay
    const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null;

    // Simplified accessibility announcements
    const announcements: Announcements = {
        onDragStart() {
            return `Started dragging item.`;
        },
        onDragOver({ over }) {
            return over ? `Moved over another item.` : `Dragging in progress.`;
        },
        onDragEnd({ over }) {
            return over ? `Finished dragging.` : `Dragging canceled.`;
        },
        onDragCancel() {
            return `Dragging canceled, item returned to original position.`;
        },
    };

    // Save changes to command store
    const saveChangesToStore = useCallback(
        async (newItems: CommandTreeItems) => {
            const newCommands = treeItemsToCommands(newItems);
            await updateSettings({ bindings: newCommands });
        },
        [updateSettings]
    );

    // Handle drag start
    function handleDragStart({ active }: DragStartEvent) {
        setActiveId(active.id);
        setOverId(active.id);

        const activeItem = flattenedItems.find(({ id }) => id === active.id);

        if (activeItem) {
            setCurrentPosition({
                parentId: activeItem.parentId,
                overId: active.id,
            });
        }

        document.body.style.setProperty("cursor", "grabbing");
    }

    // Handle drag move (horizontal position for nesting)
    function handleDragMove({ delta }: DragMoveEvent) {
        setOffsetLeft(delta.x);
    }

    // Handle drag over
    function handleDragOver({ over }: DragOverEvent) {
        setOverId(over?.id ?? null);
    }

    // Handle drag end
    async function handleDragEnd({ active, over }: DragEndEvent) {
        resetState();

        if (projected && over) {
            const { depth, parentId } = projected;
            const clonedItems: FlattenedCommandItem[] = JSON.parse(
                JSON.stringify(flattenTree(items))
            );
            const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
            const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
            const activeTreeItem = clonedItems[activeIndex];

            clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };

            const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
            const newItems = buildTree(sortedItems);

            setItems(newItems);
            await saveChangesToStore(newItems);
        }
    }

    // Handle drag cancel
    function handleDragCancel() {
        resetState();
    }

    // Reset state after drag operations
    function resetState() {
        setOverId(null);
        setActiveId(null);
        setOffsetLeft(0);
        setCurrentPosition(null);

        document.body.style.setProperty("cursor", "");
    }

    // Handle item remove
    async function handleRemove(id: UniqueIdentifier) {
        const newItems = removeItem(items, id);
        setItems(newItems);
        await saveChangesToStore(newItems);
    }

    // Handle item collapse
    function handleCollapse(id: UniqueIdentifier) {
        setItems((items) => setProperty(items, id, "collapsed", (value) => !value));
    }

    return (
        <div className="cmdr-command-viewer">
            {commands && commands.length > 0 ? (
                <div className="cmdr-commands-list" data-container-type="root">
                    <DndContext
                        accessibility={{ announcements }}
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        measuring={measuring}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                    >
                        <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
                            {flattenedItems.map(({ id, command, children, collapsed, depth }) => (
                                <CommandViewerItem
                                    key={id}
                                    id={id}
                                    command={command}
                                    depth={id === activeId && projected ? projected.depth : depth}
                                    indentationWidth={indentationWidth}
                                    indicator={indicator}
                                    collapsed={Boolean(collapsed && children.length)}
                                    onCollapse={
                                        collapsible && children.length
                                            ? () => handleCollapse(id)
                                            : undefined
                                    }
                                    onRemove={removable ? () => handleRemove(id) : undefined}
                                    plugin={plugin}
                                />
                            ))}
                            {createPortal(
                                <DragOverlay dropAnimation={dropAnimationConfig}>
                                    {activeId && activeItem ? (
                                        <CommandViewerItem
                                            id={activeId}
                                            command={activeItem.command}
                                            depth={activeItem.depth}
                                            clone
                                            childCount={getChildCount(items, activeId) + 1}
                                            indentationWidth={indentationWidth}
                                            plugin={plugin}
                                        />
                                    ) : null}
                                </DragOverlay>,
                                document.body
                            )}
                        </SortableContext>
                    </DndContext>
                </div>
            ) : (
                <div className="cmdr-commands-empty">
                    <h3>{t("bindings.no_command.detail")}</h3>
                    <span>{t("bindings.no_command.add_now")}</span>
                </div>
            )}
            <CommandViewerToolsBottom />
        </div>
    );
}
