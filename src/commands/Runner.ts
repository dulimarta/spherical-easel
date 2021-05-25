import { SENodule } from "@/models/SENodule";
import { AddPointCommand } from "./AddPointCommand";
import { AddSegmentCommand } from "./AddSegmentCommand";

const noduleDictionary = new Map<string, SENodule>();
function executeIndividual(command: string): void {
  console.log("Dictionary contains", noduleDictionary.size, " objects");
  if (command.startsWith("AddPoint"))
    AddPointCommand.parse(command, noduleDictionary);
  else if (command.startsWith("AddSegment"))
    AddSegmentCommand.parse(command, noduleDictionary);
  else throw new Error(`Not yet implemented: ${command}`);
}

/**
 * Reinterpret the command from its script.  The incoming argument
 * is either a string or an array of strings
 *
 * @param command a string that represents a single command or
 *   an array of strings that represents a command group
 */
export function interpret(command: string | Array<string>): void {
  if (typeof command === "string") {
    /* This is an individual command */
    executeIndividual(command);
  } else {
    // This is a CommandGroup, interpret each command individually
    command
      // Remove leading and training quotes
      .map((s: string) => s.replace(/^"/, "").replace(/"$/, ""))
      .forEach((c: string, gPos: number) => {
        executeIndividual(c);
      });
  }
}
