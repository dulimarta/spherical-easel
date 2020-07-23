import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Matrix4, Vector3, Matrix3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { UpdateMode, UpdateStateType } from "@/types";

export class LineNormalVisitor implements Visitor {
  private normalVector: Vector3 = new Vector3();

  setNewNormal(vec: Vector3): void {
    this.normalVector.copy(vec);
  }

  actionOnPoint(p: SEPoint): void {
    // p.update();
  }

  actionOnLine(m: SELine): void {
    m.normalVector = this.normalVector; // Set the new position vector
    console.log("position mover on point", m.name);
    m.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }

  actionOnSegment(s: SESegment): void {
    // s.update();
  }

  actionOnCircle(c: SECircle): void {
    // c.update();
  }
}
