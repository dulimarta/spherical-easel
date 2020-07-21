import Point from "../plottables/Point";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SENodule } from "./SENodule";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { Styles } from "@/types/Styles";
import { SaveStateMode, SaveStateType } from "@/types";

let POINT_COUNT = 0;
const styleSet = new Set([
  Styles.pointFrontRadius,
  Styles.pointBackRadius,
  Styles.strokeColor
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

  public update(state: SaveStateType): void {
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
    // Record the state of the object in state.stateArray
    //#region saveState
    switch (state.mode) {
      case SaveStateMode.UndoMove: {
        // Free points are can be moved, therefore store their location in the stateArray for undo move.
        // Store the coordinate values of the vector and not the point to the vector.
        state.stateArray.push({
          kind: "point",
          object: this,
          locationVectorX: this._locationVector.x,
          locationVectorY: this._locationVector.y,
          locationVectorZ: this._locationVector.z
        });
        break;
      }
      case SaveStateMode.UndoDelete: {
        break;
      }
      // The DisplayOnly case fall through and does nothing
      case SaveStateMode.DisplayOnly:
      default:
        break;
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

  public isHitAt(unitIdealVector: Vector3): boolean {
    return (
      this._locationVector.distanceTo(unitIdealVector) <
      SETTINGS.point.hitIdealDistance
    );
  }
}
