import { SEPoint } from "@/models-spherical/SEPoint";
import { SELine } from "@/models-spherical/SELine";
import { SESegment } from "@/models-spherical/SESegment";
import { SECircle } from "@/models-spherical/SECircle";
import { SELabel } from "@/models-spherical/SELabel";
import { SEEllipse } from "@/models-spherical/SEEllipse";
import { SEAngleMarker } from "@/models-spherical/SEAngleMarker";
import { SEParametric } from "@/models-spherical/SEParametric";
import { SEPolygon } from "@/models-spherical/SEPolygon";
import { SEText } from "@/models-spherical/SEText";
// import { SEAngleMarker } from "@/models-spherical/SEAngleMarker";
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
  //actionOnText(t: SEText): boolean; // THis is not needed because the visitors handle the rotation and text objects do not rotate
  //actionOnTransformation(T: SETransformation):boolean; // This is not needed because the visitors do geometric updates, and the transformations have no geometric representation on the sphere
}
