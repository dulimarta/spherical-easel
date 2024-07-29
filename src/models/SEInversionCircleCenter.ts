import { SEPoint } from "./SEPoint"
import { SECircle, SELine, SEInversion } from "./internal";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { Vector3 } from "three";
// import SETTINGS from "@/global-settings";
// import { SEInversion } from "./SEInversion";
// import { SECircle } from "./SECircle";
// import { SELine } from "./SELine";
const { t } = i18n.global;
export class SEInversionCircleCenter extends SEPoint {
  /**
   * The circle parent of this SEInversionCircleCenter
   */
  private _seCircleOrLineParent: SECircle | SELine;

  /**
   * The inversion parent of this SEInversionCircleCenter
   */
  private _seInversion: SEInversion;

  private tempVector1 = new Vector3();
  private tempVector2 = new Vector3();
  private tempVector3 = new Vector3();
  /**
   * Create an intersection point between two one-dimensional objects
   * @param seCircleOrLineParent The parent
   * @param inversionParent
   */
  constructor(
    seCircleOrLineParent: SECircle | SELine,
    seInversion: SEInversion
  ) {
    super(true);
    this._seCircleOrLineParent = seCircleOrLineParent;
    this._seInversion = seInversion;
  }

  public get noduleDescription(): string {
    //    "Point that is the center of the image of {circleOrLine} {circleOrLineName} under inversion {inversionName}.",
    return String(
      i18n.global.t(`objectTree.centerOfTransformedCircleUnderInversion`, {
        circleOrLine:
          this._seCircleOrLineParent instanceof SELine
            ? i18n.global.t(`objects.lines`, 3)
            : i18n.global.t(`objects.circles`, 3),
        circleOrLineName: this._seCircleOrLineParent.label?.ref.shortUserName,
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

  get seParentCircleOrLine(): SECircle | SELine {
    return this._seCircleOrLineParent;
  }
  get parentTransformation(): SEInversion {
    return this._seInversion;
  }

  public shallowUpdate(): void {
    // The parent points must exist
    this._exists =
      this._seCircleOrLineParent.exists && this._seInversion.exists;

    if (this._exists) {
      // compute the location of the center
      // if the circle being inverted has its center at the center of inversion then the transformed center is the antipode of the center of inversion
      const centerOfPreimageCircleVector =
        this._seCircleOrLineParent instanceof SECircle
          ? this._seCircleOrLineParent.centerSEPoint.locationVector
          : this._seCircleOrLineParent.normalVector;
      if (
        this.tempVector1
          .subVectors(
            centerOfPreimageCircleVector,
            this._seInversion.seCircleOfInversion.centerSEPoint.locationVector
          )
          .isZero()
      ) {
        this.locationVector = this.tempVector3
          .copy(centerOfPreimageCircleVector)
          .multiplyScalar(-1);
      }
      // If the center of the circle being inverted is antipodal to the center of inversion, then the transformed center is the center of inversion
      else if (
        this.tempVector1
          .addVectors(
            centerOfPreimageCircleVector,
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
            centerOfPreimageCircleVector
          ); // the angular distance from the center of inversion to the center of the circle being transformed
        const r =
          this._seCircleOrLineParent instanceof SECircle
            ? this._seCircleOrLineParent.circleRadius
            : Math.PI / 2; // the radius of the circle being transformed
        const a = this._seInversion.seCircleOfInversion.circleRadius; // the radius of the circle of inversion
        const newAngle = Math.atan(
          (-Math.sin(a) * Math.sin(a) * Math.sin(delta)) /
            ((1 + Math.cos(a) * Math.cos(a)) * Math.cos(delta) -
              2 * Math.cos(a) * Math.cos(r))
        );

        this.tempVector1 // perpendicular to both the center of inversion and the center of the circle being transformed
          .crossVectors(
            centerOfPreimageCircleVector,
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
        // console.debug(
        //   `center of inverted circle`,
        //   this._locationVector.toFixed(2)
        // );
      }

      this.ref.positionVector = this._locationVector;
      // update the display
      this.ref.updateDisplay();
    }

    // Update visibility
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
