export interface Accessory {
  id: string;
  name: string;
  unit: "buc" | "set" | "ml";
  unitPrice: number;
}

export const ACCESSORIES: Record<string, Accessory> = {
  screw_infill:    { id: "screw_infill",    name: "Șurub fixare șipcă",   unit: "buc", unitPrice: 0.4 },
  screw_mount:     { id: "screw_mount",     name: "Șurub montaj",         unit: "buc", unitPrice: 0.6 },
  end_cap_l:       { id: "end_cap_l",       name: "Capac profil L",       unit: "buc", unitPrice: 4.5 },
  end_cap_p:       { id: "end_cap_p",       name: "Capac profil P",       unit: "buc", unitPrice: 4.5 },
  crimp_corner:    { id: "crimp_corner",    name: "Colț de îmbinare",     unit: "buc", unitPrice: 7 },
  hinge_set:       { id: "hinge_set",       name: "Set balamale poartă",  unit: "set", unitPrice: 95 },
  lock_set:        { id: "lock_set",        name: "Set broască + mâner",  unit: "set", unitPrice: 180 },
  rubber_trim:     { id: "rubber_trim",     name: "Garnitură cauciuc",    unit: "ml",  unitPrice: 9 },
  post_alu:        { id: "post_alu",        name: "Stâlp aluminiu",       unit: "buc", unitPrice: 220 },
  post_cap:        { id: "post_cap",        name: "Capac stâlp",          unit: "buc", unitPrice: 12 },
  rail_system:     { id: "rail_system",     name: "Sistem șină glisare",  unit: "set", unitPrice: 1450 },
  cantilever_kit:  { id: "cantilever_kit",  name: "Kit poartă autoportantă", unit: "set", unitPrice: 2300 },
  reinforcement:   { id: "reinforcement",   name: "Întăritură panou >3m", unit: "buc", unitPrice: 85 },
};

export const SERVICES = {
  install_panel:    { id: "install_panel",    name: "Montaj panou",         unit: "buc", unitPrice: 120 },
  install_gate:     { id: "install_gate",     name: "Montaj poartă",        unit: "buc", unitPrice: 350 },
  install_small:    { id: "install_small",    name: "Montaj portiță",       unit: "buc", unitPrice: 180 },
  cutting_service:  { id: "cutting_service",  name: "Serviciu tăiere",      unit: "buc", unitPrice: 5 },
};
