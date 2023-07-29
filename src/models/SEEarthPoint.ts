import i18n from "@/i18n";
import { SEPoint } from "./SEPoint";
import { SENodule } from "./internal";
import { StyleEditPanels } from "@/types/Styles";
export class SEEarthPoint extends SEPoint {
  private _longitude: number; // DEGREES
  private _latitude: number; // DEGREES
  constructor(
    /*point: Point,*/ latitudeDegrees: number,
    longitudeDegrees: number
  ) {
    super(true); /* Non-Free Point */
    this._longitude = longitudeDegrees;
    this._latitude = latitudeDegrees;
    // style the earth point
    SENodule.store.changeStyle({
      selected: [this.ref],
      panel: StyleEditPanels.Front,
      payload: {
        fillColor: "hsla(200, 80%, 50%, 1)",
        strokeColor: "hsla(0, 0%, 0%, 1)"
      }
    });
  }
  get longitude(): number {
    return this._longitude;
  }
  get latitude(): number {
    return this._latitude;
  }
  public get noduleDescription(): string {
    if (Math.abs(this._latitude) !== 90) {
      return String(
        i18n.global.t(`objectTree.earthPoint`, {
          lat: String(this._latitude + "\u{00B0}"),
          long: String(this._longitude + "\u{00B0}")
        })
      );
    } else {
      // this is a pole
      return String(
        i18n.global.t(`objectTree.earthPointPole`, {
          lat: String(this._latitude + "\u{00B0}")
        })
      );
    }
  }

  public get noduleItemText(): string {
    return this.label?.ref.shortUserName ?? "No Label Short Name In SEPoint";
  }

  public isNonFreePoint(): boolean {
    return true;
  }
  public isFreePoint(): boolean {
    return false;
  }
}
