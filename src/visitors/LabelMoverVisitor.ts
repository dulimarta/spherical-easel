// eslint-disable-file @typescript-eslint/no-unused-vars
import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Vector3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SELabel } from "@/models/SELabel";
import { SEEllipse } from "@/models/SEEllipse";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEParametric } from "@/models/SEParametric";
import { SEPolygon } from "@/models/SEPolygon";

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

  // eslint-disable-next-line
  actionOnPoint(p: SEPoint): void {
    //p.update();
  }

  // eslint-disable-next-line
  actionOnLine(m: SELine): void {
    //m.update();
  }

  // eslint-disable-next-line
  actionOnSegment(s: SESegment): void {
    // s.update();
  }

  // eslint-disable-next-line
  actionOnCircle(c: SECircle): void {
    // c.update();
  }

  // eslint-disable-next-line
  actionOnEllipse(e: SEEllipse): void {
    // e.update();
  }

  // eslint-disable-next-line
  actionOnAngleMarker(a: SEAngleMarker): void {
    //a.update()
  }

  // eslint-disable-next-line
  actionOnParametric(p: SEParametric): void {
    // e.update();
  }

  // eslint-disable-next-line
  actionOnPolygon(p: SEPolygon): void {
    // e.update();
  }
}
