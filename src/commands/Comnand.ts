// Use command design pattern to implement undo
// let history: Command[] = [];
import { Store } from "vuex";
import { AppState } from "@/types";
import AppStore from "@/store";
export abstract class Command {
  protected static store: Store<AppState> = AppStore;
  static commandHistory: Command[] = [];
  static redoHistory: Command[] = [];
  protected lastState: any;
  // static setStore(st: Store<AppState>) {
  //   this.store = st;
  // }
  static undo() {
    if (Command.commandHistory.length === 0) return;

    // Pop the last command from the history stack
    const lastAction: Command | undefined = Command.commandHistory.pop();
    // Run is restore state logic
    if (lastAction) {
      Command.redoHistory.push(lastAction);
      lastAction.restoreState();
    }
  }

  static undoEnabled = (): boolean => Command.commandHistory.length > 0;
  static redoEnabled = (): boolean => Command.redoHistory.length > 0;

  static redo() {
    if (Command.redoHistory.length === 0) return;
    const nextAction = Command.redoHistory.pop();

    if (nextAction) {
      nextAction.execute();
    }
  }

  execute() {
    Command.commandHistory.push(this);
    this.saveState(); /* Allow the command to save necessary data to restore later */
    this.do(); /* perform the actual action */
  }

  // Child classes of Command must implement the following functions

  // Perform necessary action to restore the app state
  abstract restoreState(): void;

  // Save require information to restore the app state
  abstract saveState(): void;

  // Perform necessary action to alter the app state
  abstract do(): void;
}
