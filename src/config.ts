import { NyanModeOptions } from "./types";

export const defConf: NyanModeOptions = {
  nyanDisable: false,
  nyanAlign: "left",
  nyanPriority: 0,
  nyanColor: "#fff",
  nyanLength: 20,
  nyanDisplayPercent: false,
  nyanHeader: "$(nyan-space)",
  nyanFooter: "$(nyan-rainbow)",
  nyanAction: "line",
  nyanFaceCurve: [["$(nyan-cat)", 1]],
};

export const confPrefix = "nyanMode";
