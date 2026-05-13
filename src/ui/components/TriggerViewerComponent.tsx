import type { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { useSettings, useUpdateSettings } from "@/data/stores/useSettingStore";
import SlashCommanderPlugin from "@/main";

import ObsidianIcon from "./obsidianIconComponent";

interface TriggerViewerProps {
    plugin: SlashCommanderPlugin;
    children?: ReactElement | ReactElement[];
}

export default function TriggerViewer({ children }: TriggerViewerProps): ReactElement {
    const { t } = useTranslation();
    const settings = useSettings();
    const updateSettings = useUpdateSettings();
    const triggers = settings.extraTriggers;

    const handleTriggerChange = async (index: number, value: string): Promise<void> => {
        if (triggers[index] !== value) {
            const newTriggers = [...triggers];
            newTriggers[index] = value;

            await updateSettings({
                extraTriggers: newTriggers,
            });
        }
    };

    const handleTriggerDelete = async (index: number): Promise<void> => {
        const newTriggers = [...triggers];
        newTriggers.splice(index, 1);

        await updateSettings({
            extraTriggers: newTriggers,
        });
    };

    const handleAddTrigger = async (): Promise<void> => {
        const newTriggers = [...triggers, ""];

        await updateSettings({
            extraTriggers: newTriggers,
        });
    };

    return (
        <div className="setting-item cmdr-trigger-setting">
            <div className="setting-item-info">
                <div className="setting-item-name">{t("triggers.extra.title")}</div>
                <div className="setting-item-description">{t("triggers.extra.detail")}</div>
            </div>
            <button
                type="button"
                className="cmdr-trigger-add"
                aria-label={t("common.add")}
                onClick={handleAddTrigger}
            >
                {t("common.add")}
            </button>
            <div className="setting-item-control cmdr-triggers">
                {triggers.map((trigger, index) => (
                    <div key={`trigger-${index}`} className="cmdr-trigger-pill">
                        <input
                            value={trigger}
                            style={{ width: `${Math.max(trigger.length + 2, 8)}ch` }}
                            onChange={(e: ChangeEvent<HTMLInputElement>): void => {
                                void handleTriggerChange(index, e.currentTarget.value);
                            }}
                        />
                        <button
                            type="button"
                            className="cmdr-trigger-delete clickable-icon"
                            aria-label={t("common.delete")}
                            onClick={(): void => {
                                void handleTriggerDelete(index);
                            }}
                        >
                            <ObsidianIcon
                                className="cmdr-icon"
                                icon="lucide-x"
                                size="var(--icon-xs)"
                            />
                        </button>
                    </div>
                ))}
                {children}
            </div>
        </div>
    );
}
