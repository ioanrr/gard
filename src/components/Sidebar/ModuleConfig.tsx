import { useTranslation } from "react-i18next";
import { useProject } from "../../store/projectStore";
import { COLORS } from "../../data/colors";
import { SLAT_WIDTHS } from "../../data/profiles";
import type { FenceModule, InfillType, Orientation } from "../../engine/types";
import { calculateModule } from "../../engine/calculations";

export function ModuleConfig() {
  const { t } = useTranslation();
  const moduleId = useProject((s) => s.selectedModuleId);
  const m = useProject((s) => s.modules.find((x) => x.id === moduleId) ?? null);
  const segment = useProject((s) =>
    m ? s.segments.find((x) => x.id === m.segmentId) ?? null : null
  );
  const update = useProject((s) => s.updateModule);
  const remove = useProject((s) => s.removeModule);
  const selectSegment = useProject((s) => s.selectSegment);

  if (!m) {
    return (
      <div className="p-4 text-sm text-gray-500">
        {t("modules.noModuleSelected")}
      </div>
    );
  }

  const calc = calculateModule(m);
  const segLen = segment?.realLengthMm ?? 0;
  const maxStart = Math.max(0, segLen - m.width);

  return (
    <div className="p-4 space-y-3 overflow-y-auto">
      {segment && (
        <button
          type="button"
          onClick={() => selectSegment(segment.id)}
          className="w-full text-center text-base font-semibold text-white bg-brand-700 hover:bg-brand-900 px-3 py-3 rounded shadow-sm transition-colors"
        >
          {t("modules.backToSegment")}
        </button>
      )}
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
          {t("modules.config")} — {t(`modules.${m.kind}`)}
        </div>
        <button
          type="button"
          onClick={() => remove(m.id)}
          className="text-xs text-red-600 hover:text-red-800"
        >
          {t("modules.remove")}
        </button>
      </div>

      {segment && (
        <div className="bg-brand-50 border border-brand-200 rounded p-3 space-y-2">
          <div className="text-xs uppercase tracking-wide text-brand-700 font-semibold">
            {t("modules.position")}
          </div>
          <NumberRow
            label={t("modules.distFromStart")}
            value={m.positionMm}
            min={0}
            step={50}
            onChange={(v) => update(m.id, { positionMm: Math.min(maxStart, Math.max(0, v)) })}
          />
          <input
            type="range"
            min={0}
            max={maxStart}
            step={50}
            value={m.positionMm}
            onChange={(e) =>
              update(m.id, { positionMm: Number(e.target.value) })
            }
            className="w-full accent-brand-700"
          />
          <div className="text-xs text-gray-600 flex justify-between">
            <span>0 m</span>
            <span>
              {((m.positionMm + m.width) / 1000).toFixed(2)} m (capăt drept modul)
            </span>
            <span>{(segLen / 1000).toFixed(2)} m</span>
          </div>
        </div>
      )}

      <NumberRow
        label={t("modules.width")}
        value={m.width}
        onChange={(v) => update(m.id, { width: v })}
      />
      <NumberRow
        label={t("modules.height")}
        value={m.height}
        onChange={(v) => update(m.id, { height: v })}
      />

      <Select
        label={t("modules.color")}
        value={m.colorId}
        onChange={(v) => update(m.id, { colorId: v })}
        options={COLORS.map((c) => ({ value: c.id, label: c.name, swatch: c.hex }))}
      />

      <Select
        label={t("modules.infillType")}
        value={m.infill}
        onChange={(v) => update(m.id, { infill: v as InfillType })}
        options={[
          { value: "solid", label: t("modules.infill.solid") },
          { value: "slatted", label: t("modules.infill.slatted") },
          { value: "slatted_secondary", label: t("modules.infill.slatted_secondary") },
        ]}
      />

      <Select
        label={t("modules.slatWidth")}
        value={String(m.slatWidth)}
        onChange={(v) => update(m.id, { slatWidth: Number(v) })}
        options={SLAT_WIDTHS.map((w) => ({ value: String(w), label: `${w} mm` }))}
      />

      {m.infill === "slatted_secondary" && (
        <Select
          label={t("modules.secondarySlatWidth")}
          value={String(m.secondarySlatWidth ?? 60)}
          onChange={(v) => update(m.id, { secondarySlatWidth: Number(v) })}
          options={SLAT_WIDTHS.map((w) => ({ value: String(w), label: `${w} mm` }))}
        />
      )}

      {m.infill !== "solid" && (
        <NumberRow
          label={t("modules.gap")}
          value={m.gap}
          min={1}
          onChange={(v) => update(m.id, { gap: v })}
        />
      )}

      <Select
        label={t("modules.orientation")}
        value={m.orientation}
        onChange={(v) => update(m.id, { orientation: v as Orientation })}
        options={[
          { value: "horizontal", label: t("modules.horizontal") },
          { value: "vertical", label: t("modules.vertical") },
        ]}
      />

      <ModulePreview m={m} />

      <div className="bg-gray-50 rounded p-3 text-xs text-gray-700 space-y-1">
        {calc.notes.map((n, i) => (
          <div key={i}>• {n}</div>
        ))}
      </div>
    </div>
  );
}

function ModulePreview({ m }: { m: FenceModule }) {
  const calc = calculateModule(m);
  const aspect = m.height / m.width;
  const W = 240;
  const H = Math.min(220, Math.round(W * aspect));
  const color = COLORS.find((c) => c.id === m.colorId)?.hex ?? "#777";
  const horizontal = m.orientation === "horizontal";

  const slats: { x: number; y: number; w: number; h: number }[] = [];
  if (calc.slatCount > 0) {
    const totalSlatPx = calc.slatCount * m.slatWidth;
    const span = horizontal ? m.height : m.width;
    const gapPx = (span - totalSlatPx) / (calc.slatCount + 1);
    for (let i = 0; i < calc.slatCount; i++) {
      const offset = (i + 1) * gapPx + i * m.slatWidth;
      if (horizontal) {
        slats.push({
          x: 0,
          y: (offset / m.height) * H,
          w: W,
          h: (m.slatWidth / m.height) * H,
        });
      } else {
        slats.push({
          x: (offset / m.width) * W,
          y: 0,
          w: (m.slatWidth / m.width) * W,
          h: H,
        });
      }
    }
  }

  return (
    <div className="border border-gray-200 rounded p-2 bg-white flex flex-col items-center">
      <svg width={W} height={H}>
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          fill="#f3f4f6"
          stroke="#9ca3af"
          strokeWidth={1}
        />
        {slats.map((s, i) => (
          <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill={color} />
        ))}
      </svg>
      <div className="text-xs text-gray-500 mt-1">
        {m.width} × {m.height} mm
      </div>
    </div>
  );
}

function NumberRow({
  label,
  value,
  min,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="text-sm text-gray-700 mb-1">{label}</div>
      <input
        type="number"
        min={min ?? 0}
        step={step ?? 10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; swatch?: string }[];
}) {
  return (
    <label className="block">
      <div className="text-sm text-gray-700 mb-1">{label}</div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
