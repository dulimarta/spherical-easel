import { Command } from "./Command";
import { SENodule } from "@/models-spherical/SENodule";
import { SETranslation } from "@/models-spherical/SETranslation";
import { SESegment } from "@/models-spherical/SESegment";
import { SavedNames } from "@/types";
import { AddTranslationCommand } from "./AddTranslationCommand";
import { SEReflection } from "@/models-spherical/SEReflection";
import { SELine } from "@/models-spherical/SELine";
import { toSVGType } from "@/types";

export class AddReflectionCommand extends Command {
  private seReflection: SEReflection;
  private seLineOrSegment: SESegment | SELine;

  constructor(seReflection: SEReflection, parent: SESegment | SELine) {
    super();
    this.seReflection = seReflection;
    this.seLineOrSegment = parent;
  }
  do(): void {
    Command.store.addTransformation(this.seReflection);
    this.seLineOrSegment.registerChild(this.seReflection);
  }

  saveState(): void {
    this.lastState = this.seReflection.id;
  }

  restoreState(): void {
    this.seLineOrSegment.unregisterChild(this.seReflection);
    Command.store.removeTransformation(this.lastState);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddReflection",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seReflection.name),
      "objectExists=" + this.seReflection.exists,
      // "objectShowing=" + this.seTranslation.showing, // this object is always showing so showing has no effect

      // Object specific attributes
      "reflectionLineOrSegmentName=" +
        Command.symbolToASCIIDec(this.seLineOrSegment.name)
    ].join("&");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("&");
    const propMap = new Map<SavedNames, string>();
    // load the tokens into the map
    tokens.forEach((token, ind) => {
      if (ind === 0) return; // don't put the command type in the propMap
      const parts = token.split("=");
      propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
    });

    // get the object specific attributes
    const lineOrSegmentParent = objMap.get(
      propMap.get("reflectionLineOrSegmentName") ?? ""
    ) as SELine | SESegment | undefined;

    if (lineOrSegmentParent) {
      const reflection = new SEReflection(lineOrSegmentParent);

      //put the reflection in the object map
      if (propMap.get("objectName") !== undefined) {
        reflection.name = propMap.get("objectName") ?? "";
        // reflection.showing = propMap.get("objectShowing") === "true";
        reflection.exists = propMap.get("objectExists") === "true";
        objMap.set(reflection.name, reflection);
      } else {
        throw new Error("AddReflectionCommand: Reflection name doesn't exist");
      }
      return new AddReflectionCommand(reflection, lineOrSegmentParent);
    }
    throw new Error(
      `AddReflectionCommand: ${lineOrSegmentParent} is undefined`
    );
  }
}
