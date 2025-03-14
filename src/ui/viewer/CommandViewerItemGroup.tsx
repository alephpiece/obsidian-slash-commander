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
				<div className="cmdr-group-collapser-content">
					<ReactSortable
						list={childCommands}
						setList={(newState): void => {
							// Update depth for all child commands
							const updatedChildCommands = newState.map(childCmd => ({
								...childCmd,
								depth: 1 // Child commands are at depth 1
							}));

							// Update the parent's children array
							const updatedCmd = {
								...cmd,
								children: updatedChildCommands
							};

							// Update only the parent command and its children
							const newCommands = [...commands];
							const commandIndex = newCommands.findIndex(c => c.id === cmd.id);
							
							if (commandIndex !== -1) {
								newCommands[commandIndex] = updatedCmd;
							}

							updateCommands(newCommands);
						}}
						group="commands"
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
							if (from === to) {
								const newChildCommands = [...childCommands];
								const [removed] = newChildCommands.splice(oldIndex, 1);
								newChildCommands.splice(newIndex, 0, removed);

								// Update depth for all child commands
								const updatedChildCommands = newChildCommands.map(childCmd => ({
									...childCmd,
									depth: 1 // Child commands are at depth 1
								}));

								// Update the parent's children array
								const updatedCmd = {
									...cmd,
									children: updatedChildCommands
								};

								// Update only the parent command 
								const newCommands = [...commands];
								const commandIndex = newCommands.findIndex(c => c.id === cmd.id);
								
								if (commandIndex !== -1) {
									newCommands[commandIndex] = updatedCmd;
								}

								plugin?.saveSettings();
								updateCommands(newCommands);
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
