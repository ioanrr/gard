import type { BarLayout, CutPiece, CuttingPlan } from "./types";
import { STOCK_LENGTH_MM } from "../data/profiles";

const KERF_MM = 3;

export function packCuts(pieces: CutPiece[]): CuttingPlan {
  const groups = new Map<string, CutPiece[]>();
  for (const p of pieces) {
    if (p.lengthMm <= 0) continue;
    const key = `${p.profileId}__${p.colorId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const bars: BarLayout[] = [];

  for (const [key, list] of groups) {
    const [profileId, colorId] = key.split("__") as [BarLayout["profileId"], string];
    const sorted = [...list].sort((a, b) => b.lengthMm - a.lengthMm);
    const localBars: BarLayout[] = [];

    for (const piece of sorted) {
      const need = piece.lengthMm + KERF_MM;
      let placed = false;
      for (const bar of localBars) {
        const used = bar.cuts.reduce((s, c) => s + c.lengthMm + KERF_MM, 0);
        if (STOCK_LENGTH_MM - used >= need) {
          bar.cuts.push({ lengthMm: piece.lengthMm, source: piece.source });
          placed = true;
          break;
        }
      }
      if (!placed) {
        localBars.push({
          profileId,
          colorId,
          cuts: [{ lengthMm: piece.lengthMm, source: piece.source }],
          wasteMm: 0,
        });
      }
    }

    for (const bar of localBars) {
      const used = bar.cuts.reduce((s, c) => s + c.lengthMm + KERF_MM, 0);
      bar.wasteMm = Math.max(0, STOCK_LENGTH_MM - used + KERF_MM);
    }
    bars.push(...localBars);
  }

  bars.sort((a, b) =>
    a.profileId === b.profileId ? a.colorId.localeCompare(b.colorId) : a.profileId.localeCompare(b.profileId)
  );

  const totalBars = bars.length;
  const totalWasteMm = bars.reduce((s, b) => s + b.wasteMm, 0);
  const totalStock = totalBars * STOCK_LENGTH_MM;
  const wasteRatio = totalStock > 0 ? totalWasteMm / totalStock : 0;

  return { bars, totalBars, totalWasteMm, wasteRatio };
}
