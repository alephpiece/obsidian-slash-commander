import type { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import SlashCommanderPlugin from "src/main";

import { useSettings, useUpdateSettings } from "@/data/stores/useSettingStore";

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
        <div className="cmdr-triggers">
            {triggers.map((trigger, index) => (
                <div key={`trigger-${index}`} className="cmdr-trigger-pill">
                    <input
                        value={trigger}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void => {
                            void handleTriggerChange(index, e.currentTarget.value);
                        }}
                    />
                    <ObsidianIcon
                        className="cmdr-icon clickable-icon"
                        style={{ color: "var(--text-error)" }}
                        icon="lucide-trash"
                        size="var(--icon-s)"
                        aria-label={t("common.delete")}
                        onClick={(): void => {
                            void handleTriggerDelete(index);
                        }}
                    />
                </div>
            ))}
            <button className="cmdr-trigger-add" onClick={handleAddTrigger}>
                {t("common.add")}
            </button>
            {children}
        </div>
    );
}
