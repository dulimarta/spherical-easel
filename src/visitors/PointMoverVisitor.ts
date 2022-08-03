import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { Vector3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { SEEllipse } from "@/models/SEEllipse";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEParametric } from "@/models/SEParametric";
import { SEPolygon } from "@/models/SEPolygon";

export class PointMoverVisitor implements Visitor {
  private locationVector: Vector3 = new Vector3();

  setNewLocation(vec: Vector3): void {
    this.locationVector.copy(vec);
  }

  /**
   * Without the pointDirectLocationSetter being called from rotationVisitor and pointMoverVisitor, if you create a line segment, a point on that line segment.
   * Then if you move one endpoint of the line segment (causing the point on it to move maybe by shrinking the original line segment) and then you undo the movement of the
   * endpoint of the line segment, the point on the segment doesn’t return to its proper (original) location.
   */
  //#region actionOnPoint
  actionOnPoint(p: SEPoint): boolean {
    // Don't use the usual location setter for points on one dimensional because that will move the label to the location on a possibly out of date parent.
    if (!(p instanceof SEPointOnOneOrTwoDimensional)) {
      p.locationVector = this.locationVector; // Set the new position vector
    } else {
      p.pointDirectLocationSetter(this.locationVector);
    }
    p.shallowUpdate();
    return true;
  }
  //#endregion actionOnPoint

  // eslint-disable-next-line
  actionOnLine(m: SELine): boolean {
    //m.update();
    return false;
  }

  // eslint-disable-next-line
  actionOnSegment(s: SESegment): boolean {
    // s.update();
    return false;
  }

  // eslint-disable-next-line
  actionOnCircle(c: SECircle): boolean {
    // c.update();
    return false;
  }
  // eslint-disable-next-line
  actionOnLabel(l: SELabel): boolean {
    // l.update();
    return false;
  }
  // eslint-disable-next-line
  actionOnEllipse(e: SEEllipse): boolean {
    // e.update();
    return false;
  }

  // eslint-disable-next-line
  actionOnAngleMarker(a: SEAngleMarker): boolean {
    //a.update()
    return false;
  }
  // eslint-disable-next-line
  actionOnParametric(p: SEParametric): boolean {
    // e.update();
    return false;
  }
  // eslint-disable-next-line
  actionOnPolygon(p: SEPolygon): boolean {
    // e.update();
    return false;
  }
}
