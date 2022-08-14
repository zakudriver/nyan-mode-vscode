import { X509Certificate } from "crypto";
import { NyanModeOptions } from "./types";

export const defConf: NyanModeOptions = {
  nyanDisable: false,
  nyanAlign: "left",
  nyanPriority: 0,
  nyanColor: "#fff",
  nyanLength: 20,
  nyanDisplayPercent: false,
  nyanHeader: " -",
  nyanFooter: "| ",
  nyanAction: "line",
};

export const confPrefix = "nyanMode";

export const rateLines = [
  ["(*^ｰﾟ)", 0.25],
  ["( ^ｰ^)", 0.5],
  ["(^ｰ^ )", 0.75],
  ["(ﾟｰ^*)", 1],
] as const;
