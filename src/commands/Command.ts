/** This class uses the Command Design Pattern to
 * wraps actions into objects.
 * The most important abstract method of this class is the `do()`
 * method, it performs the action wrapped by the object
 *
 * In order to support undo feature, each command must also
 * implement the restoreState() method to revert the effects of the action.
 * The constructor of every subclass must take the arguments needed to perform
 * the actual action of the command.
 */

import { Store } from "vuex";
import { AppState } from "@/types";
import AppStore from "@/store";
export abstract class Command {
  protected static store: Store<AppState> = AppStore;

  static commandHistory: Command[] = []; // stack of executed commands
  static redoHistory: Command[] = []; // stack of undone commands
  //eslint-disable-next-line
  protected lastState: any; // The state can be of ANY type
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

  // TODO: consider merging saveState() and do(). They are always invoked one after the other

  // saveSTate: Save require information to restore the app state
  abstract saveState(): void;

  // do: Perform necessary action to alter the app state
  abstract do(): void;
}
