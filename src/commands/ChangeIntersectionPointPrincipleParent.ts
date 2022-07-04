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
    this.newPrincipleParent = this.seIntersectionPoint.removePrincipleParent(
      this.oldPrincipleParent
    );
    if (this.newPrincipleParent) {
      this.newPrincipleParent.registerChild(this.seIntersectionPoint);
      this.oldPrincipleParent.unregisterChild(this.seIntersectionPoint);
    } else {
      throw new Error(
        `ChangeIntersectionPointPrincipleParent:  can't remove principle parnet ${this.oldPrincipleParent.name} from intersection point ${this.seIntersectionPoint.name} `
      );
    }
  }

  saveState(): void {
    this.lastState = this.seIntersectionPoint.id;
  }

  restoreState(): void {
    if (this.newPrincipleParent) {
      // Add the parent to the list of parents in the SEIntersectionPoint
      this.oldPrincipleParent.registerChild(this.seIntersectionPoint);
      this.newPrincipleParent.unregisterChild(this.seIntersectionPoint);

      this.seIntersectionPoint.replacePrincipleParent(
        this.oldPrincipleParent,
        this.newPrincipleParent
      );
    }
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
