import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SELabel } from "@/models/SELabel";
import { SEEllipse } from "@/models/SEEllipse";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEParametric } from "@/models/SEParametric";
import { SEPolygon } from "@/models/SEPolygon";
import { SEText } from "@/models/SEText";
// import { SEAngleMarker } from "@/models/SEAngleMarker";
/**
 * Use the Visitor design pattern to apply operation on different types
 * of geometric objects. The non-abstract class that implements this
 * interface is the actual implementer of the operation.
 */
export interface Visitor {
  actionOnPoint(p: SEPoint): boolean;
  actionOnLine(x: SELine): boolean;
  actionOnSegment(s: SESegment): boolean;
  actionOnCircle(c: SECircle): boolean;
  actionOnLabel(l: SELabel): boolean;
  actionOnAngleMarker(a: SEAngleMarker): boolean;
  actionOnEllipse(e: SEEllipse): boolean;
  actionOnParametric(P: SEParametric): boolean;
  actionOnPolygon(P: SEPolygon): boolean;
  actionOnText(t: SEText): boolean;
  //actionOnTransformation(T: SETransformation):boolean; // This is not needed because the visitors do geometric updates, and the transformations have no geometric representation on the sphere
}
