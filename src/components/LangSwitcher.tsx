import { useTranslation } from "react-i18next";

export function LangSwitcher() {
  const { i18n, t } = useTranslation();
  const change = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };
  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={() => change("ro")}
        className={`px-2 py-1 rounded ${
          i18n.language === "ro" ? "bg-brand-700 text-white" : "bg-white text-gray-600 border border-gray-200"
        }`}
      >
        {t("lang.ro")}
      </button>
      <button
        type="button"
        onClick={() => change("hu")}
        className={`px-2 py-1 rounded ${
          i18n.language === "hu" ? "bg-brand-700 text-white" : "bg-white text-gray-600 border border-gray-200"
        }`}
      >
        {t("lang.hu")}
      </button>
    </div>
  );
}
