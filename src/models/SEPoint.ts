import Point from "../plotables/Point";
import { SELine, SECircle } from "@/types";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";

export class SEPoint implements Visitable {
  public ref: Point;
  public startOf: SELine[] = [];
  public endOf: SELine[] = [];
  public centerOf: SECircle[] = [];
  public circumOf: SECircle[] = [];
  constructor(p: Point) {
    this.ref = p;
  }
  accept(v: Visitor): void {
    v.positionUpdateVisitor(this);
  }
}
