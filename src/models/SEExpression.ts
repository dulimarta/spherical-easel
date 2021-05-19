import { SENodule } from "./SENodule";
import { Styles } from "@/types/Styles";
import { SEOneDimensional, UpdateStateType, UpdateMode } from "@/types";
import { Vector3 } from "three";
let EXPR_COUNT = 0;

const emptySet = new Set<Styles>();
export abstract class SEExpression extends SENodule {
  constructor() {
    super();
    EXPR_COUNT++;
    this.name = `M${EXPR_COUNT}`;
  }

  public isPointOnOneDimensional(): boolean {
    return false;
  }
  public isFreePoint(): boolean {
    return false;
  }
  public isPoint(): boolean {
    return false;
  }
  public isOneDimensional(): this is SEOneDimensional {
    return false;
  }
  public isSegmentOfLengthPi(): boolean {
    return false;
  }
  public isLabelable(): boolean {
    return false;
  }
  public isLabel(): boolean {
    return false;
  }
  /* TODO: Evaluate or get the value of the expressions */
  abstract get value(): number;

  protected get prettyValue(): string {
    return this.value.toFixed(3);
  }

  public customStyles = (): Set<Styles> => emptySet;

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

  public update(state: UpdateStateType): void {
    if (state.mode !== UpdateMode.DisplayOnly) return;
    if (!this.canUpdateNow()) return;
    const pos = this.name.lastIndexOf("):");
    this.name = this.name.substring(0, pos + 2) + this.prettyValue;
    this.setOutOfDate(false);
    this.updateKids(state);
  }
}
