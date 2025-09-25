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

export class LineNormalVisitor implements Visitor {
  private normalVector: Vector3 = new Vector3();

  setNewNormal(vec: Vector3): void {
    this.normalVector.copy(vec);
  }

  // eslint-disable-next-line
  actionOnPoint(p: SEPoint): boolean {
    // p.update();
    return false;
  }

  actionOnLine(m: SELine): boolean {
    m.normalVector = this.normalVector; // Set the new position vector
    //console.log("position mover on point", m.name);
    // Don't update here, because it may cause a point on one dimensional to update to the wrong location
    // The undo and restore methods of command cause one update for display at the end of every command or
    // command group
    // m.update();
    return true;
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
