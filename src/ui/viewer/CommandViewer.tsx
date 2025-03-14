import { Platform } from "obsidian";
import { createContext, type ReactElement, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { CommandTools } from "@/ui/viewer/CommandTools";
import { SortableCommandList } from "@/ui/viewer/SortableCommandList";
import {
	SlashCommand,
	isCommandActive,
} from "@/data/models/SlashCommand";
import CommandStore from "@/data/stores/CommandStore";
import SlashCommanderPlugin from "@/main";

export const CommandStoreContext = createContext<CommandStore>(null!);

interface CommandViewerProps {
	manager: CommandStore;
	plugin: SlashCommanderPlugin;
}

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

	// Update state and commit changes to store
	const updateCommands = useCallback((newCommands: SlashCommand[]): void => {
		setCommands([...newCommands]);
		manager.updateStructure(newCommands);
	}, [manager]);

	// Sync with store
	const syncWithStore = useCallback((): void => {
		manager.commitChanges();
	}, [manager]);

	return (
		<CommandStoreContext.Provider value={manager}>
			<div className="cmdr-command-viewer">
				<SortableCommandList 
					plugin={plugin} 
					commands={commands} 
					setState={updateCommands} 
				/>
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

			<CommandTools plugin={plugin} manager={manager} setState={syncWithStore} />
		</CommandStoreContext.Provider>
	);
}