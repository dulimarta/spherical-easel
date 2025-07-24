import { Vector3 } from "three";
import { HENodule } from "./HENodule";

export class HELabel extends HENodule {
  constructor(parentName: string, pos: Vector3, dir: Vector3) {
    super();
  }
  public update(): void {
    throw new Error("Method not implemented.");
  }
  public shallowUpdate(): void {
    throw new Error("Method not implemented.");
  }
  public glowingDisplay(): void {
    throw new Error("Method not implemented.");
  }
  public normalDisplay(): void {
    throw new Error("Method not implemented.");
  }
}
