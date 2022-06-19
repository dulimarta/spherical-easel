import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import ThreePointCircleCenter from "@/plottables/ThreePointCircleCenter";
import { SEInversion } from "./SEInversion";
import NonFreePoint from "@/plottables/NonFreePoint";
import { SECircle } from "./SECircle";

export class SEInversionCircleCenter extends SEPoint {
  /**
   * The circle parent of this SEInversionCircleCenter
   */
  private _seCircleParent: SECircle;

  /**
   * The inversion parent of this SEInversionCircleCenter
   */
  private _seInversion: SEInversion;

  private tempVector1 = new Vector3();
  private tempVector2 = new Vector3();
  private tempVector3 = new Vector3();
  /**
   * Create an intersection point between two one-dimensional objects
   * @param inversionCircleCenter the TwoJS point associated with this intersection
   * @param sePointParent The parent
   * @param inversionParent
   */
  constructor(
    inversionCircleCenter: NonFreePoint,
    sePointParent: SECircle,
    seInversion: SEInversion
  ) {
    super(inversionCircleCenter);
    this._seCircleParent = sePointParent;
    this._seInversion = seInversion;
  }

  public get noduleDescription(): string {
    //      "The center of the image of circle {circleName} under inversion {inversionName}.",
    return String(
      i18n.t(`objectTree.centerOfTransformedCircleUnderInversion`, {
        circleName: this._seCircleParent.label?.ref.shortUserName,
        inversionName: this._seInversion.name
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ??
      "No Label Short Name In SEThreePointCircleCenter"
    );
  }

  get seParentCircle(): SECircle {
    return this._seCircleParent;
  }
  get parentTransformation(): SEInversion {
    return this._seInversion;
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    // The parent points must exist
    this._exists = this._seCircleParent.exists && this._seInversion.exists;

    if (this._exists) {
      // compute the location of the center
      // if the circle being inverted has its center at the center of inversion then the transformed center is the antipode of the center of inversion
      if (
        this.tempVector1
          .subVectors(
            this._seCircleParent.centerSEPoint.locationVector,
            this._seInversion.seCircleOfInversion.centerSEPoint.locationVector
          )
          .isZero()
      ) {
        this.locationVector = this.tempVector3
          .copy(this._seCircleParent.centerSEPoint.locationVector)
          .multiplyScalar(-1);
      }
      // If the circle being inverted is antipodal to the center of inversion, then the transformed center is the center of inversion
      else if (
        this.tempVector1
          .subVectors(
            this.tempVector2
              .copy(this._seCircleParent.centerSEPoint.locationVector)
              .multiplyScalar(-1),
            this._seInversion.seCircleOfInversion.centerSEPoint.locationVector
          )
          .isZero()
      ) {
        this.locationVector =
          this._seInversion.seCircleOfInversion.centerSEPoint.locationVector;
      }
      // the center of the circle being transformed is not the center of inversion and is not antipodal to the center either.
      else {
        // See M'Clelland & Preston. A treatise on
        // spherical trigonometry with applications to spherical geometry and numerous
        // examples - Part 2. 1907 page 144 after Article/Theorem 169
        const delta =
          this._seInversion.seCircleOfInversion.centerSEPoint.locationVector.angleTo(
            this._seCircleParent.centerSEPoint.locationVector
          ); // the angular distance from the center of inversion to the center of the circle being transformed
        const r = this._seCircleParent.circleRadius; // the radius of the circle being transformed
        const a = this._seInversion.seCircleOfInversion.circleRadius; // the radius of the circle of inversion
        let newAngle = Math.atan(
          (-Math.sin(a) * Math.sin(a) * Math.sin(delta)) /
            ((1 + Math.cos(a) * Math.cos(a)) * Math.cos(delta) -
              2 * Math.cos(a) * Math.cos(r))
        );
        if (newAngle < 0) {
          newAngle += Math.PI;
        }
        this.tempVector1 // perpendicular to both the center of inversion and the center of the circle being transformed
          .crossVectors(
            this._seCircleParent.centerSEPoint.locationVector,
            this._seInversion.seCircleOfInversion.centerSEPoint.locationVector
          )
          .normalize();
        this.tempVector2 // the to vector
          .crossVectors(
            this._seInversion.seCircleOfInversion.centerSEPoint.locationVector,
            this.tempVector1
          )
          .normalize();
        // return vector is cos(newAngle)*circle inversion center + sin(newAngle)*tempVector2
        this._locationVector
          .copy(
            this._seInversion.seCircleOfInversion.centerSEPoint.locationVector
          )
          .multiplyScalar(Math.cos(newAngle));
        this._locationVector.addScaledVector(
          this.tempVector2,
          Math.sin(newAngle)
        );
      }

      this.ref._locationVector.copy(this._locationVector);
      // update the display
      this.ref.updateDisplay();
    }

    // Update visibility
    if (this._showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    // The center of the inversion circles is completely determined by their circle and inversion parents and an update on the parents
    // will cause this center to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Inversion Circle center with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, {
        kind: "invertedCircleCenter",
        object: this
      });
    }

    this.updateKids(objectState, orderedSENoduleList);

    // #endregion endupdate
  }
  public isNonFreePoint(): boolean {
    return true;
  }
  public isFreePoint(): boolean {
    return false;
  }
}
