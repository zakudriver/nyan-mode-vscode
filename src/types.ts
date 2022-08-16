export interface NyanModeOptions {
  nyanDisable: boolean;
  nyanAlign: "left" | "right";
  nyanPriority: number;
  nyanColor: string;
  nyanLength: number;
  nyanDisplayPercent: boolean;
  nyanDisplayBorder: boolean;
  nyanAction: "range" | "line";
  nyanAnimation: "always" | "none" | "moving";
}
