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
    // Keep this command in the history stack
    Command.commandHistory.push(this);
    this.saveState(); /* Allow the command to save necessary data to restore later */
    this.do(); /* perform the actual action of this command */
  }

  // Child classes of Command must implement the following abstract methods

  // restoreState: Perform necessary action to restore the app state.
  // The operation(s) implemented in restoreState() are usually opposite of the
  // operation(s) implemented in do()
  abstract restoreState(): void;

  // saveSTate: Save require information to restore the app state
  abstract saveState(): void;

  // do: Perform necessary action to alter the app state
  abstract do(): void;
}
