import { ComponentProps, h } from "preact";
import { useState } from "preact/hooks";
import { ObsidianIcon } from "src/util";

interface SettingCollapserProps extends ComponentProps<"details"> {
    title: string;
    children: h.JSX.Element | h.JSX.Element[];
}
export default function SettingCollapser({
    title,
    children,
}: SettingCollapserProps): h.JSX.Element {
    const [open, setOpen] = useState(true);

    const toggleHandler = (): void => {
        setOpen(!open);
    };

    return (
        <div className="cmdr-setting-collapser" aria-expanded={open}>
            <div
                className="cmdr-setting-collapser-header"
                onClick={toggleHandler}
            >
                <ObsidianIcon
                    className="cmdr-setting-collapser-icon clickable-icon"
                    icon="chevron-down"
                    size={24}
                />
                <span>{title}</span>
            </div>
            <div
                className="cmdr-setting-collapser-content"
            >
                {children}
            </div>
        </div>
    );
}