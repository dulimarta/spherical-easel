import { SEPoint } from "./internal";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
const { t } = i18n.global;
export class SEAntipodalPoint extends SEPoint {
  /**
   * The point parent of this SEAntipodalPoint
   */
  private _antipodalPointParent: SEPoint;
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
  constructor(antipodalPointParent: SEPoint, isUserCreated: boolean) {
    super(true); // Non free point and the plottable is created
    this._antipodalPointParent = antipodalPointParent;
    if (isUserCreated) {
      this._isUserCreated = true;
      // Display userCreated antipodes
      this.showing = true;
    } else {
      this._isUserCreated = false;
      // Hide automatically created antipodes
      this.showing = false;
    }
  }

  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.antipodeOf`, {
        pt: this._antipodalPointParent.label?.ref.shortUserName
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ?? "No Label Short Name In SEAntipodePoint"
    );
  }
  public get antipodalParent(): SEPoint {
    return this._antipodalPointParent;
  }

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
      // Update the current location with the opposite of the antipodal parent vector location
      this._locationVector
        .copy(this._antipodalPointParent.locationVector)
        .multiplyScalar(-1);
      this.ref.positionVector = this._locationVector;
    }

    // console.debug(
    //   `Here point visibility antipode showing ${this._showing}, user created ${this._isUserCreated}, exists ${this._exists}`
    // );
    // Update visibility
    if (this._showing && this._isUserCreated && this._exists) {
      // if (!this._pointVisibleBefore) {
      //   console.debug(`Here point visibility antipode`);
      //   // This should execute once unless the point is deleted/converted to not user created
      //   EventBus.fire("set-point-visibility-and-label", {
      //     point: this,
      //     val: true
      //   });
      // }
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
    // These antipodal point are completely determined by their line/segment/point parents and an update on the parents
    // will cause this antipodal point to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Antipodal point with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "antipodalPoint", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  // For !isUserCreated points glowing is the same as showing or not showing the point,
  set glowing(b: boolean) {
    console.log("SEAntipode::object:", this.name, " ref id ", this.ref?.id);
    if (!this._isUserCreated) {
      this.ref.setVisible(b);
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
