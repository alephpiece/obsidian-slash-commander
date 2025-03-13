import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import CommandStore from "@/data/stores/CommandStore";
import SlashCommanderPlugin from "@/main";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import { chooseNewCommand } from "@/services/utils/util";
import { SlashCommand } from "@/data/models/SlashCommand";

export interface CommandViewerToolsProps {
	plugin: SlashCommanderPlugin;
	manager: CommandStore;
	setState: (commands: SlashCommand[]) => void;
}

/**
 * Render the command list tools (full version).
 * @param plugin - The plugin instance.
 * @param manager - The command manager instance.
 * @param setState - The state updater function.
 * @returns The rendered command list tools.
 */
export function CommandViewerTools({ plugin, manager, setState }: CommandViewerToolsProps): ReactElement {
	const { t } = useTranslation();
	return (
		<div className="cmdr-add-new-wrapper">
			<button
				className="mod-cta"
				onClick={async (): Promise<void> => {
					const pair = await chooseNewCommand(plugin);
					await manager.addCommand(pair);
					manager.reorder();
					setState(manager.data);
				}}
			>
				{t("bindings.add")}
			</button>
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="rotate-ccw"
				size="var(--icon-m)"
				aria-label={t("bindings.restore_default")}
				onClick={async (): Promise<void> => {
					manager.restoreDefault();
					manager.reorder();
					setState(manager.data);
				}}
			/>
		</div>
	);
}

/**
 * Render the command list tools (short version).
 * @param plugin - The plugin instance.
 * @param manager - The command manager instance.
 * @param setState - The state updater function.
 * @returns The rendered command list tools short.
 */
export function CommandViewerToolsShort({
	plugin,
	manager,
	setState,
}: CommandViewerToolsProps): ReactElement {
	const { t } = useTranslation();
	return (
		<div className="cmdr-add-new-wrapper">
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="plus-circle"
				size="var(--icon-m)"
				aria-label={t("bindings.add")}
				onClick={async (): Promise<void> => {
					const pair = await chooseNewCommand(plugin);
					await manager.addCommand(pair);
					manager.reorder();
					setState(manager.data);
				}}
			/>
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="rotate-ccw"
				size="var(--icon-m)"
				aria-label={t("bindings.restore_default")}
				onClick={async (): Promise<void> => {
					manager.restoreDefault();
					manager.reorder();
					setState(manager.data);
				}}
			/>
		</div>
	);
} 