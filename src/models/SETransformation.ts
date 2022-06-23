import { SENodule } from "./SENodule";
import { Vector3 } from "three";
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
