import {
  window,
  StatusBarAlignment,
  TextEditor,
  workspace,
  Disposable,
  StatusBarItem,
  ThemeColor,
} from "vscode";
import {
  debounceTime,
  interval,
  Observable,
  take,
  map,
  exhaustMap,
  Subject,
  combineLatest,
  takeWhile,
  scan,
} from "rxjs";
import { makePercent, getConfig, makeFrameMs } from "./utils";
import { NyanModeOptions, SetColor } from "./types";
import {
  nyanDefConf,
  nyanConfPrefix,
  nyanEachFrames,
  nyanRainbows,
  nyanSpace,
  nyanTooltip,
  nyanDebounceMs,
} from "./config";
import { diagnostics } from "./diagnostics";

const configObservable = (
  init: NyanModeOptions,
  fn: (config: NyanModeOptions) => (() => void) | void,
  prefix = nyanConfPrefix
): (() => void) => {
  const next = () => {
    const conf = getConfig(init, prefix);
    return fn(conf);
  };

  let nextDis = next();
  const dis = workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(prefix)) {
      nextDis?.();
      nextDis = next();
    }
  });

  return () => {
    dis.dispose();
    nextDis?.();
  };
};

const createNyanBar = ({
  nyanAlign,
  nyanColor,
  nyanPriority,
  nyanDisplayPercent,
}: Pick<
  NyanModeOptions,
  "nyanAlign" | "nyanColor" | "nyanPriority" | "nyanDisplayPercent"
>) => {
  const nyanBar = window.createStatusBarItem(
    nyanAlign === "right" ? StatusBarAlignment.Right : StatusBarAlignment.Left,
    nyanPriority
  );

  nyanBar.tooltip = nyanTooltip;

  let percentBar: StatusBarItem | undefined;
  if (nyanDisplayPercent) {
    percentBar = window.createStatusBarItem(
      nyanAlign === "right"
        ? StatusBarAlignment.Right
        : StatusBarAlignment.Left,
      nyanPriority
    );

    percentBar.tooltip = nyanTooltip;
  }

  const show = () => {
    nyanBar.show();
    percentBar?.show();
  };

  const hide = () => {
    nyanBar.hide();
    percentBar?.hide();
  };

  const setColor: SetColor = (color = nyanColor) => {
    if (Array.isArray(color)) {
      const [nyanColor, percentColor] = color as [
        ThemeColor | string,
        ThemeColor | string
      ];
      nyanBar.color = nyanColor;
      percentBar && (percentBar.color = percentColor);
    } else {
      nyanBar.color = color;
      percentBar && (percentBar.color = color);
    }
  };

  setColor();

  const dispose = () => {
    nyanBar.dispose();
    percentBar?.dispose();
  };

  return { nyanBar, percentBar, show, hide, setColor, dispose };
};

export const createNyan = () => {
  const nyan = ({
    nyanDisable,
    nyanAlign,
    nyanPriority,
    nyanColor,
    nyanLength,
    nyanDisplayPercent,
    nyanAction,
    nyanFrames,
    nyanAnimation,
    nyanRainbowAnimation,
    nyanDiagnostics,
  }: NyanModeOptions): (() => void) | void => {
    const { nyanBar, percentBar, show, hide, setColor, dispose } =
      createNyanBar({
        nyanAlign,
        nyanPriority,
        nyanColor,
        nyanDisplayPercent,
      });

    if (nyanDisable) {
      hide();
      return;
    }

    const container = new Array(nyanLength).fill("");
    const makeRate = nyanAction === "scrolling" ? scrollingRate : movingRate;

    const nyanRun = (frame: number): void => {
      const editor = window.activeTextEditor;

      if (!editor) {
        hide();
        return;
      }

      const rate = makeRate(editor);
      const index = nyanIndex(rate, nyanLength);

      const nyanStr = nyanFactory(
        container,
        frame,
        index,
        nyanRainbowAnimation
      );

      nyanBar.text = nyanStr;

      percentBar && (percentBar.text = makePercent(rate));
    };

    const prevPosit = prevPositionFactory();

    const changeTextEditorOba = changeTextEditorObservableFactory(
      onDidChangeTextEditorFactory(nyanAction, prevPosit)
    );

    const nyanRunOba = nyanAnimationObservableFactory(changeTextEditorOba, {
      nyanAnimation,
      nyanFrames,
    }).pipe(
      takeWhile(() => {
        const isActive = !!window.activeTextEditor;
        if (!isActive) {
          hide();
        }

        return isActive;
      }),
      debounceTime(nyanDebounceMs)
    );

    const subscribeNyanRun = () => nyanRunOba.subscribe(nyanRun);

    let nyanRunSubs = subscribeNyanRun();
    window.activeTextEditor && changeTextEditorOba.next();
    show();

    const changeActiveTextEditor$ = changeActiveTextEditorFactory(
      (isActive) => {
        if (isActive) {
          nyanRunSubs.closed && (nyanRunSubs = subscribeNyanRun());
          changeTextEditorOba.next();
          show();
        } else {
          hide();
          nyanRunSubs.unsubscribe();
        }
      },
      (e?: TextEditor) => {
        prevPosit(
          (nyanAction === "scrolling" && e?.visibleRanges[0].end.line) || 0
        );
      }
    );

    const diagnosticsDis = nyanDiagnostics
      ? diagnostics(changeActiveTextEditor$, setColor)
      : undefined;

    return () => {
      dispose();
      diagnosticsDis?.();

      changeTextEditorOba.complete();
      nyanRunSubs.unsubscribe();
    };
  };

  const dis = configObservable(nyanDefConf, nyan);

  return new Disposable(dis);
};

const movingRate = ({ document, selection }: TextEditor): number =>
  document.lineCount - 1 ? selection.active.line / (document.lineCount - 1) : 0;

const scrollingRate = ({ visibleRanges, document }: TextEditor): number => {
  if (visibleRanges.length) {
    const diff = visibleRanges[0].end.line - visibleRanges[0].start.line;
    const startLine = visibleRanges[0].start.line;
    const num = document.lineCount - diff - 1;

    return num ? startLine / num : 1;
  }

  return 1;
};

const prevPositionFactory = (): ((num?: number) => number) => {
  let prev = 0;
  return (num?: number): number => {
    if (typeof num !== "undefined") {
      prev = num;
    }
    return prev;
  };
};

const onDidChangeTextEditorFactory = (
  action: NyanModeOptions["nyanAction"],
  prev: (num?: number) => number
): ((fn: () => void) => Disposable) =>
  action === "scrolling"
    ? (fn: () => void) =>
        window.onDidChangeTextEditorVisibleRanges(({ visibleRanges }) => {
          const cur = visibleRanges.length ? visibleRanges[0].end.line : 0;
          if (prev() !== cur) {
            fn();
          }
          prev(cur);
        })
    : (fn: () => void) =>
        window.onDidChangeTextEditorSelection(({ textEditor }) => {
          const cur = textEditor.selection.end.line;
          if (prev() !== cur) {
            fn();
          }
          prev(cur);
        });

const changeTextEditorObservableFactory = (
  onDidChange: (fn: () => void) => Disposable
): Subject<void> => {
  const subject = new Subject<void>();

  const dis = onDidChange(() => subject.next());

  subject.subscribe({
    complete() {
      dis.dispose();
    },
  });

  return subject;
};

const nyanAnimationObservableFactory = (
  oba: Observable<void>,
  {
    nyanAnimation,
    nyanFrames,
  }: Pick<NyanModeOptions, "nyanAnimation" | "nyanFrames">
): Observable<number> => {
  const frameMs = makeFrameMs(nyanFrames);

  if (nyanAnimation === "quiet") {
    return oba.pipe(
      exhaustMap(() => interval(frameMs).pipe(take(nyanEachFrames.length)))
    );
  }

  if (nyanAnimation === "active") {
    return combineLatest([
      interval(frameMs).pipe(
        scan((acc) => (acc >= nyanEachFrames.length - 1 ? 0 : ++acc), -1)
      ),
      oba,
    ]).pipe(map(([$]) => $));
  }

  return oba.pipe(map(() => 0));
};

const nyanIndex = (rate: number, nyanLen: number): number => {
  const editor = window.activeTextEditor;
  if (editor) {
    const index = Math.round(rate * nyanLen);

    return nyanLen > index ? index : nyanLen - 1;
  }
  return 0;
};

const changeActiveTextEditorFactory = (
  fn: (isActive: boolean) => void,
  prevPositFn: (e?: TextEditor) => void
) => {
  return new Observable<TextEditor | undefined>((ob) => {
    const dis = window.onDidChangeActiveTextEditor((e) => {
      ob.next(e);

      fn(!!e);
      prevPositFn(e);
    });

    return () => dis.dispose();
  });
};

// const nyanFactory = (
//   container: string[],
//   frame: number,
//   index: number,
//   nyanRainbowAnimation: NyanModeOptions["nyanRainbowAnimation"]
// ): string =>
//   container
//     .map((_, i) => {
//       if (i < index) {
//         if (nyanRainbowAnimation) {
//           return nyanRainbows[2 > ((frame + i) & 3) ? 0 : 1];
//         }
//         return nyanRainbows[i & 1];
//       } else if (i === index) {
//         return nyanEachFrames[frame];
//       }
//       return nyanSpace;
//     })
//     .join("");

const nyanFactory = (
  container: string[],
  frame: number,
  index: number,
  nyanRainbowAnimation: NyanModeOptions["nyanRainbowAnimation"]
): string => {
  for (let i = 0; i < container.length; i++) {
    if (i < index) {
      if (nyanRainbowAnimation) {
        container[i] = nyanRainbows[2 > ((frame + i) & 3) ? 0 : 1];
        continue;
      }
      container[i] = nyanRainbows[i & 1];
      continue;
    } else if (i === index) {
      container[i] = nyanEachFrames[frame];
      continue;
    }
    container[i] = nyanSpace;
  }

  return container.join("");
};
