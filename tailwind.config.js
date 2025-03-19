/** @type {import('tailwindcss').Config} */
export default {
	prefix: "cmdr-",
	content: ["./src/**/*.{ts,tsx,js,jsx}"],
	theme: {
		extend: {
			colors: {
				// 使用 Obsidian 的 CSS 变量，确保主题一致性
				primary: 'var(--interactive-accent)',
				secondary: 'var(--text-accent)',
				background: 'var(--background-primary)',
			},
		},
	},
	plugins: [],
};
