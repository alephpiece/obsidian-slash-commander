import i18next from "i18next";
import { moment } from "obsidian";
import { SupportedLanguage, TranslationKey, TranslationOptions } from "@/i18n/types";

import en from "@/i18n/resources/en-us.json";
import zhCN from "@/i18n/resources/zh-cn.json";
import jaJP from "@/i18n/resources/ja-jp.json";
import ruRU from "@/i18n/resources/ru-ru.json";

function normalizeLanguage(language: string): SupportedLanguage {
	if (language.startsWith("zh")) return "zh-cn";
	if (language.startsWith("ja")) return "ja-jp";
	if (language.startsWith("ru")) return "ru-ru";
	return "en-us";
}

const currentSystemLang = normalizeLanguage(moment.locale() || "en");

i18next.init({
	lng: currentSystemLang,
	fallbackLng: "en-us",
	debug: false,
	resources: {
		"en-us": { translation: en },
		"zh-cn": { translation: zhCN },
		"ja-jp": { translation: jaJP },
		"ru-ru": { translation: ruRU },
	},
	interpolation: {
		escapeValue: false,
	},
});

export const t = (key: TranslationKey, options?: TranslationOptions): string =>
	i18next.t(key, options);

export const currentLanguage = (): SupportedLanguage => normalizeLanguage(i18next.language);

export const defaultLanguage: SupportedLanguage = "en-us";

export const changeLanguage = (lang: string): Promise<any> =>
	i18next.changeLanguage(normalizeLanguage(lang));

export default t;
