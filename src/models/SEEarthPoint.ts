import i18n from "@/i18n";
import { SEPoint } from "./SEPoint";
export class SEEarthPoint extends SEPoint {
  private _longitude: number;
  private _latitude: number;
  constructor(/*point: Point,*/ longitude: number, latitude: number) {
    super(true); /* Non-Free Point */
    this._longitude = longitude;
    this._latitude = latitude;
    // point.updateDisplay();
  }
  get longitude(): number {
    return this._longitude;
  }
  get latitude(): number {
    return this._latitude;
  }
  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.earthPoint`, {
        lat: this._latitude,
        long: this._longitude
      })
    );
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
