import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useProject } from "../../store/projectStore";
import type { ModuleKind } from "../../engine/types";

const MODULE_KINDS: ModuleKind[] = [
  "small_gate",
  "swing_gate",
  "sliding_gate",
  "cantilever_gate",
  "panel",
];

export function SegmentPanel() {
  const { t } = useTranslation();
  const segmentId = useProject((s) => s.selectedSegmentId);
  const segments = useProject((s) => s.segments);
  const modules = useProject((s) => s.modules);
  const segment = segments.find((x) => x.id === segmentId) ?? null;
  const modulesOnSeg = modules.filter((m) => m.segmentId === segmentId);
  const setSegmentLength = useProject((s) => s.setSegmentLength);
  const addModuleToSegment = useProject((s) => s.addModuleToSegment);
  const lengthInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (segmentId && lengthInputRef.current) {
      lengthInputRef.current.focus();
      lengthInputRef.current.select();
    }
  }, [segmentId]);

  if (!segment) {
    return (
      <div className="p-4 text-sm text-gray-500">
        {t("sketch.noSegmentSelected")}
      </div>
    );
  }

  const used = modulesOnSeg.reduce((s, m) => s + m.width, 0);
  const remaining = Math.max(0, segment.realLengthMm - used);

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
        {t("sketch.segmentSelected")}
      </div>

      <label className="block">
        <div className="text-sm text-gray-800 mb-1 font-medium">
          {t("sketch.segmentLength")}
        </div>
        <input
          ref={lengthInputRef}
          type="number"
          min={100}
          step={10}
          value={segment.realLengthMm}
          onChange={(e) => setSegmentLength(segment.id, Number(e.target.value))}
          className="w-full px-3 py-2 border-2 border-brand-200 focus:border-brand-700 rounded text-sm font-medium outline-none"
        />
        <div className="text-xs text-gray-500 mt-1">
          = {(segment.realLengthMm / 1000).toFixed(2)} m
        </div>
      </label>

      <div className="text-xs text-gray-500 grid grid-cols-2 gap-1 bg-gray-50 p-2 rounded">
        <span>Folosit module:</span>
        <span className="text-right">{used} mm</span>
        <span>Rămas (auto-panouri):</span>
        <span className="text-right">{remaining} mm</span>
      </div>

      <div>
        <div className="text-sm text-gray-700 mb-2 font-medium">
          {t("sketch.addModule")}
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {MODULE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => addModuleToSegment(segment.id, k)}
              className="text-left px-3 py-2 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded text-sm text-brand-900"
            >
              + {t(`modules.${k}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
