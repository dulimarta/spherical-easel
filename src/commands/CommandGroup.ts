/**
 * This class is needed to group several commands together so
 * one single call to undo() undoes multiple effects
 */
import { toSVGType } from "@/types";
import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SELabel } from "@/models/SELabel";
import EventBus from "@/eventHandlers/EventBus";
import { AddIntersectionPointOtherParentsInfo } from "./AddIntersectionPointOtherParentsInfo";

type TxBeginMarker = {
  commandIndex: number;
  nestingLevel: number; // Must be positive, 1 = outermost. May not be needed?
};

type TxCommitMarker = TxBeginMarker & {
  // Use predicate so it can be evaluated at runtime (inside execute())
  predicate: () => boolean;
};

type CommandScope = {
  startAt: number /* inclusive */;
  endAt: number /* exclusive */;
  nestingLevel: number;
};
type ConditionScope = CommandScope & {
  predicate: () => boolean;
};

type ConditionMarker = {
  predicate: () => boolean;
  commandIndex: number;
};
// type ConditionMarker = {
//   // temporary stack for storing the condition
//   atIndex: number;
//   predicate: () => boolean;
// };
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
  /** txBegins is an array that records the beginTransaction event */
  private txBegins: Array<TxBeginMarker> = [];
  private txCommits: Array<TxCommitMarker> = [];
  private txNestingLevel = 0; // initially no nesting44
  private ifConditions: Array<ConditionScope> = [];
  private pendingIfConditions: Array<ConditionMarker> = [];
  private ifNestingLevel = 0;
  /** commitIndices is an array that records the commitIf event */
  private mostRecentBegin = -1;

  public addTransaction() {
    this.txNestingLevel++;
    this.txBegins.push({
      commandIndex: this.subCommands.length,
      nestingLevel: this.txNestingLevel
    });
    this.mostRecentBegin = this.subCommands.length;
  }

  public addCommitIf(predicate: () => boolean) {
    if (this.txNestingLevel > 0) {
      if (this.subCommands.length > this.mostRecentBegin) {
        // Make sure this is not an empty transaction
        this.txCommits.push({
          commandIndex: this.subCommands.length,
          nestingLevel: this.txNestingLevel,
          predicate
        });
      } else {
        this.txBegins.pop();
        if (this.txBegins.length > 0) {
          this.mostRecentBegin =
            this.txBegins[this.txBegins.length - 1].commandIndex;
        } else this.mostRecentBegin = -1;
        console.debug(`Transaction with empty commands, ignored `);
      }
      this.txNestingLevel--;
    } else throw "Attempt to commit when not in a CommandGroup transaction";
  }

  public addCondition(predicate: () => boolean) {
    this.ifNestingLevel++; // One if-level deeper
    this.pendingIfConditions.push({
      commandIndex: this.subCommands.length,
      predicate
    });
  }

  public addEndCondition() {
    if (this.pendingIfConditions.length > 0) {
      // We must have a prior call to addCondition()
      const { commandIndex, predicate } = this.pendingIfConditions.pop()!;
      if (commandIndex < this.subCommands.length) {
        // Must confirm that addCondition() and addEndCondition() are
        // not enclosing an empty block of commands
        this.ifConditions.push({
          startAt: commandIndex,
          endAt: this.subCommands.length,
          nestingLevel: this.ifNestingLevel,
          predicate
        });
      } else {
        console.debug(`Conditional block with empty commands, ignored`);
      }
      this.ifNestingLevel--; // One if-level shallower
    } else
      throw `No matching condition for end condition at ${this.subCommands.length}`;
  }

  execute(fromRedo?: boolean): void {
    if (
      this.txBegins.length === 0 && // No transactions
      this.ifConditions.length === 0 && // No if-blocks
      this.pendingIfConditions.length === 0 // If-blocks pair up 1-to-1 with their Endif
    ) {
      super.execute(fromRedo); // Invoke superclass method to execute without transaction
    } else if (this.txNestingLevel === 0 && this.ifNestingLevel === 0) {
      // Transaction and IF nesting level must be zero at time of command execution
      const rollbackTarget: Array<number> = [];
      // Keep track of command scope that must be purged later
      // These command scopes originate from both transactions/IF-blocks
      const purgeCandidates: Array<CommandScope> = [];
      let beginIdx = 0;
      let txLevel = 0; // transaction nesting depth
      // Remember the (implied) index of
      let nextBeginCommandAt = -1; // In absence of commit points, use -1 so
      let nextCommitCommandAt = -1; // comparison with cmdPos is always false
      if (this.txCommits.length > 0) {
        nextBeginCommandAt = this.txBegins[0].commandIndex;
        nextCommitCommandAt = this.txCommits[0].commandIndex;
      }
      let nextIfCommandAt = -1;
      let nextEndIfCommandAt = -1;
      // Ensure that ifConditions are sorted (descending) by their start position
      // When two IF begins at the same start position, break the tie using
      // their nesting level.
      // In the following loop, the ifConditions array will be treated as a stack
      this.ifConditions.sort((a, b) => {
        if (a.startAt !== b.startAt) return b.startAt - a.startAt;
        return b.nestingLevel - a.nestingLevel;
      });
      let nextCondition = this.ifConditions.pop();
      if (nextCondition) {
        nextIfCommandAt = nextCondition.startAt;
        nextEndIfCommandAt = nextCondition.endAt;
      }
      let commitIdx = 0;
      let cmdPos = 0; // index to the current command being executed
      // The while-loop upperbound is intentionally made inclusive to handle the case
      // when commitIf() is the very last event to execute in the command group
      while (cmdPos <= this.subCommands.length) {
        // Use a loop, in case we have a nested transaction which begins at the same index
        while (cmdPos === nextBeginCommandAt) {
          // Are we at beginTransaction()
          rollbackTarget.push(cmdPos); // Remember the position to rollback to
          beginIdx++; // prepare for the next beginTransaction()
          txLevel++; // we are now one level deeper in nesting depth
          if (beginIdx < this.txBegins.length) {
            nextBeginCommandAt = this.txBegins[beginIdx].commandIndex;
          } else {
            nextBeginCommandAt = -1;
          }
        }
        // Use a loop, in case we have a nested transaction which ends at the same index
        while (cmdPos === nextCommitCommandAt) {
          // Are we at commitIf()?
          const thisCommit = this.txCommits[commitIdx];
          const rollbackTo = rollbackTarget.pop()!; // index in commandHistory to rollback to
          if (thisCommit.predicate() === false) {
            // If the commit condition is not satisfied, we have to rollback
            let purgeCount = 0;
            for (let rb = cmdPos - 1; rb >= rollbackTo; rb--) {
              purgeCount++;
              this.subCommands[rb].restoreState();
            }
            // purge failed commands from the history
            // We don't want to splice() the subcommands array now, because it will
            // mess up the index numberings recorded in the txBegins and txCommits arrays
            // So we keep the purge details in an array and splice() the subcommands
            // after all the commands have been executed
            if (purgeCount > 0)
              purgeCandidates.push({
                startAt: rollbackTo,
                endAt: cmdPos,
                nestingLevel: txLevel
              });
          }
          txLevel--; // we are now one level shallower in nesting depth
          // Get the command index of the next commit (if any)
          commitIdx++;
          if (commitIdx < this.txCommits.length) {
            nextCommitCommandAt = this.txCommits[commitIdx].commandIndex;
          } else {
            nextCommitCommandAt = -1;
          }
        }
        while (cmdPos === nextIfCommandAt) {
          // We are at the beginning of an IF-block
          if (nextCondition!.predicate!() === false) {
            // console.debug(
            //   `Condition at ${cmdPos} evaluates to false, removing if-blocked enclosed by [${nextIfCommandAt},${nextEndIfCommandAt}]`
            // );
            // Keep a record of what command range that must be removed (later)
            purgeCandidates.push({
              startAt: nextCondition!.startAt,
              endAt: nextCondition!.endAt,
              nestingLevel: nextCondition!.nestingLevel
            });
            // Execution should continue after the end of this if-block
            cmdPos = nextEndIfCommandAt;

            // Remove other IF-blocks enclosed within this one
            let isEnclosed = true;
            nextCondition = this.ifConditions.pop();
            while (isEnclosed && nextCondition) {
              // if the start index of the next if-block is AFTER the end index of this if-block
              // the next if-block is NOT enclosed
              if (nextCondition.startAt >= nextEndIfCommandAt)
                isEnclosed = false;
              else {
                // Save the enclosed scope in purgeCandidates?
                purgeCandidates.push({
                  startAt: nextCondition.startAt,
                  endAt: nextCondition.endAt,
                  nestingLevel: nextCondition.nestingLevel
                });
                console.debug(
                  `[${nextCondition.startAt}, ${nextCondition.endAt}] is enclosed by [${nextIfCommandAt}, ${nextEndIfCommandAt}]`
                );
                nextCondition = this.ifConditions.pop();
              }
            }
          } else {
            // console.debug(`Condition at ${cmdPos} evaluates to true`);
            nextCondition = this.ifConditions.pop();
          }
          if (nextCondition) {
            nextIfCommandAt = nextCondition.startAt;
            nextEndIfCommandAt = nextCondition.endAt;
          } else {
            nextIfCommandAt = -1;
            nextEndIfCommandAt = -1;
          }
        }
        if (cmdPos < this.subCommands.length) {
          // const opString = this.subCommands[cmdPos].toOpcode();
          // console.debug(
          //   `Executing command at position ${cmdPos} ${opString
          //     ?.toString()
          //     .substring(0, 40)}`
          // );
          this.subCommands[cmdPos].saveState();
          this.subCommands[cmdPos].do();
        }
        cmdPos++;
      }
      if (purgeCandidates.length > 0) {
        // purgeCandidates from transaction commits are already sorted in ascending
        // order of end index & descending order of their nesting.
        // But purgeCandidates from IF-blocks are not
        purgeCandidates.sort((a, b) => {
          if (a.endAt !== b.endAt) return a.endAt - b.endAt;
          return b.nestingLevel - a.nestingLevel;
        });
        // When a nested (failing) transaction is enclosed by another failing
        // transaction, we need to remove only once (i.e. the enclosing range)
        // For instance [3,8] failed and is enclosed in [2,11] which also failed.
        // It is unnecessary to purge [3,8], we just need to purge [2,11]
        const purgeVictims: Array<CommandScope> = [];
        let currentRange = purgeCandidates.pop()!;
        purgeVictims.push(currentRange);
        let rangeStart = currentRange.startAt;
        let rangeEnd = currentRange.endAt;
        while (purgeCandidates.length > 0) {
          const thisRange = purgeCandidates.pop()!;
          if (thisRange.startAt < rangeStart || thisRange.endAt > rangeEnd) {
            // thisRange is not enclosed in the current range
            purgeVictims.push(thisRange);
            rangeStart = thisRange.startAt;
            rangeEnd = thisRange.endAt;
          } else {
            // Overlapping range and can be ignored
          }
        }
        purgeVictims.forEach(v => {
          const len = v.endAt - v.startAt;
          this.subCommands.splice(v.startAt, len);
        });
      }
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
    } else {
      if (this.txNestingLevel != 0) {
        const missing = this.txBegins.length - this.txCommits.length;
        throw `You are missing ${missing} (or ${this.txNestingLevel}) commits`;
      } else {
        throw `You are missing ${this.ifNestingLevel}) end conditions`;
      }
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
        // if (!result.success) {
        //   errorIndex = i;
        //   break;
        // }
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

  do(): void {
    // console.log("CG DO", this.subCommands.length, this.subCommands[0])
    this.subCommands.forEach(x => {
      x.do();
    });
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

  /** Combine the top two commands in the commandHistory so that
   * every time a user clicks do or undo a graphical change is observed
   */
  static combineTopTwoCommands(): void {
    if (this.commandHistory.length < 2) {
      throw console.error(
        "There are not two commands in the command history stack to combine!"
      );
    } else {
      // remove the top two elements
      const topElement = this.commandHistory.pop() as Command | CommandGroup;
      const secondToTopElement = this.commandHistory.pop() as
        | Command
        | CommandGroup;
      if (
        topElement instanceof CommandGroup &&
        secondToTopElement instanceof CommandGroup
      ) {
        topElement.subCommands.forEach(cmd =>
          secondToTopElement.addCommand(cmd)
        );
        this.commandHistory.push(secondToTopElement);
      } else if (
        topElement instanceof CommandGroup &&
        secondToTopElement instanceof Command
      ) {
        topElement.subCommands.unshift(secondToTopElement);
        this.commandHistory.push(topElement);
      } else if (
        topElement instanceof Command &&
        secondToTopElement instanceof CommandGroup
      ) {
        secondToTopElement.subCommands.push(topElement);
        this.commandHistory.push(secondToTopElement);
      } else {
        const cmdGroup = new CommandGroup();
        cmdGroup.addCommand(secondToTopElement);
        cmdGroup.addCommand(topElement);
        this.commandHistory.push(cmdGroup);
      }
    }
  }
}
