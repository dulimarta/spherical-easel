import { SENodule } from "./SENodule";
import Line from "@/plottables/Line";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";
import SETTINGS from "@/global-settings";
import { OneDimensional, Labelable } from "@/types";
import { Styles } from "@/types/Styles";
import { UpdateMode, UpdateStateType, LineState } from "@/types";
import { SELabel } from "@/models/SELabel";
// import  SENoduleItem  from "*.vue";
// import magnificationLevel from "*.vue";
import magnificationLevel from "@/components/SENoduleItem.vue";
import { SEStore } from "@/store";
import i18n from "@/i18n";
import { SELine } from "./SELine";

export class SEPolarLine extends SELine
  implements Visitable, OneDimensional, Labelable {
  private polarPointParent: SEPoint;
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
      this.tmpVector.set(
        -this.polarPointParent.locationVector.y,
        this.polarPointParent.locationVector.x,
        0
      );
      // check to see if this vector is zero, if so choose a different way of being perpendicular to the polar point parent
      if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
        this.tmpVector.set(
          0,
          -this.polarPointParent.locationVector.z,
          this.polarPointParent.locationVector.y
        );
      }
      this.endSEPoint.locationVector = this.tmpVector.normalize();
      this.tmpVector.crossVectors(
        this.polarPointParent.locationVector,
        this.endSEPoint.locationVector
      );
      this.startSEPoint.locationVector = this.tmpVector.normalize();

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
