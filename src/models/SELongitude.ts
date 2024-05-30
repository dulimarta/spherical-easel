import { SENodule } from "./SENodule";
import { SEPoint, SESegment } from "./internal";
import { Matrix4, Vector3 } from "three";
import { StyleEditPanels } from "@/types/Styles";
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
    if (SENodule.unregisteredSEPointNorthPole === undefined) {
      SENodule.unregisteredSEPointNorthPole = new SEPoint(true); // Should never be displayed
      SENodule.unregisteredSEPointNorthPole.showing = false; // this never changes
      SENodule.unregisteredSEPointNorthPole.exists = true; // this never changes

      // function geoLocationToUnitSphere(
      //   latDegree: number,
      //   lngDegree: number
      // ): number[] {
      //   const latRad = latDegree.toRadians();
      //   const lngRad = lngDegree.toRadians();
      //   const xcor = Math.cos(latRad) * Math.cos(lngRad);
      //   const zcor = -Math.cos(latRad) * Math.sin(lngRad);
      //   const ycor = Math.sin(latRad);
      //   return [xcor, ycor, zcor];
      // }

      //Setup the north pole location
      const northPoleArray = geoLocationToUnitSphere(90, 0);
      northPoleVector.set(
        northPoleArray[0],
        northPoleArray[1],
        northPoleArray[2]
      ); // this never changes from the north pole
      northPoleVector.applyMatrix4(rotationMatrix);
      SENodule.unregisteredSEPointNorthPole.locationVector = northPoleVector;
    } else {
      northPoleVector.copy(
        SENodule.unregisteredSEPointNorthPole.locationVector
      );
    }

    // South Pole - create it as a static object if it doesn't exist already
    const southPoleVector = new Vector3();
    if (SENodule.unregisteredSEPointSouthPole === undefined) {
      SENodule.unregisteredSEPointSouthPole = new SEPoint(true); // Should never be displayed
      SENodule.unregisteredSEPointSouthPole.showing = false; // this never changes
      SENodule.unregisteredSEPointSouthPole.exists = true; // this never changes

      // function geoLocationToUnitSphere(
      //   latDegree: number,
      //   lngDegree: number
      // ): number[] {
      //   const latRad = latDegree.toRadians();
      //   const lngRad = lngDegree.toRadians();
      //   const xcor = Math.cos(latRad) * Math.cos(lngRad);
      //   const zcor = -Math.cos(latRad) * Math.sin(lngRad);
      //   const ycor = Math.sin(latRad);
      //   return [xcor, ycor, zcor];
      // }

      //Setup the South pole location
      const southPoleArray = geoLocationToUnitSphere(-90, 0);
      southPoleVector.set(
        southPoleArray[0],
        southPoleArray[1],
        southPoleArray[2]
      ); // this never changes from the South pole
      southPoleVector.applyMatrix4(rotationMatrix);
      SENodule.unregisteredSEPointSouthPole.locationVector = southPoleVector;
    }
    // else {
    //   southPoleVector.copy(
    //     SENodule.unregisteredSEPointSouthPole.locationVector
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
    //   SENodule.unregisteredSEPointNorthPole.locationVector.toFixed(2),
    //   "south ",
    //   SENodule.unregisteredSEPointSouthPole.locationVector.toFixed(2),
    //   "temp ",
    //   tempVec.toFixed(2)
    // );

    super(
      SENodule.unregisteredSEPointNorthPole,
      segmentNormalVector,
      Math.PI,
      SENodule.unregisteredSEPointSouthPole,
      true
    );
    this._longitude = longitudeDegree;
    //turn off the fill of the ref circle
    this.ref.updateStyle(StyleEditPanels.Front,
       {
        strokeColor: "hsla(0, 0%, 0%, 1)",
        fillColor: "hsla(0, 0%, 0%, 0)"
      }
    )
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
