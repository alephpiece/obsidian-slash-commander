import { Platform } from "obsidian";
import { Fragment, h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import t from "src/l10n";
import { Tab } from "src/types";
import { ObsidianIcon } from "src/util";
import SlashCommanderPlugin from "../../main";
import CommandViewer from "./commandViewerComponent";
import {
	ToggleComponent,
	TextBoxComponent
} from "./settingComponent";

export default function settingTabComponent({
	plugin,
	mobileMode,
}: {
	plugin: SlashCommanderPlugin;
	mobileMode: boolean;
}): h.JSX.Element {
	const [activeTab, setActiveTab] = useState(0);
	const [open, setOpen] = useState(true);

	const tabToNextTab = ({ key, shiftKey }: KeyboardEvent): void => {
		if (shiftKey && key === "Tab") {
			if (activeTab > 0) {
				setActiveTab((activeTab - 1) % tabs.length);
			} else {
				setActiveTab(tabs.length - 1);
			}
		} else if (key === "Tab") {
			setActiveTab((activeTab + 1) % tabs.length);
		}
	};

	useEffect(() => {
		addEventListener("keydown", tabToNextTab);
		return () => removeEventListener("keydown", tabToNextTab);
	}, [activeTab]);

	//This is used to remove the initial onclick event listener.
	if (Platform.isMobile) {
		useEffect(() => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const old_element = document.querySelector(
				".modal-setting-back-button"
			)!;
			const new_element = old_element.cloneNode(true);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			old_element.parentNode!.replaceChild(new_element, old_element);
			setOpen(true);
		}, []);
	}

	useEffect(() => {
		const el = document.querySelector<HTMLElement>(
			".modal-setting-back-button"
		);
		if (!el) return;

		if (!open) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			el.parentElement!.lastChild!.textContent = tabs[activeTab].name;
			el.onclick = (): void => setOpen(true);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			el.parentElement!.lastChild!.textContent = "Commander";
			el.onclick = (): void => plugin.app.setting.closeActiveTab();
		}
	}, [open]);

	const tabs: Tab[] = useMemo(
		() => [
			{
				name: t("General"),
				tab: (
					<Fragment>
						<TextBoxComponent
							value={plugin.settings.trigger}
							name={t("Command trigger")}
							description={t("Characters to trigger slash commands.")}
							changeHandler={async (value): Promise<void> => {
								plugin.settings.trigger = value;
								await plugin.saveSettings();
							}}
						/>
						<ToggleComponent
							name={t("Always ask before removing?")}
							description={t(
								"Always show a Popup to confirm deletion of a Command."
							)}
							value={plugin.settings.confirmDeletion}
							changeHandler={async (value): Promise<void> => {
								plugin.settings.confirmDeletion = !value;
								await plugin.saveSettings();
							}}
						/>
					</Fragment>
				),
			},
			{
				name: t("Slash Commands"),
				tab: (
					<CommandViewer
						manager={plugin.manager}
						plugin={plugin}
						sortable={false}
					/>
				),
			},
		],
		[]
	);

	return (
		<Fragment>
			{Platform.isDesktop && (
				<div className="cmdr-setting-title">
					<h1>{plugin.manifest.name}</h1>
				</div>
			)}

			{(Platform.isDesktop || open) && (
				<TabHeader
					tabs={tabs}
					activeTab={activeTab}
					setActiveTab={setActiveTab}
					setOpen={setOpen}
				/>
			)}

			<div
				class={`cmdr-setting-content ${mobileMode ? "cmdr-mobile" : ""
					}`}
			>
				{(Platform.isDesktop || !open) && tabs[activeTab].tab}

				{((Platform.isMobile && open) ||
					(Platform.isDesktop && activeTab === 0))}
			</div>
		</Fragment>
	);
}

interface TabHeaderProps {
	tabs: Tab[];
	activeTab: number;
	// eslint-disable-next-line no-unused-vars
	setActiveTab: (idx: number) => void;
	// eslint-disable-next-line no-unused-vars
	setOpen: (open: boolean) => void;
}
export function TabHeader({
	tabs,
	activeTab,
	setActiveTab,
	setOpen,
}: TabHeaderProps): h.JSX.Element {
	const wrapper = useRef<HTMLElement>(null);

	const handleScroll = (e: WheelEvent): void => {
		e.preventDefault();
		wrapper.current?.scrollBy({ left: e.deltaY > 0 ? 16 : -16 });
	};

	useEffect(() => {
		const el = wrapper.current;
		if (!el || Platform.isMobile) {
			return;
		}

		el.addEventListener("wheel", handleScroll);
		return () => el.removeEventListener("wheel", handleScroll);
	}, []);

	useEffect(
		() =>
			document
				.querySelector(".cmdr-tab-active")
				?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
		[activeTab]
	);

	return (
		<nav
			class={`cmdr-setting-header ${Platform.isMobile ? "cmdr-mobile" : ""
				}`}
			ref={wrapper}
		>
			<div
				class={`cmdr-setting-tab-group ${Platform.isMobile ? "vertical-tab-header-group-items" : ""
					}`}
			>
				{tabs.map((tab, idx) => (
					<div
						className={`cmdr-tab ${activeTab === idx ? "cmdr-tab-active" : ""
							} ${Platform.isMobile ? "vertical-tab-nav-item" : ""}`}
						onClick={(): void => {
							setActiveTab(idx);
							setOpen(false);
						}}
					>
						{tab.name}
						{Platform.isMobile && (
							<ObsidianIcon
								className="vertical-tab-nav-item-chevron cmdr-block"
								icon="chevron-right"
								size={24}
							/>
						)}
					</div>
				))}
			</div>

			{Platform.isDesktop && <div className="cmdr-fill" />}
		</nav>
	);
}
