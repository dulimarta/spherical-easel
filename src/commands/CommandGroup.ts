/**
 * This class is needed to group several commands together so
 * one single call to undo() undoes multiple effects
 */
import { toSVGType } from "@/types";
import { Command } from "./Command";
import { SELabel, SENodule } from "@/models/internal";

export class CommandGroup extends Command {
  public subCommands: Command[] = [];

  addCommand(c: Command): Command {
    this.subCommands.push(c);
    return this;
  }

  restoreState(): void {
    // Restore state should be done in REVERSE order
    // console.log("CG UNDO", this.subCommands.length, this.subCommands[0])
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
    // console.log("CG DO", this.subCommands.length, this.subCommands[0])
    this.subCommands.forEach(x => {
      x.do();
    });
  }

  getSVGObjectLabelPairs(): [SENodule, SELabel][] {
    const group: Array<[SENodule, SELabel]> = [];
   this.subCommands.forEach((cmd: Command) => {
      const converted = cmd.getSVGObjectLabelPairs();
      // We all all add the command to the group when
      // it returns non-null
      if (converted.length !== 0) group.push(...converted);
    });
    // When all the sub-commands return empty, we ended up
    // with an empty array. In which case we return empty
    return group?.length > 0 ? group : [];
  }

  toOpcode(): null | string | Array<string> {
    const group: Array<string> = [];
    this.subCommands.forEach((cmd: Command) => {
      const converted = cmd.toOpcode() as null | string;
      // We all all add the command to the group when
      // it returns non-null
      if (converted !== null) group.push(converted);
    });
    // When all the sub-commands return null, we ended up
    // with an empty array. In which case we return a null.
    return group?.length > 0 ? group : null;
  }
}
