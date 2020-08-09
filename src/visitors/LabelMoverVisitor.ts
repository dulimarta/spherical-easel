import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Vector3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";
import { SELabel } from "@/models/SELabel";

export class LabelMoverVisitor implements Visitor {
  private locationVector: Vector3 = new Vector3();

  setNewLocation(vec: Vector3): void {
    this.locationVector.copy(vec);
  }

  actionOnLabel(l: SELabel): void {
    // Don't use the usual location setter because that will move the label to the location on a possibly out of date parent.
    // if (!(p instanceof SEPointOnOneDimensional)) {
    //   p.locationVector = this.locationVector; // Set the new position vector
    // } else {
    l.labelDirectLocationSetter(this.locationVector);
    // }
  }

  actionOnPoint(p: SEPoint): void {
    //p.update();
  }

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
