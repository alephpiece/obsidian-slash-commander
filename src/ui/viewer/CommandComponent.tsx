import { Platform } from "obsidian";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { SlashCommand } from "@/data/models/SlashCommand";
import SlashCommanderPlugin from "@/main";
import {
    getCommandSourceName,
    getObsidianCommand,
    isCommandGroup,
    isRootCommand,
} from "@/services/command";
import { getDeviceModeInfo, getTriggerModeInfo } from "@/services/utils";
import ChangeableText from "@/ui/components/changeableText";
import ObsidianIcon from "@/ui/components/obsidianIconComponent";
import BindingEditorModal from "@/ui/modals/BindingEditorModal";

export interface CommandProps {
    plugin: SlashCommanderPlugin;
    pair: SlashCommand;
    handleRemove: () => void;
    handleNewIcon: () => void;
    handleRename: (name: string) => void;
    handleDeviceModeChange: (mode?: string) => void;
    handleTriggerModeChange: (mode?: string) => void;
    handleUpdateCommand: (updates: Partial<SlashCommand>) => Promise<void> | void;
    handleAddChild?: () => void;
    isCollapsed?: boolean;
    handleCollapse?: () => void;
}

/**
 * Component for rendering a command item with appropriate controls.
 */
export function CommandComponent({
    plugin,
    pair,
    handleRemove,
    handleNewIcon,
    handleRename,
    handleDeviceModeChange,
    handleTriggerModeChange,
    handleUpdateCommand,
    handleAddChild,
    isCollapsed,
    handleCollapse,
}: CommandProps): ReactElement {
    const { t } = useTranslation();
    const cmd = getObsidianCommand(plugin, pair);
    const isUnavailable = !isCommandGroup(pair) && !cmd;

    const { deviceModeIcon, deviceModeName } = getDeviceModeInfo(pair.mode);
    const { triggerModeIcon, triggerModeName } = getTriggerModeInfo(pair.triggerMode);

    return (
        <div className="cmdr-setting-item">
            {isUnavailable ? (
                <ObsidianIcon
                    icon="alert-triangle"
                    size="var(--icon-l) + 4px"
                    className="cmdr-icon mod-warning"
                    style={{ color: "var(--text-error)" }}
                    aria-label={`id: "${pair.id}"\naction: "${pair.action}"`}
                />
            ) : (
                <ObsidianIcon
                    icon={pair.icon}
                    size="var(--icon-l) + 4px"
                    aria-label={t("bindings.icon.change")}
                    onClick={handleNewIcon}
                    className="cmdr-icon clickable-icon"
                />
            )}
            <div className="cmdr-item-info">
                <div className="cmdr-item-name">
                    <ChangeableText
                        ariaLabel={t("bindings.rename.click")}
                        handleChange={(e): void => {
                            handleRename(e.currentTarget.value);
                        }}
                        value={pair.name}
                    />
                </div>
                {Platform.isDesktop &&
                    !isCommandGroup(pair) &&
                    (cmd ? (
                        <div
                            className="cmdr-item-description"
                            aria-label={`id: "${pair.id}"\naction: "${pair.action}"`}
                        >
                            {t("bindings.source", {
                                plugin_name: getCommandSourceName(plugin, cmd),
                            })}
                            {pair.name !== cmd.name ? ` "${cmd.name}"` : "."}
                        </div>
                    ) : (
                        <div
                            className="cmdr-item-description"
                            style={{ color: "var(--text-error)" }}
                        >
                            {t("bindings.device_mode.unavailable")}
                        </div>
                    ))}
            </div>
            <div className="cmdr-item-control">
                {isCollapsed !== undefined && handleCollapse && (
                    <ObsidianIcon
                        icon={isCollapsed ? "chevron-right" : "chevron-down"}
                        className="cmdr-group-collapser-button clickable-icon"
                        onClick={handleCollapse}
                        aria-label={
                            isCollapsed ? t("bindings.group.expand") : t("bindings.group.collapse")
                        }
                    />
                )}
                {isRootCommand(pair) && handleAddChild && (
                    <ObsidianIcon
                        icon="list-plus"
                        className="clickable-icon"
                        onClick={handleAddChild}
                        aria-label={t("bindings.add_child")}
                    />
                )}
                {Platform.isDesktop && !isCommandGroup(pair) && (
                    <>
                        <ObsidianIcon
                            icon={triggerModeIcon}
                            className="clickable-icon"
                            onClick={(): void => handleTriggerModeChange()}
                            aria-label={t("bindings.trigger_mode.change", {
                                current_mode: triggerModeName,
                            })}
                        />
                        <ObsidianIcon
                            icon={deviceModeIcon}
                            className="clickable-icon"
                            onClick={(): void => handleDeviceModeChange()}
                            aria-label={t("bindings.device_mode.change", {
                                current_mode: deviceModeName,
                            })}
                        />
                    </>
                )}
                <ObsidianIcon
                    icon="pencil"
                    className="clickable-icon"
                    onClick={async (): Promise<void> => {
                        if (plugin) {
                            const updatedCommand = await new BindingEditorModal(
                                plugin,
                                pair
                            ).awaitSelection();
                            if (updatedCommand) {
                                await handleUpdateCommand({
                                    name: updatedCommand.name,
                                    icon: updatedCommand.icon,
                                    mode: updatedCommand.mode,
                                    triggerMode: updatedCommand.triggerMode,
                                    action: updatedCommand.action,
                                });
                            }
                        }
                    }}
                    aria-label={t("bindings.edit")}
                />
                <ObsidianIcon
                    icon="lucide-trash"
                    className="clickable-icon"
                    style={{ color: "var(--text-error)" }}
                    onClick={handleRemove}
                    aria-label={t("common.delete")}
                />
            </div>
        </div>
    );
}
