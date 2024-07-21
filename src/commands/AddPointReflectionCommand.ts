import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SETranslation } from "@/models/SETranslation";
import { SESegment } from "@/models/SESegment";
import { SavedNames } from "@/types";
import { AddTranslationCommand } from "./AddTranslationCommand";
import { SEPointReflection } from "@/models/SEPointReflection";
import { SEPoint } from "@/models/SEPoint";
import { toSVGType } from "@/types";

export class AddPointReflectionCommand extends Command {
  private sePointReflection: SEPointReflection;
  private sePointOfReflection: SEPoint;

  constructor(sePointReflection: SEPointReflection, parent: SEPoint) {
    super();
    this.sePointReflection = sePointReflection;
    this.sePointOfReflection = parent;
  }
  do(): void {
    Command.store.addTransformation(this.sePointReflection);
    this.sePointOfReflection.registerChild(this.sePointReflection);
  }

  saveState(): void {
    this.lastState = this.sePointReflection.id;
  }

  restoreState(): void {
    this.sePointOfReflection.unregisterChild(this.sePointReflection);
    Command.store.removeTransformation(this.lastState);
  }

  toSVG(deletedNoduleIds: Array<number>): null | toSVGType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddPointReflection",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.sePointReflection.name),
      "objectExists=" + this.sePointReflection.exists,
      // "objectShowing=" + this.seTranslation.showing, // this object is always showing so showing has no effect

      // Object specific attributes
      "pointReflectionPointName=" +
        Command.symbolToASCIIDec(this.sePointOfReflection.name)
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
    const pointOfReflection = objMap.get(
      propMap.get("pointReflectionPointName") ?? ""
    ) as SEPoint | undefined;

    if (pointOfReflection) {
      const pointReflection = new SEPointReflection(pointOfReflection);

      //put the pointReflection in the object map
      if (propMap.get("objectName") !== undefined) {
        pointReflection.name = propMap.get("objectName") ?? "";
        // pointReflection.showing = propMap.get("objectShowing") === "true";
        pointReflection.exists = propMap.get("objectExists") === "true";
        objMap.set(pointReflection.name, pointReflection);
      } else {
        throw new Error(
          "AddPointReflectionCommand: PointReflection name doesn't exist"
        );
      }
      return new AddPointReflectionCommand(pointReflection, pointOfReflection);
    }
    throw new Error(
      `AddPointReflectionCommand: ${pointOfReflection} is undefined`
    );
  }
}
