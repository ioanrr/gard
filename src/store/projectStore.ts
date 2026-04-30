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
  drawMode: "draw" | "select";
  selectedSegmentId: string | null;
  selectedModuleId: string | null;
  pendingPoint: Point | null;
  cursor: Point | null;

  setDrawMode: (m: "draw" | "select") => void;
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

const SEG_DEFAULT_LENGTH = 5000;

export const useProject = create<ProjectState>((set, get) => {
  return {
    segments: [],
    modules: [],
    pxPerMm: 0.05,
    closed: false,
    drawMode: "draw",
    selectedSegmentId: null,
    selectedModuleId: null,
    pendingPoint: null,
    cursor: null,

    setDrawMode: (m) => set({ drawMode: m }),

    setCursor: (p) => set({ cursor: p }),

    addPoint: (p) => {
      const { segments, closed, pendingPoint } = get();
      if (closed) return;

      if (!pendingPoint && segments.length === 0) {
        set({ pendingPoint: p });
        return;
      }
      const start = pendingPoint ?? segments[segments.length - 1].end;
      const seg: Segment = {
        id: `s_${Math.random().toString(36).slice(2, 9)}`,
        start,
        end: p,
        realLengthMm: SEG_DEFAULT_LENGTH,
      };
      set({
        segments: [...segments, seg],
        selectedSegmentId: seg.id,
        pendingPoint: null,
      });
    },

    closePerimeter: () => {
      const { segments } = get();
      if (segments.length < 2) return;
      const first = segments[0].start;
      const last = segments[segments.length - 1].end;
      if (distance(first, last) < 5) {
        set({ closed: true, pendingPoint: null });
        return;
      }
      const seg: Segment = {
        id: `s_${Math.random().toString(36).slice(2, 9)}`,
        start: last,
        end: first,
        realLengthMm: SEG_DEFAULT_LENGTH,
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
      const m = defaultModule(kind, segmentId, get().modules.filter((x) => x.segmentId === segmentId).length);
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
  const used = modulesOnSegment.reduce((s, m) => s + m.width, 0);
  const remaining = segment.realLengthMm - used;
  if (remaining <= 200) return [];
  const count = Math.ceil(remaining / MAX_PANEL_WIDTH_MM);
  const panelWidth = Math.floor(remaining / count);
  const panels: FenceModule[] = [];
  for (let i = 0; i < count; i++) {
    panels.push({
      id: `auto_${segment.id}_${i}`,
      segmentId: segment.id,
      kind: "panel",
      position: 1000 + i,
      width: panelWidth,
      height: 1800,
      colorId: "ral7016",
      infill: "slatted",
      slatWidth: 100,
      gap: 20,
      orientation: "horizontal",
    });
  }
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
