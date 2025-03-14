import { Platform } from "obsidian";
import { type ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { CommandTools } from "@/ui/viewer/CommandTools";
import { SortableCommandList } from "@/ui/viewer/SortableCommandList";
import {
	SlashCommand,
	isCommandActive,
} from "@/data/models/SlashCommand";
import CommandStore from "@/data/stores/CommandStore";
import SlashCommanderPlugin from "@/main";
import { useCommandStore } from "@/data/stores/useCommandStore";

interface CommandViewerProps {
	manager: CommandStore;
	plugin: SlashCommanderPlugin;
}

/**
 * Main command viewer component that displays all commands and provides tools to manage them
 */
export function CommandViewer({ manager, plugin }: CommandViewerProps): ReactElement {
	const { t } = useTranslation();
	
	// Use Zustand store instead of Context
	const commands = useCommandStore(state => state.commands);
	const setPlugin = useCommandStore(state => state.setPlugin);
	const setStore = useCommandStore(state => state.setStore);
	const initialize = useCommandStore(state => state.initialize);

	// Initialize Zustand store with plugin and manager
	useEffect(() => {
		setPlugin(plugin);
		const unsubscribe = setStore(manager);
		initialize();
		
		// Cleanup subscription on unmount
		return () => {
			unsubscribe();
		};
	}, [plugin, manager, setPlugin, setStore, initialize]);

	return (
		<div>
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
		</div>
	);
}