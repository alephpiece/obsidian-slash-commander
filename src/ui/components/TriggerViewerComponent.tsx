import type { ReactElement, ChangeEvent } from "react";
import { useState, useEffect } from "react";
import SlashCommanderPlugin from "src/main";
import ObsidianIcon from "./obsidianIconComponent";
import { useTranslation } from "react-i18next";
import { useSettings, useUpdateSettings } from "@/data/stores/useSettingStore";

interface TriggerViewerProps {
    plugin: SlashCommanderPlugin;
    children?: ReactElement | ReactElement[];
}

export default function TriggerViewer({ plugin, children }: TriggerViewerProps): ReactElement {
    const { t } = useTranslation();
    const settings = useSettings();
    const updateSettings = useUpdateSettings();
    const [triggers, setTriggers] = useState(settings.extraTriggers);

    // Update local state when global settings change
    useEffect(() => {
        setTriggers([...settings.extraTriggers]);
    }, [settings.extraTriggers]);

    const handleTriggerChange = async (index: number, value: string): Promise<void> => {
        if (triggers[index] !== value) {
            const newTriggers = [...triggers];
            newTriggers[index] = value;
            setTriggers(newTriggers);

            await updateSettings({
                extraTriggers: newTriggers,
            });
        }
    };

    const handleTriggerDelete = async (index: number): Promise<void> => {
        const newTriggers = [...triggers];
        newTriggers.splice(index, 1);
        setTriggers(newTriggers);

        await updateSettings({
            extraTriggers: newTriggers,
        });
    };

    const handleAddTrigger = async (): Promise<void> => {
        const newTriggers = [...triggers, ""];
        setTriggers(newTriggers);

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
