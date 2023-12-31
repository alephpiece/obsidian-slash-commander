import { Fragment, h } from "preact";
import SlashCommanderPlugin from "src/main";
import { buildQueryPattern } from "src/utils/search";
import ObsidianIcon from "./obsidianIconComponent";
import t from "src/l10n";

interface TriggerViewerProps {
    plugin: SlashCommanderPlugin;
    children?: h.JSX.Element | h.JSX.Element[];
}

export default function TriggerViewer({
    plugin,
    children,
}: TriggerViewerProps): h.JSX.Element {
    // FIXME: more flexible is good
    const triggers = plugin.settings.extraTriggers;
    return (
        <Fragment>
            <div className="cmdr-triggers">
                {triggers.map((trigger, index) => {
                    return (
                        <div className="cmdr-trigger-pill">
                            <input
                                value={trigger}
                                onChange={async ({ target }): Promise<void> => {
                                    {/*@ts-expect-error*/ }
                                    if (trigger !== target.value) {
                                        {/*@ts-expect-error*/ }
                                        triggers[index] = target.value;
                                        plugin.settings.queryPattern = buildQueryPattern(plugin.settings);
                                        await plugin.saveSettings();
                                        this.forceUpdate();
                                    }
                                }}
                            />
                            <ObsidianIcon
                                className="cmdr-icon clickable-icon"
                                icon="trash-2"
                                size={15}
                                aria-label={t("Delete")}
                                onClick={async (): Promise<void> => {
                                    triggers.splice(index, 1);
                                    plugin.settings.queryPattern = buildQueryPattern(plugin.settings);
                                    await plugin.saveSettings();
                                    this.forceUpdate();
                                }}
                            />
                        </div>
                    );
                })}
                <button
                    className="cmdr-trigger-add"
                    onClick={async (): Promise<void> => {
                        triggers.push("");
                        this.forceUpdate();
                    }}
                >
                    {t("Add")}
                </button>
                {children}
            </div>
        </Fragment>
    );
}
