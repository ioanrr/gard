import { create } from "zustand";
import type { FenceModule, ModuleKind, Point, Segment } from "../engine/types";
import { defaultModule } from "../engine/calculations";

const MAX_PANEL_WIDTH_MM = 2500;

const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);

interface ProjectState {
  segments: Segment[];
  modules: FenceModule[];
  pxPerMm: number;
  closed: boolean;
  selectedSegmentId: string | null;
  selectedModuleId: string | null;
  pendingPoint: Point | null;
  cursor: Point | null;

  addPoint: (p: Point) => void;
  setCursor: (p: Point | null) => void;
  closePerimeter: () => void;
  undo: () => void;
  clear: () => void;
  setPxPerMm: (px: number) => void;
  setSegmentLength: (id: string, lengthMm: number) => void;
  selectSegment: (id: string | null) => void;
  selectModule: (id: string | null) => void;
  addModuleToSegment: (segmentId: string, kind: ModuleKind) => void;
  updateModule: (id: string, patch: Partial<FenceModule>) => void;
  removeModule: (id: string) => void;
}

const SEG_MIN_LENGTH = 100;
const DEFAULT_PX_PER_MM = 0.05;

export const useProject = create<ProjectState>((set, get) => {
  return {
    segments: [],
    modules: [],
    pxPerMm: DEFAULT_PX_PER_MM,
    closed: false,
    selectedSegmentId: null,
    selectedModuleId: null,
    pendingPoint: null,
    cursor: null,

    setCursor: (p) => set({ cursor: p }),

    addPoint: (p) => {
      const { segments, closed, pendingPoint, pxPerMm } = get();
      if (closed) return;

      if (!pendingPoint && segments.length === 0) {
        set({ pendingPoint: p });
        return;
      }
      const start = pendingPoint ?? segments[segments.length - 1].end;
      const distPx = distance(start, p);
      const realLengthMm = Math.max(
        SEG_MIN_LENGTH,
        Math.round(distPx / pxPerMm / 100) * 100
      );
      const seg: Segment = {
        id: `s_${Math.random().toString(36).slice(2, 9)}`,
        start,
        end: p,
        realLengthMm,
      };
      set({
        segments: [...segments, seg],
        selectedSegmentId: seg.id,
        pendingPoint: null,
      });
    },

    closePerimeter: () => {
      const { segments, pxPerMm } = get();
      if (segments.length < 2) return;
      const first = segments[0].start;
      const last = segments[segments.length - 1].end;
      if (distance(first, last) < 5) {
        set({ closed: true, pendingPoint: null });
        return;
      }
      const distPx = distance(last, first);
      const realLengthMm = Math.max(
        SEG_MIN_LENGTH,
        Math.round(distPx / pxPerMm / 100) * 100
      );
      const seg: Segment = {
        id: `s_${Math.random().toString(36).slice(2, 9)}`,
        start: last,
        end: first,
        realLengthMm,
      };
      set({
        segments: [...segments, seg],
        closed: true,
        pendingPoint: null,
      });
    },

    undo: () => {
      const { segments, modules } = get();
      if (segments.length === 0) {
        set({ pendingPoint: null });
        return;
      }
      const removed = segments[segments.length - 1];
      set({
        segments: segments.slice(0, -1),
        modules: modules.filter((m) => m.segmentId !== removed.id),
        closed: false,
        selectedSegmentId: null,
      });
    },

    clear: () =>
      set({
        segments: [],
        modules: [],
        closed: false,
        selectedSegmentId: null,
        selectedModuleId: null,
        pendingPoint: null,
        cursor: null,
      }),

    setPxPerMm: (px) => set({ pxPerMm: px }),

    setSegmentLength: (id, lengthMm) =>
      set({
        segments: get().segments.map((s) =>
          s.id === id ? { ...s, realLengthMm: Math.max(100, Math.round(lengthMm)) } : s
        ),
      }),

    selectSegment: (id) => set({ selectedSegmentId: id, selectedModuleId: null }),
    selectModule: (id) => set({ selectedModuleId: id, selectedSegmentId: null }),

    addModuleToSegment: (segmentId, kind) => {
      const seg = get().segments.find((s) => s.id === segmentId);
      if (!seg) return;
      const existing = get().modules.filter((x) => x.segmentId === segmentId);
      const usedSpan = existing.reduce((s, m) => Math.max(s, m.positionMm + m.width), 0);
      const m = defaultModule(kind, segmentId, usedSpan);
      const maxStart = Math.max(0, seg.realLengthMm - m.width);
      m.positionMm = Math.min(m.positionMm, maxStart);
      set({ modules: [...get().modules, m], selectedModuleId: m.id });
    },

    updateModule: (id, patch) =>
      set({
        modules: get().modules.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }),

    removeModule: (id) =>
      set({
        modules: get().modules.filter((m) => m.id !== id),
        selectedModuleId: null,
      }),
  };
});

export function autoPanelsForSegment(
  segment: Segment,
  modulesOnSegment: FenceModule[]
): FenceModule[] {
  const sorted = [...modulesOnSegment].sort((a, b) => a.positionMm - b.positionMm);
  const panels: FenceModule[] = [];
  let cursor = 0;
  let panelIdx = 0;

  const fillGap = (start: number, end: number) => {
    const gap = end - start;
    if (gap <= 200) return;
    const count = Math.ceil(gap / MAX_PANEL_WIDTH_MM);
    const panelWidth = Math.floor(gap / count);
    for (let i = 0; i < count; i++) {
      panels.push({
        id: `auto_${segment.id}_${panelIdx++}`,
        segmentId: segment.id,
        kind: "panel",
        positionMm: start + i * panelWidth,
        width: panelWidth,
        height: 1800,
        colorId: "ral7016",
        infill: "slatted",
        slatWidth: 100,
        gap: 20,
        orientation: "horizontal",
      });
    }
  };

  for (const m of sorted) {
    if (m.positionMm > cursor) fillGap(cursor, m.positionMm);
    cursor = Math.max(cursor, m.positionMm + m.width);
  }
  if (cursor < segment.realLengthMm) fillGap(cursor, segment.realLengthMm);

  return panels;
}

export function expandedModules(state: {
  segments: Segment[];
  modules: FenceModule[];
}): FenceModule[] {
  const out: FenceModule[] = [...state.modules];
  for (const seg of state.segments) {
    const mods = state.modules.filter((m) => m.segmentId === seg.id);
    out.push(...autoPanelsForSegment(seg, mods));
  }
  return out;
}
