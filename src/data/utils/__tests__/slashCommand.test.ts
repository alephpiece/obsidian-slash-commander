import { describe, expect, it } from "vitest";

import type { SlashCommand } from "@/data/models/SlashCommand";

import { cloneSlashCommandTree } from "../slashCommand";

function createCommand(overrides: Partial<SlashCommand> = {}): SlashCommand {
    return {
        action: "test:command",
        icon: "terminal",
        id: "test:command",
        name: "Test command",
        ...overrides,
    };
}

describe("cloneSlashCommandTree", () => {
    it("deep clones command trees and mutable visibility pattern arrays", () => {
        const child = createCommand({
            id: "test:child",
            name: "Child",
            parentId: "test:parent",
            visibility: {
                pathPatterns: {
                    exclude: ["Archive/**"],
                    include: ["Projects/**"],
                },
            },
        });
        const commands = [
            createCommand({
                children: [child],
                id: "test:parent",
                isGroup: true,
                name: "Parent",
                visibility: {
                    pathPatterns: {
                        include: ["Slip Box/**"],
                    },
                },
            }),
        ];

        const cloned = cloneSlashCommandTree(commands);

        expect(cloned).toEqual(commands);
        expect(cloned).not.toBe(commands);
        expect(cloned[0]).not.toBe(commands[0]);
        expect(cloned[0].children).not.toBe(commands[0].children);
        expect(cloned[0].children?.[0]).not.toBe(commands[0].children?.[0]);
        expect(cloned[0].visibility).not.toBe(commands[0].visibility);
        expect(cloned[0].visibility?.pathPatterns).not.toBe(
            commands[0].visibility?.pathPatterns
        );
        expect(cloned[0].visibility?.pathPatterns?.include).not.toBe(
            commands[0].visibility?.pathPatterns?.include
        );
        expect(cloned[0].children?.[0].visibility?.pathPatterns?.exclude).not.toBe(
            commands[0].children?.[0].visibility?.pathPatterns?.exclude
        );

        cloned[0].children![0].name = "Changed child";
        cloned[0].children![0].visibility!.pathPatterns!.include!.push("People/**");

        expect(commands[0].children?.[0].name).toBe("Child");
        expect(commands[0].children?.[0].visibility?.pathPatterns?.include).toEqual([
            "Projects/**",
        ]);
    });
});
