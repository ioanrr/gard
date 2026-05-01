import { useTranslation } from "react-i18next";

const LANGS = ["ro", "hu", "de"] as const;

export function LangSwitcher() {
  const { i18n, t } = useTranslation();
  const change = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };
  return (
    <div className="flex items-center gap-1 text-xs">
      {LANGS.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => change(lng)}
          className={`px-2 py-1 rounded ${
            i18n.language === lng
              ? "bg-brand-700 text-white"
              : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          {t(`lang.${lng}`)}
        </button>
      ))}
    </div>
  );
}
