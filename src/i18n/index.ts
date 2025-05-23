import i18n from "i18next";
import { moment } from "obsidian";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/resources/en.json";
import ja from "@/i18n/resources/ja.json";
import ru from "@/i18n/resources/ru.json";
import uk from "@/i18n/resources/uk.json";
import zhCN from "@/i18n/resources/zh-cn.json";

const resources = {
    en,
    ja,
    ru,
    uk,
    "zh-CN": zhCN,
};

i18n.use(initReactI18next).init({
    lng: moment.locale(),
    fallbackLng: "en",
    resources,
    interpolation: {
        escapeValue: false,
    },
    keySeparator: false,
    returnNull: false,
});

export default i18n;
