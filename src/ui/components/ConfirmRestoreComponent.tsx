import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

/**
 * Props for the confirm restore component
 */
interface ConfirmRestoreProps {
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Component that renders the confirmation dialog for restoring default commands
 */
export function ConfirmRestoreComponent({
    onConfirm,
    onCancel,
}: ConfirmRestoreProps): ReactElement {
    const { t } = useTranslation();
    return (
        <>
            <p>{t("modals.viewer.restore_default.detail")}</p>
            <div className="modal-button-container">
                <button className="mod-cta" onClick={onConfirm}>
                    {t("common.ok")}
                </button>
                <button onClick={onCancel}>{t("common.cancel")}</button>
            </div>
        </>
    );
}
