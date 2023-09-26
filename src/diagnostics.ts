import {
  Observable,
  Subject,
  combineLatest,
  of,
  merge,
  debounceTime,
} from "rxjs";
import {
  window,
  ThemeColor,
  languages,
  TextEditor,
  DiagnosticChangeEvent,
} from "vscode";
import { SetColor } from "./types";
import { nyanDebounceMs } from "./config";

const diagnosticsNyan = (textEditor: TextEditor, setColor: SetColor) => {
  const allDiagnostics = languages.getDiagnostics();

  const { errorState, warningState } = allDiagnostics.reduce(
    (prev, cur) => {
      if (cur[0].path !== textEditor?.document.uri.path) {
        return prev;
      }

      for (const it of cur[1]) {
        if (it.severity === 0) {
          prev.errorState = true;
        }

        if (it.severity === 1) {
          prev.warningState = true;
        }

        if (prev.errorState && prev.warningState) {
          break;
        }
      }

      return prev;
    },
    {
      errorState: false,
      warningState: false,
    }
  );

  const errorColor = new ThemeColor("statusBarItem.errorBackground");
  const warningColor = new ThemeColor("statusBarItem.warningBackground");

  if (!errorState && warningState) {
    setColor(warningColor);
    return;
  }

  if (errorState && !warningState) {
    setColor(errorColor);
    return;
  }

  if (errorState && warningState) {
    setColor([errorColor, warningColor]);
    return;
  }

  setColor();
};

export const nyanDiagnostics = (
  changeActiveTextEditor$: Observable<TextEditor | undefined>,
  setColor: SetColor
) => {
  const changeDiagnostics$ = new Subject<DiagnosticChangeEvent>();

  const subs = combineLatest([
    merge(of(window.activeTextEditor), changeActiveTextEditor$),
    changeDiagnostics$,
  ])
    .pipe(debounceTime(nyanDebounceMs))
    .subscribe(
      ([textEditor]) => textEditor && diagnosticsNyan(textEditor, setColor)
    );

  const dis = languages.onDidChangeDiagnostics((e) =>
    changeDiagnostics$.next(e)
  );

  return () => {
    dis.dispose();
    subs.unsubscribe();
  };
};
