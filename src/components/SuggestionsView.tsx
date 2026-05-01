import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProject } from "../store/projectStore";
import {
  generateSuggestions,
  computeSubtotal,
  type PackageSuggestion,
  type SingleSuggestion,
  type SuggestionMove,
} from "../engine/suggestions";
import type { FenceModule } from "../engine/types";

const TOLERANCE_OPTIONS = [5, 7, 10, 15, 20, 100] as const;
const DEFAULT_TOLERANCE = 10;

export function SuggestionsView({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const segments = useProject((s) => s.segments);
  const modules = useProject((s) => s.modules);
  const update = useProject((s) => s.updateModule);

  const [tolerance, setTolerance] = useState<number>(DEFAULT_TOLERANCE);

  const [originalSnapshot] = useState(() => {
    const map: Record<string, number> = {};
    for (const m of modules) {
      if (!m.id.startsWith("auto_")) map[m.id] = m.positionMm;
    }
    return map;
  });

  const baselineModules = useMemo(
    () =>
      modules.map((m) =>
        originalSnapshot[m.id] !== undefined
          ? { ...m, positionMm: originalSnapshot[m.id] }
          : m
      ),
    [modules, originalSnapshot]
  );

  const snapshot = useMemo(() => {
    const baseCost = computeSubtotal({ segments, modules: baselineModules });
    const suggestions = generateSuggestions(
      { segments, modules: baselineModules },
      { toleranceFraction: tolerance / 100 }
    );
    return { baseCost, suggestions };
  }, [segments, baselineModules, tolerance]);

  const isModified = useMemo(
    () =>
      modules.some(
        (m) =>
          originalSnapshot[m.id] !== undefined &&
          m.positionMm !== originalSnapshot[m.id]
      ),
    [modules, originalSnapshot]
  );

  const revertToOriginal = () => {
    for (const id in originalSnapshot) {
      update(id, { positionMm: originalSnapshot[id] });
    }
  };

  const toleranceSelector = (
    <div className="bg-white border border-gray-200 rounded p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-600 font-semibold mb-2">
        {t("suggestions.toleranceLabel")}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {TOLERANCE_OPTIONS.map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => setTolerance(pct)}
            className={`px-2 py-1.5 text-xs font-medium rounded border ${
              tolerance === pct
                ? "bg-brand-700 text-white border-brand-700"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {pct >= 100 ? t("suggestions.toleranceUnlimited") : `±${pct}%`}
          </button>
        ))}
      </div>
      <div className="text-[11px] text-gray-500 mt-2">
        {t("suggestions.toleranceHint")}
      </div>
    </div>
  );

  if (segments.length === 0) {
    return (
      <SuggestionsLayout onClose={onClose} title={t("suggestions.title")}>
        <div className="p-3 space-y-3">
          {toleranceSelector}
          <div className="text-sm text-gray-500">{t("suggestions.empty")}</div>
        </div>
      </SuggestionsLayout>
    );
  }

  return (
    <SuggestionsLayout onClose={onClose} title={t("suggestions.title")}>
      <div className="p-3 space-y-3">
        {toleranceSelector}

        <div className="bg-brand-50 border border-brand-200 rounded p-3">
          <div className="text-[11px] text-brand-700 uppercase tracking-wide font-semibold">
            {t("suggestions.baseCost")}
          </div>
          <div className="text-base font-bold text-brand-900">
            {snapshot.baseCost.toFixed(2)} RON
          </div>
        </div>

        {snapshot.suggestions.length === 0 ? (
          <div className="text-sm text-brand-900 bg-emerald-50 border border-emerald-200 rounded p-3">
            {t("suggestions.alreadyOptimal")}
          </div>
        ) : (
          snapshot.suggestions.map((s, i) =>
            s.type === "package" ? (
              <PackageCard
                key={i}
                suggestion={s}
                modules={modules}
                update={update}
              />
            ) : (
              <SingleCard
                key={i}
                suggestion={s}
                modules={modules}
                update={update}
              />
            )
          )
        )}

        <button
          type="button"
          onClick={revertToOriginal}
          disabled={!isModified}
          className="w-full px-3 py-2.5 text-sm font-semibold rounded border-2 border-gray-400 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↶ {t("suggestions.revertToOriginal")}
        </button>
      </div>
    </SuggestionsLayout>
  );
}

function MoveLine({ move, t }: { move: SuggestionMove; t: (k: string) => string }) {
  const distMm = Math.abs(move.toMm - move.fromMm);
  const dirRight = move.toMm > move.fromMm;
  const dirLabel = dirRight ? t("suggestions.right") : t("suggestions.left");
  const dirArrow = dirRight ? "→" : "←";
  return (
    <div className="text-xs">
      <div className="font-medium text-gray-800">{t(`modules.${move.kind}`)}</div>
      <div className="text-gray-700">
        {dirArrow} {(distMm / 1000).toFixed(2)} m {dirLabel}
      </div>
      <div className="text-[11px] text-gray-500">
        {(move.fromMm / 1000).toFixed(2)} m → {(move.toMm / 1000).toFixed(2)} m
      </div>
    </div>
  );
}

function SingleCard({
  suggestion,
  modules,
  update,
}: {
  suggestion: SingleSuggestion;
  modules: FenceModule[];
  update: (id: string, patch: Partial<FenceModule>) => void;
}) {
  const { t } = useTranslation();
  const m = modules.find((x) => x.id === suggestion.move.moduleId);
  const isApplied =
    m && m.positionMm === suggestion.move.toMm && m.positionMm !== suggestion.move.fromMm;

  return (
    <div
      className={`border rounded p-2.5 transition-colors ${
        isApplied ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white"
      }`}
    >
      <MoveLine move={suggestion.move} t={t} />
      <div className="text-xs text-emerald-700 font-semibold mt-1">
        − {suggestion.savings.toFixed(2)} RON (
        {((suggestion.savings / suggestion.baseCost) * 100).toFixed(1)}%)
      </div>
      <button
        type="button"
        onClick={() => {
          if (isApplied)
            update(suggestion.move.moduleId, { positionMm: suggestion.move.fromMm });
          else
            update(suggestion.move.moduleId, { positionMm: suggestion.move.toMm });
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
}

function PackageCard({
  suggestion,
  modules,
  update,
}: {
  suggestion: PackageSuggestion;
  modules: FenceModule[];
  update: (id: string, patch: Partial<FenceModule>) => void;
}) {
  const { t } = useTranslation();

  const allApplied = useMemo(
    () =>
      suggestion.moves.every((mv) => {
        const m = modules.find((x) => x.id === mv.moduleId);
        return m && m.positionMm === mv.toMm;
      }),
    [modules, suggestion.moves]
  );

  return (
    <div
      className={`border-2 rounded-lg p-3 transition-colors ${
        allApplied ? "border-emerald-400 bg-emerald-50" : "border-amber-300 bg-amber-50"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wide font-bold text-amber-800 mb-1">
        ⭑ {t("suggestions.package")}
      </div>
      <div className="text-xs text-gray-700 mb-2">
        {t("suggestions.packageHint", { count: suggestion.moves.length })}
      </div>
      <div className="space-y-2 mb-2 bg-white rounded p-2 border border-amber-200">
        {suggestion.moves.map((mv, idx) => (
          <div
            key={mv.moduleId}
            className={idx > 0 ? "pt-2 border-t border-gray-100" : ""}
          >
            <MoveLine move={mv} t={t} />
          </div>
        ))}
      </div>
      <div className="text-sm text-emerald-700 font-bold">
        − {suggestion.savings.toFixed(2)} RON (
        {((suggestion.savings / suggestion.baseCost) * 100).toFixed(1)}%)
      </div>
      <button
        type="button"
        onClick={() => {
          if (allApplied) {
            for (const mv of suggestion.moves) update(mv.moduleId, { positionMm: mv.fromMm });
          } else {
            for (const mv of suggestion.moves) update(mv.moduleId, { positionMm: mv.toMm });
          }
        }}
        className={`mt-2 w-full px-3 py-2 text-sm font-bold rounded transition-colors ${
          allApplied
            ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {allApplied ? t("suggestions.revertAll") : t("suggestions.applyAll")}
      </button>
    </div>
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
