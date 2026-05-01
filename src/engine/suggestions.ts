import type { FenceModule, Segment } from "./types";
import { calculateModule } from "./calculations";
import { packCuts } from "./cutting";
import { buildQuote } from "./pricing";
import { autoPanelsForSegment } from "../store/projectStore";

export interface Suggestion {
  moduleId: string;
  segmentId: string;
  kind: FenceModule["kind"];
  fromMm: number;
  toMm: number;
  baseCost: number;
  newCost: number;
  savings: number;
}

interface State {
  segments: Segment[];
  modules: FenceModule[];
}

const STEP_MM = 100;
const MIN_SAVINGS_RON = 20;

function expand(state: State): FenceModule[] {
  const out: FenceModule[] = [...state.modules];
  for (const seg of state.segments) {
    const mods = state.modules.filter((m) => m.segmentId === seg.id);
    out.push(...autoPanelsForSegment(seg, mods));
  }
  return out;
}

export function computeSubtotal(state: State): number {
  const all = expand(state);
  if (all.length === 0) return 0;
  const calcs = all.map(calculateModule);
  const pieces = calcs.flatMap((c) => c.pieces);
  const plan = packCuts(pieces);
  const quote = buildQuote(all, calcs, plan);
  return quote.subtotal;
}

export function computeWasteRatio(state: State): number {
  const all = expand(state);
  if (all.length === 0) return 0;
  const calcs = all.map(calculateModule);
  const pieces = calcs.flatMap((c) => c.pieces);
  const plan = packCuts(pieces);
  return plan.wasteRatio;
}

export function generateSuggestions(state: State): Suggestion[] {
  const baseCost = computeSubtotal(state);
  if (baseCost === 0) return [];

  const userModules = state.modules.filter((m) => !m.id.startsWith("auto_"));
  const out: Suggestion[] = [];

  for (const m of userModules) {
    const segment = state.segments.find((s) => s.id === m.segmentId);
    if (!segment) continue;
    const maxStart = Math.max(0, segment.realLengthMm - m.width);

    let bestPos = m.positionMm;
    let bestCost = baseCost;

    for (let p = 0; p <= maxStart; p += STEP_MM) {
      if (p === m.positionMm) continue;
      const trial = state.modules.map((x) =>
        x.id === m.id ? { ...x, positionMm: p } : x
      );
      const cost = computeSubtotal({ ...state, modules: trial });
      if (cost < bestCost - 1) {
        bestCost = cost;
        bestPos = p;
      }
    }

    if (bestPos !== m.positionMm && baseCost - bestCost >= MIN_SAVINGS_RON) {
      out.push({
        moduleId: m.id,
        segmentId: m.segmentId,
        kind: m.kind,
        fromMm: m.positionMm,
        toMm: bestPos,
        baseCost,
        newCost: bestCost,
        savings: baseCost - bestCost,
      });
    }
  }

  return out.sort((a, b) => b.savings - a.savings).slice(0, 5);
}
