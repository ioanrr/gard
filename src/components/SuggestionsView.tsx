import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useProject } from "../store/projectStore";
import { generateSuggestions, computeSubtotal } from "../engine/suggestions";

export function SuggestionsView() {
  const { t } = useTranslation();
  const segments = useProject((s) => s.segments);
  const modules = useProject((s) => s.modules);
  const update = useProject((s) => s.updateModule);

  const { suggestions, baseCost } = useMemo(() => {
    const baseCost = computeSubtotal({ segments, modules });
    const suggestions = generateSuggestions({ segments, modules });
    return { suggestions, baseCost };
  }, [segments, modules]);

  if (segments.length === 0) {
    return <div className="p-6 text-sm text-gray-500">{t("suggestions.empty")}</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-6">
        <div className="text-sm text-brand-900 font-medium mb-1">
          {t("suggestions.alreadyOptimal")}
        </div>
        <div className="text-xs text-gray-500">
          {t("suggestions.baseCost")}: {baseCost.toFixed(2)} RON
        </div>
      </div>
    );
  }

  const totalSavings = suggestions.reduce((s, x) => s + x.savings, 0);

  return (
    <div className="p-6 space-y-4">
      <div className="bg-brand-50 border border-brand-200 rounded p-4">
        <div className="text-sm text-brand-700">{t("suggestions.totalSavings")}</div>
        <div className="text-2xl font-bold text-brand-900">
          ~ {totalSavings.toFixed(2)} RON
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {t("suggestions.baseCost")}: {baseCost.toFixed(2)} RON
        </div>
      </div>

      <div className="space-y-2">
        {suggestions.map((s, i) => {
          const mod = modules.find((m) => m.id === s.moduleId);
          if (!mod) return null;
          return (
            <div
              key={i}
              className="border border-gray-200 rounded p-3 flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-sm">
                  <span className="font-medium">{t(`modules.${s.kind}`)}</span>:{" "}
                  {t("suggestions.move")}{" "}
                  <span className="text-gray-500 line-through">
                    {(s.fromMm / 1000).toFixed(2)} m
                  </span>{" "}
                  →{" "}
                  <span className="font-semibold text-brand-900">
                    {(s.toMm / 1000).toFixed(2)} m
                  </span>
                </div>
                <div className="text-xs text-emerald-700 font-medium mt-0.5">
                  − {s.savings.toFixed(2)} RON ({((s.savings / s.baseCost) * 100).toFixed(1)}%)
                </div>
              </div>
              <button
                type="button"
                onClick={() => update(s.moduleId, { positionMm: s.toMm })}
                className="px-3 py-1.5 text-sm bg-brand-700 text-white rounded hover:bg-brand-900"
              >
                {t("suggestions.apply")}
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          for (const s of suggestions) update(s.moduleId, { positionMm: s.toMm });
        }}
        className="w-full px-3 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm"
      >
        {t("suggestions.applyAll")}
      </button>
    </div>
  );
}
