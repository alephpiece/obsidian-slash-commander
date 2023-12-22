import { createContext, Fragment, h } from "preact";
import SlashCommanderPlugin from "src/main";
import CommandComponent from "./commandComponent";
import CommandManager from "src/manager/commandManager";
import { chooseNewCommand, isModeActive } from "src/utils/util";
import ObsidianIcon from "src/components/obsidianIconComponent";
import ChooseIconModal from "../settings/chooseIconModal";
import ConfirmDeleteModal from "../settings/confirmDeleteModal";
import t from "src/l10n";
import { Platform } from "obsidian";
import { useState } from "react";
import { ReactSortable } from "react-sortablejs";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const ManagerContext = createContext<CommandManager>(null!);

interface CommandViewerProps {
    manager: CommandManager;
    plugin: SlashCommanderPlugin;
    children?: h.JSX.Element | h.JSX.Element[];
}

export default function CommandViewer({
    manager,
    plugin,
    children,
}: CommandViewerProps): h.JSX.Element {
    const [state, setState] = useState(manager.pairs);

    return (
        <Fragment>
            <ManagerContext.Provider value={manager}>
                <div className="cmdr-sep-con">
                    <ReactSortable
                        list={state}
                        setList={setState}
                        animation={200}
                        forceFallback={true}
                        fallbackClass="sortable-fallback"
                        onSort={(pair): void => {
                            const arrayResult = manager.pairs;
                            const [removed] = arrayResult.splice(pair.oldIndex, 1);
                            arrayResult.splice(pair.newIndex, 0, removed);
                            plugin.saveSettings();
                        }}
                    >
                        {state.map((cmd) => {
                            if (
                                cmd.mode.match(/desktop|mobile|any/) ||
                                cmd.mode === plugin.app.appId
                            ) {
                                return (
                                    <CommandComponent
                                        plugin={plugin}
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
                                                setState(manager.pairs);
                                            }
                                        }}
                                        handleRename={async (
                                            name
                                        ): Promise<void> => {
                                            cmd.name = name;
                                            await plugin.saveSettings();
                                            manager.reorder();
                                            setState(manager.pairs);
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
                                                setState(manager.pairs);
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
                                            setState(manager.pairs);
                                        }}
                                    />
                                );
                            }
                        })}
                    </ReactSortable>
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
                            setState(manager.pairs);
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
                            setState(manager.pairs);
                        }}
                    />
                </div>
            </ManagerContext.Provider>

            {children}
        </Fragment>
    );
}
