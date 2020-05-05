import { Command } from "./Comnand";
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
