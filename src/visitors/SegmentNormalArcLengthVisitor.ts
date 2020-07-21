import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Matrix4, Vector3, Matrix3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SaveStateMode, SaveStateType } from "@/types";

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
    console.log("position mover on segment", s.name, "set AL", s.arcLength);
    s.update({ mode: SaveStateMode.DisplayOnly, stateArray: [] });
  }

  actionOnCircle(c: SECircle): void {
    // c.update();
  }
}
