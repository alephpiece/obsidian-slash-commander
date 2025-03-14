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
				<div className="cmdr-commands-list">
					<ReactSortable
						list={commands}
						setList={(newState): void => {
							// React-sortablejs requires this callback,
							// but we'll handle actual updates in onSort
						}}
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
							if (oldIndex === undefined || newIndex === undefined || from !== to) return;
							
							// Create a new array with updated order
							const updatedCommands = [...commands];
							const [removed] = updatedCommands.splice(oldIndex, 1);
							updatedCommands.splice(newIndex, 0, removed);
							
							// Ensure all root commands have depth=0
							for (let i = 0; i < updatedCommands.length; i++) {
								updatedCommands[i] = {
									...updatedCommands[i],
									depth: 0
								};
							}
							
							// Update state and save changes
							updateCommands(updatedCommands);
							plugin?.saveSettings();
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
