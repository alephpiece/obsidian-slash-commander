import { ComponentProps, h } from "preact";
import { useState } from "preact/hooks";

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
            <h2
                className="cmdr-setting-collapser-header"
                onClick={toggleHandler}
            >
                {title}
            </h2>
            <div className="cmdr-setting-collapser-content">
                {children}
            </div>
        </div>
    );
}