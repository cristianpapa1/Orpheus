import type { School } from "@atelier/core/design/schools";

/** Bauhaus tokens — same contract as the web app's globals.css. */
export interface Palette {
  ink: string;
  paper: string;
  red: string;
  blue: string;
  yellow: string;
}

export const BAUHAUS: Palette = {
  ink: "#121210",
  paper: "#f5f3ec",
  red: "#e1251b",
  blue: "#2145c9",
  yellow: "#f2b705",
};

export const SCHOOL_PALETTES: Record<School, Palette> = {
  bauhaus: BAUHAUS,
  "de-stijl": { ink: "#111111", paper: "#ffffff", red: "#dd0100", blue: "#225095", yellow: "#fac901" },
  constructivism: { ink: "#1a1614", paper: "#e8e0d5", red: "#c8102e", blue: "#3d3a38", yellow: "#d9a404" },
  swiss: { ink: "#000000", paper: "#ffffff", red: "#e30613", blue: "#0057a8", yellow: "#e3b505" },
  memphis: { ink: "#22203a", paper: "#fff8e7", red: "#f45b69", blue: "#2ec4b6", yellow: "#ffd23f" },
};

export const FONT = "SpaceGrotesk_700Bold";
export const FONT_BODY = "SpaceGrotesk_400Regular";
