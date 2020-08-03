import Point from "../plottables/Point";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SENodule } from "./SENodule";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { Styles } from "@/types/Styles";
import {
  UpdateMode,
  UpdateStateType,
  PointState,
  SEOneDimensional
} from "@/types";

let POINT_COUNT = 0;
const styleSet = new Set([
  Styles.fillColor,
  Styles.strokeColor,
  Styles.pointRadiusPercent,
  Styles.opacity,
  Styles.dynamicBackStyle
]);

export class SEPoint extends SENodule implements Visitable {
  /* This should be the only reference to the plotted version of this SEPoint */
  public ref: Point;

  /**
   * The vector location of the SEPoint on the ideal unit sphere
   */
  protected _locationVector = new Vector3();

  /**
   * Create a model SEPoint using:
   * @param point The plottable TwoJS Object associated to this object
   */
  constructor(point: Point) {
    super();
    /* Establish the link between this abstract object on the fixed unit sphere
    and the object that helps create the corresponding renderable object  */
    this.ref = point;
    POINT_COUNT++;
    this.name = `P-${POINT_COUNT}`;
  }
  customStyles(): Set<Styles> {
    return styleSet;
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    //These points always exist - they have no parents to depend on

    //Update the location of the associate plottable Point (setter also updates the display)
    this.ref.positionVector = this._locationVector;

    if (this.showing) {
      this.ref.updateDisplay();
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // Record the state of the object in state.stateArray if necessary
    //#region saveState
    // Create a point state for a Move or delete if necessary
    if (
      state.mode == UpdateMode.RecordStateForDelete ||
      state.mode == UpdateMode.RecordStateForMove
    ) {
      // If the parent points of the segment are antipodal, the normal vector determines the
      // plane of the segment.  The points also don't determine the arcLength of the segments.
      // Both of these quantities could change during a move therefore store normal vector and arcLength
      // in stateArray for undo move. (No need to store the parent points, they will be updated on their own
      // before this line is updated.) Store the coordinate values of the vector and not the point to the vector.
      const pointState: PointState = {
        kind: "point",
        locationVectorX: this._locationVector.x,
        locationVectorY: this._locationVector.y,
        locationVectorZ: this._locationVector.z,
        object: this
      };
      state.stateArray.push(pointState);
    }
    //#endregion saveState
    this.updateKids(state);
  }

  /**
   * Set or get the location vector of the SEPoint on the unit ideal sphere
   */
  set locationVector(pos: Vector3) {
    // Record the location on the unit ideal sphere of this SEPoint
    this._locationVector.copy(pos).normalize();
    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this._locationVector;
  }
  get locationVector(): Vector3 {
    return this._locationVector;
  }

  accept(v: Visitor): void {
    v.actionOnPoint(this);
  }

  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    return (
      this._locationVector.distanceTo(unitIdealVector) <
      SETTINGS.point.hitIdealDistance / currentMagnificationFactor
    );
  }

  // I wish the SENodule methods would work but I couldn't figure out how
  // See the attempts in SENodule
  public isFreePoint(): boolean {
    return this._parents.length === 0;
  }
  public isOneDimensional(): this is SEOneDimensional {
    return false;
  }
  public isPoint(): boolean {
    return true;
  }
  public isPointOnOneDimensional(): false {
    return false;
  }
}
