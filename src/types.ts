import { ThemeColor } from "vscode";

export interface NyanModeOptions {
  nyanDisable: boolean;
  nyanAlign: "left" | "right";
  nyanPriority: number;
  nyanColor: string;
  nyanLength: number;
  nyanDisplayPercent: boolean;
  nyanAction: "scrolling" | "moving";
  nyanAnimation: "quiet" | "active" | "none";
  nyanFrames: number;
  nyanRainbowAnimation: boolean;
  nyanDiagnostics: boolean;
}

export interface SetColor {
  (
    color?: ThemeColor | string | [ThemeColor | string, ThemeColor | string]
  ): void;
}
