import { Platform } from "obsidian";
import { createContext, type ReactElement, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Tree, NodeApi, NodeRendererProps } from "react-arborist";

import {
	SlashCommand,
	isCommandGroup,
	isCommandActive,
	isDeviceValid,
} from "@/data/models/SlashCommand";
import CommandStore from "@/data/stores/CommandStore";
import SlashCommanderPlugin from "@/main";
import { CommandViewerItem } from "@/ui/viewer/CommandViewerItem";
import { CommandTools } from "@/ui/viewer/CommandTools";

export const CommandStoreContext = createContext<CommandStore>(null!);

interface CommandViewerProps {
	manager: CommandStore;
	plugin: SlashCommanderPlugin;
}

interface MoveParams {
	dragIds: string[];
	parentId: string | null;
	index: number | undefined;
}

interface DropParams {
	parentNode: NodeApi<SlashCommand> | null;
	dragNodes: NodeApi<SlashCommand>[];
}

/**
 * CommandViewer component renders a tree of commands with drag-and-drop capabilities.
 * Uses react-arborist for efficient tree rendering and handling of drag-drop operations.
 */
export function CommandViewer({ manager, plugin }: CommandViewerProps): ReactElement {
	const [commands, setCommands] = useState<SlashCommand[]>(() => manager.getAllCommands());
	const { t } = useTranslation();
	const treeRef = useRef<any>(null);

	// Subscribe to command store changes
	useEffect(() => {
		const handleStoreChange = (newCommands: SlashCommand[]): void => {
			setCommands([...newCommands]);
		};
		
		// Subscribe to changes
		const unsubscribe = manager.on('changed', handleStoreChange);
		
		// Cleanup subscription on unmount
		return () => {
			unsubscribe();
		};
	}, [manager]);

	// Get root-level commands for the tree
	const rootCommands = useMemo(() => 
		commands.filter(cmd => !cmd.parentId),
		[commands]
	);
	
	// Handle movement of commands in the tree
	const handleMove = useCallback(async ({ dragIds, parentId, index }: MoveParams) => {
		// Create a copy of the command list to work with
		const updatedCommands = [...commands];
		
		// Get the dragged command
		const draggedCmd = updatedCommands.find(cmd => cmd.id === dragIds[0]);
		if (!draggedCmd) return;
		
		// Get the new parent command (if any)
		const newParent = parentId 
			? updatedCommands.find(cmd => cmd.id === parentId)
			: null;
		
		// Prevent nested command groups
		if (draggedCmd.childrenIds?.length && newParent?.childrenIds?.length) {
			return;
		}
		
		// Step 1: Remove from old parent's children array
		if (draggedCmd.parentId) {
			const oldParent = updatedCommands.find(cmd => cmd.id === draggedCmd.parentId);
			if (oldParent && oldParent.childrenIds) {
				oldParent.childrenIds = oldParent.childrenIds.filter(id => id !== draggedCmd.id);
			}
		}
		
		// Step 2: Handle the move based on the target location
		if (newParent) {
			// Moving to (or within) a parent
			
			// Update the parent ID
			draggedCmd.parentId = newParent.id;
			
			// Ensure the parent has a childrenIds array
			if (!newParent.childrenIds) {
				newParent.childrenIds = [];
			}
			
			// Determine where to insert the command
			if (index === undefined) {
				// If no index is provided, add to the end
				newParent.childrenIds.push(draggedCmd.id);
			} else {
				// Insert at the specified index
				newParent.childrenIds.splice(index, 0, draggedCmd.id);
			}
		} else {
			// Moving to root level
			
			// Clear the parent ID
			draggedCmd.parentId = undefined;
			
			// Get the root commands (excluding the dragged command if it was already at root)
			const rootCmds = updatedCommands
				.filter(cmd => !cmd.parentId && cmd.id !== draggedCmd.id);
			
			// Determine where to insert the command at root level
			let insertAt = index ?? rootCmds.length;
			
			// Create a new order of root commands
			const newRootOrder = [
				...rootCmds.slice(0, insertAt),
				draggedCmd,
				...rootCmds.slice(insertAt)
			];
			
			// Rebuild the full command list with the new root order
			const childCmds = updatedCommands.filter(cmd => cmd.parentId);
			updatedCommands.splice(0, updatedCommands.length, ...newRootOrder, ...childCmds);
		}
		
		// Save the updated structure
		await manager.updateStructure(updatedCommands);
	}, [commands, manager]);
	
	// Handle selection events from the tree
	const handleSelect = useCallback((nodes: NodeApi<SlashCommand>[]) => {
		// Optional: Handle selection behavior
	}, []);
	
	// Convert our flat data structure to tree format
	const childrenAccessor = useCallback((cmd: SlashCommand) => {
		if (!cmd.childrenIds || cmd.childrenIds.length === 0) return null;
		return commands.filter(c => cmd.childrenIds?.includes(c.id));
	}, [commands]);
	
	// Prevent command groups from being nested
	const disableDrop = useCallback(({ parentNode, dragNodes }: DropParams) => {
		if (!parentNode) return false;
		
		return dragNodes.some(node => {
			const nodeChildrenIds = node.data.childrenIds;
			const parentChildrenIds = parentNode.data.childrenIds;
			return (nodeChildrenIds && nodeChildrenIds.length > 0) && 
				(parentChildrenIds && parentChildrenIds.length > 0);
		});
	}, []);
	
	// Calculate appropriate tree height
	const treeHeight = useMemo(() => {
		const rowCount = commands.length;
		const minHeight = 400;
		const rowHeight = 55;
		const calculatedHeight = Math.min(rowCount * rowHeight, 600);
		return Math.max(calculatedHeight, minHeight);
	}, [commands.length]);
	
	// Simplified sync function that just triggers changes from manager
	const syncDataFromManager = useCallback(() => {
		manager.commitChanges();
	}, [manager]);
	
	// Custom tree node renderer
	const CommandNode = useCallback((props: NodeRendererProps<SlashCommand>) => {
		const { node, dragHandle, style } = props;
		const command = node.data;
		const isGroup = command.childrenIds && command.childrenIds.length > 0;
		
		return (
			<div 
				ref={dragHandle}
				style={style}
				className={`cmdr-command-wrapper ${isGroup ? 'is-group' : ''} ${node.state.isSelected ? 'is-selected' : ''}`}
			>
				<CommandViewerItem
					cmd={command}
					plugin={plugin}
					commands={commands}
					setState={syncDataFromManager}
					isCollapsed={!node.isOpen}
					onCollapse={isGroup ? () => node.toggle() : undefined}
				/>
			</div>
		);
	}, [commands, plugin, syncDataFromManager]);

	return (
		<CommandStoreContext.Provider value={manager}>
			<div className="cmdr-command-viewer">
				<Tree<SlashCommand>
					ref={treeRef}
					data={rootCommands}
					idAccessor="id"
					childrenAccessor={childrenAccessor}
					onMove={handleMove}
					onSelect={handleSelect}
					disableDrop={disableDrop}
					width="100%"
					height={treeHeight}
					indent={24}
					rowHeight={55}
					openByDefault={true}
					padding={10}
					selectionFollowsFocus={true}
					disableMultiSelection={true}
				>
					{CommandNode}
				</Tree>
				
				{!commands.some(
					pre => isCommandActive(plugin, pre) || pre.mode?.match(/mobile|desktop/)
				) && (
					<div className="cmdr-commands-empty">
						<h3>{t("bindings.no_command.detail")}</h3>
						<span>{t("bindings.no_command.add_now")}</span>
					</div>
				)}

				{Platform.isMobile && <hr />}

				<CommandTools plugin={plugin} manager={manager} setState={syncDataFromManager} />
			</div>
		</CommandStoreContext.Provider>
	);
} 