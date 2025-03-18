import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";
import { SlashCommand } from "@/data/models/SlashCommand";
import { useSettings, useUpdateSettings } from "@/data/stores/useSettingStore";

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
export function ConfirmDeleteComponent({ modal, command }: ConfirmDeleteProps): ReactElement {
	const { t } = useTranslation();
	const settings = useSettings();
	const updateSettings = useUpdateSettings();
	
	return (
		<>
			<p>
				{command?.isGroup
					? t("modals.remove_command.detail_group")
					: t("modals.remove_command.detail")}
			</p>
			<div className="modal-button-container">
				{settings.confirmDeletion && (
					<button
						className="mod-warning"
						onClick={async (): Promise<void> => {
							await updateSettings({
								confirmDeletion: false,
							});

							modal.remove = true;
							modal.close();
						}}
					>
						{t("modals.remove_command.never_ask")}
					</button>
				)}
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
