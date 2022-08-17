import { NyanModeOptions } from "./types";

export const nyanDefConf: NyanModeOptions = {
  nyanDisable: false,
  nyanAlign: "left",
  nyanPriority: 0,
  nyanColor: "#fff",
  nyanLength: 20,
  nyanDisplayPercent: false,
  nyanDisplayBorder: false,
  nyanAction: "scrolling",
  nyanAnimation: "quiet",
};

export const nyanConfPrefix = "nyanMode";

export const nyanFrameMs = (1 / 20) * 1000;

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

export const nyanTooltip = "nyan-mode";

export const nyanDebounceMs = 30;
