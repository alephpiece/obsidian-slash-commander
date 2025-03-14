import { ReactElement } from "react";
import { ReactSortable } from "react-sortablejs";
import { SlashCommand, isCommandGroup } from "@/data/models/SlashCommand";
import { CommandViewerItem } from "@/ui/viewer/CommandViewerItem";
import { CommandViewerItemGroup } from "@/ui/viewer/CommandViewerItemGroup";
import { useCommands, usePlugin, useCommandStore } from "@/data/hooks/useCommandStore";

/**
 * Render a sortable list of command components.
 * Uses Zustand store for accessing commands and update functions.
 */
export function SortableCommandList(): ReactElement {
	const commands = useCommands();
	const updateCommands = useCommandStore((state) => state.updateCommands);
	const plugin = usePlugin();
	
	return (
		<ReactSortable
			list={commands}
			setList={(newState): void => updateCommands(newState)}
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
					const newCommands = [...commands];
					const [removed] = newCommands.splice(oldIndex, 1);
					newCommands.splice(newIndex, 0, removed);
					plugin?.saveSettings();
					updateCommands(newCommands);
				}
			}}
		>
			{commands.map(cmd => {
				return isCommandGroup(cmd) ? (
					<CommandViewerItemGroup
						key={cmd.id}
						cmd={cmd}
					/>
				) : (
					<CommandViewerItem
						key={cmd.id}
						cmd={cmd}
					/>
				);
			})}
		</ReactSortable>
	);
} 