import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Vector3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
// import { UpdateMode, UpdateStateType } from "@/types";

export class SegmentNormalArcLengthVisitor implements Visitor {
  private normalVector: Vector3 = new Vector3();
  private arcLength = 0;

  setNewNormal(vec: Vector3): void {
    this.normalVector.copy(vec);
  }
  setNewArcLength(num: number): void {
    this.arcLength = num;
  }

  actionOnPoint(p: SEPoint): void {
    // p.update();
  }

  actionOnLine(m: SELine): void {
    // m.update();
  }

  actionOnSegment(s: SESegment): void {
    s.normalVector = this.normalVector; // Set the new normal vector
    s.arcLength = this.arcLength; // set the new arcLength
    //console.log("position mover on segment", s.name, s.normalVector.toFixed(2));
    // Don't update here, because it may cause a point on one dimensional to update to the wrong location
    // The undo and restore methods of command cause one update for display at the end of every command or
    // command group
    //s.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }

  actionOnCircle(c: SECircle): void {
    // c.update();
  }
}
