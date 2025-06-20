import { SENodule } from "./SENodule";
import { SEPoint, SECircle } from "./internal";
import { Matrix4, Vector3 } from "three";
import { StyleCategory } from "@/types/Styles";
import i18n from "@/i18n";
import { geoLocationToUnitSphere } from "@/composables/earth";

export class SELatitude extends SECircle {
  private _latitude = 0;

  /**
   * Create a model SECircle using:
   * @param latitude, the latitude of the circle IN DEGREES
   */
  constructor(latitude: number) {
    // (center|circle)SEPoint are never added to the object tree, they are never displayed, they are never registered
    // they *could* be updated in the update() method, but in this case they are not because they are fixed (in other classes
    //  like tangent line, these hidden SEPoint may have *only* there location updated via a rotation visitor)

    const northPoleVector = new Vector3();
    const rotationMatrix = new Matrix4();
    rotationMatrix.copy(SENodule.store.inverseTotalRotationMatrix).invert();

    // North Pole - create it as a static object if it doesn't exist already
    if (SEPoint.unregisteredSEPointNorthPole === undefined) {
      SEPoint.unregisteredSEPointNorthPole = new SEPoint(true); // Should never be displayed
      SEPoint.unregisteredSEPointNorthPole.showing = false; // this never changes
      SEPoint.unregisteredSEPointNorthPole.exists = true; // this never changes

      //Setup the north pole location
      const northPoleArray = geoLocationToUnitSphere(90, 0);
      northPoleVector.set(
        northPoleArray[0],
        northPoleArray[1],
        northPoleArray[2]
      ); // this never changes from the north pole
      northPoleVector.applyMatrix4(rotationMatrix);
      SEPoint.unregisteredSEPointNorthPole.locationVector = northPoleVector;
    }
    //Circle Point
    const circleSEPoint = new SEPoint(true); // Should never be displayed
    circleSEPoint.showing = false; // this never changes
    circleSEPoint.exists = true; // this never changes

    //Set up the circle point location
    const pointLocationArray = geoLocationToUnitSphere(latitude, 0);
    const pointLocationVector = new Vector3(
      pointLocationArray[0],
      pointLocationArray[1],
      pointLocationArray[2]
    ); // this never changes
    pointLocationVector.applyMatrix4(rotationMatrix);
    circleSEPoint.locationVector = pointLocationVector;

    super(SEPoint.unregisteredSEPointNorthPole, circleSEPoint, true);
    this._latitude = latitude;
    //turn off the fill of the ref circle
    this.ref.updateStyle(
      StyleCategory.Front,
       {
        strokeColor: "#000000ff",
        fillColor: "#00000000"
      }
    );
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
          degree: String(this._latitude + "\u{00B0}")
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
  public isNonFreeCircle(): boolean {
    return true;
  }
}
