import { SENodule } from "./SENodule";
import { SEPoint, SECircle } from "./internal";
import { Vector3 } from "three";
import { StyleEditPanels } from "@/types/Styles";
import i18n from "@/i18n";

export class SELatitude extends SECircle {
  private _latitude = 0;

  /**
   * Create a model SECircle using:
   * @param latitude, the latitude of the circle IN DEGREES
   */
  constructor(latitude: number) {
    // (center|circle)SEPoint are never added to the object tree, they are never displayed, they are never registered
    // they *could* be updated in the update() method, but in this case they are not because they are fixed (in other classes
    //  like tangent line, these hidden SEPoint may have *only* there location updated)
    const centerSEPoint = new SEPoint(true); // Should never be displayed
    centerSEPoint.showing = false; // this never changes
    centerSEPoint.exists = true; // this never changes
    centerSEPoint.locationVector = new Vector3(0, 0, 1); // this never changes from the north pole
    const circleSEPoint = new SEPoint(true); // Should never be displayed
    centerSEPoint.showing = false; // this never changes
    centerSEPoint.exists = true; // this never changes
    const angleRad = (latitude * Math.PI) / 180;
    circleSEPoint.locationVector = new Vector3(
      0,
      Math.cos(angleRad),
      Math.sin(angleRad)
    ); // this never changes
    super(centerSEPoint, circleSEPoint, true);
    this._latitude = latitude;
    // turn off the fill of the ref circle
    SENodule.store.changeStyle({
      selected: [this.ref],
      panel: StyleEditPanels.Front,
      payload: {
        strokeColor: "hsla(0, 0%, 0%, 1)",
        fillColor: "hsla(0, 0%, 0%, 0)"
      }
    });
  }

  get latitude(): number {
    return this._latitude;
  }

  public get noduleDescription(): string {
    if (this._latitude == 0) {
      return String(i18n.global.t(`objectTree.equatorCircle`));
    } else {
      return String(
        i18n.global.t(`objectTree.latitudeCircle`, {
          degreee: String(this._latitude + "\u{00B0}")
        })
      );
    }
  }

  public get noduleItemText(): string {
    return this.label?.ref.shortUserName ?? "No Label Short Name In SECircle";
  }

  public isFreeToMove(): boolean {
    return false;
  }
  public isNonFreeCirle(): boolean {
    return true;
  }
}
