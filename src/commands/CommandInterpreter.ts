import EventBus from "@/eventHandlers/EventBus";
import { SENodule } from "@/models/SENodule";
import { AddIntersectionPointCommand } from "./AddIntersectionPointCommand";
import { AddPointCommand } from "./AddPointCommand";
import { AddSegmentCommand } from "./AddSegmentCommand";
import { Command } from "./Command";
import { CommandGroup } from "./CommandGroup";
export type ConstructionScript = Array<string | Array<string>>;

const noduleDictionary = new Map<string, SENodule>();
function executeIndividual(command: string): Command {
  // console.log("Dictionary contains", noduleDictionary.size, " objects");
  if (command.startsWith("AddPoint"))
    return AddPointCommand.parse(command, noduleDictionary);
  else if (command.startsWith("AddSegment"))
    return AddSegmentCommand.parse(command, noduleDictionary);
  else if (command.startsWith("AddIntersectionPoint"))
    return AddIntersectionPointCommand.parse(command, noduleDictionary);
  else {
    const errMsg = `Not yet implemented: ${command}`;
    EventBus.fire("show-alert", {
      key: `Not yet implemented ${errMsg}`,
      type: "error"
    });
    throw new Error(errMsg);
  }
}

/**
 * Reinterpret the command from its script.  The incoming argument
 * is either a string or an array of strings
 *
 * @param command a string that represents a single command or
 *   an array of strings that represents a command group
 */
function interpret(command: string | Array<string>): void {
  if (typeof command === "string") {
    /* This is an individual command */
    console.log("Command", command);
    executeIndividual(command).execute();
  } else {
    // This is a CommandGroup, interpret each command individually
    const group = new CommandGroup();
    command
      // Remove leading and training quotes
      .map((s: string) => s.replace(/^"/, "").replace(/"$/, ""))
      .forEach((c: string, gPos: number) => {
        console.log("Sub-command", gPos, c);
        group.addCommand(executeIndividual(c));
      });
    // Then execute as a group
    group.execute();
  }
}

export function run(script: ConstructionScript): void {
  console.log("Running script", script);
  // Reset the command history before interpreting a new script
  noduleDictionary.clear();
  Command.commandHistory.splice(0);
  Command.redoHistory.splice(0);
  script.forEach((s: string | Array<string>) => {
    interpret(s);
  });
}
