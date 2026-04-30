import { useTranslation } from "react-i18next";
import { useProject, expandedModules } from "../../store/projectStore";
import { calculateModule } from "../../engine/calculations";
import { packCuts } from "../../engine/cutting";
import { PROFILES, STOCK_LENGTH_MM } from "../../data/profiles";
import { colorById } from "../../data/colors";
import { exportCuttingPdf } from "../../pdf/exportPdf";

export function CuttingPlanView() {
  const { t } = useTranslation();
  const segments = useProject((s) => s.segments);
  const modules = useProject((s) => s.modules);
  const all = expandedModules({ segments, modules });

  if (all.length === 0) {
    return <div className="p-4 text-sm text-gray-500">{t("cutting.empty")}</div>;
  }

  const calcs = all.map(calculateModule);
  const pieces = calcs.flatMap((c) => c.pieces);
  const plan = packCuts(pieces);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">{t("cutting.title")}</h2>
          <p className="text-xs text-gray-500">{t("cutting.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => exportCuttingPdf(plan, t)}
          className="text-sm bg-brand-700 text-white px-3 py-1.5 rounded hover:bg-brand-900"
        >
          {t("cutting.exportPdf")}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label={t("cutting.totalBars")} value={`${plan.totalBars}`} />
        <Stat label={t("cutting.totalWaste")} value={`${(plan.totalWasteMm / 1000).toFixed(2)} m`} />
        <Stat label={t("cutting.wasteRatio")} value={`${(plan.wasteRatio * 100).toFixed(1)}%`} />
      </div>

      <div className="space-y-2">
        {plan.bars.map((bar, i) => {
          const profile = PROFILES[bar.profileId];
          const color = colorById(bar.colorId);
          const usedMm = bar.cuts.reduce((s, c) => s + c.lengthMm, 0);
          return (
            <div key={i} className="border border-gray-200 rounded p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">
                  #{i + 1} — {profile.name}{" "}
                  <span className="text-xs text-gray-500 font-normal">
                    ({color.name})
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {usedMm} / {STOCK_LENGTH_MM} mm — rebut {bar.wasteMm} mm
                </div>
              </div>
              <div className="flex h-6 rounded overflow-hidden border border-gray-200">
                {bar.cuts.map((c, j) => {
                  const w = (c.lengthMm / STOCK_LENGTH_MM) * 100;
                  return (
                    <div
                      key={j}
                      style={{ width: `${w}%`, background: color.hex }}
                      className="text-[10px] text-white px-1 flex items-center overflow-hidden border-r border-white/40"
                      title={`${c.lengthMm} mm — ${c.source.role}`}
                    >
                      {c.lengthMm}
                    </div>
                  );
                })}
                <div
                  style={{ width: `${(bar.wasteMm / STOCK_LENGTH_MM) * 100}%` }}
                  className="bg-gray-200"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold text-brand-900">{value}</div>
    </div>
  );
}
