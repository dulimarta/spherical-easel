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

export class LineNormalVisitor implements Visitor {
  private normalVector: Vector3 = new Vector3();

  setNewNormal(vec: Vector3): void {
    this.normalVector.copy(vec);
  }

  // eslint-disable-next-line
  actionOnPoint(p: SEPoint): void {
    // p.update();
  }

  actionOnLine(m: SELine): void {
    m.normalVector = this.normalVector; // Set the new position vector
    //console.log("position mover on point", m.name);
    // Don't update here, because it may cause a point on one dimensional to update to the wrong location
    // The undo and restore methods of command cause one update for display at the end of every command or
    // command group
    // m.update();
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
  actionOnLabel(l: SELabel): void {
    // l.update();
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
