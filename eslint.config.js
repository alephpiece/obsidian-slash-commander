// @ts-check

import eslint from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    eslintReact.configs["recommended-typescript"],
    reactHooks.configs.flat.recommended,
    {
        plugins: {
            "simple-import-sort": simpleImportSort,
            "unused-imports": unusedImports,
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "unused-imports/no-unused-imports": "error",
            "@eslint-react/naming-convention-ref-name": "off",
            "@eslint-react/no-array-index-key": "off",
            "@eslint-react/no-unnecessary-use-prefix": "off",
            "@eslint-react/use-state": "off",
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        ignores: ["dist/", "node_modules/", ".yarn/", "scripts/"],
    },
    eslintConfigPrettier
);
