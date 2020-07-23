import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Matrix4, Vector3, Matrix3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { UpdateMode, UpdateStateType } from "@/types";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";

export class PointMoverVisitor implements Visitor {
  private locationVector: Vector3 = new Vector3();

  setNewLocation(vec: Vector3): void {
    this.locationVector.copy(vec);
  }

  //#region actionOnPoint
  actionOnPoint(p: SEPoint): void {
    if (!(p instanceof SEPointOnOneDimensional)) {
      p.locationVector = this.locationVector; // Set the new position vector
    } else {
      p.pointMoverLocationSetter(this.locationVector);
      console.log("here");
    }
    //console.log("position mover on point", p.name, p.locationVector.toFixed(2));
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
}
