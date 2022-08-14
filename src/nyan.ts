import {
  window,
  StatusBarAlignment,
  TextEditor,
  workspace,
  Disposable,
} from "vscode";
import { timesReduce, makePercent, debounce, getConfig } from "./utils";
import { NyanModeOptions } from "./types";
import { defConf, confPrefix } from "./config";

const configObservable = (
  init: NyanModeOptions,
  fn: (config: NyanModeOptions) => Disposable,
  prefix = confPrefix
): Disposable => {
  const next = () => {
    const conf = getConfig(init, prefix);
    return fn(conf);
  };

  let nextDis = next();
  const dis = workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(prefix)) {
      nextDis.dispose();
      nextDis = next();
    }
  });

  return Disposable.from(dis, new Disposable(() => nextDis.dispose()));
};

export const createNyan = (init: NyanModeOptions = defConf) => {
  const nyan = ({
    nyanDisable,
    nyanAlign,
    nyanPriority,
    nyanColor,
    nyanLength,
    nyanDisplayPercent,
    nyanHeader,
    nyanFooter,
    nyanAction,
    nyanFaceCurve,
  }: NyanModeOptions) => {
    const nyanBar = window.createStatusBarItem(
      nyanAlign === "right"
        ? StatusBarAlignment.Right
        : StatusBarAlignment.Left,
      nyanPriority
    );

    if (nyanDisable) {
      nyanBar.hide();
      return Disposable.from();
    }

    const makeRate = nyanAction === "range" ? rangeAction : lineAction;

    const updateNyan = (): void => {
      const editor = window.activeTextEditor;

      if (!editor) {
        nyanBar.hide();
        return;
      }

      nyanBar.text = drawNyan(makeRate(editor), {
        nyanLength,
        nyanHeader,
        nyanFooter,
        nyanFaceCurve,
      })(($, $1) => (nyanDisplayPercent ? `${$}  ${$1}` : $));

      nyanBar.color = nyanColor;
      nyanBar.tooltip = "nyan-mode";

      nyanBar.show();
    };

    const handleUpdateNyan = debounce(() => updateNyan());
    const handleHideNyan = debounce(() => nyanBar.hide());

    const onDidChange =
      nyanAction === "range"
        ? window.onDidChangeTextEditorVisibleRanges
        : window.onDidChangeTextEditorSelection;

    handleUpdateNyan();
    const dis: Disposable[] = [nyanBar];

    dis.push(onDidChange(handleUpdateNyan));

    dis.push(
      window.onDidChangeVisibleTextEditors((e) => {
        if (e.length) {
          handleUpdateNyan();
        } else {
          handleHideNyan();
        }
      })
    );

    return Disposable.from(...dis);
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

const nyanFace = (rate: number, lines: Array<[string, number]>): string => {
  const [face] = lines.find(([, v]) => rate <= v) || lines[lines.length - 1];

  return face;
};

const drawNyan = (
  rate: number,
  {
    nyanLength,
    nyanHeader,
    nyanFooter,
    nyanFaceCurve,
  }: Omit<
    NyanModeOptions,
    | "nyanDisable"
    | "nyanAlign"
    | "nyanPriority"
    | "nyanColor"
    | "nyanAction"
    | "nyanDisplayPercent"
  >
) => {
  const tailLen = Math.round(nyanLength * rate);

  const tail = timesReduce(
    tailLen,
    (arg, i) => (i ? (arg += nyanFooter) : ""),
    ""
  );
  const ends = timesReduce(
    nyanLength - tailLen,
    (arg) => (arg += nyanHeader),
    ""
  );

  const face = nyanFace(rate, nyanFaceCurve);

  return (segmentFn: (nyanStr: string, percentStr: string) => string) => {
    const percent = makePercent(rate);

    return segmentFn(`[${tail}${face}${ends}]`, percent);
  };
};
