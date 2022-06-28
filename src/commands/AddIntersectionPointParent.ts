import { Command } from "./Command";
import { SECircle } from "@/models/SECircle";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import Circle from "@/plottables/Circle";
import { Vector3 } from "three";
import Label from "@/plottables/Label";
import { StyleEditPanels } from "@/types/Styles";
import { SavedNames, SEOneDimensional } from "@/types";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";

export class AddIntersectionPointParent extends Command {
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
    // Add the parent to the intersection point in the DAG
    this.seParent.registerChild(this.seIntersectionPoint);
    // Add the parent to the list of parents in the SEIntersectionPoint
    this.seIntersectionPoint.addIntersectionParent(this.seParent);
  }

  saveState(): void {
    this.lastState = this.seIntersectionPoint.id;
  }

  restoreState(): void {
    this.seIntersectionPoint.removeIntersectionParent(this.seParent);
    this.seParent.unregisterChild(this.seIntersectionPoint);
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
