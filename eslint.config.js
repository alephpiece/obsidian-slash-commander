import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import prettierPlugin from "eslint-plugin-prettier";

const commonRules = {
	"react/prop-types": "off",
	"react/react-in-jsx-scope": "off",
	"react-hooks/rules-of-hooks": "error",
	"react-hooks/exhaustive-deps": "warn",
	"prettier/prettier": "warn",
};

const commonPlugins = {
	react: reactPlugin,
	"react-hooks": reactHooksPlugin,
	prettier: prettierPlugin,
};

export default {
	...eslint.configs.recommended,
	files: ["**/*.{ts,tsx,js,jsx}"],
	ignores: [
		"**/node_modules/**",
		"**/build/**",
		"**/scripts/**",
		"**/main.js",
		"**/dist/**",
		"**/.git/**",
		"**/coverage/**",
	],
	languageOptions: {
		ecmaVersion: 2023,
		sourceType: "module",
	},
	plugins: {
		react: reactPlugin,
		"react-hooks": reactHooksPlugin,
		prettier: prettierPlugin,
	},
	rules: {
		...commonRules,
		"no-prototype-builtins": "off",
	},
};
