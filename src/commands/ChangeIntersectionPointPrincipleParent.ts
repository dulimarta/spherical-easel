import { Command } from "./Command";
import { SEOneDimensional } from "@/types";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";

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
    return null; // Exclude this command from interpretation
  }
}
