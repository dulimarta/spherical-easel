import Segment from "@/plottables/Segment";
import { Vector3 } from "three";
import { SEPoint } from "./SEPoint";
import { ObjectState, SEIsometry } from "@/types";
import i18n from "@/i18n";
import { SESegment } from "./SESegment";
import { SETransformation } from "./SETransformation";
import { SETranslation } from "./SETranslation";
import { SERotation } from "./SERotation";
import { SEReflection } from "./SEReflection";
import { SEPointReflection } from "./SEPointReflection";

export class SEIsometrySegment extends SESegment {
  /**
   * The parents of this SEIsometryPoint
   */
  private _seParentSegment: SESegment;
  private _seParentIsometry: SEIsometry;
  private transType: string;

  /**
   * Create a model SESegment using:
   * @param seg  The plottable TwoJS Object associated to this object
   * @param segmentStartSEPoint The model SEPoint object that is the start of the segment
   * @param segmentNormalVector The vector3 that is perpendicular to the plane containing the segment
   * @param segmentArcLength The arcLength number of the segment
   * @param segmentEndSEPoint The model SEPoint object that is the end of the segment
   */
  constructor(
    seg: Segment,
    segmentStartSEPoint: SEPoint,
    segmentNormalVector: Vector3,
    segmentArcLength: number,
    segmentEndSEPoint: SEPoint,
    parentSegment: SESegment,
    parentTransformation: SEIsometry
  ) {
    console.debug(
      "Type of the parent isometry segment: ",
      parentTransformation instanceof SEReflection
    );
    // switch end and start because of mirroring for reflections
    if (parentTransformation instanceof SEReflection) {
      // console.debug("here");
      super(
        seg,
        segmentEndSEPoint,
        segmentNormalVector,
        segmentArcLength,
        segmentStartSEPoint
      );
    } else {
      super(
        seg,
        segmentStartSEPoint,
        segmentNormalVector,
        segmentArcLength,
        segmentEndSEPoint
      );
    }
    this._seParentSegment = parentSegment;
    this._seParentIsometry = parentTransformation;
    if (this._seParentIsometry instanceof SETranslation) {
      this.transType = i18n.tc("objects.translations", 3);
    } else if (this._seParentIsometry instanceof SERotation) {
      this.transType = i18n.tc("objects.rotations", 3);
    } else if (this._seParentIsometry instanceof SEReflection) {
      this.transType = i18n.tc("objects.reflections", 3);
    } else if (this._seParentIsometry instanceof SEPointReflection) {
      this.transType = i18n.tc("objects.pointReflections", 3);
    } else {
      this.transType = "";
    }
  }

  get parentSegment(): SESegment {
    return this._seParentSegment;
  }

  get parentIsometry(): SETransformation {
    return this._seParentIsometry;
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.transformationObject`, {
        object: i18n.tc(`objects.segments`, 3),
        name: this._seParentSegment.label?.ref.shortUserName,
        trans: this._seParentIsometry.name,
        transType: this.transType
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ??
      "No Label Short Name In SETransformedSegment"
    );
  }

  public shallowUpdate(): void {
    this._exists =
      this._seParentSegment.exists && this._seParentIsometry.exists;

    if (this._exists) {
      // Set the normal vector
      this.normalVector.copy(
        this.parentIsometry.f(this._seParentSegment.normalVector)
      );

      // Set the arc length of the segment
      this.arcLength = this._seParentSegment.arcLength;

      // set the start vector location
      // this.startSEPoint.locationVector.copy(
      //   this.parentIsometry.f(
      //     this._seParentSegment.startSEPoint.locationVector
      //   )
      // );

      ////////////////////////////////////////////////////////////////////////////////////////
      this.ref.startVector = this.startSEPoint.locationVector;
      this.ref.arcLength = this.arcLength;
      this.ref.normalVector = this.normalVector;
      // update the display of the segment now that the start, normal vectors and arcLength are set, but only if showing
      this.ref.updateDisplay();
    }
    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);
    this.shallowUpdate();

    // Segments are determined by more than their point parents so we store additional information
    // If the parent points of the segment are antipodal, the normal vector determines the
    // plane of the segment.  The points also don't determine the arcLength of the segments.
    // Both of these quantities could change during a move therefore store normal vector and arcLength
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Isometry Segment with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      const normal = new Vector3();
      normal.copy(this.normalVector);
      objectState.set(this.id, {
        kind: "isometrySegment",
        object: this,
        normalVector: normal,
        arcLength: this.arcLength
      });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public isNonFreeSegment(): boolean {
    return true;
  }
}
