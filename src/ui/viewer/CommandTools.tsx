import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import { chooseNewCommand } from "@/services/utils/util";
import { useCommandStore } from "@/data/stores/useCommandStore";

/**
 * Render the command list tools (full version).
 * Uses Zustand store for accessing plugin, store and sync functions.
 */
export function CommandTools(): ReactElement {
	const { t } = useTranslation();
	const plugin = useCommandStore(state => state.plugin);
	const store = useCommandStore(state => state.store);
	
	return (
		<div className="cmdr-add-new-wrapper">
			<button
				className="mod-cta"
				onClick={async (): Promise<void> => {
					if (plugin) {
						const pair = await chooseNewCommand(plugin);
						if (pair && store) {
							await store.addCommand(pair);
							// store.addCommand 会触发 'changed' 事件，Zustand store 会自动更新
						}
					}
				}}
			>
				<ObsidianIcon icon="plus-with-circle" />
				{t("bindings.add")}
			</button>
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="rotate-ccw"
				size="var(--icon-m)"
				aria-label={t("bindings.restore_default")}
				onClick={async (): Promise<void> => {
					if (store) {
						await store.restoreDefault();
						// restoreDefault 会触发 'changed' 事件，Zustand store 会自动更新
					}
				}}
			/>
		</div>
	);
}

/**
 * Render the command list tools (short version).
 * Uses Zustand store for accessing plugin, store and sync functions.
 * This is a more compact version used in different contexts than CommandTools.
 */
export function CommandToolsShort(): ReactElement {
	const { t } = useTranslation();
	const plugin = useCommandStore(state => state.plugin);
	const store = useCommandStore(state => state.store);
	
	return (
		<div className="cmdr-add-new-wrapper">
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="plus-circle"
				size="var(--icon-m)"
				aria-label={t("bindings.add")}
				onClick={async (): Promise<void> => {
					if (plugin) {
						const pair = await chooseNewCommand(plugin);
						if (pair && store) {
							await store.addCommand(pair);
							// store.addCommand 会触发 'changed' 事件，Zustand store 会自动更新
						}
					}
				}}
			/>
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="rotate-ccw"
				size="var(--icon-m)"
				aria-label={t("bindings.restore_default")}
				onClick={async (): Promise<void> => {
					if (store) {
						await store.restoreDefault();
						// restoreDefault 会触发 'changed' 事件，Zustand store 会自动更新
					}
				}}
			/>
		</div>
	);
} 