import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { HEPoint } from "./HEPoint";
import { Mesh, Vector3 } from "three";
import { CustomPointMaterial } from "@/plottables-hyperbolic/MaterialFactory";
const { t } = i18n.global;
export class HEAntipodalPoint extends HEPoint {
  /**
   * The point parent of this HEAntipodalPoint
   */
  private _antipodalPointParent: HEPoint;
  /**
   * This flag is true if the user created this point
   * This flag is false if this point was automatically created
   */
  private _isUserCreated = false;

  /**
   * Create an intersection point between two one-dimensional objects
   * @param point the TwoJS point associated with this intersection
   * @param antipodalPointParent The parent
   */
  constructor({
    antipodalPointParent,
    isUserCreated,
    atInfinity,
    upper // this is the upper/lower of the new point being created
  }: {
    antipodalPointParent: HEPoint;
    isUserCreated: boolean;
    atInfinity: boolean;
    upper: boolean;
  }) {
    super(
      atInfinity
        ? (antipodalPointParent.angle + Math.PI).modTwoPi()
        : new Vector3().copy(antipodalPointParent.position).multiplyScalar(-1),
      atInfinity,
      upper,
      true
    );
    this._antipodalPointParent = antipodalPointParent;
    this._isUserCreated = isUserCreated;
    this.showing = isUserCreated; // Hide automatically created antipodes
    this.shallowUpdate(); // set the location and the visibility
    // console.log(
    //   "create antipode parent",
    //   this._antipodalPointParent.material.angle,
    //   this._antipodalPointParent.material.position.toFixed(2)
    // );
    // console.log(
    //   "antipode info:",
    //   this._material.angle,
    //   this._material.position.toFixed(2)
    // );
  }

  // public get noduleDescription(): string {
  //   return String(
  //     i18n.global.t(`objectTree.antipodeOf`, {
  //       pt: this._antipodalPointParent.label?.ref.shortUserName
  //     })
  //   );
  // }

  // public get noduleItemText(): string {
  //   return (
  //     this.label?.ref.shortUserName ?? "No Label Short Name In SEAntipodePoint"
  //   );
  // }
  // public get antipodalParent(): SEPoint {
  //   return this._antipodalPointParent;
  // }

  /**
   * If the antipodal point is changed to isUserCreated(true) then the user intentionally created this point
   * That is, the point was not automatically created. The showing or not of a user created
   * point is possible. A not user created point is not showing unless moused over.
   */
  set isUserCreated(flag: boolean) {
    this._isUserCreated = flag;
  }

  get isUserCreated(): boolean {
    return this._isUserCreated;
  }

  public shallowUpdate(): void {
    this._exists = this._antipodalPointParent.exists;

    if (this._exists) {
      // Update the current location with the opposite of the antipodal parent vector/angle location
      if (this.atInfinity) {
        this._material.angle = (
          this._antipodalPointParent.material.angle + Math.PI
        ).modTwoPi();
      } else {
        this._material.position = this._antipodalPointParent.material.position
          .clone()
          .multiplyScalar(-1);
      }
      this.updateTransformationMatrix();
    }

    // console.debug(
    //   `Here point visibility antipode showing ${this.showing}, user created ${this._isUserCreated}, exists ${this._exists}`
    // );
    // Update visibility
    if (this.showing && this._isUserCreated && this._exists) {
      this._material.visible = true;
    } else {
      // console.log("antipode point NOT visible", this.name, this.angle);
      this._material.visible = false;
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
    // These antipodal point are completely determined by their line/segment/point parents and an update on the parents
    // will cause this antipodal point to be put into the correct location. So we don't store any additional information
    // if (objectState && orderedSENoduleList) {
    //   if (objectState.has(this.id)) {
    //     // `Antipodal point with id ${this.id} has been visited twice proceed no further down this branch of the DAG. Hopefully this is because we are moving two or more SENodules at the same time in the MoveHandler.`
    //     return;
    //   }
    //   orderedSENoduleList.push(this.id);
    //   objectState.set(this.id, { kind: "antipodalPoint", object: this });
    // }

    this.updateKids(); //objectState, orderedSENoduleList);
  }

  // For !isUserCreated points glowing is the same as showing or not showing the point,
  set glowing(b: boolean) {
    // console.log("HENodule set glow of ", this.name, " to ", b);
    if (!this._isUserCreated) {
      this.showing = b;
    } else {
      super.glowing = b;
    }
  }

  public isNonFreePoint(): boolean {
    return true;
  }
  public isFreePoint(): boolean {
    return false;
  }
}
