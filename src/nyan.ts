import {
  window,
  StatusBarAlignment,
  TextEditor,
  workspace,
  Disposable,
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
} from "rxjs";
import { makePercent, getConfig, makeFrameMs } from "./utils";
import { NyanModeOptions } from "./types";
import {
  nyanDefConf,
  nyanConfPrefix,
  nyanEachFrames,
  nyanRainbows,
  nyanSpace,
  nyanTooltip,
  nyanDebounceMs,
} from "./config";

const configObservable = (
  init: NyanModeOptions,
  fn: (config: NyanModeOptions) => Disposable | undefined,
  prefix = nyanConfPrefix
): Disposable => {
  const next = () => {
    const conf = getConfig(init, prefix);
    return fn(conf);
  };

  let nextDis = next();
  const dis = workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(prefix)) {
      nextDis?.dispose();
      nextDis = next();
    }
  });

  return Disposable.from(dis, new Disposable(() => nextDis?.dispose()));
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
  }: NyanModeOptions): Disposable | undefined => {
    const nyanBar = window.createStatusBarItem(
      nyanAlign === "right"
        ? StatusBarAlignment.Right
        : StatusBarAlignment.Left,
      nyanPriority
    );
    nyanBar.color = nyanColor;
    nyanBar.tooltip = nyanTooltip;

    if (nyanDisable) {
      nyanBar.hide();
      return;
    }

    const container = new Array(nyanLength).fill("");
    const makeRate = nyanAction === "scrolling" ? scrollingRate : movingRate;

    const nyanRun = (frame: number): void => {
      const editor = window.activeTextEditor;

      if (!editor) {
        nyanBar.hide();
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

      nyanBar.text = nyanDisplayPercent
        ? `${nyanStr}  ${makePercent(rate)}`
        : nyanStr;

      nyanBar.show();
    };

    const prev = prevPositionFactory();

    const changeSubject = changeObservableFactory(
      onDidChangeFactory(nyanAction, prev)
    );

    const changeOba = nyanAnimationObservableFactory(changeSubject, {
      nyanAnimation,
      nyanFrames,
    }).pipe(
      takeWhile(() => {
        const isActive = !!window.activeTextEditor;
        if (!isActive) {
          nyanBar.hide();
        }

        return isActive;
      })
    );

    const subscribeChange = () => changeOba.subscribe(nyanRun);

    let changeSubs = subscribeChange();
    window.activeTextEditor && changeSubject.next();

    const changeActiveSub = changeActiveFactory(nyanAction, prev).subscribe(
      (isActive) => {
        if (isActive) {
          changeSubs.closed && (changeSubs = subscribeChange());
          changeSubject.next();
        } else {
          nyanBar.hide();
          changeSubs.unsubscribe();
        }
      }
    );

    return new Disposable(() => {
      nyanBar.dispose();
      changeSubject.complete();
      changeSubs.unsubscribe();
      changeActiveSub.unsubscribe();
    });
  };

  return configObservable(nyanDefConf, nyan);
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

const onDidChangeFactory = (
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

const changeObservableFactory = (
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

  let i = 0;
  if (nyanAnimation === "active") {
    return combineLatest([
      interval(frameMs).pipe(
        map(() => {
          if (i >= nyanEachFrames.length) {
            i = 0;
          }

          return i++;
        })
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

const changeActiveFactory = (
  nyanAction: NyanModeOptions["nyanAction"],
  prev: (num?: number) => number
): Observable<boolean> =>
  new Observable<boolean>((ob) => {
    const dis = window.onDidChangeActiveTextEditor((e) => {
      ob.next(!!e);

      prev((nyanAction === "scrolling" && e?.visibleRanges[0].end.line) || 0);
    });

    return () => dis.dispose();
  }).pipe(debounceTime(nyanDebounceMs));

const nyanFactory = (
  container: string[],
  frame: number,
  index: number,
  nyanRainbowAnimation: NyanModeOptions["nyanRainbowAnimation"]
): string =>
  container
    .map((_, i) => {
      if (i < index) {
        if (nyanRainbowAnimation) {
          return nyanRainbows[2 > ((frame + i) & 3) ? 0 : 1];
        }
        return nyanRainbows[i & 1];
      } else if (i === index) {
        return nyanEachFrames[frame];
      }
      return nyanSpace;
    })
    .join("");
