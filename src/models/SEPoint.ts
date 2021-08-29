import Point from "../plottables/Point";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SENodule } from "./SENodule";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import {
  DEFAULT_POINT_BACK_STYLE,
  DEFAULT_POINT_FRONT_STYLE
} from "@/types/Styles";
import { SEOneOrTwoDimensional, Labelable, ObjectState } from "@/types";
import { SELabel } from "./SELabel";
// The following import creates a circular dependencies when testing SENoduleItem
// The dependency loop is:
// SENoduleItem.vue => SEIntersectionPoint => SEPoint => store/index.ts => se-module.ts
// => RotationVisitor => SEPointOnOneDimensional => SEPoint (again)
// import { SEStore } from "@/store";
import i18n from "@/i18n";

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_POINT_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_POINT_BACK_STYLE)
]);

export class SEPoint extends SENodule implements Visitable, Labelable {
  /* This should be the only reference to the plotted version of this SEPoint */
  public ref: Point;

  /**
   * Pointer to the label of this point
   */
  public label?: SELabel;
  /**
   * The vector location of the SEPoint on the ideal unit sphere
   */
  protected _locationVector = new Vector3();
  /** Temporary vectors to help with calculations */
  private tmpVector = new Vector3(); //
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();

  /**
   * Create a model SEPoint using:
   * @param point The plottable TwoJS Object associated to this object
   */
  constructor(point: Point) {
    super();
    /* Establish the link between this abstract object on the fixed unit sphere
    and the object that helps create the corresponding renderable object  */
    this.ref = point;
    SENodule.POINT_COUNT++;
    this.name = `P${SENodule.POINT_COUNT}`;
  }
  customStyles(): Set<string> {
    return styleSet;
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    //These points always exist - they have no parents to depend on
    this.ref.updateDisplay();

    //Update the location of the associate plottable Point (setter also updates the display)
    this.ref.positionVector = this._locationVector;

    if (this.showing) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    // These are free points and are have no parents so we store additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Point with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      const location = new Vector3();
      location.copy(this._locationVector);
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, {
        kind: "point",
        object: this,
        locationVector: location
      });
    }

    this.updateKids(objectState, orderedSENoduleList);
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

  public get noduleDescription(): string {
    return String(i18n.t(`objectTree.freePoint`));
  }

  public get noduleItemText(): string {
    return this.label?.ref.shortUserName ?? "No Label Short Name In SEPoint";
  }

  accept(v: Visitor): void {
    v.actionOnPoint(this);
  }
  /**
   * Return the vector near the SELine (within SETTINGS.point.maxLabelDistance) that is closest to the idealUnitSphereVector
   * @param currentLabelLocationVector A vector on the unit sphere
   */
  public closestLabelLocationVector(
    currentLabelLocationVector: Vector3,
    zoomMagnificationFactor: number
  ): Vector3 {
    // The current magnification level

    const mag = zoomMagnificationFactor;
    // If the idealUnitSphereVector is within the tolerance of the point, do nothing, otherwise return the vector in the plane of the ideanUnitSphereVector and the point that is at the tolerance distance away.
    if (
      this._locationVector.angleTo(currentLabelLocationVector) <
      ((SETTINGS.point.maxLabelDistance / mag) * this.ref.pointRadiusPercent) /
        100
    ) {
      return currentLabelLocationVector;
    } else {
      // tmpVector1 is the normal to the plane of the point vector and the idealUnitVector
      this.tmpVector1.crossVectors(
        currentLabelLocationVector,
        this._locationVector
      );

      if (this.tmpVector1.isZero(SETTINGS.nearlyAntipodalIdeal)) {
        // The idealUnitSphereVector and location of the point are parallel (well antipodal because the case of being on top of each other is covered)
        // Use the north pole because any point will do as long at the crossproduct with the _locationVector is not zero.
        this.tmpVector1.set(0, 0, 1);

        if (
          this.tmpVector2
            .crossVectors(this._locationVector, this.tmpVector1)
            .isZero(SETTINGS.nearlyAntipodalIdeal)
        ) {
          this.tmpVector1.set(0, 1, 0);
        }
      } else {
        // normalize the tmpVector1
        this.tmpVector1.normalize();
      }
      // compute the toVector (so that tmpVector2= toVector, this._locationVector, tmpVector1 form an orthonormal frame)
      this.tmpVector2
        .crossVectors(this._locationVector, this.tmpVector1)
        .normalize();
      // return cos(SETTINGS.segment.maxLabelDistance)*fromVector/tmpVec + sin(SETTINGS.segment.maxLabelDistance)*toVector/tmpVec2
      this.tmpVector2.multiplyScalar(
        Math.sin(
          ((SETTINGS.point.maxLabelDistance / mag) *
            this.ref.pointRadiusPercent) /
            100
        )
      );
      this.tmpVector2
        .addScaledVector(
          this._locationVector,
          Math.cos(
            ((SETTINGS.point.maxLabelDistance / mag) *
              this.ref.pointRadiusPercent) /
              100
          )
        )
        .normalize();
      return this.tmpVector2;
    }
  }

  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    return (
      this._locationVector.distanceTo(unitIdealVector) <
      ((SETTINGS.point.hitIdealDistance / currentMagnificationFactor) *
        this.ref.pointRadiusPercent) /
        100
    );
  }

  public isFreePoint(): boolean {
    return true;
  }

  public isPoint(): boolean {
    return true;
  }

  public isLabelable(): boolean {
    return true;
  }
}
