import { ReactElement } from "react";
import { ReactSortable } from "react-sortablejs";
import SlashCommanderPlugin from "@/main";
import { SlashCommand, isCommandGroup } from "@/data/models/SlashCommand";
import { CommandViewerItem } from "@/ui/viewer/CommandViewerItem";
import { CommandViewerItemGroup } from "@/ui/viewer/CommandViewerItemGroup";

interface SortableCommandListProps {
	plugin: SlashCommanderPlugin;
	commands: SlashCommand[];
	setState: (commands: SlashCommand[]) => void;
}

/**
 * Render a sortable list of command components.
 * @param plugin - The plugin instance.
 * @param commands - The commands to render.
 * @param setState - The state updater function.
 * @returns The rendered sortable command list.
 */
export function SortableCommandList({
	plugin,
	commands,
	setState,
}: SortableCommandListProps): ReactElement {
	return (
		<ReactSortable
			list={commands}
			setList={(newState): void => setState(newState)}
			group="root"
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
					const [removed] = commands.splice(oldIndex, 1);
					commands.splice(newIndex, 0, removed);
					plugin.saveSettings();
					setState(commands);
				}
			}}
		>
			{commands.map(cmd => {
				return isCommandGroup(cmd) ? (
					<CommandViewerItemGroup
						key={cmd.id}
						cmd={cmd}
						plugin={plugin}
						parentCommands={commands}
						setState={setState}
					/>
				) : (
					<CommandViewerItem
						key={cmd.id}
						cmd={cmd}
						plugin={plugin}
						commands={commands}
						setState={(): void => syncCommands(plugin, commands, setState)}
					/>
				);
			})}
		</ReactSortable>
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