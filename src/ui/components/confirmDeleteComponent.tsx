import { Fragment, h } from "preact";
import { useTranslation } from "react-i18next";
import ConfirmDeleteModal from "../modals/confirmDeleteModal";

export function confirmDeleteComponent({ modal }: { modal: ConfirmDeleteModal }): h.JSX.Element {
	const { t } = useTranslation();
	return (
		<>
			<p>{t("modal.remove_command.detail")}</p>
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
					{t("modal.remove_command.dont_ask")}
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
