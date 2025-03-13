import { Platform } from "obsidian";
import { createContext, type ReactElement, useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	UniqueIdentifier
} from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {
	SlashCommand,
	isCommandGroup,
	isCommandActive,
	isDeviceValid,
} from "@/data/models/SlashCommand";
import CommandStore from "@/data/stores/CommandStore";
import SlashCommanderPlugin from "@/main";
import { CommandListItem } from "@/ui/components/commandListItem";
import { CommandViewerTools } from "@/ui/components/commandViewerTools";
import { SortableCommandItem } from "@/ui/components/sortableCommandItem";

export const CommandStoreContext = createContext<CommandStore>(null!);

interface CommandViewerProps {
	manager: CommandStore;
	plugin: SlashCommanderPlugin;
}

export default function CommandViewer({ manager, plugin }: CommandViewerProps): ReactElement {
	const [commands, setCommands] = useState<SlashCommand[]>(() => manager.data);
	const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
	const { t } = useTranslation();

	// Find active command when dragging
	const activeCommand = useMemo(() => 
		activeId ? commands.find(cmd => cmd.id === activeId) : null, 
		[activeId, commands]
	);

	// Configure sensors for drag detection
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5, // Minimum drag distance to activate
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Organize commands into a tree structure for display
	const rootCommands = useMemo(() => 
		commands.filter(cmd => !cmd.parentId),
		[commands]
	);

	// Handle drag start
	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id);
	};

	// Handle drag end 
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		
		if (!over || active.id === over.id) {
			setActiveId(null);
			return;
		}

		// Create a new copy of commands
		const updatedCommands = [...commands];
		
		// Find indexes of dragged and target items
		const activeIndex = updatedCommands.findIndex(cmd => cmd.id === active.id);
		const overIndex = updatedCommands.findIndex(cmd => cmd.id === over.id);
		
		if (activeIndex < 0 || overIndex < 0) {
			setActiveId(null);
			return;
		}

		const draggedCmd = updatedCommands[activeIndex];
		const targetCmd = updatedCommands[overIndex];
		
		// Prevent dragging a group into another group
		if (isCommandGroup(draggedCmd) && isCommandGroup(targetCmd)) {
			setActiveId(null);
			return;
		}
		
		// Check if dragging to a command group
		if (isCommandGroup(targetCmd)) {
			// Move command to the group
			const oldParentId = draggedCmd.parentId;

			// Remove from previous parent's childrenIds if it existed
			if (oldParentId) {
				const oldParent = updatedCommands.find(cmd => cmd.id === oldParentId);
				if (oldParent && oldParent.childrenIds) {
					oldParent.childrenIds = oldParent.childrenIds.filter(id => id !== draggedCmd.id);
				}
			}
			
			// Add to new parent at the beginning of the group
			draggedCmd.parentId = targetCmd.id;
			if (!targetCmd.childrenIds) targetCmd.childrenIds = [];
			
			// Add to beginning of the children array
			targetCmd.childrenIds.unshift(draggedCmd.id);
		}
		// Handle case where target is a child command
		else if (targetCmd.parentId) {
			const parentId = targetCmd.parentId;
			const parent = updatedCommands.find(cmd => cmd.id === parentId);
			
			if (!parent || !parent.childrenIds) {
				setActiveId(null);
				return;
			}
			
			// Find position in parent's children
			const childIndex = parent.childrenIds.indexOf(targetCmd.id);
			if (childIndex === -1) {
				setActiveId(null);
				return;
			}
			
			// Remove from old parent if applicable
			if (draggedCmd.parentId) {
				const oldParent = updatedCommands.find(cmd => cmd.id === draggedCmd.parentId);
				if (oldParent && oldParent.childrenIds) {
					oldParent.childrenIds = oldParent.childrenIds.filter(id => id !== draggedCmd.id);
				}
			}
			
			// Add to new parent's children at the correct position
			draggedCmd.parentId = parentId;
			
			// Same parent - we need to handle the position shift
			if (draggedCmd.parentId === parent.id && parent.childrenIds.includes(draggedCmd.id)) {
				// Remove first then insert
				parent.childrenIds = parent.childrenIds.filter(id => id !== draggedCmd.id);
				
				// Get updated index after removal
				const targetIndex = parent.childrenIds.indexOf(targetCmd.id);
				parent.childrenIds.splice(targetIndex, 0, draggedCmd.id);
			} else {
				// Insert at the correct position
				parent.childrenIds.splice(childIndex, 0, draggedCmd.id);
			}
		}
		// Handle same-level reordering
		else {
			// If same parent or both at root level
			if (draggedCmd.parentId === targetCmd.parentId) {
				// Just reorder the array
				const newCommands = arrayMove(updatedCommands, activeIndex, overIndex);
				setCommands(newCommands);
				setActiveId(null);
				
				// Save changes
				manager.reorder();
				plugin.saveSettings();
				return;
			}
			// Handle moving from group to root level
			else if (draggedCmd.parentId && !targetCmd.parentId) {
				// Remove from parent group
				const oldParent = updatedCommands.find(cmd => cmd.id === draggedCmd.parentId);
				if (oldParent && oldParent.childrenIds) {
					oldParent.childrenIds = oldParent.childrenIds.filter(id => id !== draggedCmd.id);
				}
				
				// Remove parent reference
				draggedCmd.parentId = undefined;
				
				// Place in the correct position at root level
				const rootCommands = updatedCommands.filter(cmd => !cmd.parentId);
				const targetIndex = rootCommands.findIndex(cmd => cmd.id === targetCmd.id);
				
				// Remove from current position
				updatedCommands.splice(activeIndex, 1);
				
				// Find correct insertion point in the full array
				const insertIndex = updatedCommands.findIndex(cmd => cmd.id === targetCmd.id);
				updatedCommands.splice(insertIndex, 0, draggedCmd);
			}
		}
		
		// Update state and save changes
		setCommands(updatedCommands);
		manager.reorder();
		plugin.saveSettings();
		setActiveId(null);
	};

	// Update internal state when manager data changes
	const syncDataFromManager = () => {
		setCommands([...manager.data]);
	};

	return (
		<CommandStoreContext.Provider value={manager}>
			<div className="cmdr-command-viewer">
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<SortableContext 
						items={commands.map(cmd => cmd.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className="cmdr-commands-list">
							{rootCommands.map(cmd => (
								<SortableCommandItem
									key={cmd.id}
									command={cmd}
									commands={commands}
									plugin={plugin}
									setState={syncDataFromManager}
								/>
							))}
						</div>
					</SortableContext>
					
					{/* Overlay showing the dragged item */}
					<DragOverlay>
						{activeId && activeCommand ? (
							<div className="cmdr-command-overlay">
								<CommandListItem
									cmd={activeCommand}
									plugin={plugin}
									commands={commands}
									setState={syncDataFromManager}
									isGroupDragging={isCommandGroup(activeCommand)}
								/>
								{isCommandGroup(activeCommand) && (
									<div className="cmdr-group-badge">
										{commands.filter(cmd => cmd.parentId === activeCommand.id).length} items
									</div>
								)}
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			</div>
			
			{!commands.some(
				pre => isCommandActive(plugin, pre) || pre.mode?.match(/mobile|desktop/)
			) && (
				<div className="cmdr-commands-empty">
					<h3>{t("bindings.no_command.detail")}</h3>
					<span>{t("bindings.no_command.add_now")}</span>
				</div>
			)}

			{Platform.isMobile && <hr />}

			<CommandViewerTools plugin={plugin} manager={manager} setState={syncDataFromManager} />
		</CommandStoreContext.Provider>
	);
}
