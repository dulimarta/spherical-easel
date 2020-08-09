import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SELabel } from "@/models/SELabel";
/**
 * Use the Visitor design pattern to apply operation on different types
 * of geometric objects. The non-abstract class that implements this
 * interface is the actual implementer of the operation.
 */
export interface Visitor {
  actionOnPoint(p: SEPoint): void;
  actionOnLine(x: SELine): void;
  actionOnSegment(s: SESegment): void;
  actionOnCircle(c: SECircle): void;
  actionOnLabel(l: SELabel): void;
}
