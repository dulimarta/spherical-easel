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

type TxBeginMarker = {
  commandIndex: number;
  nestingLevel: number; // Must be positive, 1 = outermost
};

type TxCommitMarker = TxBeginMarker & {
  predicate: () => boolean;
};
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
  /** transactionIndices is an array that records the beginTransaction event */
  private txBegins: Array<TxBeginMarker> = [];
  private txCommits: Array<TxCommitMarker> = [];
  /** commitIndices is an array that records the commitIf event */
  private nestingLevel = 0; // initially no nesting
  // private sequence = 0
  public addTransaction() {
    this.nestingLevel++;
    this.txBegins.push({
      commandIndex: this.subCommands.length,
      nestingLevel: this.nestingLevel
    });
  }

  // private commit() {
  // if (this.transactionIndices.length > 0) {
  //   this.transactionIndices.pop();
  // } else {
  //   throw "Not inside a CommandGroup transaction";
  // }
  // }

  public addCommitIf(predicate: () => boolean) {
    if (this.nestingLevel > 0) {
      this.txCommits.push({
        commandIndex: this.subCommands.length,
        nestingLevel: this.nestingLevel,
        predicate
      });
      this.nestingLevel--;
    } else throw "Attempt to commit when not in a CommandGroup transaction";
  }

  // private rollback() {
  // if (this.transactionIndices.length > 0) {
  //   const mostRecentIndex = this.transactionIndices.pop();
  //   while (this.subCommands.length > mostRecentIndex!) {
  //     this.subCommands.pop()?.restoreState();
  //   }
  // } else {
  //   throw "Not inside a CommandGroup transaction";
  // }
  // }

  execute(fromRedo?: boolean): void {
    if (this.txBegins.length === 0) {
      super.execute(); // Invoke superclass method to execute without transaction
    } else if (this.txBegins.length == this.txCommits.length) {
      const rollbackTarget: Array<number> = [];
      let beginIdx = 0;
      let txLevel = 0;
      let nextBeginCommandAt = this.txBegins[0].commandIndex;
      let nextCommitCommandAt = this.txCommits[0].commandIndex;
      let commitIdx = 0;
      let cmdPos = 0;
      // The while-loop upperbound is intentionally made inclusive to handle the case
      // when commitIf() is the very last event to execute in the command group
      while (cmdPos <= this.subCommands.length) {
        if (cmdPos === nextBeginCommandAt) {
          // Are we at beginTransaction()
          rollbackTarget.push(cmdPos);
          beginIdx++;
          txLevel++;
          console.debug(
            `Begin of level ${txLevel} transaction ${beginIdx} at command index ${cmdPos}`
          );
          if (beginIdx < this.txBegins.length) {
            nextBeginCommandAt = this.txBegins[beginIdx].commandIndex;
          } else {
            nextBeginCommandAt = -1;
          }
        } else if (cmdPos === nextCommitCommandAt) {
          // Are we at commitIf()?
          const thisCommit = this.txCommits[commitIdx];
          console.debug(
            `End of level ${txLevel} (${thisCommit.nestingLevel}) at ${cmdPos}`
          );
          const rollbackTo = rollbackTarget.pop()!;
          if (thisCommit.predicate() === false) {
            let purgeCount = 0;
            for (let rb = cmdPos - 1; rb >= rollbackTo; rb--) {
              purgeCount++;
              this.subCommands[rb].restoreState();
            }
            // purge failed commands from the history
            console.debug(
              `Purging ${purgeCount} or ${cmdPos - rollbackTo} failed commands`
            );
            this.subCommands.splice(rollbackTo, cmdPos - rollbackTo);
            cmdPos = rollbackTo;
          }
          txLevel--;
          commitIdx++;
          if (commitIdx < this.txCommits.length) {
            nextCommitCommandAt = this.txBegins[commitIdx].commandIndex;
          } else {
            nextCommitCommandAt = -1;
          }
        }
        if (cmdPos < this.subCommands.length) {
          this.subCommands[cmdPos].saveState();
          this.subCommands[cmdPos].do();
        }
        cmdPos++;
      }
    } else {
      const missing = this.txBegins.length - this.txCommits.length;
      throw `You have ${missing} missing commits`;
    }
  }

  // execute is responsible for putting the corrected (if necessary) group into the
  // command history and also for calling the do() method on all subcommands
  execute_v1(fromRedo?: boolean): void {
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
