import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProject, autoPanelsForSegment } from "../../store/projectStore";
import { calculateModule } from "../../engine/calculations";
import { colorById } from "../../data/colors";
import i18n from "../../i18n";
import type { FenceModule, Segment } from "../../engine/types";

const STRIP_HEIGHT = 170;
const LABEL_BAND = 26;
const PAD_X = 12;
const PAD_Y = 8;

export function SegmentElevation() {
  const { t } = useTranslation();
  const segmentId = useProject((s) => s.selectedSegmentId);
  const moduleId = useProject((s) => s.selectedModuleId);
  const segments = useProject((s) => s.segments);
  const modules = useProject((s) => s.modules);
  const selectModule = useProject((s) => s.selectModule);
  const selectSegment = useProject((s) => s.selectSegment);

  const segmentForSelectedModule = moduleId
    ? modules.find((m) => m.id === moduleId)?.segmentId
    : null;
  const activeSegmentId = segmentId ?? segmentForSelectedModule ?? null;
  const segment = activeSegmentId
    ? segments.find((s) => s.id === activeSegmentId) ?? null
    : null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.max(200, e.contentRect.width));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!segment) return null;

  const userModules = modules.filter((m) => m.segmentId === segment.id);
  const autoPanels = autoPanelsForSegment(segment, userModules);
  const allModules = [...userModules, ...autoPanels].sort(
    (a, b) => a.positionMm - b.positionMm
  );

  const totalMm = segment.realLengthMm;
  const maxHeightMm = Math.max(
    1800,
    ...allModules.map((m) => m.height)
  );

  const drawableW = width - 2 * PAD_X;
  const drawableH = STRIP_HEIGHT - LABEL_BAND - 2 * PAD_Y;
  const scale = Math.min(drawableW / totalMm, drawableH / maxHeightMm);
  const fenceWPx = totalMm * scale;
  const fenceHPx = maxHeightMm * scale;
  const baseY = PAD_Y + (drawableH - fenceHPx) + LABEL_BAND;

  return (
    <div
      ref={containerRef}
      className="absolute top-2 left-2 right-2 bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-sm overflow-hidden z-10"
      style={{ height: STRIP_HEIGHT }}
    >
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-100 bg-gray-50">
        <div className="text-xs font-medium text-gray-700">
          {t("elevation.title")}
        </div>
        <div className="text-[11px] text-gray-500">
          {(totalMm / 1000).toFixed(2)} m × {(maxHeightMm / 1000).toFixed(2)} m
          &middot; 1:{Math.round(1 / scale)}
        </div>
      </div>
      <svg width={width} height={STRIP_HEIGHT - 22}>
        <line
          x1={PAD_X}
          y1={baseY + fenceHPx + 1}
          x2={PAD_X + fenceWPx}
          y2={baseY + fenceHPx + 1}
          stroke="#475569"
          strokeWidth={1.5}
        />
        {[0, totalMm].map((mm, i) => (
          <text
            key={i}
            x={PAD_X + (mm / totalMm) * fenceWPx}
            y={baseY + fenceHPx + 14}
            fontSize={10}
            fill="#475569"
            textAnchor={i === 0 ? "start" : "end"}
          >
            {(mm / 1000).toFixed(2)} m
          </text>
        ))}

        {allModules.map((m) => {
          const isAuto = m.id.startsWith("auto_");
          const isSelected = m.id === moduleId;
          return (
            <ModuleElevation
              key={m.id}
              m={m}
              segment={segment}
              x={PAD_X + m.positionMm * scale}
              y={baseY + (maxHeightMm - m.height) * scale}
              w={m.width * scale}
              h={m.height * scale}
              selected={isSelected}
              isAuto={isAuto}
              onClick={() => {
                if (isAuto) selectSegment(segment.id);
                else selectModule(m.id);
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

function ModuleElevation({
  m,
  x,
  y,
  w,
  h,
  selected,
  isAuto,
  onClick,
}: {
  m: FenceModule;
  segment: Segment;
  x: number;
  y: number;
  w: number;
  h: number;
  selected: boolean;
  isAuto: boolean;
  onClick: () => void;
}) {
  const calc = calculateModule(m);
  const color = colorById(m.colorId);
  const horizontal = m.orientation === "horizontal";
  const isGate = m.kind !== "panel";

  const slats: { x: number; y: number; w: number; h: number; fill: string }[] = [];
  if (calc.slatCount > 0) {
    const totalSlatPx = calc.slatCount * m.slatWidth * (horizontal ? h / m.height : w / m.width);
    const span = horizontal ? h : w;
    const gapPx = (span - totalSlatPx) / (calc.slatCount + 1);
    const slatPx = m.slatWidth * (horizontal ? h / m.height : w / m.width);
    for (let i = 0; i < calc.slatCount; i++) {
      const offset = (i + 1) * gapPx + i * slatPx;
      const fillColor =
        m.secondaryColorId && horizontal && m.infill !== "solid" && (i === 1 || i === 2)
          ? colorById(m.secondaryColorId).hex
          : color.hex;
      if (horizontal) {
        slats.push({ x: 0, y: offset, w, h: slatPx, fill: fillColor });
      } else {
        slats.push({ x: offset, y: 0, w: slatPx, h, fill: fillColor });
      }
    }
  }

  const stroke = selected ? "#0e1f17" : isAuto ? "#94a3b8" : "#1f2937";
  const strokeWidth = selected ? 2 : 1;

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill={isAuto ? "#f1f5f9" : "#f8fafc"}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={isAuto ? 0.85 : 1}
      />
      {isGate && (
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill="none"
          stroke={color.hex}
          strokeWidth={Math.min(4, w * 0.06)}
        />
      )}
      {slats.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill={s.fill} />
      ))}
      {w > 30 && (
        <text
          x={w / 2}
          y={-4}
          fontSize={9}
          fill="#475569"
          textAnchor="middle"
        >
          {(m.width / 1000).toFixed(2)} m
        </text>
      )}
      {isGate && w > 60 && (
        <text
          x={w / 2}
          y={h / 2 + 3}
          fontSize={10}
          fill="white"
          textAnchor="middle"
          stroke="#1f2937"
          strokeWidth={2}
          paintOrder="stroke"
          fontWeight="bold"
        >
          {kindShort(m.kind)}
        </text>
      )}
    </g>
  );
}

function kindShort(k: FenceModule["kind"]) {
  return i18n.t(`canvasLabel.${k}`);
}
