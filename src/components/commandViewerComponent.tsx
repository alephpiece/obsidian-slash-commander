import { createContext, Fragment, h } from "preact";
import SlashCommanderPlugin from "src/main";
import CommandComponent from "./commandComponent";
import CommandManager from "src/manager/commandManager";
import { chooseNewCommand, isModeActive, ObsidianIcon } from "src/utils/util";
import { arrayMoveMutable } from "array-move";
import ChooseIconModal from "../settings/chooseIconModal";
import ConfirmDeleteModal from "../settings/confirmDeleteModal";
import t from "src/l10n";
import { Platform } from "obsidian";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const ManagerContext = createContext<CommandManager>(null!);

interface CommandViewerProps {
    manager: CommandManager;
    plugin: SlashCommanderPlugin;
    children?: h.JSX.Element | h.JSX.Element[];
    sortable?: boolean;
}
export default function CommandViewer({
    manager,
    plugin,
    children,
    sortable = true,
}: CommandViewerProps): h.JSX.Element {
    return (
        <Fragment>
            <ManagerContext.Provider value={manager}>
                <div className="cmdr-sep-con">
                    {manager.pairs.map((cmd, idx) => {
                        if (
                            cmd.mode.match(/desktop|mobile|any/) ||
                            cmd.mode === plugin.app.appId
                        ) {
                            return (
                                <CommandComponent
                                    plugin={plugin}
                                    sortable={sortable}
                                    key={cmd.id}
                                    pair={cmd}
                                    handleRemove={async (): Promise<void> => {
                                        if (
                                            !plugin.settings.confirmDeletion ||
                                            (await new ConfirmDeleteModal(
                                                plugin
                                            ).didChooseRemove())
                                        ) {
                                            await manager.removeCommand(cmd);
                                            this.forceUpdate();
                                        }
                                    }}
                                    handleUp={(): void => {
                                        arrayMoveMutable(
                                            manager.pairs,
                                            idx,
                                            idx - 1
                                        );
                                        manager.reorder();
                                        this.forceUpdate();
                                    }}
                                    handleDown={(): void => {
                                        arrayMoveMutable(
                                            manager.pairs,
                                            idx,
                                            idx + 1
                                        );
                                        manager.reorder();
                                        this.forceUpdate();
                                    }}
                                    handleRename={async (
                                        name
                                    ): Promise<void> => {
                                        cmd.name = name;
                                        await plugin.saveSettings();
                                        manager.reorder();
                                        this.forceUpdate();
                                    }}
                                    handleNewIcon={async (): Promise<void> => {
                                        const newIcon =
                                            await new ChooseIconModal(
                                                plugin
                                            ).awaitSelection();
                                        if (newIcon && newIcon !== cmd.icon) {
                                            cmd.icon = newIcon;
                                            await plugin.saveSettings();
                                            manager.reorder();
                                            this.forceUpdate();
                                        }
                                        dispatchEvent(
                                            new Event("cmdr-icon-changed")
                                        );
                                    }}
                                    handleModeChange={async (
                                        mode?: string
                                    ): Promise<void> => {
                                        // This is the rotation
                                        const modes = [
                                            "any",
                                            "desktop",
                                            "mobile",
                                            plugin.app.appId,
                                        ];
                                        let currentIdx = modes.indexOf(
                                            cmd.mode
                                        );
                                        if (currentIdx === 3) currentIdx = -1;

                                        cmd.mode =
                                            mode || modes[currentIdx + 1];
                                        await plugin.saveSettings();
                                        manager.reorder();
                                        this.forceUpdate();
                                    }}
                                />
                            );
                        }
                    })}
                </div>
                {!manager.pairs.some(
                    (pre) =>
                        isModeActive(plugin, pre.mode) ||
                        pre.mode.match(/mobile|desktop/)
                ) && (
                        <div class="cmdr-commands-empty">
                            <h3>{t("No commands here!")}</h3>
                            <span>{t("Would you like to add one now?")}</span>
                        </div>
                    )}

                {Platform.isMobile && <hr />}

                <div className="cmdr-add-new-wrapper">
                    <button
                        className="mod-cta"
                        onClick={async (): Promise<void> => {
                            const pair = await chooseNewCommand(plugin);
                            await manager.addCommand(pair);
                            manager.reorder();
                            this.forceUpdate();
                        }}
                    >
                        {t("Add command")}
                    </button>
                    <ObsidianIcon
                        className="cmdr-icon clickable-icon"
                        icon="rotate-ccw"
                        size={20}
                        aria-label={t("Restore default")}
                        onClick={async (): Promise<void> => {
                            manager.restoreDefault();
                            manager.reorder();
                            this.forceUpdate();
                        }}
                    />
                </div>
            </ManagerContext.Provider>

            {children}
        </Fragment>
    );
}
