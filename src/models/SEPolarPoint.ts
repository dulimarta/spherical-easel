import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { UpdateMode, UpdateStateType, PointState } from "@/types";
import i18n from "@/i18n";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";

export class SEPolarPoint extends SEPoint {
  /**
   * The point parent of this SEAntipodalPoint
   */
  private _polarLineOrSegmentParent: SELine | SESegment;
  private index: number;

  /**
   *
   * @param point The TwoJS object associated with this SEPoint
   * @param polarLineOrSegmentParent The SELine parent of this SEPoint
   * @param index Which point is this?  There are two polar points associated with each line
   */
  constructor(
    point: Point,
    polarLineOrSegmentParent: SELine | SESegment,
    index: number
  ) {
    super(point);
    this._polarLineOrSegmentParent = polarLineOrSegmentParent;
    this.index = index;
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.aPolarPointOf`, {
        line: this._polarLineOrSegmentParent.label?.ref.shortUserName,
        index: this.index
      })
    );
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this._exists = this._polarLineOrSegmentParent.exists;
    if (this._exists) {
      // Update the current location normal vector of the line, multiply by -1 if index is 1
      this._locationVector
        .copy(this._polarLineOrSegmentParent.normalVector)
        .multiplyScalar(this.index === 1 ? -1 : 1);
      this.ref.positionVector = this._locationVector;
    }

    // Update visibility
    if (this._showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // The location of this antipodal point is determined by the parent point so no need to
    // store anything for moving undo Only store for delete

    if (state.mode == UpdateMode.RecordStateForDelete) {
      const pointState: PointState = {
        kind: "point",
        locationVectorX: this._locationVector.x,
        locationVectorY: this._locationVector.y,
        locationVectorZ: this._locationVector.z,
        object: this
      };
      state.stateArray.push(pointState);
    }

    this.updateKids(state);
  }
  public isNonFreeLine(): boolean {
    return false;
  }
  public isFreePoint(): boolean {
    return false;
  }
}
