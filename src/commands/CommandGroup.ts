/**
 * This class is needed to group several commands together so
 * one single call to undo() undoes multiple effects
 */
import { Command } from "./Command";
export class CommandGroup extends Command {
  public subCommands: Command[] = [];

  addCommand(c: Command): Command {
    this.subCommands.push(c);
    return this;
  }

  restoreState(): void {
    // Restore state should be done in REVERSE order
    for (let kIdx = this.subCommands.length - 1; kIdx >= 0; kIdx--) {
      this.subCommands[kIdx].restoreState();
    }
  }

  saveState(): void {
    this.subCommands.forEach(x => {
      x.saveState();
    });
  }

  do(): void {
    this.subCommands.forEach(x => {
      x.do();
    });
  }

  //eslint-disable-next-line
  toJSON(arg: string): string[] {
    return this.subCommands.map((s: Command) => JSON.stringify(s));
  }
}
