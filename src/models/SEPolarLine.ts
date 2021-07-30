import Line from "@/plottables/Line";
import { Visitable } from "@/visitors/Visitable";
import { SEPoint } from "./SEPoint";
import SETTINGS from "@/global-settings";
import { OneDimensional, Labelable } from "@/types";
import { UpdateMode, UpdateStateType, LineState } from "@/types";
import i18n from "@/i18n";
import { SELine } from "./SELine";
import { Vector3 } from "three";

export class SEPolarLine extends SELine
  implements Visitable, OneDimensional, Labelable {
  private polarPointParent: SEPoint;
  private tempVector = new Vector3();
  /**
   * Create an SELine
   * @param line plottable (TwoJS) line associated with this line
   * @param lineStartSEPoint One Point on the line (not *ever* visible and updated only by this line)
   * @param lineEndSEPoint A second Point on the line (not *ever* visible and updated only by this line)
   * @param polarPointParent The polar point parent of the line
   */
  constructor(
    line: Line,
    lineStartSEPoint: SEPoint,
    lineEndSEPoint: SEPoint,
    polarPointParent: SEPoint
  ) {
    super(
      line,
      lineStartSEPoint,
      polarPointParent.locationVector,
      lineEndSEPoint
    );
    this.polarPointParent = polarPointParent;
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.polarLine`, {
        pt: this.polarPointParent.label?.ref.shortUserName,
        normalX: this._normalVector.x.toFixed(SETTINGS.decimalPrecision),
        normalY: this._normalVector.y.toFixed(SETTINGS.decimalPrecision),
        normalZ: this._normalVector.z.toFixed(SETTINGS.decimalPrecision)
      })
    );
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this._exists = this.polarPointParent.exists;
    if (this._exists) {
      // now update the locations of endSEPoiont and startSEPoint
      // form a vector perpendicular to the polar point parent
      this.tempVector.set(
        -this.polarPointParent.locationVector.y,
        this.polarPointParent.locationVector.x,
        0
      );
      // check to see if this vector is zero, if so choose a different way of being perpendicular to the polar point parent
      if (this.tempVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
        this.tempVector.set(
          0,
          -this.polarPointParent.locationVector.z,
          this.polarPointParent.locationVector.y
        );
      }
      this.endSEPoint.locationVector = this.tempVector.normalize();
      this.tempVector.crossVectors(
        this.polarPointParent.locationVector,
        this.endSEPoint.locationVector
      );
      this.startSEPoint.locationVector = this.tempVector.normalize();

      //update the normal vector
      this._normalVector.copy(this.polarPointParent.locationVector).normalize();
      // Set the normal vector in the plottable object (the setter also calls the updateDisplay() method)
      this.ref.normalVector = this._normalVector;
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    // Create a line state for a Move or delete if necessary
    if (
      state.mode == UpdateMode.RecordStateForDelete ||
      state.mode == UpdateMode.RecordStateForMove
    ) {
      // If the parent points of the line are antipodal, the normal vector determines the
      // plane of the line.   Store the coordinate values of the normal vector and not the pointer to the vector.
      const lineState: LineState = {
        kind: "line",
        object: this,
        normalVectorX: this._normalVector.x,
        normalVectorY: this._normalVector.y,
        normalVectorZ: this._normalVector.z
      };
      state.stateArray.push(lineState);
    }
    this.updateKids(state);
  }
  public isNonFreeLine(): boolean {
    return true;
  }
}
