import { useTranslation } from "react-i18next";
import { useProject, expandedModules } from "../../store/projectStore";

export function ProjectSummary() {
  const { t } = useTranslation();
  const segments = useProject((s) => s.segments);
  const modules = useProject((s) => s.modules);

  const totalLengthMm = segments.reduce((s, x) => s + x.realLengthMm, 0);
  const all = expandedModules({ segments, modules });
  const panels = all.filter((m) => m.kind === "panel").length;
  const gates = all.filter((m) => m.kind !== "panel").length;

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
        {t("summary.title")}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">{t("summary.totalLength")}</div>
          <div className="text-sm font-semibold text-brand-900">
            {(totalLengthMm / 1000).toFixed(2)} m
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">{t("summary.panels")}</div>
          <div className="text-sm font-semibold text-brand-900">{panels}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">{t("summary.gates")}</div>
          <div className="text-sm font-semibold text-brand-900">{gates}</div>
        </div>
      </div>
    </div>
  );
}
