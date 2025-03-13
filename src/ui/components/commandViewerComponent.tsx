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
import { CommandListItem } from "@/ui/components/commandListItem";
import { CommandViewerTools } from "@/ui/components/commandViewerTools";

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
export default function CommandViewer({ manager, plugin }: CommandViewerProps): ReactElement {
	const [commands, setCommands] = useState<SlashCommand[]>(() => manager.data);
	const { t } = useTranslation();
	const treeRef = useRef<any>(null);

	// Get root-level commands for the tree
	const rootCommands = useMemo(() => 
		commands.filter(cmd => !cmd.parentId),
		[commands]
	);
	
	// Keep local state in sync with store
	useEffect(() => {
		setCommands([...manager.data]);
	}, [manager]);
	
	// Handle movement of commands in the tree
	const handleMove = useCallback(({ dragIds, parentId, index }: MoveParams) => {
		const updatedCommands = [...commands];
		const draggedCmd = updatedCommands.find(cmd => cmd.id === dragIds[0]);
		const targetParent = parentId 
			? updatedCommands.find(cmd => cmd.id === parentId)
			: null;
			
		if (!draggedCmd) return;
		
		// Prevent nested command groups
		if (draggedCmd.childrenIds?.length && targetParent?.childrenIds?.length) {
			return;
		}
		
		// Remove from old parent if applicable
		if (draggedCmd.parentId) {
			const oldParent = updatedCommands.find(cmd => cmd.id === draggedCmd.parentId);
			if (oldParent && oldParent.childrenIds) {
				oldParent.childrenIds = oldParent.childrenIds.filter(id => id !== draggedCmd.id);
			}
		}
		
		// Add to new parent or keep at root level
		if (targetParent) {
			draggedCmd.parentId = targetParent.id;
			if (!targetParent.childrenIds) targetParent.childrenIds = [];
			
			if (index === undefined) {
				targetParent.childrenIds.push(draggedCmd.id);
			} else {
				targetParent.childrenIds.splice(index, 0, draggedCmd.id);
			}
		} else {
			draggedCmd.parentId = undefined;
		}
		
		setCommands(updatedCommands);
		manager.reorder();
		plugin.saveSettings();
	}, [commands, manager, plugin]);
	
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
		const rowHeight = 55; // 确保每行有足够的空间
		const calculatedHeight = Math.min(rowCount * rowHeight, 600);
		return Math.max(calculatedHeight, minHeight);
	}, [commands.length]);
	
	const syncDataFromManager = useCallback(() => {
		setCommands([...manager.data]);
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
				<CommandListItem
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

				<CommandViewerTools plugin={plugin} manager={manager} setState={syncDataFromManager} />
			</div>
		</CommandStoreContext.Provider>
	);
}
