import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import { chooseNewCommand } from "@/services/utils/util";
import { usePlugin, useStore } from "@/data/hooks/useCommandStore";
import ConfirmRestoreModal from "@/ui/modals/confirmRestoreModal";

/**
 * Render the command list tools (full version).
 * Uses Zustand store for accessing plugin, store and sync functions.
 */
export function CommandViewerTools(): ReactElement {
	const { t } = useTranslation();
	const plugin = usePlugin();
	const store = useStore();

	return (
		<div className="cmdr-add-new-wrapper">
			<button
				className="mod-cta"
				onClick={async (): Promise<void> => {
					if (plugin) {
						const pair = await chooseNewCommand(plugin);
						if (pair && store) {
							await store.addCommand(pair);
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
					if (plugin && store) {
						const confirmed = await new ConfirmRestoreModal(plugin, async () => {
							if (store) {
								await store.restoreDefault();
							}
						}).didChooseRestore();
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
export function CommandViewerToolsShort(): ReactElement {
	const { t } = useTranslation();
	const plugin = usePlugin();
	const store = useStore();

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
					if (plugin && store) {
						const confirmed = await new ConfirmRestoreModal(plugin, async () => {
							if (store) {
								await store.restoreDefault();
							}
						}).didChooseRestore();
					}
				}}
			/>
		</div>
	);
}
