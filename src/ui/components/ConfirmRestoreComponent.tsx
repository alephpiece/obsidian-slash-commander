import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import ConfirmRestoreModal from "../modals/ConfirmRestoreModal";

/**
 * Props for the confirm restore component
 */
interface ConfirmRestoreProps {
    modal: ConfirmRestoreModal;
}

/**
 * Component that renders the confirmation dialog for restoring default commands
 */
export function ConfirmRestoreComponent({ modal }: ConfirmRestoreProps): ReactElement {
    const { t } = useTranslation();
    return (
        <>
            <p>{t("modals.viewer.restore_default.detail")}</p>
            <div className="modal-button-container">
                <button
                    className="mod-cta"
                    onClick={(): void => {
                        modal.restore = true;
                        modal.close();
                    }}
                >
                    {t("common.ok")}
                </button>
                <button
                    onClick={(): void => {
                        modal.restore = false;
                        modal.close();
                    }}
                >
                    {t("common.cancel")}
                </button>
            </div>
        </>
    );
}
