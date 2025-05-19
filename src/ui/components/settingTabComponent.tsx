import ObsidianIcon from "@ui/components/obsidianIconComponent";
import { TextBoxComponent, ToggleComponent } from "@ui/components/settingItemComponent";
import TriggerViewer from "@ui/components/TriggerViewerComponent";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { useSettings, useUpdateSettings } from "@/data/stores/useSettingStore";
import SlashCommanderPlugin from "@/main";
import { isTriggerInConflicts } from "@/services/utils";
import { SettingCollapserWithTools } from "@/ui/components/SettingHeaders";
import { CommandViewer } from "@/ui/viewer";
import { CommandViewerToolsBar } from "@/ui/viewer/CommandViewerTools";

interface SettingTabProps {
    plugin: SlashCommanderPlugin;
    mobileMode: boolean;
}

export default function SettingTabComponent({ plugin }: SettingTabProps): ReactElement {
    const { t } = useTranslation();
    const settings = useSettings();
    const updateSettings = useUpdateSettings();

    return (
        <div>
            <div>
                <h2>{t("settings.general")}</h2>
                {isTriggerInConflicts(plugin) && (
                    <div
                        className="setting-item"
                        style={{ border: "thin solid crimson", paddingLeft: "1em" }}
                    >
                        <ObsidianIcon
                            icon="alert-triangle"
                            size="var(--icon-xl)"
                            className="cmdr-icon mod-warning"
                            style={{
                                display: "flex",
                                alignSelf: "start",
                                justifyContent: "center",
                            }}
                        />
                        <div className="setting-item-info">
                            <div
                                className="setting-item-name"
                                style={{ fontWeight: "bold", color: "crimson" }}
                            >
                                {t("triggers.conflict.title")}
                            </div>
                            <div className="setting-item-description">
                                {t("triggers.conflict.detail")}
                            </div>
                        </div>
                    </div>
                )}
                <TextBoxComponent
                    value={settings.mainTrigger}
                    name={t("triggers.command.title")}
                    description={t("triggers.command.detail")}
                    changeHandler={async (value): Promise<void> => {
                        await updateSettings({
                            mainTrigger: value,
                        });
                    }}
                />
                <ToggleComponent
                    name={t("triggers.more.title")}
                    description={t("triggers.more.detail")}
                    value={settings.useExtraTriggers}
                    changeHandler={async (value): Promise<void> => {
                        await updateSettings({
                            useExtraTriggers: !value,
                        });
                    }}
                />
                {settings.useExtraTriggers && <TriggerViewer plugin={plugin} />}
                <ToggleComponent
                    name={t("settings.newline_only")}
                    description={t("settings.newline_only.detail")}
                    value={settings.triggerOnlyOnNewLine}
                    changeHandler={async (value): Promise<void> => {
                        await updateSettings({
                            triggerOnlyOnNewLine: !value,
                        });
                    }}
                />
                <ToggleComponent
                    name={t("settings.show_descriptions")}
                    description={t("settings.show_descriptions.detail")}
                    value={settings.showDescriptions}
                    changeHandler={async (value): Promise<void> => {
                        await updateSettings({
                            showDescriptions: !value,
                        });
                    }}
                />
                <ToggleComponent
                    name={t("settings.show_sources")}
                    description={t("settings.show_sources.detail")}
                    value={settings.showSourcesForDuplicates}
                    changeHandler={async (value): Promise<void> => {
                        await updateSettings({
                            showSourcesForDuplicates: !value,
                        });
                    }}
                />
                <ToggleComponent
                    name={t("settings.ask_before_removing")}
                    description={t("settings.ask_before_removing.detail")}
                    value={settings.confirmDeletion}
                    changeHandler={async (value): Promise<void> => {
                        await updateSettings({
                            confirmDeletion: !value,
                        });
                    }}
                />
            </div>
            <SettingCollapserWithTools
                title={t("bindings.title")}
                tools={<CommandViewerToolsBar />}
            >
                <CommandViewer
                    plugin={plugin}
                    collapsible={true}
                    indentationWidth={20}
                    removable={true}
                />
            </SettingCollapserWithTools>
        </div>
    );
}
