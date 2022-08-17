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
  filter,
} from "rxjs";
import { makePercent, getConfig } from "./utils";
import { NyanModeOptions } from "./types";
import {
  nyanDefConf,
  nyanConfPrefix,
  nyanFrames,
  nyanFrameMs,
  nyanRainbow,
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
    nyanAnimation,
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

    const nyanRun = (face: string, index: number): void => {
      const editor = window.activeTextEditor;

      if (!editor) {
        nyanBar.hide();
        return;
      }

      const str = nyanFactory(container, face, index);
      const nyanStr = nyanDisplayBorder ? `[${str}]` : str;

      nyanBar.text = nyanDisplayPercent
        ? `${nyanStr}  ${makePercent(makeRate(editor))}`
        : nyanStr;

      nyanBar.show();
    };

    const changeSubject = changeObservableFactory(
      onDidChangeFactory(nyanAction)
    );

    const changeOba = operatorFactory(
      changeSubject.pipe(
        debounceTime(nyanDebounceMs),
        map(() => nyanIndex(makeRate, nyanLength))
      ),
      nyanAnimation
    );

    const subscribeChange = () =>
      changeOba
        .pipe(
          filter(() => {
            const isActiveEditor = !!window.activeTextEditor;
            if (!isActiveEditor) {
              hideNyan();
            }

            return isActiveEditor;
          })
        )
        .subscribe(([face, index]) => nyanRun(face, index));

    let changeSubs = subscribeChange();
    window.activeTextEditor && changeSubject.next();

    const hideNyan = () => {
      nyanBar.hide();
      changeSubs.unsubscribe();
    };

    const changeVisibleSub = changeVisibleFactory().subscribe((visible) => {
      if (visible) {
        changeSubs.closed && (changeSubs = subscribeChange());
        changeSubject.next();
      }
      if (!visible) {
        hideNyan();
      }
    });

    return new Disposable(() => {
      nyanBar.dispose();
      changeSubject.complete();
      changeSubs.unsubscribe();
      changeVisibleSub.unsubscribe();
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

const operatorFactory = (
  oba: Observable<number>,
  nyanAnimation: NyanModeOptions["nyanAnimation"]
): Observable<readonly [string, number]> => {
  if (nyanAnimation === "quiet") {
    return oba.pipe(
      exhaustMap((index) =>
        interval(nyanFrameMs).pipe(
          map((i) => [nyanFrames[i], index] as const),
          take(nyanFrames.length)
        )
      )
    );
  }

  let i = 0;
  if (nyanAnimation === "active") {
    return combineLatest([
      interval(nyanFrameMs).pipe(
        map(() => {
          const frame = nyanFrames[i++];
          if (i >= nyanFrames.length) {
            i = 0;
          }
          return frame;
        })
      ),
      oba,
    ]);
  }

  return oba.pipe(map((index) => [nyanFrames[0], index]));
};

const nyanIndex = (
  rateFn: (editor: TextEditor) => number,
  nyanLen: number
): number => {
  const editor = window.activeTextEditor;
  if (editor) {
    const index = Math.round(rateFn(editor) * nyanLen);

    return nyanLen > index ? index : index - 1;
  }
  return 0;
};

const changeVisibleFactory = (): Observable<boolean> =>
  new Observable<boolean>((ob) => {
    const dis = window.onDidChangeVisibleTextEditors((e) =>
      ob.next(!!e.length)
    );

    return () => dis.dispose();
  }).pipe(debounceTime(nyanDebounceMs));

const nyanFactory = (container: string[], face: string, index: number) =>
  container
    .map((_, i) => {
      if (i < index) {
        return nyanRainbow;
      } else if (i === index) {
        return face;
      }
      return nyanSpace;
    })
    .join("");
