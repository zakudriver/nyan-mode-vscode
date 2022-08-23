import { NyanModeOptions } from "./types";

export const nyanDefConf: NyanModeOptions = {
  nyanDisable: false,
  nyanAlign: "left",
  nyanPriority: 0,
  nyanColor: "#f99cf7",
  nyanLength: 30,
  nyanDisplayPercent: false,
  nyanAction: "scrolling",
  nyanAnimation: "quiet",
  nyanRainbowAnimation: true,
  nyanFrames: 20,
};

export const nyanConfPrefix = "nyanMode";

export const nyanSpace = "$(nyan-space)";

export const nyanRainbows = ["$(nyan-rainbow)", "$(nyan-rainbow-1)"];

export const nyanEachFrames = [
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

export const nyanTooltip = "nyan-mode";

export const nyanDebounceMs = 30;
