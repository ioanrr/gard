import type { CuttingPlan, FenceModule, ModuleCalculation, Quote, QuoteLine } from "./types";
import { PROFILES, STOCK_LENGTH_MM } from "../data/profiles";
import { ACCESSORIES, SERVICES } from "../data/accessories";
import { colorById } from "../data/colors";

const VAT_RATE = 0.19;

export function buildQuote(
  modules: FenceModule[],
  calcs: ModuleCalculation[],
  plan: CuttingPlan
): Quote {
  const lines: QuoteLine[] = [];

  const profileBuckets = new Map<string, { qty: number; profileId: string; colorId: string }>();
  for (const bar of plan.bars) {
    const key = `${bar.profileId}__${bar.colorId}`;
    const cur = profileBuckets.get(key) ?? { qty: 0, profileId: bar.profileId, colorId: bar.colorId };
    cur.qty += 1;
    profileBuckets.set(key, cur);
  }

  for (const { qty, profileId, colorId } of profileBuckets.values()) {
    const profile = PROFILES[profileId as keyof typeof PROFILES];
    const color = colorById(colorId);
    const pricePerMeter = profile.basePricePerMeter + color.surcharge;
    const unitPrice = pricePerMeter * (STOCK_LENGTH_MM / 1000);
    lines.push({
      itemId: `${profileId}_${colorId}`,
      name: `${profile.name} (${color.name})`,
      qty,
      unit: "buc 6m",
      unitPrice: round2(unitPrice),
      total: round2(unitPrice * qty),
    });
  }

  const accBuckets = new Map<string, number>();
  for (const c of calcs) {
    for (const a of c.accessories) {
      accBuckets.set(a.id, (accBuckets.get(a.id) ?? 0) + a.qty);
    }
  }
  for (const [id, qty] of accBuckets) {
    const a = ACCESSORIES[id];
    if (!a) continue;
    lines.push({
      itemId: id,
      name: a.name,
      qty,
      unit: a.unit,
      unitPrice: a.unitPrice,
      total: round2(a.unitPrice * qty),
    });
  }

  const panelCount = modules.filter((m) => m.kind === "panel").length;
  const smallGateCount = modules.filter((m) => m.kind === "small_gate").length;
  const gateCount = modules.filter((m) =>
    ["swing_gate", "sliding_gate", "cantilever_gate"].includes(m.kind)
  ).length;

  if (panelCount > 0) lines.push(svc(SERVICES.install_panel, panelCount));
  if (smallGateCount > 0) lines.push(svc(SERVICES.install_small, smallGateCount));
  if (gateCount > 0) lines.push(svc(SERVICES.install_gate, gateCount));

  const totalCuts = plan.bars.reduce((s, b) => s + b.cuts.length, 0);
  if (totalCuts > 0) lines.push(svc(SERVICES.cutting_service, totalCuts));

  const subtotal = round2(lines.reduce((s, l) => s + l.total, 0));
  const vat = round2(subtotal * VAT_RATE);
  const grandTotal = round2(subtotal + vat);

  return { lines, subtotal, vat, grandTotal };
}

function svc(s: { id: string; name: string; unit: string; unitPrice: number }, qty: number): QuoteLine {
  return {
    itemId: s.id,
    name: s.name,
    qty,
    unit: s.unit,
    unitPrice: s.unitPrice,
    total: round2(s.unitPrice * qty),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
