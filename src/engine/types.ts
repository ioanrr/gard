import type { ProfileId } from "../data/profiles";

export type ModuleKind =
  | "panel"
  | "small_gate"
  | "swing_gate"
  | "sliding_gate"
  | "cantilever_gate";

export type InfillType = "solid" | "slatted" | "slatted_secondary";
export type Orientation = "horizontal" | "vertical";

export interface FenceModule {
  id: string;
  kind: ModuleKind;
  segmentId: string;
  position: number;
  width: number;
  height: number;
  colorId: string;
  secondaryColorId?: string;
  infill: InfillType;
  slatWidth: number;
  secondarySlatWidth?: number;
  gap: number;
  orientation: Orientation;
}

export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  id: string;
  start: Point;
  end: Point;
  realLengthMm: number;
}

export interface SketchProject {
  segments: Segment[];
  modules: FenceModule[];
  pxPerMm: number;
}

export interface CutPiece {
  profileId: ProfileId;
  colorId: string;
  lengthMm: number;
  source: { moduleId: string; role: string };
}

export interface ModuleCalculation {
  moduleId: string;
  kind: ModuleKind;
  pieces: CutPiece[];
  accessories: { id: string; qty: number }[];
  slatCount: number;
  effectiveGap: number;
  notes: string[];
}

export interface BarLayout {
  profileId: ProfileId;
  colorId: string;
  cuts: { lengthMm: number; source: CutPiece["source"] }[];
  wasteMm: number;
}

export interface CuttingPlan {
  bars: BarLayout[];
  totalBars: number;
  totalWasteMm: number;
  wasteRatio: number;
}

export interface QuoteLine {
  itemId: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotal: number;
  vat: number;
  grandTotal: number;
}
