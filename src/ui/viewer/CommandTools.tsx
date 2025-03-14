import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import { chooseNewCommand } from "@/services/utils/util";
import { useCommandContext } from "@/ui/contexts/CommandContext";

/**
 * Render the command list tools (full version).
 * Uses Context API for accessing plugin, store and sync functions.
 */
export function CommandTools(): ReactElement {
	const { t } = useTranslation();
	const { plugin, store, syncCommands } = useCommandContext();
	
	return (
		<div className="cmdr-add-new-wrapper">
			<button
				className="mod-cta"
				onClick={async (): Promise<void> => {
					const pair = await chooseNewCommand(plugin);
					if (pair) {
						await store.addCommand(pair);
						// store.addCommand 会触发 'changed' 事件，Context 会自动更新
					}
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
					await store.restoreDefault();
					syncCommands();
				}}
			/>
		</div>
	);
}

/**
 * Render the command list tools (short version).
 * Uses Context API for accessing plugin, store and sync functions.
 * This is a more compact version used in different contexts than CommandTools.
 */
export function CommandToolsShort(): ReactElement {
	const { t } = useTranslation();
	const { plugin, store, syncCommands } = useCommandContext();
	
	return (
		<div className="cmdr-add-new-wrapper">
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="plus-circle"
				size="var(--icon-m)"
				aria-label={t("bindings.add")}
				onClick={async (): Promise<void> => {
					const pair = await chooseNewCommand(plugin);
					await store.addCommand(pair);
					syncCommands();
				}}
			/>
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="rotate-ccw"
				size="var(--icon-m)"
				aria-label={t("bindings.restore_default")}
				onClick={async (): Promise<void> => {
					await store.restoreDefault();
					syncCommands();
				}}
			/>
		</div>
	);
} 