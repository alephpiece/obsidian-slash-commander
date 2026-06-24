/* eslint-disable @typescript-eslint/no-unused-vars */

type DomOptions =
    | string
    | {
          attr?: Record<string, string>;
          cls?: string;
          placeholder?: string;
          text?: string;
          type?: string;
      };

export const iconCalls: Array<{ element: HTMLElement; icon: string }> = [];
export const noticeMessages: string[] = [];

function applyDomOptions(element: HTMLElement, options?: DomOptions): void {
    if (!options) return;

    if (typeof options === "string") {
        element.className = options;
        return;
    }

    if (options.cls) {
        element.className = options.cls;
    }

    if (options.text !== undefined) {
        element.textContent = options.text;
    }

    if (options.placeholder !== undefined && element instanceof HTMLInputElement) {
        element.placeholder = options.placeholder;
    }

    if (options.type !== undefined && element instanceof HTMLInputElement) {
        element.type = options.type;
    }

    for (const [name, value] of Object.entries(options.attr ?? {})) {
        element.setAttribute(name, value);
    }
}

function createElementWithOptions<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: DomOptions
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    applyDomOptions(element, options);
    return element;
}

function installDomHelpers(): void {
    const proto = HTMLElement.prototype as any;

    proto.addClass ??= function addClass(...classes: string[]) {
        this.classList.add(...classes.flatMap((cls) => cls.split(/\s+/).filter(Boolean)));
    };

    proto.removeClass ??= function removeClass(...classes: string[]) {
        this.classList.remove(...classes.flatMap((cls) => cls.split(/\s+/).filter(Boolean)));
    };

    proto.createDiv ??= function createDiv(options?: DomOptions) {
        const element = createElementWithOptions("div", options);
        this.appendChild(element);
        return element;
    };

    proto.createEl ??= function createEl<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        options?: DomOptions
    ) {
        const element = createElementWithOptions(tagName, options);
        this.appendChild(element);
        return element;
    };

    proto.empty ??= function empty() {
        this.replaceChildren();
    };

    proto.detach ??= function detach() {
        this.remove();
    };

    proto.setText ??= function setText(text: string) {
        this.textContent = text;
    };

    proto.setCssStyles ??= function setCssStyles(styles: Partial<CSSStyleDeclaration>) {
        for (const [name, value] of Object.entries(styles)) {
            if (value !== undefined) {
                this.style.setProperty(name, String(value));
            }
        }
    };

    proto.on ??= function on(
        eventName: string,
        selector: string,
        listener: (event: Event, element: HTMLElement) => void
    ) {
        this.addEventListener(eventName, (event: Event) => {
            const target = event.target instanceof Element ? event.target.closest(selector) : null;
            if (target instanceof HTMLElement && this.contains(target)) {
                listener(event, target);
            }
        });
    };

    globalThis.createDiv ??= (options?: DomOptions) => createElementWithOptions("div", options);
}

installDomHelpers();

if (!Array.prototype.first) {
    Object.defineProperty(Array.prototype, "first", {
        value: function first<T>(this: T[]): T | undefined {
            return this[0];
        },
    });
}

export class Command {
    public id = "";
    public name = "";
}

export class Notice {
    public constructor(message: string) {
        noticeMessages.push(message);
    }
}

export class Scope {
    public register(): void {
        // No-op for tests.
    }
}

export class Plugin {
    public app: any;

    public constructor(app?: any) {
        this.app = app ?? {};
    }

    public addCommand(): void {
        // No-op for tests.
    }

    public addSettingTab(): void {
        // No-op for tests.
    }

    public registerEditorSuggest(): void {
        // No-op for tests.
    }

    public registerEvent(): void {
        // No-op for tests.
    }
}

export class PluginSettingTab {
    public containerEl = document.createElement("div");

    public constructor(
        public app: any,
        public plugin: Plugin
    ) {}
}

export class Modal {
    public contentEl = document.createElement("div");

    public constructor(public app: any) {}

    public open(): void {
        this.onOpen();
    }

    public close(): void {
        this.onClose();
    }

    public onOpen(): void {
        // No-op for tests.
    }

    public onClose(): void {
        // No-op for tests.
    }
}

export class SuggestModal<T> {
    public contentEl = document.createElement("div");
    public inputEl = document.createElement("input");
    public limit = 100;

    public constructor(public app: any) {}

    public close(): void {
        // No-op for tests.
    }

    public open(): void {
        // No-op for tests.
    }

    public renderSuggestion(_item: T, _el: HTMLElement): void {
        // No-op for tests.
    }

    public selectSuggestion(_item: T, _evt?: Event): void {
        // No-op for tests.
    }
}

export class FuzzySuggestModal<T> extends SuggestModal<T> {
    public getSuggestions(query: string): Array<{ item: T; match: FuzzyMatch<T>["match"] }> {
        const search = prepareFuzzySearch(query);
        return this.getItems()
            .map((item) => ({ item, match: search(this.getItemText(item)) }))
            .filter(({ match }) => query === "" || match);
    }

    public getItemText(_item: T): string {
        return "";
    }

    public getItems(): T[] {
        return [];
    }

    public onChooseItem(_item: T, _evt?: Event): void {
        // No-op for tests.
    }
}

export class EditorSuggest<T> {
    public context: EditorSuggestContext | null = null;
    public limit = 100;

    public constructor(public app: any) {}

    public close(): void {
        // No-op for tests.
    }
}

export class TextComponent {
    public inputEl = document.createElement("input") as HTMLInputElement & {
        setCssStyles: (styles: Partial<CSSStyleDeclaration>) => void;
    };

    public constructor(containerEl?: HTMLElement) {
        this.inputEl.setCssStyles = (styles) => {
            for (const [name, value] of Object.entries(styles)) {
                if (value !== undefined) {
                    this.inputEl.style.setProperty(name, String(value));
                }
            }
        };
        containerEl?.appendChild(this.inputEl);
    }

    public getValue(): string {
        return this.inputEl.value;
    }

    public setValue(value: string): this {
        this.inputEl.value = value;
        return this;
    }
}

export class MarkdownView {
    public containerEl = document.createElement("div");
}

export interface Editor {
    getLine(line: number): string;
    replaceRange?(replacement: string, from: EditorPosition, to: EditorPosition): void;
}

export interface EditorPosition {
    ch: number;
    line: number;
}

export interface EditorSuggestTriggerInfo {
    end: EditorPosition;
    query: string;
    start: EditorPosition;
}

export interface EditorSuggestContext extends EditorSuggestTriggerInfo {
    editor: Editor;
    file: TFile | null;
}

export interface FuzzyMatch<T> {
    item: T;
    match: null | {
        matches: Array<[number, number]>;
        score?: number;
    };
}

export interface PluginManifest {
    id: string;
    name: string;
}

export interface TFile {
    path: string;
}

export const Platform = {
    isDesktop: true,
    isMobile: false,
};

export const moment = {
    locale: () => "en",
};

export function addIcon(_iconId: string, _svgContent: string): void {
    // No-op for tests.
}

export function prepareFuzzySearch(query: string): (text: string) => FuzzyMatch<unknown>["match"] {
    return (text: string) => {
        if (query === "") return { matches: [], score: 0 };

        const start = text.toLowerCase().indexOf(query.toLowerCase());
        if (start === -1) return null;

        return {
            matches: [[start, start + query.length]],
            score: 0,
        };
    };
}

export function setIcon(element: HTMLElement, icon: string): void {
    iconCalls.push({ element, icon });
    element.dataset.icon = icon;
}
