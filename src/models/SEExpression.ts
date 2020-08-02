import { SENodule } from "./SENodule";
import { Styles } from "@/types/Styles";
import { UpdateStateType } from "@/types";
import { Vector3 } from "three";
let EXPR_COUNT = 0;

const emptySet = new Set<Styles>();
export abstract class SEExpression extends SENodule {
  constructor() {
    super();
    EXPR_COUNT++;
    this.name = `M${EXPR_COUNT}`;
  }
  /* TODO: Evaluate or get the value of the expressions */
  abstract get value(): number;

  public customStyles = (): Set<Styles> => emptySet;

  public update = (state: UpdateStateType): void => {
    // No code here
  };

  /**
   * Is the object hit a point at a particular sphere location?
   * @param sphereVector a location on the ideal unit sphere
   */
  public isHitAt = (unitIdealVector: Vector3): boolean => false;
}
