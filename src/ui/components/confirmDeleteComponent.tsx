import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import ConfirmDeleteModal from "../modals/confirmDeleteModal";
import { SlashCommand } from "@/data/models/SlashCommand";

/**
 * Props for the confirm delete component
 */
interface ConfirmDeleteProps {
	modal: ConfirmDeleteModal;
	command?: SlashCommand;
}

/**
 * Component that renders the confirmation dialog for deleting a command
 */
export function confirmDeleteComponent({ modal }: ConfirmDeleteProps): ReactElement {
	const { t } = useTranslation();
	return (
		<>
			<p>{t("modals.remove_command.detail")}</p>
			<div className="modal-button-container">
				<button
					className="mod-warning"
					onClick={async (): Promise<void> => {
						modal.plugin.settings.confirmDeletion = false;
						modal.plugin.saveSettings();

						modal.remove = true;
						modal.close();
					}}
				>
					{t("modals.remove_command.dont_ask")}
				</button>
				<button
					className="mod-warning"
					onClick={(): void => {
						modal.remove = true;
						modal.close();
					}}
				>
					{t("common.remove")}
				</button>
				<button
					onClick={(): void => {
						modal.remove = false;
						modal.close();
					}}
				>
					{t("common.cancel")}
				</button>
			</div>
		</>
	);
}
