export interface NyanModeOptions {
  nyanDisable?: boolean;
  nyanAlign?: "left" | "right";
  nyanPriority?: number;
  nyanColor?: string;
  nyanLength?: number;
  nyanDisplayPercent?: boolean;
  nyanHeader?: string;
  nyanFooter?: string;
  nyanAction?: "line" | "range";
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
type LastOf<T> = UnionToIntersection<
  T extends any ? () => T : never
> extends () => infer R
  ? R
  : never;

type Push<T extends any[], V> = [...T, V];

type TuplifyUnion<
  T,
  L = LastOf<T>,
  N = [T] extends [never] ? true : false
> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>;

export type NyanModeOptionsKeysTuple = TuplifyUnion<keyof NyanModeOptions>;
