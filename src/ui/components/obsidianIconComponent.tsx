import { setIcon } from "obsidian";
import { ComponentProps, h } from "preact";
import { useRef, useLayoutEffect } from "preact/hooks";

interface ObsidianIconProps extends ComponentProps<"div"> {
	icon: string;
	size?: string;
}

export default function ObsidianIcon({ icon, size, ...props }: ObsidianIconProps): h.JSX.Element {
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
