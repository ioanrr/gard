import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ro from "./ro.json";
import hu from "./hu.json";

i18n.use(initReactI18next).init({
  resources: {
    ro: { translation: ro },
    hu: { translation: hu },
  },
  lng: localStorage.getItem("lang") ?? "ro",
  fallbackLng: "ro",
  interpolation: { escapeValue: false },
});

export default i18n;
