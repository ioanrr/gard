import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Circle, Text, Group, Rect } from "react-konva";
import type Konva from "konva";
import { useProject } from "../../store/projectStore";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import type { Segment, FenceModule } from "../../engine/types";

const SEGMENT_OFFSET = 16;

interface Props {
  width: number;
  height: number;
}

export function SketchCanvas({ width, height }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const [hoverSegId, setHoverSegId] = useState<string | null>(null);

  const segments = useProject((s) => s.segments);
  const modules = useProject((s) => s.modules);
  const closed = useProject((s) => s.closed);
  const selectedSegmentId = useProject((s) => s.selectedSegmentId);
  const selectedModuleId = useProject((s) => s.selectedModuleId);
  const pendingPoint = useProject((s) => s.pendingPoint);
  const cursor = useProject((s) => s.cursor);
  const addPoint = useProject((s) => s.addPoint);
  const setCursor = useProject((s) => s.setCursor);
  const selectSegment = useProject((s) => s.selectSegment);
  const selectModule = useProject((s) => s.selectModule);
  const updateModule = useProject((s) => s.updateModule);
  const closePerimeter = useProject((s) => s.closePerimeter);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target !== stageRef.current) return;
    if (closed) return;
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;
    addPoint({ x: pos.x, y: pos.y });
  };

  const handleMouseMove = () => {
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;
    setCursor({ x: pos.x, y: pos.y });
  };

  const handleMouseLeave = () => setCursor(null);

  const handleDblClick = () => {
    if (segments.length >= 2 && !closed) {
      closePerimeter();
    }
  };

  const anchor: { x: number; y: number } | null =
    pendingPoint ??
    (segments.length > 0 && !closed ? segments[segments.length - 1].end : null);

  const showGhost = !closed && anchor !== null && cursor !== null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#fbfaf6] border border-gray-200 rounded-lg">
      <GridLayer width={width} height={height} />
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onClick={handleClick}
        onDblClick={handleDblClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ position: "absolute", inset: 0 }}
      >
        <Layer>
          {showGhost && (
            <Line
              points={[anchor!.x, anchor!.y, cursor!.x, cursor!.y]}
              stroke="#447a5e"
              strokeWidth={2}
              dash={[6, 6]}
              listening={false}
              opacity={0.85}
            />
          )}
          {segments.map((seg) => (
            <SegmentNode
              key={seg.id}
              seg={seg}
              modules={modules.filter((m) => m.segmentId === seg.id)}
              selected={selectedSegmentId === seg.id}
              hovered={hoverSegId === seg.id}
              selectedModuleId={selectedModuleId}
              onHover={(h) => setHoverSegId(h ? seg.id : null)}
              onClickSegment={() => selectSegment(seg.id)}
              onClickModule={(id) => selectModule(id)}
              onDragModule={(id, positionMm) => updateModule(id, { positionMm })}
            />
          ))}
          {segments.map((seg, i) => (
            <Group key={`pt_${seg.id}`}>
              {i === 0 && (
                <Circle x={seg.start.x} y={seg.start.y} radius={5} fill="#1f3b2d" />
              )}
              <Circle x={seg.end.x} y={seg.end.y} radius={5} fill="#1f3b2d" />
            </Group>
          ))}
          {pendingPoint && segments.length === 0 && (
            <Group>
              <Circle
                x={pendingPoint.x}
                y={pendingPoint.y}
                radius={8}
                fill="#1f3b2d"
              />
              <Circle
                x={pendingPoint.x}
                y={pendingPoint.y}
                radius={14}
                stroke="#447a5e"
                strokeWidth={2}
                opacity={0.5}
              />
            </Group>
          )}
        </Layer>
      </Stage>
      <CanvasOverlay />
    </div>
  );
}

function CanvasOverlay() {
  const { t } = useTranslation();
  const segments = useProject((s) => s.segments);
  if (segments.length > 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="text-gray-400 text-sm max-w-xs text-center px-6">
        {t("sketch.instructions")}
      </div>
    </div>
  );
}

function GridLayer({ width, height }: { width: number; height: number }) {
  const lines: React.ReactNode[] = [];
  const STEP = 40;
  for (let x = 0; x <= width; x += STEP) {
    lines.push(
      <div
        key={`v${x}`}
        style={{ position: "absolute", left: x, top: 0, width: 1, height, background: "#eef0ec" }}
      />
    );
  }
  for (let y = 0; y <= height; y += STEP) {
    lines.push(
      <div
        key={`h${y}`}
        style={{ position: "absolute", top: y, left: 0, height: 1, width, background: "#eef0ec" }}
      />
    );
  }
  return <div className="absolute inset-0 pointer-events-none">{lines}</div>;
}

interface SegProps {
  seg: Segment;
  modules: FenceModule[];
  selected: boolean;
  hovered: boolean;
  selectedModuleId: string | null;
  onHover: (h: boolean) => void;
  onClickSegment: () => void;
  onClickModule: (id: string) => void;
  onDragModule: (id: string, positionMm: number) => void;
}

function SegmentNode({
  seg,
  modules,
  selected,
  hovered,
  selectedModuleId,
  onHover,
  onClickSegment,
  onClickModule,
  onDragModule,
}: SegProps) {
  const dx = seg.end.x - seg.start.x;
  const dy = seg.end.y - seg.start.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return null;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

  const stroke = selected ? "#1f3b2d" : hovered ? "#447a5e" : "#94a3b8";
  const strokeWidth = selected || hovered ? 6 : 4;

  const realLen = seg.realLengthMm;
  const pxPerMm = len / realLen;

  const offsetX = nx * SEGMENT_OFFSET;
  const offsetY = ny * SEGMENT_OFFSET;

  const projectToSegment = (stageX: number, stageY: number) => {
    const ax = stageX - (seg.start.x + offsetX);
    const ay = stageY - (seg.start.y + offsetY);
    return ax * ux + ay * uy;
  };

  return (
    <Group>
      <Line
        points={[seg.start.x, seg.start.y, seg.end.x, seg.end.y]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        lineCap="round"
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onClick={(e) => {
          e.cancelBubble = true;
          onClickSegment();
        }}
        hitStrokeWidth={20}
      />

      <Group
        x={seg.start.x + offsetX}
        y={seg.start.y + offsetY}
        rotation={angleDeg}
      >
        <Rect
          x={0}
          y={-12}
          width={len}
          height={24}
          fill="#eef2ee"
          stroke="#d4dad6"
          strokeWidth={1}
          cornerRadius={2}
          listening={false}
        />

        {modules.map((m) => {
          const blockX = (m.positionMm / realLen) * len;
          const blockW = Math.max(8, (m.width / realLen) * len);
          const isSelected = m.id === selectedModuleId;
          const colors: Record<string, string> = {
            panel: "#94a3b8",
            small_gate: "#fbbf24",
            swing_gate: "#f97316",
            sliding_gate: "#3b82f6",
            cantilever_gate: "#8b5cf6",
          };
          return (
            <Rect
              key={m.id}
              x={blockX}
              y={-14}
              width={blockW}
              height={28}
              fill={colors[m.kind]}
              stroke={isSelected ? "#0e1f17" : "#1f2937"}
              strokeWidth={isSelected ? 2.5 : 1}
              cornerRadius={3}
              opacity={0.92}
              draggable
              onClick={(e) => {
                e.cancelBubble = true;
                onClickModule(m.id);
              }}
              onDragStart={(e) => {
                e.cancelBubble = true;
                onClickModule(m.id);
              }}
              onDragMove={(e) => {
                const stage = e.target.getStage();
                if (!stage) return;
                const pos = stage.getPointerPosition();
                if (!pos) return;
                const proj = projectToSegment(pos.x, pos.y);
                const blockMm = m.width;
                const newPosMm =
                  Math.round(
                    Math.max(0, Math.min(realLen - blockMm, proj / pxPerMm - blockMm / 2)) / 50
                  ) * 50;
                onDragModule(m.id, newPosMm);
                e.target.position({ x: (newPosMm / realLen) * len, y: -14 });
              }}
              onDragEnd={(e) => {
                e.target.position({ x: blockX, y: -14 });
              }}
            />
          );
        })}

        {modules.map((m) => {
          const blockX = (m.positionMm / realLen) * len;
          const blockW = Math.max(8, (m.width / realLen) * len);
          if (blockW <= 50) return null;
          return (
            <Text
              key={`label_${m.id}`}
              x={blockX + 4}
              y={-6}
              text={kindLabel(m.kind)}
              fontSize={10}
              fill="white"
              width={blockW - 8}
              ellipsis
              wrap="none"
              listening={false}
            />
          );
        })}

        <Text
          x={0}
          y={-32}
          text={`${(realLen / 1000).toFixed(2)} m`}
          fontSize={12}
          fill={selected ? "#1f3b2d" : "#475569"}
          fontStyle="bold"
          listening={false}
        />
      </Group>
    </Group>
  );
}

function kindLabel(k: FenceModule["kind"]) {
  return i18n.t(`canvasLabel.${k}`);
}

export function useResizeObserver(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 600, height: 400 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setSize({ width: Math.max(100, width), height: Math.max(100, height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}
