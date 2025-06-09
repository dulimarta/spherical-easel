/**
 * This class is needed to group several commands together so
 * one single call to undo() undoes multiple effects
 */
import { CommandReturnType, toSVGType } from "@/types";
import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SELabel } from "@/models/SELabel";
import EventBus from "@/eventHandlers/EventBus";
import { AddIntersectionPointOtherParentsInfo } from "./AddIntersectionPointOtherParentsInfo";

export class CommandGroup extends Command {
  public subCommands: Command[] = [];
  // Make command group like a transaction in data base management:
  // Try the command in a dry-run, then if there are
  // any errors, edit the command group and try again until
  // the command runs successfully.
  // The first step (and only one needed now) is to remove a command from the
  // the group and that is what is implemented here. That is, each command in a
  // group will return an object and one property of the that object is a
  // boolean success (other properties can be added later to diagnose other
  // issues if necessary). In this case if a command is not successful it is removed
  // from the group.
  private transactionIndices: Array<number> = [];

  beginTransaction() {
    this.transactionIndices.push(this.subCommands.length);
  }

  commit() {
    if (this.transactionIndices.length > 0) {
      this.transactionIndices.pop();
    } else {
      throw "Not inside a CommandGroup transaction";
    }
  }

  commitIf(predicate: () => boolean) {
    if (predicate()) this.commit();
    else this.rollback();
  }

  rollback() {
    if (this.transactionIndices.length > 0) {
      const mostRecentIndex = this.transactionIndices.pop();
      while (this.subCommands.length > mostRecentIndex!) {
        this.subCommands.pop()?.restoreState();
      }
    } else {
      throw "Not inside a CommandGroup transaction";
    }
  }

  // execute is responsible for putting the corrected (if necessary) group into the
  // command history and also for calling the do() method on all subcommands
  execute(fromRedo?: boolean): void {
    let acceptThisGroup = false;
    while (!acceptThisGroup) {
      // Try the commands until an unsuccessful one is found
      let errorIndex = -1;
      for (let i = 0; i < this.subCommands.length; i++) {
        this.subCommands[i].saveState();
        const result = this.subCommands[i].do();
        if (!result.success) {
          errorIndex = i;
          break;
        }
      }
      // console.log("error index", errorIndex)
      if (errorIndex != -1) {
        // Undo all the commands starting with the unsuccessful one and working backwards
        for (let i = errorIndex; i >= 0; i--) {
          this.subCommands[i].restoreState();
        }
        // attempt to fix this command group
        if (
          this.subCommands[errorIndex] instanceof
          AddIntersectionPointOtherParentsInfo
        ) {
          // console.log("Command Removed",this.subCommands[errorIndex])
          // In this case remove this command from the group
          this.subCommands.splice(errorIndex, 1);
        }
      } else {
        // all subcommands are now successful and have been performed and saved

        // Keep this command in the history stack
        Command.commandHistory.push(this);

        if (Command.redoHistory.length > 0 && fromRedo === undefined) {
          Command.redoHistory.splice(0);
        }
        EventBus.fire("undo-enabled", {
          value: Command.commandHistory.length > 0
        });
        EventBus.fire("redo-enabled", {
          value: Command.redoHistory.length > 0
        });
        acceptThisGroup = true;
      }
    }
  }

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

  do(): CommandReturnType {
    // console.log("CG DO", this.subCommands.length, this.subCommands[0])
    this.subCommands.forEach(x => {
      x.do();
    });
    return { success: true }; // to make the linter happy but is not used
  }

  getSVGObjectLabelPairs(): [SENodule, SELabel | null][] {
    const group: Array<[SENodule, SELabel | null]> = [];
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
