import { Fragment, h } from "preact";
import t from "@/i18n";
import ConfirmDeleteModal from "../modals/confirmDeleteModal";

export function confirmDeleteComponent({ modal }: { modal: ConfirmDeleteModal }): h.JSX.Element {
	return (
		<>
			<p>{t("Are you sure you want to delete the command?")}</p>
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
					{t("Remove and don't ask again")}
				</button>
				<button
					className="mod-warning"
					onClick={(): void => {
						modal.remove = true;
						modal.close();
					}}
				>
					{t("Remove")}
				</button>
				<button
					onClick={(): void => {
						modal.remove = false;
						modal.close();
					}}
				>
					{t("Cancel")}
				</button>
			</div>
		</>
	);
}
