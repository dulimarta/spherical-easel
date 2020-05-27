import { SEPoint } from "@/models/SEPoint";

export interface Visitor {
  positionUpdateVisitor(p: SEPoint): void;
}
