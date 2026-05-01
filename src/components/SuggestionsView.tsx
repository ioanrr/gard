import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProject } from "../store/projectStore";
import { generateSuggestions, computeSubtotal } from "../engine/suggestions";

export function SuggestionsView({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const segments = useProject((s) => s.segments);
  const modules = useProject((s) => s.modules);
  const update = useProject((s) => s.updateModule);

  const [snapshot] = useState(() => {
    const baseCost = computeSubtotal({ segments, modules });
    const suggestions = generateSuggestions({ segments, modules });
    return { baseCost, suggestions };
  });

  const appliedSet = useMemo(() => {
    const set = new Set<string>();
    for (const s of snapshot.suggestions) {
      const mod = modules.find((m) => m.id === s.moduleId);
      if (mod && mod.positionMm === s.toMm) set.add(s.moduleId);
    }
    return set;
  }, [modules, snapshot.suggestions]);

  if (segments.length === 0) {
    return (
      <SuggestionsLayout onClose={onClose} title={t("suggestions.title")}>
        <div className="p-4 text-sm text-gray-500">{t("suggestions.empty")}</div>
      </SuggestionsLayout>
    );
  }

  if (snapshot.suggestions.length === 0) {
    return (
      <SuggestionsLayout onClose={onClose} title={t("suggestions.title")}>
        <div className="p-4 space-y-2">
          <div className="text-sm text-brand-900 font-medium">
            {t("suggestions.alreadyOptimal")}
          </div>
          <div className="text-xs text-gray-500">
            {t("suggestions.baseCost")}: {snapshot.baseCost.toFixed(2)} RON
          </div>
        </div>
      </SuggestionsLayout>
    );
  }

  const totalSavingsApplied = snapshot.suggestions
    .filter((s) => appliedSet.has(s.moduleId))
    .reduce((sum, s) => sum + s.savings, 0);
  const totalSavingsPotential = snapshot.suggestions.reduce(
    (sum, s) => sum + s.savings,
    0
  );

  const allApplied = snapshot.suggestions.every((s) => appliedSet.has(s.moduleId));

  return (
    <SuggestionsLayout onClose={onClose} title={t("suggestions.title")}>
      <div className="p-3 space-y-3">
        <div className="bg-brand-50 border border-brand-200 rounded p-3">
          <div className="text-[11px] text-brand-700 uppercase tracking-wide font-semibold">
            {t("suggestions.totalSavings")}
          </div>
          <div className="text-xl font-bold text-brand-900">
            ~ {totalSavingsApplied.toFixed(2)}{" "}
            <span className="text-sm font-normal text-gray-500">
              / {totalSavingsPotential.toFixed(2)} RON
            </span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            {t("suggestions.baseCost")}: {snapshot.baseCost.toFixed(2)} RON
          </div>
        </div>

        <div className="space-y-2">
          {snapshot.suggestions.map((s, i) => {
            const isApplied = appliedSet.has(s.moduleId);
            const distMm = Math.abs(s.toMm - s.fromMm);
            const dirRight = s.toMm > s.fromMm;
            const dirLabel = dirRight ? t("suggestions.right") : t("suggestions.left");
            const dirArrow = dirRight ? "→" : "←";
            return (
              <div
                key={i}
                className={`border rounded p-2.5 transition-colors ${
                  isApplied
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="text-[13px]">
                  <span className="font-medium">{t(`modules.${s.kind}`)}</span>
                </div>
                <div className="text-xs text-gray-700 mt-0.5">
                  {dirArrow} {(distMm / 1000).toFixed(2)} m {dirLabel}
                </div>
                <div className="text-[11px] text-gray-500">
                  {(s.fromMm / 1000).toFixed(2)} m → {(s.toMm / 1000).toFixed(2)} m
                </div>
                <div className="text-xs text-emerald-700 font-semibold mt-1">
                  − {s.savings.toFixed(2)} RON ({((s.savings / s.baseCost) * 100).toFixed(1)}%)
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isApplied) update(s.moduleId, { positionMm: s.fromMm });
                    else update(s.moduleId, { positionMm: s.toMm });
                  }}
                  className={`mt-2 w-full px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                    isApplied
                      ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {isApplied ? t("suggestions.cancel") : t("suggestions.apply")}
                </button>
              </div>
            );
          })}
        </div>

        {!allApplied ? (
          <button
            type="button"
            onClick={() => {
              for (const s of snapshot.suggestions) {
                update(s.moduleId, { positionMm: s.toMm });
              }
            }}
            className="w-full px-3 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm"
          >
            {t("suggestions.applyAll")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              for (const s of snapshot.suggestions) {
                update(s.moduleId, { positionMm: s.fromMm });
              }
            }}
            className="w-full px-3 py-2 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 rounded"
          >
            {t("suggestions.revertAll")}
          </button>
        )}
      </div>
    </SuggestionsLayout>
  );
}

function SuggestionsLayout({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={onClose}
          className="w-full px-3 py-2.5 text-base font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 rounded shadow"
        >
          ✕ {t("suggestions.close")}
        </button>
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mt-2">
          {title}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
