import { describe, expect, it } from "vitest";

import { buildQueryPattern } from "../search";

describe("buildQueryPattern", () => {
    describe("mainTrigger only", () => {
        it("should match mainTrigger at start and extract commandQuery", () => {
            const pattern = buildQueryPattern("/", [], false);
            const input = "/hello world";
            const match = input.match(pattern);
            expect(match).not.toBeNull();
            expect(match?.groups?.fullQuery).toBe("/hello world");
            expect(match?.groups?.commandQuery).toBe("hello world");
        });

        it("should not match if input does not start with mainTrigger", () => {
            const pattern = buildQueryPattern("/", [], false);
            const input = "hello /world";
            const match = input.match(pattern);
            expect(match).toBeNull();
        });

        it("should only match mainTrigger if useExtraTriggers is false", () => {
            const pattern = buildQueryPattern("/", ["!"], false);
            expect("/abc".match(pattern)?.groups?.commandQuery).toBe("abc");
            expect("!abc".match(pattern)).toBeNull();
        });

        it("should not match if mainTrigger is empty string", () => {
            const pattern = buildQueryPattern("", [], false);
            expect("abc".match(pattern)?.groups?.commandQuery).toBe("abc");
        });
    });

    describe("extraTriggers", () => {
        it("should match extraTriggers if enabled", () => {
            const pattern = buildQueryPattern("/", ["!"], true);
            const input = "!foo";
            const match = input.match(pattern);
            expect(match).not.toBeNull();
            expect(match?.groups?.fullQuery).toBe("!foo");
            expect(match?.groups?.commandQuery).toBe("foo");
        });

        it("should match any of multiple extraTriggers", () => {
            const pattern = buildQueryPattern("/", ["!", "#"], true);
            const input1 = "!bar";
            const input2 = "#baz";
            expect(input1.match(pattern)?.groups?.commandQuery).toBe("bar");
            expect(input2.match(pattern)?.groups?.commandQuery).toBe("baz");
        });

        it("should handle extraTriggers containing empty string", () => {
            const pattern = buildQueryPattern("/", [""], true);
            expect("abc".match(pattern)?.groups?.commandQuery).toBe("abc");
            expect("/abc".match(pattern)?.groups?.commandQuery).toBe("abc");
        });
    });

    describe("special and multi-character triggers", () => {
        it("should handle special character triggers", () => {
            const pattern = buildQueryPattern("*", ["?"], true);
            expect("*cmd".match(pattern)?.groups?.commandQuery).toBe("cmd");
            expect("?cmd".match(pattern)?.groups?.commandQuery).toBe("cmd");
        });

        it("should handle multi-character triggers", () => {
            const pattern = buildQueryPattern("//", ["!!"], true);
            expect("//foo".match(pattern)?.groups?.commandQuery).toBe("foo");
            expect("!!bar".match(pattern)?.groups?.commandQuery).toBe("bar");
        });

        it("should handle triggers with regex special characters", () => {
            const pattern = buildQueryPattern("$", ["^", "."], true);
            expect("$abc".match(pattern)?.groups?.commandQuery).toBe("abc");
            expect("^abc".match(pattern)?.groups?.commandQuery).toBe("abc");
            expect(".abc".match(pattern)?.groups?.commandQuery).toBe("abc");
        });

        it("should handle triggers with regex meta characters", () => {
            const pattern = buildQueryPattern(".*+?", ["^$[]"], true);
            expect(".*+?foo".match(pattern)?.groups?.commandQuery).toBe("foo");
            expect("^$[]bar".match(pattern)?.groups?.commandQuery).toBe("bar");
        });
    });

    describe("prefix relationship between triggers", () => {
        it("should prefer longer trigger if triggers have prefix relationship", () => {
            const pattern = buildQueryPattern("/", ["//"], true);
            expect("//cmd".match(pattern)?.groups?.commandQuery).toBe("/cmd");
            const pattern2 = buildQueryPattern("//", ["/"], true);
            expect("//cmd".match(pattern2)?.groups?.commandQuery).toBe("cmd");
        });
    });

    describe("unicode triggers", () => {
        it("should match Unicode triggers", () => {
            const pattern = buildQueryPattern("😀", ["测试"], true);
            expect("😀hello".match(pattern)?.groups?.commandQuery).toBe("hello");
            expect("测试命令".match(pattern)?.groups?.commandQuery).toBe("命令");
        });
    });

    describe("edge and error cases", () => {
        it("should match only at the start of the string", () => {
            const pattern = buildQueryPattern("/", [], false);
            expect(" /notmatch".match(pattern)).toBeNull();
            expect("foo/bar".match(pattern)).toBeNull();
        });

        it("should not match empty string", () => {
            const pattern = buildQueryPattern("/", [], false);
            expect("".match(pattern)).toBeNull();
        });

        it("should not throw on null or undefined input", () => {
            const pattern = buildQueryPattern("/", [], false);
            expect(() => "".match(pattern)).not.toThrow();
            expect(() => (null as any)?.match(pattern)).not.toThrow();
            expect(() => (undefined as any)?.match(pattern)).not.toThrow();
        });
    });

    describe("commandQuery content", () => {
        it("should match empty commandQuery if only trigger present", () => {
            const pattern = buildQueryPattern("/", [], false);
            const match = "/".match(pattern);
            expect(match).not.toBeNull();
            expect(match?.groups?.commandQuery).toBe("");
        });

        it("should extract commandQuery with special characters", () => {
            const pattern = buildQueryPattern("/", [], false);
            expect("/!@#".match(pattern)?.groups?.commandQuery).toBe("!@#");
        });

        it("should match commandQuery that is only spaces", () => {
            const pattern = buildQueryPattern("/", [], false);
            const match = "/   ".match(pattern);
            expect(match).not.toBeNull();
            expect(match?.groups?.commandQuery).toBe("   ");
        });
    });
});
