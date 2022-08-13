import { NyanModeOptionsKeysTuple, NyanModeOptions } from "./types";
import { workspace } from "vscode";

export const timesReduce = <T>(
  counts: number,
  cb: (arg: T, i: number) => T,
  init: T
): T => {
  for (let i = 0; i < counts; i++) {
    init = cb(init, i);
  }

  return init;
};

export const makePercent = (arg: number): string =>
  `${Math.round(arg * 1000) / 10}%`;

export const getConfig = (
  tup: NyanModeOptionsKeysTuple,
  configPrefix = "nyanMode"
): NyanModeOptions => {
  const config = workspace.getConfiguration(configPrefix);

  return tup.reduce(
    (prev, cur) => ({
      ...prev,
      [cur]: config.get(cur),
    }),
    {} as NyanModeOptions
  );
};

export const debounce = (cb: () => void, time = 50) => {
  let timeout: null | NodeJS.Timeout = null;

  return () => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(cb, time);
  };
};
