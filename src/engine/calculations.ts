import type {
  CutPiece,
  FenceModule,
  ModuleCalculation,
  ModuleKind,
} from "./types";
import { slatProfileFor } from "../data/profiles";

const PIECE = (
  profileId: CutPiece["profileId"],
  lengthMm: number,
  colorId: string,
  moduleId: string,
  role: string
): CutPiece => ({ profileId, lengthMm: Math.max(0, Math.round(lengthMm)), colorId, source: { moduleId, role } });

interface SlatLayout {
  count: number;
  effectiveGap: number;
  slatLengthMm: number;
}

function planSlats(
  spanForSlatsMm: number,
  slatWidth: number,
  desiredGap: number,
  infill: FenceModule["infill"]
): SlatLayout {
  if (spanForSlatsMm <= 0 || slatWidth <= 0) {
    return { count: 0, effectiveGap: 0, slatLengthMm: 0 };
  }
  if (infill === "solid") {
    const count = Math.max(1, Math.floor(spanForSlatsMm / slatWidth));
    return { count, effectiveGap: 0, slatLengthMm: 0 };
  }
  const gap = Math.max(1, desiredGap);
  const denom = slatWidth + gap;
  let count = Math.max(1, Math.round((spanForSlatsMm + gap) / denom));
  while (count > 1 && count * slatWidth + (count + 1) * 1 > spanForSlatsMm) count--;
  const totalSlatHeight = count * slatWidth;
  const remaining = Math.max(0, spanForSlatsMm - totalSlatHeight);
  const effectiveGap = remaining / (count + 1);
  return { count, effectiveGap, slatLengthMm: 0 };
}

export function calcPanel(m: FenceModule): ModuleCalculation {
  const pieces: CutPiece[] = [];
  const notes: string[] = [];
  const accessories: { id: string; qty: number }[] = [];

  const horizontal = m.orientation === "horizontal";
  const slatLengthMm = horizontal ? m.width - 25 : m.height - 25;
  const spanForSlatsMm = horizontal ? m.height : m.width;

  const layout = planSlats(spanForSlatsMm, m.slatWidth, m.gap, m.infill);
  const profileId = slatProfileFor(m.slatWidth);

  for (let i = 0; i < layout.count; i++) {
    let colorId = m.colorId;
    if (
      m.secondaryColorId &&
      horizontal &&
      m.infill !== "solid" &&
      (i === 1 || i === 2)
    ) {
      colorId = m.secondaryColorId;
    }
    pieces.push(PIECE(profileId, slatLengthMm, colorId, m.id, `slat_${i + 1}`));
  }

  pieces.push(PIECE("l_channel", m.height, m.colorId, m.id, "l_channel_left"));
  pieces.push(PIECE("l_channel", m.height, m.colorId, m.id, "l_channel_right"));
  pieces.push(PIECE("trim", m.width, m.colorId, m.id, "trim_top"));
  pieces.push(PIECE("trim", m.width, m.colorId, m.id, "trim_bottom"));

  accessories.push({ id: "screw_infill", qty: layout.count * 4 });
  accessories.push({ id: "screw_mount", qty: 8 });
  accessories.push({ id: "post_alu", qty: 2 });
  accessories.push({ id: "post_cap", qty: 2 });

  if (m.width > 3000) {
    accessories.push({ id: "reinforcement", qty: 1 });
    notes.push("Panou > 3000 mm: întăritură adăugată");
  }

  if (layout.effectiveGap > 0) {
    notes.push(`Spațiere efectivă: ${layout.effectiveGap.toFixed(1)} mm`);
  }
  notes.push(`${layout.count} șipci de ${slatLengthMm} mm`);

  return {
    moduleId: m.id,
    kind: "panel",
    pieces,
    accessories,
    slatCount: layout.count,
    effectiveGap: layout.effectiveGap,
    notes,
  };
}

export function calcSmallGate(m: FenceModule): ModuleCalculation {
  const pieces: CutPiece[] = [];
  const notes: string[] = [];
  const accessories: { id: string; qty: number }[] = [];

  const frameWidth = m.width - 100;
  const frameHeight = m.height - 60;
  const horizontalFrameLen = frameWidth;
  const verticalFrameLen = frameHeight - 120;

  pieces.push(PIECE("frame_60x40", horizontalFrameLen, m.colorId, m.id, "frame_top"));
  pieces.push(PIECE("frame_60x40", horizontalFrameLen, m.colorId, m.id, "frame_bottom"));
  pieces.push(PIECE("frame_60x40", verticalFrameLen, m.colorId, m.id, "frame_left"));
  pieces.push(PIECE("frame_60x40", verticalFrameLen, m.colorId, m.id, "frame_right"));

  pieces.push(PIECE("p_profile_40x40", m.height - 60, m.colorId, m.id, "p_profile_left"));
  pieces.push(PIECE("p_profile_40x40", m.height - 60, m.colorId, m.id, "p_profile_right"));

  const channelingLen = m.height - 60 - 120 - 2;
  const trimLen = m.height - 60 - 120 - 1;
  pieces.push(PIECE("l_channel", channelingLen, m.colorId, m.id, "channel_left"));
  pieces.push(PIECE("l_channel", channelingLen, m.colorId, m.id, "channel_right"));
  pieces.push(PIECE("trim", trimLen, m.colorId, m.id, "trim_left"));
  pieces.push(PIECE("trim", trimLen, m.colorId, m.id, "trim_right"));

  const horizontal = m.orientation === "horizontal";
  const slatLengthMm = horizontal
    ? m.width - 100 - 120 - 25
    : m.height - 60 - 120 - 25;
  const spanForSlatsMm = horizontal
    ? m.height - 60 - 120
    : m.width - 100 - 120;

  const layout = planSlats(spanForSlatsMm, m.slatWidth, m.gap, m.infill);
  const slatProfile = slatProfileFor(m.slatWidth);
  for (let i = 0; i < layout.count; i++) {
    pieces.push(PIECE(slatProfile, slatLengthMm, m.colorId, m.id, `slat_${i + 1}`));
  }

  accessories.push({ id: "screw_infill", qty: layout.count * 4 });
  accessories.push({ id: "screw_mount", qty: 18 });
  accessories.push({ id: "end_cap_l", qty: 2 });
  accessories.push({ id: "end_cap_p", qty: 2 });
  accessories.push({ id: "crimp_corner", qty: 4 });
  accessories.push({ id: "hinge_set", qty: 1 });
  accessories.push({ id: "lock_set", qty: 1 });
  accessories.push({ id: "rubber_trim", qty: Math.ceil((m.height + m.width) / 1000) });

  notes.push(`Cadru ${frameWidth}×${frameHeight} mm`);
  notes.push(`${layout.count} șipci de ${slatLengthMm} mm`);
  if (layout.effectiveGap > 0) {
    notes.push(`Spațiere efectivă: ${layout.effectiveGap.toFixed(1)} mm`);
  }

  return {
    moduleId: m.id,
    kind: "small_gate",
    pieces,
    accessories,
    slatCount: layout.count,
    effectiveGap: layout.effectiveGap,
    notes,
  };
}

function calcLargeGate(m: FenceModule, kind: ModuleKind): ModuleCalculation {
  const pieces: CutPiece[] = [];
  const notes: string[] = [];
  const accessories: { id: string; qty: number }[] = [];

  const isSwing = kind === "swing_gate";
  const leafCount = isSwing ? 2 : 1;
  const leafWidth = isSwing ? (m.width - 110) / 2 : m.width - 110;
  const leafHeight = m.height - 60;

  for (let leaf = 0; leaf < leafCount; leaf++) {
    pieces.push(PIECE("frame_60x40", leafWidth, m.colorId, m.id, `frame_top_${leaf + 1}`));
    pieces.push(PIECE("frame_60x40", leafWidth, m.colorId, m.id, `frame_bottom_${leaf + 1}`));
    pieces.push(PIECE("frame_60x40", leafHeight - 120, m.colorId, m.id, `frame_left_${leaf + 1}`));
    pieces.push(PIECE("frame_60x40", leafHeight - 120, m.colorId, m.id, `frame_right_${leaf + 1}`));
    pieces.push(PIECE("frame_60x40", leafWidth - 120, m.colorId, m.id, `reinforcement_${leaf + 1}`));

    pieces.push(PIECE("p_profile_40x40", m.height - 60, m.colorId, m.id, `p_profile_${leaf + 1}`));

    const channelingLen = leafHeight - 120 - 2;
    const trimLen = leafHeight - 120 - 1;
    pieces.push(PIECE("l_channel", channelingLen, m.colorId, m.id, `channel_left_${leaf + 1}`));
    pieces.push(PIECE("l_channel", channelingLen, m.colorId, m.id, `channel_right_${leaf + 1}`));
    pieces.push(PIECE("trim", trimLen, m.colorId, m.id, `trim_left_${leaf + 1}`));
    pieces.push(PIECE("trim", trimLen, m.colorId, m.id, `trim_right_${leaf + 1}`));
  }

  const horizontal = m.orientation === "horizontal";
  const slatLengthMm = horizontal ? leafWidth - 120 - 25 : leafHeight - 120 - 25;
  const spanForSlatsMm = horizontal ? leafHeight - 120 : leafWidth - 120;

  const layout = planSlats(spanForSlatsMm, m.slatWidth, m.gap, m.infill);
  const slatProfile = slatProfileFor(m.slatWidth);
  let totalSlats = 0;
  for (let leaf = 0; leaf < leafCount; leaf++) {
    for (let i = 0; i < layout.count; i++) {
      pieces.push(PIECE(slatProfile, slatLengthMm, m.colorId, m.id, `slat_${leaf + 1}_${i + 1}`));
      totalSlats++;
    }
  }

  accessories.push({ id: "screw_infill", qty: totalSlats * 4 });
  accessories.push({ id: "screw_mount", qty: 18 * leafCount });
  accessories.push({ id: "end_cap_l", qty: 2 * leafCount });
  accessories.push({ id: "end_cap_p", qty: 2 * leafCount });
  accessories.push({ id: "crimp_corner", qty: 4 * leafCount });
  accessories.push({ id: "rubber_trim", qty: Math.ceil((m.height + m.width) / 1000) });

  if (kind === "swing_gate") {
    accessories.push({ id: "hinge_set", qty: 2 });
    accessories.push({ id: "lock_set", qty: 1 });
  } else if (kind === "sliding_gate") {
    accessories.push({ id: "rail_system", qty: 1 });
    accessories.push({ id: "lock_set", qty: 1 });
  } else if (kind === "cantilever_gate") {
    accessories.push({ id: "cantilever_kit", qty: 1 });
    accessories.push({ id: "lock_set", qty: 1 });
  }

  notes.push(`${leafCount} cana(le), fiecare ${Math.round(leafWidth)}×${Math.round(leafHeight)} mm`);
  notes.push(`${totalSlats} șipci totale de ${slatLengthMm} mm`);
  if (layout.effectiveGap > 0) {
    notes.push(`Spațiere efectivă: ${layout.effectiveGap.toFixed(1)} mm`);
  }

  return {
    moduleId: m.id,
    kind,
    pieces,
    accessories,
    slatCount: totalSlats,
    effectiveGap: layout.effectiveGap,
    notes,
  };
}

export function calculateModule(m: FenceModule): ModuleCalculation {
  switch (m.kind) {
    case "panel":
      return calcPanel(m);
    case "small_gate":
      return calcSmallGate(m);
    case "swing_gate":
    case "sliding_gate":
    case "cantilever_gate":
      return calcLargeGate(m, m.kind);
  }
}

export function defaultModule(
  kind: ModuleKind,
  segmentId: string,
  position: number
): FenceModule {
  const base = {
    id: `m_${Math.random().toString(36).slice(2, 9)}`,
    segmentId,
    position,
    height: 1800,
    colorId: "ral7016",
    infill: "slatted" as const,
    slatWidth: 100,
    gap: 20,
    orientation: "horizontal" as const,
  };
  switch (kind) {
    case "panel":
      return { ...base, kind, width: 2000 };
    case "small_gate":
      return { ...base, kind, width: 1000 };
    case "swing_gate":
      return { ...base, kind, width: 3500 };
    case "sliding_gate":
      return { ...base, kind, width: 4000 };
    case "cantilever_gate":
      return { ...base, kind, width: 4500 };
  }
}
