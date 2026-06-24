import { describe, expect, it } from "vitest";

import { SlashCommand } from "@/data/models/SlashCommand";

import type { CommandTreeItems, FlattenedCommandItem } from "../types";
import {
    buildTree,
    commandsToTreeItems,
    findItemDeep,
    flattenTree,
    getChildCount,
    getProjection,
    removeChildrenOf,
    removeItem,
    setProperty,
    treeItemsToCommands,
} from "../utilities";

function createCommand(id: string, overrides: Partial<SlashCommand> = {}): SlashCommand {
    return {
        id,
        action: id,
        icon: "terminal",
        name: id,
        ...overrides,
    };
}

function createTree(): CommandTreeItems {
    const child = createCommand("child", { parentId: "group" });
    const grandchild = createCommand("grandchild", { parentId: "child" });

    return commandsToTreeItems([
        createCommand("first"),
        createCommand("group", {
            action: undefined,
            children: [{ ...child, children: [grandchild], isGroup: true }],
            isGroup: true,
        }),
        createCommand("last"),
    ]);
}

function createFlatItems(): FlattenedCommandItem[] {
    const tree = createTree();
    return flattenTree(tree);
}

describe("viewer tree utilities", () => {
    it("converts commands to tree items and back", () => {
        const child = createCommand("child", { parentId: "group" });
        const commands = [
            createCommand("first"),
            createCommand("group", {
                action: undefined,
                children: [child],
                isGroup: true,
            }),
        ];

        const tree = commandsToTreeItems(commands);
        const restored = treeItemsToCommands(tree);

        expect(tree.map((item) => item.id)).toEqual(["first", "group"]);
        expect(tree[1].children.map((item) => item.id)).toEqual(["child"]);
        expect(restored).toEqual([
            { ...commands[0], children: [] },
            { ...commands[1], children: [{ ...child, children: [] }] },
        ]);
    });

    it("rewrites parent ids from tree structure when converting back to commands", () => {
        const tree = createTree();
        const movedRoot = buildTree(
            flattenTree(tree).map((item) =>
                item.id === "child" ? { ...item, depth: 0, parentId: null } : item
            )
        );

        const restored = treeItemsToCommands(movedRoot);
        const movedChild = restored.find((command) => command.id === "child");
        const grandchild = movedChild?.children?.find((command) => command.id === "grandchild");

        expect(movedChild?.parentId).toBeUndefined();
        expect(grandchild?.parentId).toBe("child");
    });

    it("flattens expanded trees and skips collapsed descendants", () => {
        const tree = createTree();

        expect(flattenTree(tree).map((item) => item.id)).toEqual([
            "first",
            "group",
            "child",
            "grandchild",
            "last",
        ]);

        const collapsed = setProperty(tree, "group", "collapsed", () => true);

        expect(flattenTree(collapsed).map((item) => item.id)).toEqual(["first", "group", "last"]);
    });

    it("rebuilds a tree from flattened items", () => {
        const rebuilt = buildTree(createFlatItems());

        expect(rebuilt.map((item) => item.id)).toEqual(["first", "group", "last"]);
        expect(rebuilt[1].children.map((item) => item.id)).toEqual(["child"]);
        expect(rebuilt[1].children[0].children.map((item) => item.id)).toEqual(["grandchild"]);
    });

    it("projects dragged items into nested and root positions", () => {
        const flatItems = createFlatItems();

        expect(getProjection(flatItems, "last", "child", 20, 20)).toMatchObject({
            depth: 1,
            parentId: "group",
        });
        expect(getProjection(flatItems, "grandchild", "last", -40, 20)).toMatchObject({
            depth: 0,
            parentId: null,
        });
        expect(getProjection(flatItems, "group", "first", 20, 20)).toMatchObject({
            depth: 0,
            parentId: null,
        });
    });

    it("finds and removes nested items", () => {
        const tree = createTree();

        expect(findItemDeep(tree, "grandchild")?.id).toBe("grandchild");
        expect(findItemDeep(tree, "missing")).toBeUndefined();

        const withoutChild = removeItem(tree, "child");

        expect(flattenTree(withoutChild).map((item) => item.id)).toEqual([
            "first",
            "group",
            "last",
        ]);
    });

    it("sets nested item properties immutably", () => {
        const tree = createTree();
        const updated = setProperty(tree, "child", "collapsed", () => true);

        expect(findItemDeep(updated, "child")?.collapsed).toBe(true);
        expect(findItemDeep(tree, "child")?.collapsed).toBe(false);
    });

    it("counts descendants and removes collapsed children from flattened items", () => {
        const tree = createTree();
        const flatItems = flattenTree(tree);

        expect(getChildCount(tree, "group")).toBe(2);
        expect(getChildCount(tree, "missing")).toBe(0);
        expect(removeChildrenOf(flatItems, ["group"]).map((item) => item.id)).toEqual([
            "first",
            "group",
            "last",
        ]);
    });
});
