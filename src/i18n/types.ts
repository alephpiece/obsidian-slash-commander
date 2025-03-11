import en from "./resources/en-us.json";

export type SupportedLanguage = "en-us" | "zh-cn" | "ja-jp" | "ru-ru";
export type TranslationKey = keyof typeof en;
export type TranslationOptions = Record<string, string | number>;
