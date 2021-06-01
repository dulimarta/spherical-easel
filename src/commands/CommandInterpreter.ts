import EventBus from "@/eventHandlers/EventBus";
import { SENodule } from "@/models/SENodule";
import { AddAntipodalPointCommand } from "./AddAntipodalPointCommand";
import { AddCircleCommand } from "./AddCircleCommand";
import { AddIntersectionPointCommand } from "./AddIntersectionPointCommand";
import { AddLineCommand } from "./AddLineCommand";
import { AddPerpendicularLineThruPointCommand } from "./AddPerpendicularLineThruPointCommand";
import { AddPointCommand } from "./AddPointCommand";
import { AddPointOnOneDimensionalCommand } from "./AddPointOnOneDimensionalCommand";
import { AddSegmentCommand } from "./AddSegmentCommand";
import { AddAngleMarkerCommand } from "./AddAngleMarkerAndExpressionCommand";
import { Command } from "./Command";
import { CommandGroup } from "./CommandGroup";
export type ConstructionScript = Array<string | Array<string>>;

const noduleDictionary = new Map<string, SENodule>();

function executeIndividual(command: string): Command {
  // console.log("Dictionary contains", noduleDictionary.size, " objects");
  const slashPos = command.indexOf("/");
  if (slashPos < 0) {
    const errMsg = `Invalid command format: ${command}`;
    EventBus.fire("show-alert", {
      key: errMsg,
      type: "error"
    });
    throw new Error(errMsg);
  }
  const opCode = command.substring(0, slashPos);
  // Use exact comparison (and not startsWith) because a command name
  // can be a prefix of another command name
  // (example: AddPoint and AddPointOnOneDimensional)
  if (opCode === "AddPoint")
    return AddPointCommand.parse(command, noduleDictionary);
  else if (opCode === "AddPointOnOneDimensional") {
    return AddPointOnOneDimensionalCommand.parse(command, noduleDictionary);
  } else if (opCode === "AddIntersectionPoint")
    return AddIntersectionPointCommand.parse(command, noduleDictionary);
  else if (opCode === "AddSegment")
    return AddSegmentCommand.parse(command, noduleDictionary);
  else if (opCode === "AddLine")
    return AddLineCommand.parse(command, noduleDictionary);
  else if (opCode === "AddCircle")
    return AddCircleCommand.parse(command, noduleDictionary);
  else if (opCode === "AddAntipodalPoint")
    return AddAntipodalPointCommand.parse(command, noduleDictionary);
  else if (opCode === "AddPerpendicularLineThruPoint")
    return AddPerpendicularLineThruPointCommand.parse(
      command,
      noduleDictionary
    );
  else if (opCode == "AddAngleMarker") {
    return AddAngleMarkerCommand.parse(command, noduleDictionary);
  } else {
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
    // console.log("Command", command);
    executeIndividual(command).execute();
  } else {
    // This is a CommandGroup, interpret each command individually
    const group = new CommandGroup();
    command
      // Remove leading and training quotes
      .map((s: string) => s.replace(/^"/, "").replace(/"$/, ""))
      .forEach((c: string /*, gPos: number*/) => {
        // console.log("Sub-command", gPos, c);
        group.addCommand(executeIndividual(c));
      });
    // Then execute as a group
    group.execute();
  }
}

export function run(script: ConstructionScript): void {
  // console.log("Running script", script);
  // Reset the command history before interpreting a new script
  noduleDictionary.clear();
  Command.commandHistory.splice(0);
  Command.redoHistory.splice(0);
  script.forEach((s: string | Array<string>) => {
    interpret(s);
  });
}
