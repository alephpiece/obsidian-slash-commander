import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import { usePlugin, useStore } from "@/data/hooks/useCommandStore";
import ConfirmRestoreModal from "@/ui/modals/confirmRestoreModal";
import AddBindingModal from "@/ui/bind/AddBindingModal";

/**
 * Render the command list tools (full version).
 * Uses Zustand store for accessing plugin, store and sync functions.
 */
export function CommandViewerToolsBottom(): ReactElement {
	const { t } = useTranslation();
	const plugin = usePlugin();
	const store = useStore();

	const handleRestoreDefault = async (): Promise<void> => {
		if (plugin && store) {
			await new ConfirmRestoreModal(plugin, async () => {
				await store.restoreDefault();
			}).didChooseRestore();
		}
	};

	return (
		<div className="cmdr-viewer-tools-bottom">
			<button
				className="mod-cta"
				onClick={async (): Promise<void> => {
					if (plugin) {
						const command = await new AddBindingModal(plugin).awaitSelection();
						if (command && store) {
							await store.addCommand(command);
						}
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
				onClick={handleRestoreDefault}
			/>
		</div>
	);
}

/**
 * Render the command list tools (short version).
 * Uses Zustand store for accessing plugin, store and sync functions.
 * This is a more compact version used in different contexts than CommandTools.
 */
export function CommandViewerToolsBar(): ReactElement {
	const { t } = useTranslation();
	const plugin = usePlugin();
	const store = useStore();

	const handleRestoreDefault = async (): Promise<void> => {
		if (plugin && store) {
			await new ConfirmRestoreModal(plugin, async () => {
				await store.restoreDefault();
			}).didChooseRestore();
		}
	};

	return (
		<div className="cmdr-viewer-tools-bar">
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="plus-circle"
				size="var(--icon-m)"
				aria-label={t("bindings.add")}
				onClick={async (): Promise<void> => {
					if (plugin) {
						const command = await new AddBindingModal(plugin).awaitSelection();
						if (command && store) {
							await store.addCommand(command);
						}
					}
				}}
			/>
			<ObsidianIcon
				className="cmdr-icon clickable-icon"
				icon="rotate-ccw"
				size="var(--icon-m)"
				aria-label={t("bindings.restore_default")}
				onClick={handleRestoreDefault}
			/>
		</div>
	);
}
