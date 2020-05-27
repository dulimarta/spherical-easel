import { SENode } from "./SENode";
import Line from "@/plotables/Line";
import { SEPoint } from "./SEPoint";
import { Vector3 } from "three";

export class SELine extends SENode {
  public ref: Line;
  private normalDir: Vector3;

  // FIXME: We probably don't have to store the following
  // Keep them here for now to make the rest of the code compiles
  public start: SEPoint | null = null;
  public end: SEPoint | null = null;
  //   public isSegment: boolean;

  constructor(l: Line, normalDir: Vector3) {
    super();
    this.ref = l;
    l.owner = this;
    this.normalDir = new Vector3();
    this.normalDir.copy(normalDir);
  }

  get normalDirection(): Vector3 {
    return this.normalDir;
  }

  set normalDirection(dir: Vector3) {
    this.normalDir.copy(dir);
    this.ref.orientation = dir;
  }
}
