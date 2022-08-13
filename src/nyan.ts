import { window, StatusBarAlignment, TextEditor } from "vscode";
import { timesReduce, makePercent, debounce, getConfig } from "./utils";
import { NyanModeOptions } from "./types";

export const createNyan = (): (() => { dispose(): void }) => {
  const {
    nyanDisable = false,
    nyanAlign = "left",
    nyanPriority = 0,
    nyanColor = "#fff",
    nyanLength = 20,
    nyanDisplayPercent = false,
    nyanHeader = " -",
    nyanFooter = "| ",
    nyanAction = "line",
  } = getConfig([
    "nyanDisable",
    "nyanAlign",
    "nyanPriority",
    "nyanColor",
    "nyanAction",
    "nyanDisplayPercent",
    "nyanLength",
    "nyanHeader",
    "nyanFooter",
  ]);

  if (nyanDisable) {
    return () => ({
      dispose() {},
    });
  }

  const nyanBar = window.createStatusBarItem(
    nyanAlign === "left" ? StatusBarAlignment.Left : StatusBarAlignment.Right,
    nyanPriority
  );

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

  return () => {
    handleUpdateNyan();

    onDidChange(handleUpdateNyan);

    window.onDidChangeVisibleTextEditors((e) => {
      if (e.length) {
        handleUpdateNyan();
      } else {
        handleHideNyan();
      }
    });

    return {
      dispose() {
        nyanBar.dispose();
      },
    };
  };
};

const lineAction = (editor: TextEditor): number =>
  editor.document.lineCount - 1
    ? editor.selection.active.line / (editor.document.lineCount - 1)
    : 0;

const rangeAction = (editor: TextEditor): number => {
  const range = editor.visibleRanges;
  if (range.length) {
    const diff = range[0].end.line - range[0].start.line;
    const startLine = range[0].start.line;
    const num = editor.document.lineCount - diff - 1;

    return num ? startLine / num : 1;
  }

  return 1;
};

const nyanFace = (rate: number): string => {
  if (rate <= 0.25) {
    return "(*^ｰﾟ)";
  }
  if (rate <= 0.5) {
    return "( ^ｰ^)";
  }
  if (rate <= 0.75) {
    return "(^ｰ^ )";
  }

  return "(ﾟｰ^*)";
};

const drawNyan = (
  rate: number,
  {
    nyanLength,
    nyanHeader,
    nyanFooter,
  }: Omit<
    Required<NyanModeOptions>,
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

  const face = nyanFace(rate);

  return (segmentFn: (nyanStr: string, percentStr: string) => string) => {
    const percent = makePercent(rate);

    return segmentFn(`[${tail}${face}${ends}]`, percent);
  };
};
