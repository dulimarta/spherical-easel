import { Command } from "./Command";
import { SavedNames, SEOneDimensional } from "@/types";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SENodule } from "@/models/SENodule";

export class RemoveIntersectionPointOtherParent extends Command {
  private seOtherParent: SEOneDimensional;
  private seIntersectionPoint: SEIntersectionPoint;

  constructor(
    seIntersectionPoint: SEIntersectionPoint,
    seOtherParent: SEOneDimensional
  ) {
    super();
    this.seOtherParent = seOtherParent;
    this.seIntersectionPoint = seIntersectionPoint;
  }

  do(): void {
    console.debug(`Remove intersection point parent`);
    this.seIntersectionPoint.removeIntersectionOtherParent(this.seOtherParent);
  }

  saveState(): void {
    this.lastState = this.seIntersectionPoint.id;
  }
  restoreState(): void {
    // Add the parent to the list of parents in the SEIntersectionPoint
    this.seIntersectionPoint.addIntersectionOtherParent(this.seOtherParent);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "RemoveIntersectionPointOtherParent",
      // Object specific attributes
      "intersectionPointName=" + this.seIntersectionPoint.name,
      "intersectionPointOtherParentName=" + this.seOtherParent.name
    ].join("&");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    // console.log(command);
    const tokens = command.split("&");
    const propMap = new Map<SavedNames, string>();
    // load the tokens into the map
    tokens.forEach((token, ind) => {
      if (ind === 0) return; // don't put the command type in the propMap
      const parts = token.split("=");
      propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
    });

    // get the object specific attributes
    const intersectionPoint = objMap.get(
      propMap.get("intersectionPointName") ?? ""
    ) as SEIntersectionPoint | undefined;

    const intersectionPointOtherParent = objMap.get(
      propMap.get("intersectionPointOtherParentName") ?? ""
    ) as SEOneDimensional | undefined;

    if (intersectionPoint && intersectionPointOtherParent) {
      return new RemoveIntersectionPointOtherParent(
        intersectionPoint,
        intersectionPointOtherParent
      );
    }
    throw new Error(
      `RemoveIntersectionPointOtherParentCommand: ${intersectionPoint} or ${intersectionPointOtherParent} is undefined`
    );
  }
}
