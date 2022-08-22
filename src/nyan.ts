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
    nyanDisplayBorder,
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

    const nyanRun = ([face, rainbow]: readonly [number, number]): void => {
      const editor = window.activeTextEditor;

      if (!editor) {
        nyanBar.hide();
        return;
      }

      const rate = makeRate(editor);
      const index = nyanIndex(rate, nyanLength);

      const str = nyanFactory(
        container,
        nyanEachFrames[face],
        nyanRainbows[rainbow],
        index
      );
      const nyanStr = nyanDisplayBorder ? `[${str}]` : str;

      nyanBar.text = nyanDisplayPercent
        ? `${nyanStr}  ${makePercent(rate)}`
        : nyanStr;

      nyanBar.show();
    };

    const changeSubject = changeObservableFactory(
      onDidChangeFactory(nyanAction)
    );

    const changeOba = nyanAnimationObservableFactory(changeSubject, {
      nyanAnimation,
      nyanRainbowAnimation,
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

    const changeActiveSub = changeActiveFactory().subscribe((isActive) => {
      if (isActive) {
        changeSubs.closed && (changeSubs = subscribeChange());
        changeSubject.next();
      } else {
        nyanBar.hide();
        changeSubs.unsubscribe();
      }
    });

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

const onDidChangeFactory = (
  action: NyanModeOptions["nyanAction"]
): ((fn: () => void) => Disposable) =>
  action === "scrolling"
    ? window.onDidChangeTextEditorVisibleRanges
    : (fn: () => void) => {
        let prev = 0;

        return window.onDidChangeTextEditorSelection((e) => {
          const cur = e.textEditor.selection.end.line;

          if (prev !== cur) {
            fn();
          }
          prev = cur;
        });
      };

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

const rainbowIndexFactory = (
  nyanRainbowAnimation: NyanModeOptions["nyanRainbowAnimation"],
  times = 4
) => {
  let count = 0,
    rainbowIndex = 0;

  if (nyanRainbowAnimation) {
    return () => {
      if (count > times - 1) {
        count = 0;
      }

      if (count++) {
        return rainbowIndex;
      }

      rainbowIndex = rainbowIndex ? 0 : 1;
      return rainbowIndex;
    };
  }

  return () => 0;
};

const nyanAnimationObservableFactory = (
  oba: Observable<void>,
  {
    nyanAnimation,
    nyanRainbowAnimation,
    nyanFrames,
  }: Pick<
    NyanModeOptions,
    "nyanAnimation" | "nyanFrames" | "nyanRainbowAnimation"
  >
): Observable<readonly [number, number]> => {
  const frameMs = makeFrameMs(nyanFrames);

  const rainbowIndex = rainbowIndexFactory(nyanRainbowAnimation);

  if (nyanAnimation === "quiet") {
    return oba.pipe(
      exhaustMap(() =>
        interval(frameMs).pipe(
          map((i) => [i, rainbowIndex()] as const),
          take(nyanEachFrames.length)
        )
      )
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

          return [i++, rainbowIndex()] as const;
        })
      ),
      oba,
    ]).pipe(map(([$]) => $));
  }

  return oba.pipe(map(() => [0, 0]));
};

const nyanIndex = (rate: number, nyanLen: number): number => {
  const editor = window.activeTextEditor;
  if (editor) {
    const index = Math.round(rate * nyanLen);

    return nyanLen > index ? index : nyanLen - 1;
  }
  return 0;
};

const changeActiveFactory = (): Observable<boolean> =>
  new Observable<boolean>((ob) => {
    const dis = window.onDidChangeActiveTextEditor((e) => ob.next(!!e));

    return () => dis.dispose();
  }).pipe(debounceTime(nyanDebounceMs));

const nyanFactory = (
  container: string[],
  face: string,
  rainbow: string,
  index: number
) =>
  container
    .map((_, i) => {
      if (i < index) {
        return rainbow;
      } else if (i === index) {
        return face;
      }
      return nyanSpace;
    })
    .join("");
