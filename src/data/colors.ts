export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  surcharge: number;
  kind: "ral" | "wood";
}

export const COLORS: ColorOption[] = [
  { id: "ral7016", name: "RAL 7016 Antracit", hex: "#383E42", surcharge: 0, kind: "ral" },
  { id: "ral8017", name: "RAL 8017 Maro", hex: "#45322E", surcharge: 0, kind: "ral" },
  { id: "ral9010", name: "RAL 9010 Alb", hex: "#F1ECE0", surcharge: 0, kind: "ral" },
  { id: "ral9005", name: "RAL 9005 Negru", hex: "#0A0A0A", surcharge: 0, kind: "ral" },
  { id: "ral6011", name: "RAL 6011 Verde", hex: "#587246", surcharge: 0, kind: "ral" },
  { id: "ral1019", name: "RAL 1019 Bej", hex: "#9E8B6F", surcharge: 0, kind: "ral" },
  { id: "oak", name: "Stejar (Oak)", hex: "#C28E4C", surcharge: 18, kind: "wood" },
  { id: "golden_oak", name: "Stejar auriu (Golden Oak)", hex: "#D89A4A", surcharge: 18, kind: "wood" },
  { id: "walnut", name: "Nuc (Walnut)", hex: "#5B3320", surcharge: 18, kind: "wood" },
];

export const colorById = (id: string) =>
  COLORS.find((c) => c.id === id) ?? COLORS[0];
