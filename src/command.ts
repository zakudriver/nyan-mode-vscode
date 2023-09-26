import { Observable } from "rxjs";
import { StatusBarItem, commands } from "vscode";

const cmdId = "nyanMode.statusBarHandler";

export const nyanCommand = (nyanBar: StatusBarItem): Observable<void> => {
  // const dis = commands.registerCommand(cmdId, async (...args) => {
  //   const newTerminal = window.createTerminal();
  //   newTerminal.show(false);
  // });

  const obs = new Observable<void>((ob) => {
    const dis = commands.registerCommand(cmdId, () => ob.next());
    return dis.dispose;
  });

  nyanBar.command = cmdId;

  return obs;
};
