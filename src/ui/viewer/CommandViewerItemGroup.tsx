import { ReactElement, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import SlashCommanderPlugin from "@/main";
import { SlashCommand } from "@/data/models/SlashCommand";
import { CommandViewerItem } from "@/ui/viewer/CommandViewerItem";

interface CommandViewerItemGroupProps {
	cmd: SlashCommand;
	plugin: SlashCommanderPlugin;
	parentCommands: SlashCommand[];
	setState: (commands: SlashCommand[]) => void;
}

/**
 * Render a collapsible command group with its child commands.
 * This component handles the display and interaction of a command group.
 * @param cmd - The command group to render.
 * @param plugin - The plugin instance.
 * @param parentCommands - The parent commands array.
 * @param setState - The state updater function.
 * @returns The rendered command group with its children.
 */
export function CommandViewerItemGroup({
	cmd,
	plugin,
	parentCommands,
	setState,
}: CommandViewerItemGroupProps): ReactElement {
	const [collapsed, setCollapsed] = useState(false);
	const childCommands = parentCommands.filter(c => c.parentId === cmd.id);

	return (
		<div className="cmdr-group-collapser" aria-expanded={!collapsed}>
			<CommandViewerItem
				cmd={cmd}
				plugin={plugin}
				commands={childCommands}
				setState={(): void => syncCommands(plugin, parentCommands, setState)}
				isCollapsed={collapsed}
				onCollapse={(): void => setCollapsed(!collapsed)}
			/>
			<ReactSortable
				list={childCommands}
				setList={(newState): void => setState(newState)}
				group="root"
				delay={100}
				delayOnTouchOnly={true}
				animation={200}
				forceFallback={true}
				swapThreshold={0.7}
				fallbackClass="sortable-fallback"
				className="cmdr-group-collapser-content"
				dragClass="cmdr-sortable-drag"
				ghostClass="cmdr-sortable-ghost"
				onSort={({ oldIndex, newIndex, from, to }): void => {
					if (oldIndex === undefined || newIndex === undefined) return;

					// Moving within the same child list
					if (from === to) {
						const [removed] = childCommands.splice(oldIndex, 1);
						childCommands.splice(newIndex, 0, removed);
					}
					// Moving from child to parent list
					else if (from.classList.contains("cmdr-group-collapser-content")) {
						const [removed] = childCommands.splice(oldIndex, 1);
						parentCommands.splice(newIndex, 0, removed);
					}
					// Moving from parent to child list
					else if (to.classList.contains("cmdr-group-collapser-content")) {
						const [removed] = parentCommands.splice(oldIndex, 1);
						childCommands.splice(newIndex, 0, removed);
					}

					plugin.saveSettings();
					setState(parentCommands);
				}}
			>
				{childCommands.map(cmd => (
					<CommandViewerItem
						key={cmd.id}
						cmd={cmd}
						plugin={plugin}
						commands={childCommands}
						setState={(): void => syncCommands(plugin, parentCommands, setState)}
					/>
				))}
			</ReactSortable>
		</div>
	);
}

/**
 * Helper function to sync commands with the plugin settings
 */
function syncCommands(
	plugin: SlashCommanderPlugin, 
	commands: SlashCommand[], 
	setState: (commands: SlashCommand[]) => void
): void {
	plugin.saveSettings();
	setState([...commands]);
} 