/**
 * This class is needed to group several commands together so
 * one single call to undo() undoes multiple effects
 */
import { Command } from "./Command";
export class CommandGroup extends Command {
  private subCommands: Command[] = [];

  addCommand(c: Command): Command {
    this.subCommands.push(c);
    return this;
  }

  restoreState(): void {
    this.subCommands.forEach(x => {
      x.restoreState();
    });
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
}
