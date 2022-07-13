import { Command } from "./Command";
import { SavedNames, SEOneDimensional } from "@/types";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SENodule } from "@/models/SENodule";

export class ChangeIntersectionPointPrincipleParent extends Command {
  private oldPrincipleParent: SEOneDimensional;
  private seIntersectionPoint: SEIntersectionPoint;
  private newPrincipleParent: SEOneDimensional | null = null;

  constructor(
    seIntersectionPoint: SEIntersectionPoint,
    oldPrincipleParent: SEOneDimensional
  ) {
    super();
    this.seIntersectionPoint = seIntersectionPoint;
    this.oldPrincipleParent = oldPrincipleParent;
  }

  do(): void {
    console.debug(
      `ChangeIntersectionPointPrinciplePointCommand: do ${this.seIntersectionPoint.name}, old principle: ${this.oldPrincipleParent.name}`
    );
    console.debug(
      `Current principle parents ${this.seIntersectionPoint.principleParent1.name} and ${this.seIntersectionPoint.principleParent2.name}`
    );
    console.debug(
      `Current other parents ${this.seIntersectionPoint.otherParentArray[0].name}`
    );
    this.newPrincipleParent = this.seIntersectionPoint.removePrincipleParent(
      this.oldPrincipleParent
    );
    if (this.newPrincipleParent) {
      this.newPrincipleParent.registerChild(this.seIntersectionPoint);
      this.oldPrincipleParent.unregisterChild(this.seIntersectionPoint);
    } else {
      throw new Error(
        `ChangeIntersectionPointPrincipleParent: Can't remove principle parent ${this.oldPrincipleParent.name} from intersection point ${this.seIntersectionPoint.name} `
      );
    }
  }

  saveState(): void {
    this.lastState = this.seIntersectionPoint.id;
  }

  restoreState(): void {
    console.debug(
      `ChangeIntersectionPointPrinciplePointCommand: restoreState ${
        this.seIntersectionPoint.name
      }, old principle: ${this.oldPrincipleParent.name}, new principle ${
        this.newPrincipleParent ? this.newPrincipleParent.name : "NULL!"
      }`
    );

    if (this.newPrincipleParent) {
      // Add the parent to the list of parents in the SEIntersectionPoint
      this.oldPrincipleParent.registerChild(this.seIntersectionPoint);
      this.newPrincipleParent.unregisterChild(this.seIntersectionPoint);

      this.seIntersectionPoint.replacePrincipleParent(
        this.newPrincipleParent,
        this.oldPrincipleParent
      );
    }
  }
  toOpcode(): null | string | Array<string> {
    return [
      "ChangeIntersectionPointPrinciplePoint",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // Object specific attributes
      "changePrincipleParentSEIntersectionPointName=" +
        Command.symbolToASCIIDec(this.seIntersectionPoint.name),
      "changePrincipleParentOldPrincipleName=" +
        Command.symbolToASCIIDec(this.oldPrincipleParent.name)
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
    const seIntersectionPoint = objMap.get(
      propMap.get("changePrincipleParentSEIntersectionPointName") ?? ""
    ) as SEIntersectionPoint | undefined;

    const oldPrincipleParent = objMap.get(
      propMap.get("changePrincipleParentOldPrincipleName") ?? ""
    ) as SEOneDimensional | undefined;

    if (seIntersectionPoint && oldPrincipleParent) {
      return new ChangeIntersectionPointPrincipleParent(
        seIntersectionPoint,
        oldPrincipleParent
      );
    }
    throw new Error(
      `Change Principle Parent Command: SEIntersection point ${seIntersectionPoint} or old principle parent ${oldPrincipleParent} doesn't exist`
    );
  }
}
