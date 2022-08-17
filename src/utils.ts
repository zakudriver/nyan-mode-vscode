import { NyanModeOptions } from "./types";
import { workspace } from "vscode";

export const makePercent = (arg: number): string =>
  `${Math.round(arg * 1000) / 10}%`;

export const getConfig = (
  init: NyanModeOptions,
  prefix: string
): NyanModeOptions => {
  const config = workspace.getConfiguration(prefix);

  const checkType = (
    conf: NyanModeOptions[keyof NyanModeOptions] | undefined,
    key: keyof NyanModeOptions
  ) => typeof conf !== "undefined" && typeof conf === typeof init[key];

  return Object.keys(init).reduce((prev, cur) => {
    const conf = config.get<NyanModeOptions[keyof NyanModeOptions]>(cur);

    return {
      ...prev,
      [cur]: checkType(conf, cur as keyof NyanModeOptions)
        ? conf
        : init[cur as keyof NyanModeOptions],
    };
  }, {} as NyanModeOptions);
};

export const makeFrameMs = (frames: number) => (1 / frames) * 1000;
