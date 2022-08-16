import { NyanModeOptions } from "./types";

export const defConf: NyanModeOptions = {
  nyanDisable: false,
  nyanAlign: "left",
  nyanPriority: 0,
  nyanColor: "#fff",
  nyanLength: 20,
  nyanDisplayPercent: false,
  nyanDisplayBorder: false,
  nyanAction: "line",
  nyanAnimation: "moving",
};

export const frameMs = (1 / 20) * 1000;

export const confPrefix = "nyanMode";

export const nyanSpace = "$(nyan-space)";

export const nyanRainbow = "$(nyan-rainbow)";

export const nyanFrames = [
  "$(nyan-0)",
  "$(nyan-1)",
  "$(nyan-2)",
  "$(nyan-3)",
  "$(nyan-4)",
  "$(nyan-5)",
  "$(nyan-6)",
  "$(nyan-7)",
  "$(nyan-8)",
  "$(nyan-9)",
  "$(nyan-10)",
  "$(nyan-11)",
];
