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
  nyanFaceCurve: [
    ["(*^ｰﾟ)", 0.25],
    ["( ^ｰ^)", 0.5],
    ["(^ｰ^ )", 0.75],
    ["(ﾟｰ^*)", 1],
  ],
};

export const confPrefix = "nyanMode";
