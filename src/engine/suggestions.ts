import type { FenceModule, Segment } from "./types";
import { calculateModule } from "./calculations";
import { packCuts } from "./cutting";
import { buildQuote } from "./pricing";
import { autoPanelsForSegment, isOverlap } from "../store/projectStore";

export interface SuggestionMove {
  moduleId: string;
  kind: FenceModule["kind"];
  segmentId: string;
  fromMm: number;
  toMm: number;
}

export interface SingleSuggestion {
  type: "single";
  move: SuggestionMove;
  baseCost: number;
  newCost: number;
  savings: number;
}

export interface PackageSuggestion {
  type: "package";
  moves: SuggestionMove[];
  baseCost: number;
  newCost: number;
  savings: number;
}

export type Suggestion = SingleSuggestion | PackageSuggestion;

interface State {
  segments: Segment[];
  modules: FenceModule[];
}

export interface SuggestionOptions {
  /** Max fraction of segment length each module is allowed to move from
   *  its current position. Set to a large value (or omit) for no limit. */
  toleranceFraction?: number;
}

const STEP_MM = 100;
const MIN_SAVINGS_RON = 20;
const MAX_PACKAGE_ITERATIONS = 6;

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

function userModules(state: State): FenceModule[] {
  return state.modules.filter((m) => !m.id.startsWith("auto_"));
}

function bestPositionFor(
  m: FenceModule,
  workingModules: FenceModule[],
  state: State,
  origPosMm: number,
  options: SuggestionOptions
): { pos: number; cost: number } {
  const segment = state.segments.find((s) => s.id === m.segmentId);
  if (!segment) return { pos: m.positionMm, cost: Infinity };

  const others = workingModules.filter(
    (x) =>
      x.segmentId === m.segmentId &&
      !x.id.startsWith("auto_") &&
      x.id !== m.id
  );
  const maxStart = Math.max(0, segment.realLengthMm - m.width);

  const tolMm =
    options.toleranceFraction != null && options.toleranceFraction < 1
      ? options.toleranceFraction * segment.realLengthMm
      : Infinity;
  const minP = Math.max(0, origPosMm - tolMm);
  const maxP = Math.min(maxStart, origPosMm + tolMm);

  let bestPos = m.positionMm;
  let bestCost = computeSubtotal({ ...state, modules: workingModules });

  const startStep = Math.ceil(minP / STEP_MM) * STEP_MM;
  for (let p = startStep; p <= maxP; p += STEP_MM) {
    if (p === m.positionMm) continue;
    if (isOverlap(p, m.width, others)) continue;
    const trial = workingModules.map((x) =>
      x.id === m.id ? { ...x, positionMm: p } : x
    );
    const cost = computeSubtotal({ ...state, modules: trial });
    if (cost < bestCost - 1) {
      bestCost = cost;
      bestPos = p;
    }
  }
  return { pos: bestPos, cost: bestCost };
}

export function generateSuggestions(
  state: State,
  options: SuggestionOptions = {}
): Suggestion[] {
  const baseCost = computeSubtotal(state);
  if (baseCost === 0) return [];

  const us = userModules(state);
  if (us.length === 0) return [];

  if (us.length === 1) {
    const m = us[0];
    const result = bestPositionFor(m, state.modules, state, m.positionMm, options);
    if (result.pos !== m.positionMm && baseCost - result.cost >= MIN_SAVINGS_RON) {
      return [
        {
          type: "single",
          move: {
            moduleId: m.id,
            kind: m.kind,
            segmentId: m.segmentId,
            fromMm: m.positionMm,
            toMm: result.pos,
          },
          baseCost,
          newCost: result.cost,
          savings: baseCost - result.cost,
        },
      ];
    }
    return [];
  }

  const origPos = new Map(us.map((m) => [m.id, m.positionMm]));
  let workingModules = state.modules.map((m) => ({ ...m }));
  let workingCost = baseCost;
  let improved = true;
  let iter = 0;
  while (improved && iter < MAX_PACKAGE_ITERATIONS) {
    improved = false;
    iter++;
    for (const m of workingModules.filter((x) => !x.id.startsWith("auto_"))) {
      const orig = origPos.get(m.id) ?? m.positionMm;
      const result = bestPositionFor(m, workingModules, state, orig, options);
      if (result.pos !== m.positionMm && result.cost < workingCost - 1) {
        workingModules = workingModules.map((x) =>
          x.id === m.id ? { ...x, positionMm: result.pos } : x
        );
        workingCost = result.cost;
        improved = true;
      }
    }
  }

  if (workingCost >= baseCost - MIN_SAVINGS_RON) return [];

  const moves: SuggestionMove[] = [];
  for (const orig of us) {
    const cur = workingModules.find((x) => x.id === orig.id);
    if (cur && cur.positionMm !== orig.positionMm) {
      moves.push({
        moduleId: orig.id,
        kind: orig.kind,
        segmentId: orig.segmentId,
        fromMm: orig.positionMm,
        toMm: cur.positionMm,
      });
    }
  }
  if (moves.length === 0) return [];

  return [
    {
      type: "package",
      moves,
      baseCost,
      newCost: workingCost,
      savings: baseCost - workingCost,
    },
  ];
}
