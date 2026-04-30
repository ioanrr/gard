export const STOCK_LENGTH_MM = 6000;

export type ProfileId =
  | "slat_40"
  | "slat_60"
  | "slat_100"
  | "slat_160"
  | "slat_120z"
  | "frame_60x40"
  | "p_profile_40x40"
  | "l_channel"
  | "trim";

export interface Profile {
  id: ProfileId;
  name: string;
  description: string;
  basePricePerMeter: number;
  isSlat: boolean;
}

export const PROFILES: Record<ProfileId, Profile> = {
  slat_40:       { id: "slat_40",       name: "Șipcă 40x25",        description: "Profil umplere 40x25 mm",          basePricePerMeter: 18, isSlat: true },
  slat_60:       { id: "slat_60",       name: "Șipcă 60x25",        description: "Profil umplere 60x25 mm",          basePricePerMeter: 22, isSlat: true },
  slat_100:      { id: "slat_100",      name: "Șipcă 100x25",       description: "Profil umplere 100x25 mm (standard)", basePricePerMeter: 28, isSlat: true },
  slat_160:      { id: "slat_160",      name: "Șipcă 160x25",       description: "Profil umplere 160x25 mm",         basePricePerMeter: 38, isSlat: true },
  slat_120z:     { id: "slat_120z",     name: "Șipcă 120x25 Z",     description: "Profil Z 120x25 mm",                basePricePerMeter: 34, isSlat: true },
  frame_60x40:   { id: "frame_60x40",   name: "Cadru 60x40",        description: "Profil cadru poartă 60x40 mm",     basePricePerMeter: 42, isSlat: false },
  p_profile_40x40: { id: "p_profile_40x40", name: "Profil P 40x40", description: "Profil P 40x40 montaj poartă",     basePricePerMeter: 35, isSlat: false },
  l_channel:     { id: "l_channel",     name: "Profil L canal",     description: "Profil L pentru fixare șipci",      basePricePerMeter: 24, isSlat: false },
  trim:          { id: "trim",          name: "Profil trim",        description: "Profil ornament/acoperire",         basePricePerMeter: 16, isSlat: false },
};

export const SLAT_WIDTHS = [40, 60, 100, 160] as const;
export type SlatWidth = (typeof SLAT_WIDTHS)[number];

export const slatProfileFor = (width: number): ProfileId => {
  if (width <= 40) return "slat_40";
  if (width <= 60) return "slat_60";
  if (width <= 100) return "slat_100";
  return "slat_160";
};
