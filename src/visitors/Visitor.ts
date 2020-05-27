import { SEPoint } from "@/models/SEPoint";
/**
 * Use the Visitor design pattern to apply operation on different types
 * of geometric objects. The non-abstract class that implements this
 * interface is the actual implementer of the operation.
 */
export interface Visitor {
  actionOnPoint(p: SEPoint): void;

  // TODO: add the following abstract methods later
  /*
  actionOnLine(x:SELine): void;
  actionOnCircle(x:SECircle): void;
  */
}
