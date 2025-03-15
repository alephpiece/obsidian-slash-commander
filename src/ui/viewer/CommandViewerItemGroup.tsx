import { ReactElement, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { SlashCommand } from "@/data/models/SlashCommand";
import { CommandViewerItem } from "@/ui/viewer/CommandViewerItem";
import {
	useCommands,
	usePlugin,
	useCommandStore,
	useChildCommands,
} from "@/data/hooks/useCommandStore";

interface CommandViewerItemGroupProps {
	cmd: SlashCommand;
}

/**
 * Render a collapsible command group with its child commands.
 * This component handles the display and interaction of a command group.
 * Uses Zustand store for accessing commands and update functions.
 */
export function CommandViewerItemGroup({ cmd }: CommandViewerItemGroupProps): ReactElement {
	const [collapsed, setCollapsed] = useState(false);
	const commands = useCommands();
	const updateCommands = useCommandStore(state => state.updateCommands);
	const plugin = usePlugin();

	// Use the specialized hook for child commands
	const childCommands = useChildCommands(cmd.id);

	return (
		<div className="cmdr-group-collapser" aria-expanded={!collapsed}>
			<CommandViewerItem
				cmd={cmd}
				isCollapsed={collapsed}
				onCollapse={(): void => setCollapsed(!collapsed)}
			/>
			{!collapsed && (
				<div className="cmdr-group-collapser-content" data-container-type="group" data-group-id={cmd.id}>
					<ReactSortable
						list={childCommands}
						setList={(newState): void => {
							// React-sortablejs requires this callback,
							// but we'll handle actual updates in onSort
						}}
						group={{
							name: "commands",
							put: ["root"]  // Allow dragging from root list
						}}
						delay={100}
						delayOnTouchOnly={true}
						animation={200}
						forceFallback={true}
						swapThreshold={0.7}
						fallbackClass="sortable-fallback"
						dragClass="cmdr-sortable-drag"
						ghostClass="cmdr-sortable-ghost"
						onSort={({ oldIndex, newIndex, from, to }): void => {
							if (oldIndex === undefined || newIndex === undefined) return;
							
							// Handle reordering within child commands group
							if (from === to) {
								// Create a new array with updated order
								const updatedChildCommands = [...childCommands];
								const [removed] = updatedChildCommands.splice(oldIndex, 1);
								updatedChildCommands.splice(newIndex, 0, removed);

								// Ensure all child commands have the correct parentId
								for (let i = 0; i < updatedChildCommands.length; i++) {
									updatedChildCommands[i] = {
										...updatedChildCommands[i],
										parentId: cmd.id
									};
								}

								// Update the parent's children array
								const updatedCmd = {
									...cmd,
									children: updatedChildCommands
								};

								// Update only the parent command in the commands array
								const newCommands = [...commands];
								const commandIndex = newCommands.findIndex(c => c.id === cmd.id);
								
								if (commandIndex !== -1) {
									newCommands[commandIndex] = updatedCmd;
									
									// Update state and save changes
									updateCommands(newCommands);
									plugin?.saveSettings();
								}
							}
						}}
						onEnd={(evt): void => {
							// Handle dragging from root to child group
							if (evt.from !== evt.to && evt.to.closest(`[data-group-id="${cmd.id}"]`)) {
								// Get dragged command ID
								const draggedId = evt.item.dataset.id;
								if (!draggedId) return;
								
								// Get the store from Zustand
								const store = useCommandStore.getState().store;
								if (!store) return;
								
								// Get new index for proper ordering
								const newIndex = evt.newDraggableIndex;
								
								// Move command to this parent using CommandStore's moveCommand
								store.moveCommand(draggedId, cmd.id).then(() => {
									// After moving, ensure correct order within parent's children
									if (newIndex !== undefined && cmd.children && cmd.children.length > 0) {
										// Get updated parent command after the move operation
										const updatedCmd = store.getAllCommands().find(c => c.id === cmd.id);
										if (updatedCmd && updatedCmd.children) {
											// Find the moved command in children
											const movedCmdIndex = updatedCmd.children.findIndex(c => c.id === draggedId);
											if (movedCmdIndex !== -1 && movedCmdIndex !== newIndex) {
												// Reorder children array
												const updatedChildren = [...updatedCmd.children];
												const [removed] = updatedChildren.splice(movedCmdIndex, 1);
												updatedChildren.splice(newIndex, 0, removed);
												
												// Update parent with reordered children
												const updatedCommands = store.getAllCommands();
												const rootIndex = updatedCommands.findIndex(c => c.id === cmd.id);
												if (rootIndex !== -1) {
													updatedCommands[rootIndex] = {
														...updatedCommands[rootIndex],
														children: updatedChildren
													};
													
													// Update command structure with reordered children
													store.updateStructure(updatedCommands);
												}
											}
										}
									}
								});
							}
						}}
					>
						{childCommands.map(childCmd => (
							<CommandViewerItem
								key={childCmd.id}
								cmd={childCmd}
								isGroupDragging={false}
							/>
						))}
					</ReactSortable>
				</div>
			)}
		</div>
	);
}
