import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SECircle } from "@/models/SECircle";
import { SavedNames } from "@/types";
import { SEInversion } from "@/models/SEInversion";

export class AddInversionCommand extends Command {
  private seInversion: SEInversion;
  private seCircle: SECircle;

  constructor(seInversion: SEInversion, parent: SECircle) {
    super();
    this.seInversion = seInversion;
    this.seCircle = parent;
  }
  do(): void {
    Command.store.addTransformation(this.seInversion);
    this.seCircle.registerChild(this.seInversion);
  }

  saveState(): void {
    this.lastState = this.seInversion.id;
  }

  restoreState(): void {
    this.seCircle.unregisterChild(this.seInversion);
    Command.store.removeTransformation(this.lastState);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddInversion",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seInversion.name),
      "objectExists=" + this.seInversion.exists,
      // "objectShowing=" + this.seTranslation.showing, // this object is always showing so showing has no effect

      // Object specific attributes
      "inverstionCircleName=" + Command.symbolToASCIIDec(this.seCircle.name)
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
    const circleParent = objMap.get(
      propMap.get("inversionCircleName") ?? ""
    ) as SECircle | undefined;

    if (circleParent) {
      const inversion = new SEInversion(circleParent);

      //put the inversion in the object map
      if (propMap.get("objectName") !== undefined) {
        inversion.name = propMap.get("objectName") ?? "";
        // inversion.showing = propMap.get("objectShowing") === "true";
        inversion.exists = propMap.get("objectExists") === "true";
        objMap.set(inversion.name, inversion);
      } else {
        throw new Error("AddInversionCommand: Inversion name doesn't exist");
      }
      return new AddInversionCommand(inversion, circleParent);
    }
    throw new Error(`AddInversionCommand: ${circleParent} is undefined`);
  }
}
