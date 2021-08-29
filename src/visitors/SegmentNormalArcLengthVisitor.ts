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

export class SegmentNormalArcLengthVisitor implements Visitor {
  private normalVector: Vector3 = new Vector3();
  private arcLength = 0;

  setNewNormal(vec: Vector3): void {
    this.normalVector.copy(vec);
  }
  setNewArcLength(num: number): void {
    this.arcLength = num;
  }

  // eslint-disable-next-line
  actionOnPoint(p: SEPoint): void {
    // p.update();
  }

  // eslint-disable-next-line
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
    //s.update();
  }

  // eslint-disable-next-line
  actionOnCircle(c: SECircle): void {
    // c.update();
  }
  // eslint-disable-next-line
  actionOnLabel(l: SELabel): void {
    // l.update();
  }
  // eslint-disable-next-line
  actionOnEllipse(e: SEEllipse): void {
    //Ellipses are completely determined by three points they depend on so no need to update them
  }

  // eslint-disable-next-line
  actionOnAngleMarker(a: SEAngleMarker): void {
    //AngleMarekrs are completely determined by their parents so no need to update them
  }
  // eslint-disable-next-line
  actionOnParametric(p: SEParametric): void {
    //Parametric curves are completely determined by their parents so no need to update them
  }
  // eslint-disable-next-line
  actionOnPolygon(p: SEPolygon): void {
    //Parametric curves are completely determined by their parents so no need to update them
  }
}
