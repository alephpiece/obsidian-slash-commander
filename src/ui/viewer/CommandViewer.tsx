import { Platform } from "obsidian";
import { type ReactElement, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { CommandTools } from "@/ui/viewer/CommandTools";
import { SortableCommandList } from "@/ui/viewer/SortableCommandList";
import {
	SlashCommand,
	isCommandActive,
} from "@/data/models/SlashCommand";
import CommandStore from "@/data/stores/CommandStore";
import SlashCommanderPlugin from "@/main";
import { CommandProvider } from "@/ui/contexts/CommandContext";

interface CommandViewerProps {
	manager: CommandStore;
	plugin: SlashCommanderPlugin;
}

/**
 * Main command viewer component that displays all commands and provides tools to manage them
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

	return (
		<CommandProvider 
			plugin={plugin} 
			store={manager} 
			initialCommands={commands}
		>
			<div className="cmdr-command-viewer">
				<SortableCommandList />
			</div>
			{!commands.some(
				(pre) => isCommandActive(plugin, pre) || pre.mode?.match(/mobile|desktop/)
			) && (
				<div className="cmdr-commands-empty">
					<h3>{t("bindings.no_command.detail")}</h3>
					<span>{t("bindings.no_command.add_now")}</span>
				</div>
			)}

			{Platform.isMobile && <hr />}

			<CommandTools />
		</CommandProvider>
	);
}