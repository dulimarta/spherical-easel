import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint"
import { SESegment } from "./SESegment";
import { Matrix4, Vector3 } from "three";
import { StyleCategory } from "@/types/Styles";
import i18n from "@/i18n";
import { geoLocationToUnitSphere } from "@/composables/earth";
const tempVec = new Vector3();

export class SELongitude extends SESegment {
  private _longitude = 0;

  /**
   * Create a model SESegment using:
   * @param longitudeDegree, the longitude of the segment IN DEGREES
   */
  constructor(longitudeDegree: number) {
    // segment(start|end)SEPoint are never added to the object tree, they are never displayed, they are never registered
    // they *could* be updated in the update() method, but in this case they are not because they are fixed (in other classes
    //  like tangent line, these hidden SEPoint may have *only* there location updated)
    const rotationMatrix = new Matrix4();
    rotationMatrix.copy(SENodule.store.inverseTotalRotationMatrix).invert();

    // North Pole - create it as a static object if it doesn't exist already
    const northPoleVector = new Vector3();
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
    } else {
      northPoleVector.copy(SEPoint.unregisteredSEPointNorthPole.locationVector);
    }

    // South Pole - create it as a static object if it doesn't exist already
    const southPoleVector = new Vector3();
    if (SEPoint.unregisteredSEPointSouthPole === undefined) {
      SEPoint.unregisteredSEPointSouthPole = new SEPoint(true); // Should never be displayed
      SEPoint.unregisteredSEPointSouthPole.showing = false; // this never changes
      SEPoint.unregisteredSEPointSouthPole.exists = true; // this never changes

      //Setup the South pole location
      const southPoleArray = geoLocationToUnitSphere(-90, 0);
      southPoleVector.set(
        southPoleArray[0],
        southPoleArray[1],
        southPoleArray[2]
      ); // this never changes from the South pole
      southPoleVector.applyMatrix4(rotationMatrix);
      SEPoint.unregisteredSEPointSouthPole.locationVector = southPoleVector;
    }
    // else {
    //   southPoleVector.copy(
    //     SEPoint.unregisteredSEPointSouthPole.locationVector
    //   );
    // }

    // Normal Vector
    const segmentNormalVector = new Vector3();
    tempVec.set(
      Math.cos(longitudeDegree.toRadians()),
      0,
      -Math.sin(longitudeDegree.toRadians())
    );
    tempVec.applyMatrix4(rotationMatrix);
    segmentNormalVector.crossVectors(northPoleVector, tempVec).normalize();
    // console.log(
    //   "normal",
    //   segmentNormalVector.toFixed(2),
    //   "north ",
    //   SEPoint.unregisteredSEPointNorthPole.locationVector.toFixed(2),
    //   "south ",
    //   SEPoint.unregisteredSEPointSouthPole.locationVector.toFixed(2),
    //   "temp ",
    //   tempVec.toFixed(2)
    // );

    super(
      SEPoint.unregisteredSEPointNorthPole,
      segmentNormalVector,
      Math.PI,
      SEPoint.unregisteredSEPointSouthPole,
      true
    );
    this._longitude = longitudeDegree;
    //turn off the fill of the ref circle
    this.ref.updateStyle(StyleCategory.Front, {
      strokeColor: "#000000ff",
      fillColor: "#00000000"
    });
    this.update();
  }

  get longitude(): number {
    return this._longitude;
  }

  public get noduleDescription(): string {
    if (this._longitude == 0) {
      return String(i18n.global.t(`objectTree.primeMeridian`));
    } else {
      return String(
        i18n.global.t(`objectTree.longitudeSegment`, {
          degree: String(this._longitude + "\u{00B0}")
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
  public isNonFreeSegment(): boolean {
    return true;
  }
}
