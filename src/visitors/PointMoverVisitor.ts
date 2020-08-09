import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { Vector3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";

export class PointMoverVisitor implements Visitor {
  private locationVector: Vector3 = new Vector3();

  setNewLocation(vec: Vector3): void {
    this.locationVector.copy(vec);
  }

  //#region actionOnPoint
  actionOnPoint(p: SEPoint): void {
    // Don't use the usual location setter for points on one dimensional because that will move the label to the location on a possibly out of date parent.
    if (!(p instanceof SEPointOnOneDimensional)) {
      p.locationVector = this.locationVector; // Set the new position vector
    } else {
      p.pointDirectLocationSetter(this.locationVector);
    }

    // Don't update here, because it may cause a point on one dimensional to update to the wrong location
    // The undo and restore methods of command cause one update for display at the end of every command or
    // command group
    //p.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }
  //#endregion actionOnPoint

  actionOnLine(m: SELine): void {
    //m.update();
  }

  actionOnSegment(s: SESegment): void {
    // s.update();
  }

  actionOnCircle(c: SECircle): void {
    // c.update();
  }
  actionOnLabel(l: SELabel): void {
    // l.update();
  }
}
