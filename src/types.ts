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
}
