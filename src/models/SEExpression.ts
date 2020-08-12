import { SENodule } from "./SENodule";
import { Styles } from "@/types/Styles";
import { UpdateStateType, SEOneDimensional } from "@/types";
import { Vector3 } from "three";
let EXPR_COUNT = 0;

const emptySet = new Set<Styles>();
export abstract class SEExpression extends SENodule {
  public isPointOnOneDimensional = (): boolean => false;
  public isFreePoint = (): boolean => false;
  public isPoint = (): boolean => false;
  public isOneDimensional = (): this is SEOneDimensional => false;
  public isPointOnOneDimensional = (): boolean => false;

  constructor() {
    super();
    EXPR_COUNT++;
    this.name = `M${EXPR_COUNT}`;
  }
  /* TODO: Evaluate or get the value of the expressions */
  abstract get value(): number;

  public customStyles = (): Set<Styles> => emptySet;

  /**
   * Is the object hit a point at a particular sphere location?
   * @param sphereVector a location on the ideal unit sphere
   */
  public isHitAt = (
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean => false;

  public isLabel(): boolean {
    return false;
  }
}
