import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
/**
 * Use the Visitor design pattern to apply operation on different types
 * of geometric objects. The non-abstract class that implements this
 * interface is the actual implementer of the operation.
 */
export interface Visitor {
  actionOnPoint(p: SEPoint): void;
  actionOnLine(x: SELine): void;

  // TODO: add the following abstract methods later
  /*
  actionOnCircle(x:SECircle): void;
  */
}
