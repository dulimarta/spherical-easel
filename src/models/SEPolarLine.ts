import Line from "@/plottables/Line";
import { Visitable } from "@/visitors/Visitable";
import { SEPoint } from "./SEPoint";
import SETTINGS from "@/global-settings";
import { OneDimensional, Labelable, ObjectState } from "@/types";
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

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

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

    // These polar lines are completely determined by their line/segment/point parents and an update on the parents
    // will cause this line to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Polar Line with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "polarLine", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }
  public isNonFreeLine(): boolean {
    return true;
  }
}
