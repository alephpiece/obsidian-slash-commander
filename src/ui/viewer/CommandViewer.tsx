import { ReactElement } from "react";
import { ReactSortable } from "react-sortablejs";
import { useTranslation } from "react-i18next";
import { SlashCommand, isCommandGroup } from "@/data/models/SlashCommand";
import { CommandViewerItem } from "@/ui/viewer/CommandViewerItem";
import { CommandViewerItemGroup } from "@/ui/viewer/CommandViewerItemGroup";
import { CommandViewerToolsBottom } from "@/ui/viewer/CommandViewerTools";
import {
	useCommands,
	usePlugin,
	useCommandStore,
} from "@/data/hooks/useCommandStore";

/**
 * Renders the command viewer component.
 * This is the main component for viewing and organizing commands.
 * Uses Zustand store to access commands.
 */
export function CommandViewer(): ReactElement {
	const { t } = useTranslation();
	const commands = useCommands();
	const updateCommands = useCommandStore(state => state.updateCommands);
	const plugin = usePlugin();

	return (
		<div className="cmdr-command-viewer">
			{commands && commands.length > 0 ? (
				<div className="cmdr-commands-list" data-container-type="root">
					<ReactSortable
						list={commands}
						setList={(newState): void => {
							// React-sortablejs requires this callback,
							// but we'll handle actual updates in onSort/onEnd
						}}
						group={{
							name: "root",
							put: ["commands"],  // Allow dragging from child lists
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
							
							// Handle reordering within the same level
							if (from === to) {
								// Create a new array with updated order
								const updatedCommands = [...commands];
								const [removed] = updatedCommands.splice(oldIndex, 1);
								updatedCommands.splice(newIndex, 0, removed);
								
								// Ensure all root commands have no parentId
								for (let i = 0; i < updatedCommands.length; i++) {
									if (updatedCommands[i].parentId) {
										updatedCommands[i] = {
											...updatedCommands[i],
											parentId: undefined
										};
									}
								}
								
								// Update state and save changes
								updateCommands(updatedCommands);
								plugin?.saveSettings();
							}
						}}
						onEnd={(evt): void => {
							// Handle dragging from child group to root level
							if (evt.from !== evt.to && evt.to.closest('[data-container-type="root"]')) {
								// Get dragged command ID
								const draggedId = evt.item.dataset.id;
								if (!draggedId) return;
								
								// Find the dragged command among all commands
								const allCommands = commands.flatMap(cmd => 
									cmd.children ? [cmd, ...cmd.children] : [cmd]
								);
								const movedCommand = allCommands.find(cmd => cmd.id === draggedId);
								if (!movedCommand || !movedCommand.parentId) return;
								
								// Create updated command list
								const updatedCommands = [...commands];
								
								// Update parent by removing the child command
								const parentIndex = updatedCommands.findIndex(cmd => cmd.id === movedCommand.parentId);
								if (parentIndex !== -1 && updatedCommands[parentIndex].children) {
									updatedCommands[parentIndex] = {
										...updatedCommands[parentIndex],
										children: updatedCommands[parentIndex].children.filter(
											child => child.id !== draggedId
										)
									};
								}
								
								// Create new root command (remove parentId)
								const newRootCommand = {
									...movedCommand,
									parentId: undefined
								};
								
								// Add to root command list
								updatedCommands.splice(evt.newDraggableIndex || 0, 0, newRootCommand);
								
								// Update state and save
								updateCommands(updatedCommands);
								plugin?.saveSettings();
							}
						}}
					>
						{commands.map(cmd => {
							return isCommandGroup(cmd) ? (
								<CommandViewerItemGroup key={cmd.id} cmd={cmd} />
							) : (
								<CommandViewerItem key={cmd.id} cmd={cmd} />
							);
						})}
					</ReactSortable>
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
