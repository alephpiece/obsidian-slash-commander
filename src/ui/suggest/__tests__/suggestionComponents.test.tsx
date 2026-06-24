import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const settings = vi.hoisted(() => ({
    showDescriptions: false,
    showSourcesForDuplicates: true,
}));

vi.mock("@/data/stores/useSettingStore", () => ({
    useSettings: () => settings,
}));

import { SlashCommand } from "@/data/models/SlashCommand";

import { highlightMatch } from "../highlightMatch";
import SuggestedCommand from "../SuggestedCommand";
import SuggestedGroup from "../SuggestedGroup";

function createCommand(overrides: Partial<SlashCommand> = {}): SlashCommand {
    return {
        id: "test:command",
        action: "plugin-one:open",
        icon: "terminal",
        name: "Open note",
        ...overrides,
    };
}

function createPlugin() {
    return {
        app: {
            commands: {
                commands: {
                    "plugin-one:open": {
                        id: "plugin-one:open",
                        name: "Open current note",
                    },
                },
            },
            plugins: {
                manifests: {
                    "plugin-one": {
                        name: "Plugin One",
                    },
                },
            },
        },
    } as any;
}

function createResult(item: SlashCommand, match: unknown = null) {
    return { item, match } as any;
}

describe("highlightMatch", () => {
    it("renders the full command name when there is no fuzzy match", () => {
        render(<div>{highlightMatch(createResult(createCommand({ name: "Open note" })))}</div>);

        expect(screen.getByText("Open note")).toBeInTheDocument();
    });

    it("marks matched ranges with suggestion-highlight", () => {
        const { container } = render(
            <div>
                {highlightMatch({
                    ...createResult(createCommand({ name: "Open note" }), {
                        matches: [[0, 4]],
                    }),
                })}
            </div>
        );

        expect(container.querySelector(".suggestion-highlight")).toHaveTextContent("Open");
        expect(container).toHaveTextContent("Open note");
    });

    it("marks multiple non-contiguous matched ranges", () => {
        const { container } = render(
            <div>
                {highlightMatch({
                    ...createResult(createCommand({ name: "Open note" }), {
                        matches: [
                            [0, 1],
                            [5, 9],
                        ],
                    }),
                })}
            </div>
        );

        expect(
            Array.from(container.querySelectorAll(".suggestion-highlight")).map(
                (element) => element.textContent
            )
        ).toEqual(["O", "note"]);
        expect(container).toHaveTextContent("Open note");
    });
});

describe("SuggestedCommand", () => {
    it("shows the source label for duplicate visible command names", () => {
        const command = createCommand({ id: "test:first", name: "Duplicate" });
        const duplicate = createCommand({ id: "test:second", name: "Duplicate" });

        render(
            <SuggestedCommand
                plugin={createPlugin()}
                renderedItems={[command, duplicate]}
                result={createResult(command)}
            />
        );

        expect(screen.getByText("Duplicate")).toBeInTheDocument();
        expect(screen.getByText("Plugin One")).toBeInTheDocument();
    });

    it("omits the source label when the visible command name is unique", () => {
        const command = createCommand({ name: "Unique" });

        render(
            <SuggestedCommand
                plugin={createPlugin()}
                renderedItems={[command]}
                result={createResult(command)}
            />
        );

        expect(screen.getByText("Unique")).toBeInTheDocument();
        expect(screen.queryByText("Plugin One")).not.toBeInTheDocument();
    });
});

describe("SuggestedGroup", () => {
    it("renders command group names", () => {
        const group = createCommand({
            action: undefined,
            isGroup: true,
            name: "Group",
        });

        render(
            <SuggestedGroup
                plugin={createPlugin()}
                renderedItems={[group]}
                result={createResult(group)}
            />
        );

        expect(screen.getByText("Group")).toBeInTheDocument();
    });
});
