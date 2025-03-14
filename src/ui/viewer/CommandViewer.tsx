import { Platform } from "obsidian";
import { createContext, type ReactElement, useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	UncontrolledTreeEnvironment,
	Tree,
	StaticTreeDataProvider,
	TreeItem,
	TreeItemIndex,
	TreeRenderProps,
	InteractionMode
} from 'react-complex-tree';

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
import ObsidianIcon from "@/ui/components/obsidianIconComponent";

export const CommandStoreContext = createContext<CommandStore>(null!);

interface CommandViewerProps {
	manager: CommandStore;
	plugin: SlashCommanderPlugin;
}

// Define the tree item data structure
interface CommandTreeItem extends TreeItem {
	data: SlashCommand;
}

type CommandTreeItems = Record<TreeItemIndex, CommandTreeItem>;

/**
 * Convert SlashCommand array to tree items format required by react-complex-tree
 */
function convertCommandsToTreeItems(commands: SlashCommand[]): CommandTreeItems {
	const treeItems: CommandTreeItems = {
		root: {
			index: 'root',
			isFolder: true,
			children: [],
			data: {
				id: 'root',
				name: 'Root',
				icon: 'folder',
				childrenIds: [],
				children: []
			}
		}
	};
	
	// Add all commands as tree items
	commands.forEach(cmd => {
		treeItems[cmd.id] = {
			index: cmd.id,
			isFolder: !!(cmd.children && cmd.children.length > 0),
			children: cmd.children?.map(child => child.id) || [],
			data: cmd
		};
	});
	
	// Set root node children
	treeItems.root.children = commands
		.filter(cmd => !cmd.parentId)
		.map(cmd => cmd.id);
		
	return treeItems;
}

/**
 * CommandViewer component renders a tree of commands with drag-and-drop capabilities.
 * Uses react-complex-tree for efficient tree rendering and handling of drag-drop operations.
 */
export function CommandViewer({ manager, plugin }: CommandViewerProps): ReactElement {
	const [commands, setCommands] = useState<SlashCommand[]>(() => manager.getAllCommands());
	const { t } = useTranslation();
	
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
	
	// Convert commands to tree items format
	const treeItems = useMemo(() => 
		convertCommandsToTreeItems(commands),
		[commands]
	);
	
	// Create data provider for the tree
	const dataProvider = useMemo(() => 
		new StaticTreeDataProvider(treeItems),
		[treeItems]
	);
	
	// Sync data from manager
	const syncDataFromManager = useCallback(() => {
		manager.commitChanges();
	}, [manager]);
	
	// Handle drag and drop operations
	const handleDrop = useCallback((items: CommandTreeItem[], target: any) => {
		// Create a copy of the command list to work with
		const updatedCommands = [...commands];
		
		// Get the dragged commands
		const draggedCommands = items
			.map(item => updatedCommands.find(cmd => cmd.id === item.index.toString()))
			.filter(Boolean) as SlashCommand[];
		
		if (draggedCommands.length === 0) return;
		
		// Get the target parent ID based on the drop target type
		let targetParentId: string | undefined;
		
		if (target.targetType === 'item') {
			// Dropping on an item - make it a child of that item
			targetParentId = target.targetItem;
		} else if (target.targetType === 'between-items') {
			// Dropping between items - add to the same parent
			targetParentId = target.parentItem === 'root' ? undefined : target.parentItem;
		} else if (target.targetType === 'root') {
			// Dropping on root
			targetParentId = undefined;
		}
		
		// Prevent nested command groups
		const hasCommandGroup = draggedCommands.some(cmd => cmd.children?.length);
		const targetIsGroup = targetParentId && updatedCommands.find(
			cmd => cmd.id === targetParentId && cmd.children?.length
		);
		
		if (hasCommandGroup && targetIsGroup) {
			return;
		}
		
		// Update each dragged command
		for (const draggedCmd of draggedCommands) {
			// Remove from old parent's children array
			if (draggedCmd.parentId) {
				const oldParent = updatedCommands.find(cmd => cmd.id === draggedCmd.parentId);
				if (oldParent && oldParent.children) {
					oldParent.children = oldParent.children.filter(child => child.id !== draggedCmd.id);
				}
			}
			
			// Update parent ID
			draggedCmd.parentId = targetParentId;
		}
		
		// Add to new parent's children array
		if (targetParentId) {
			const targetParent = updatedCommands.find(cmd => cmd.id === targetParentId);
			if (targetParent) {
				if (!targetParent.children) {
					targetParent.children = [];
				}
				
				// Add all dragged commands to the target parent
				for (const draggedCmd of draggedCommands) {
					targetParent.children.push(draggedCmd);
				}
			}
		}
		
		// Save the updated structure
		manager.updateStructure(updatedCommands);
	}, [commands, manager]);
	
	// Custom renderer for tree items
	const renderItemTitle = useCallback(({ item }: { item: CommandTreeItem }) => {
		const command = item.data;
		
		return (
			<div className={`cmdr-command-wrapper ${item.isFolder ? 'is-group' : ''}`}>
				<CommandViewerItem
					cmd={command}
					plugin={plugin}
					commands={commands}
					setState={syncDataFromManager}
					isCollapsed={false}
					onCollapse={undefined}
				/>
			</div>
		);
	}, [commands, plugin, syncDataFromManager]);
	
	// Calculate appropriate tree height - 不再需要固定高度
	const treeHeight = useMemo(() => {
		return 'auto'; // 让树形结构自适应高度
	}, []);
	
	// Custom arrow renderer
	const renderItemArrow = useCallback(({ item, context }: { item: CommandTreeItem, context: any }) => {
		if (!item.isFolder) return null;
		
		return (
			<ObsidianIcon
				icon={context.isExpanded ? "chevron-down" : "chevron-right"}
				className="cmdr-group-collapser-button clickable-icon"
			/>
		);
	}, []);
	
	return (
		<CommandStoreContext.Provider value={manager}>
			<div className="cmdr-command-viewer">
				<UncontrolledTreeEnvironment
					dataProvider={dataProvider}
					getItemTitle={(item: CommandTreeItem) => item.data.name}
					canDragAndDrop={true}
					canDropOnFolder={true}
					canReorderItems={true}
					onDrop={handleDrop}
					renderItemTitle={renderItemTitle}
					renderItemArrow={renderItemArrow}
					defaultInteractionMode={InteractionMode.DoubleClickItemToExpand}
					viewState={{
						'command-tree': {
							expandedItems: commands
								.filter(cmd => cmd.children && cmd.children.length > 0)
								.map(cmd => cmd.id)
						}
					}}
				>
					<Tree
						treeId="command-tree"
						rootItem="root"
					/>
				</UncontrolledTreeEnvironment>
				
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