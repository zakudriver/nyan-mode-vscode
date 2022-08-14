export interface NyanModeOptions {
  nyanDisable: boolean;
  nyanAlign: "left" | "right";
  nyanPriority: number;
  nyanColor: string;
  nyanLength: number;
  nyanDisplayPercent: boolean;
  nyanHeader: string;
  nyanFooter: string;
  nyanAction: "line" | "range";
  nyanFaceCurve: Array<[string, number]>;
}
