// Use command design pattern to implement undo
// let history: Command[] = [];
import { Store } from "vuex";
import { AppState } from "@/types";
import AppStore from "@/store";
export abstract class Command {
  protected static store: Store<AppState> = AppStore;
  static commandHistory: Command[] = [];
  protected lastState: any;
  // static setStore(st: Store<AppState>) {
  //   this.store = st;
  // }
  static undo() {
    if (Command.commandHistory.length == 0) return;
    const lastAction: Command | undefined = Command.commandHistory.pop();
    if (lastAction) lastAction.restoreState();
  }

  execute() {
    Command.commandHistory.push(this);
    this.saveState();
    this.do();
  }

  // Child classes of Command must implement the following functions

  // Perforn necessary action to restore the app state
  abstract restoreState(): void;

  // Save require information to restore the app state
  abstract saveState(): void;

  // Perform necessary action to alter the app state
  abstract do(): void;
}
