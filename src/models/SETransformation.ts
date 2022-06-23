import { SENodule } from "./SENodule";
import { Vector3 } from "three";
import { Visitor } from "@/visitors/Visitor";
const emptySet = new Set<string>();

export abstract class SETransformation extends SENodule {
  constructor() {
    super();
    SETransformation.TRANSFORMATION_COUNT++;
  }

  /**
   * f is the central transformation whose inputs are before the transformation
   * is applied and the output is the result of applying the transformation
   */
  public abstract f(preimage: Vector3): Vector3;

  public customStyles = (): Set<string> => emptySet;

  abstract get geometricChild(): SENodule;

  // This always returns false for all transformations because the visitors do geometric updates, and the transformations have no geometric representation on the sphere
  public accept(v: Visitor): boolean {
    return false;
  }
  /**
   * Is the object hit a point at a particular sphere location?
   * Never! This object is not on the sphere
   * @param sphereVector a location on the ideal unit sphere
   */
  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    return false;
  }
  public isTransformation(): boolean {
    return true;
  }
}
