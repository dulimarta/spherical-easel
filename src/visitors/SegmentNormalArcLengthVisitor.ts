import { Visitor } from "./Visitor";
import { SEPoint } from "@/models-spherical/SEPoint";
import { SELine } from "@/models-spherical/SELine";
import { Vector3 } from "three";
import { SECircle } from "@/models-spherical/SECircle";
import { SESegment } from "@/models-spherical/SESegment";
import { SELabel } from "@/models-spherical/SELabel";
import { SEEllipse } from "@/models-spherical/SEEllipse";
import { SEAngleMarker } from "@/models-spherical/SEAngleMarker";
import { SEParametric } from "@/models-spherical/SEParametric";
import { SEPolygon } from "@/models-spherical/SEPolygon";
import { SEText } from "@/models-spherical/SEText";

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
  actionOnPoint(p: SEPoint): boolean {
    // p.update();
    return false;
  }

  // eslint-disable-next-line
  actionOnLine(m: SELine): boolean {
    // m.update();
    return false;
  }

  actionOnSegment(s: SESegment): boolean {
    s.normalVector = this.normalVector; // Set the new normal vector
    s.arcLength = this.arcLength; // set the new arcLength
    //console.log("position mover on segment", s.name, s.normalVector.toFixed(2));
    // Don't update here, because it may cause a point on one dimensional to update to the wrong location
    // The undo and restore methods of command cause one update for display at the end of every command or
    // command group
    //s.update();
    return true;
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
    //Ellipses are completely determined by three points they depend on so no need to update them
    return false;
  }

  // eslint-disable-next-line
  actionOnAngleMarker(a: SEAngleMarker): boolean {
    //AngleMarekrs are completely determined by their parents so no need to update them
    return false;
  }
  // eslint-disable-next-line
  actionOnParametric(p: SEParametric): boolean {
    //Parametric curves are completely determined by their parents so no need to update them
    return false;
  }
  // eslint-disable-next-line
  actionOnPolygon(p: SEPolygon): boolean {
    //Parametric curves are completely determined by their parents so no need to update them
    return false;
  }
}
