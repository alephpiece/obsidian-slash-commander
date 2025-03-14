import { ReactElement, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { SlashCommand } from "@/data/models/SlashCommand";
import { CommandViewerItem } from "@/ui/viewer/CommandViewerItem";
import { useCommandStore } from "@/data/stores/useCommandStore";

interface CommandViewerItemGroupProps {
	cmd: SlashCommand;
}

/**
 * Render a collapsible command group with its child commands.
 * This component handles the display and interaction of a command group.
 * Uses Zustand store for accessing commands and update functions.
 */
export function CommandViewerItemGroup({
	cmd,
}: CommandViewerItemGroupProps): ReactElement {
	const [collapsed, setCollapsed] = useState(false);
	const commands = useCommandStore(state => state.commands);
	const updateCommands = useCommandStore(state => state.updateCommands);
	const plugin = useCommandStore(state => state.plugin);
	
	const childCommands = commands.filter(c => c.parentId === cmd.id);

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
							// Update only the child commands
							const newCommands = [...commands];
							const childIds = childCommands.map(c => c.id);
							
							// Remove old children
							const withoutChildren = newCommands.filter(c => !childIds.includes(c.id));
							
							// Add updated children
							updateCommands([...withoutChildren, ...newState]);
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
								
								// Update only the child commands
								const newCommands = [...commands];
								const childIds = childCommands.map(c => c.id);
								
								// Remove old children
								const withoutChildren = newCommands.filter(c => !childIds.includes(c.id));
								
								// Add updated children
								plugin?.saveSettings();
								updateCommands([...withoutChildren, ...newChildCommands]);
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