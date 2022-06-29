import { Command } from "./Command";
import { SEOneDimensional } from "@/types";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";

export class RemoveIntersectionPointParent extends Command {
  private seParent: SEOneDimensional;
  private seIntersectionPoint: SEIntersectionPoint;

  constructor(
    seIntersectionPoint: SEIntersectionPoint,
    seParent: SEOneDimensional
  ) {
    super();
    this.seParent = seParent;
    this.seIntersectionPoint = seIntersectionPoint;
  }

  do(): void {
    this.seIntersectionPoint.removeIntersectionParent(this.seParent);
    this.seParent.unregisterChild(this.seIntersectionPoint);
  }

  saveState(): void {
    this.lastState = this.seIntersectionPoint.id;
  }

  restoreState(): void {
    // Add the parent to the intersection point in the DAG
    this.seParent.registerChild(this.seIntersectionPoint);
    // Add the parent to the list of parents in the SEIntersectionPoint
    this.seIntersectionPoint.addIntersectionParent(this.seParent);
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
