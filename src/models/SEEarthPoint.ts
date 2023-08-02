import { SEPoint } from "./SEPoint";
export class SEEarthPoint extends SEPoint {
  private _longitude: number;
  private _latitude: number;
  constructor(latitudeDegree: number, longitudeDegree: number) {
    super(true); /* Non-Free Point */
    this._longitude = longitudeDegree;
    this._latitude = latitudeDegree;
    // point.updateDisplay();
  }
  get longitude(): number {
    return this._longitude;
  }
  get latitude(): number {
    return this._latitude;
  }
  public isNonFreePoint(): boolean {
    return true;
  }
  public isFreePoint(): boolean {
    return false;
  }
}
