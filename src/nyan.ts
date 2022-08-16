import {
  window,
  StatusBarAlignment,
  TextEditor,
  workspace,
  Disposable,
  Event,
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
} from "rxjs";
import { makePercent, getConfig } from "./utils";
import { NyanModeOptions } from "./types";
import {
  defConf,
  confPrefix,
  nyanFrames,
  frameMs,
  nyanRainbow,
  nyanSpace,
} from "./config";

const configObservable = (
  init: NyanModeOptions,
  fn: (config: NyanModeOptions) => Disposable | undefined,
  prefix = confPrefix
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

export const createNyan = (init: NyanModeOptions = defConf) => {
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

    if (nyanDisable) {
      nyanBar.hide();
      return;
    }

    const container = new Array(nyanLength).fill("");
    const makeRate = nyanAction === "range" ? rangeAction : lineAction;

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

      nyanBar.color = nyanColor;
      nyanBar.tooltip = "nyan-mode";

      nyanBar.show();
    };

    const onDidChange =
      nyanAction === "range"
        ? window.onDidChangeTextEditorVisibleRanges
        : window.onDidChangeTextEditorSelection;

    const changeSubject = changeObservableFactory(onDidChange);

    const changeSubs = operatorFactory(
      changeSubject.pipe(
        debounceTime(50),
        map(() => nyanIndex(makeRate, nyanLength))
      ),
      nyanAnimation
    ).subscribe(([face, index]) => nyanRun(face, index));

    const changeVisibleSub = changeVisibleFactory().subscribe((res) => {
      if (res) {
        changeSubject.next();
      } else {
        nyanBar.hide();
        changeSubs.unsubscribe();
      }
    });

    window.activeTextEditor && changeSubject.next();

    return new Disposable(() => {
      nyanBar.dispose();
      changeSubject.complete();
      changeVisibleSub.unsubscribe();
    });
  };

  return configObservable(init, nyan);
};

const lineAction = ({ document, selection }: TextEditor): number =>
  document.lineCount - 1 ? selection.active.line / (document.lineCount - 1) : 0;

const rangeAction = ({ visibleRanges, document }: TextEditor): number => {
  if (visibleRanges.length) {
    const diff = visibleRanges[0].end.line - visibleRanges[0].start.line;
    const startLine = visibleRanges[0].start.line;
    const num = document.lineCount - diff - 1;

    return num ? startLine / num : 1;
  }

  return 1;
};

const changeObservableFactory = (onDidChange: Event<any>): Subject<void> => {
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
  if (nyanAnimation === "moving") {
    return oba.pipe(
      exhaustMap((index) =>
        interval(frameMs).pipe(
          map((i) => [nyanFrames[i], index] as const),
          take(nyanFrames.length)
        )
      )
    );
  }

  let i = 0;
  if (nyanAnimation === "always") {
    return combineLatest([
      interval(frameMs).pipe(
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
  }).pipe(debounceTime(50));

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
