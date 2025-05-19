import { setIcon } from "obsidian";
import type { ComponentProps } from "react";
import { useLayoutEffect, useRef } from "react";

interface ObsidianIconProps extends ComponentProps<"div"> {
    icon: string;
    size?: string;
}

export default function ObsidianIcon({ icon, size, ...props }: ObsidianIconProps) {
    const iconEl = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!iconEl.current) return;

        setIcon(iconEl.current, icon);

        if (size) {
            iconEl.current.style.setProperty("--icon-size", size);
        }
    }, [icon, size]);

    return <div ref={iconEl} {...props} />;
}
