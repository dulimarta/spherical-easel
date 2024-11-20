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
import { SEText } from "@/models/SEText";

export class TextMoverVisitor implements Visitor {
  private locationVector: Vector3 = new Vector3();

  setNewLocation(vec: Vector3): void {
    this.locationVector.copy(vec);
  }

  //#region actionOnPoint
  actionOnPoint(p: SEPoint): boolean {
    return false;
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
  //eslint-disable-next-line
  actionOnText(t: SEText): boolean {
    t.shallowUpdate();
    return true;
  }
}
