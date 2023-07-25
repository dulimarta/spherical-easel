import { SENodule } from "./SENodule";
import { SEPoint, SESegment } from "./internal";
import { Matrix4, Vector3 } from "three";
import { StyleEditPanels } from "@/types/Styles";
import i18n from "@/i18n";
import { geoLocationToUnitSphere } from "@/composables/earth";
// import { useSEStore } from "@/stores/se";
// import { storeToRefs } from "pinia";

// const store = useSEStore();
// const { inverseTotalRotationMatrix } = storeToRefs(store);
// const { geoLocationToUnitSphere } = useEarthCoordinate();
const tempVec = new Vector3();

export class SELongitude extends SESegment {
  private _longitude = 0;

  /**
   * Create a model SESegment using:
   * @param longitude, the longitude of the circle IN DEGREES
   */
  constructor(longitude: number) {
    // segment(start|end)SEPoint are never added to the object tree, they are never displayed, they are never registered
    // they *could* be updated in the update() method, but in this case they are not because they are fixed (in other classes
    //  like tangent line, these hidden SEPoint may have *only* there location updated)

    // North Pole
    const segmentStartSEPoint = new SEPoint(true); // Should never be displayed
    segmentStartSEPoint.showing = false; // this never changes
    segmentStartSEPoint.exists = true; // this never changes

    //Setup the north pole location
    const northPole = geoLocationToUnitSphere(90, 0);
    const northPoleVector = new Vector3(
      northPole[0],
      northPole[2],
      northPole[1] // Switch when merging with vue3-upgrade
    ); // this never changes from the north pole
    const rotationMatrix = new Matrix4();
    rotationMatrix.copy(SENodule.store.inverseTotalRotationMatrix).invert();
    northPoleVector.applyMatrix4(rotationMatrix);
    segmentStartSEPoint.locationVector = northPoleVector;

    // South Pole
    const segmentEndSEPoint = new SEPoint(true); // Should never be displayed
    segmentEndSEPoint.showing = false; // this never changes
    segmentEndSEPoint.exists = true; // this never changes

    //Setup the south pole location
    const southPole = geoLocationToUnitSphere(-90, 0);
    const southPoleVector = new Vector3(
      southPole[0],
      southPole[2],
      southPole[1] // Switch when merging with vue3-upgrade
    ); // this never changes from the south pole
    southPoleVector.applyMatrix4(rotationMatrix);
    segmentEndSEPoint.locationVector = southPoleVector;

    // Normal Vector
    const segmentNormalVector = new Vector3();
    tempVec.set(
      Math.cos(longitude.toRadians()),
      Math.sin(longitude.toRadians()),
      0 // Switch when merging with vue3-upgrade
    );
    tempVec.applyMatrix4(rotationMatrix);
    segmentNormalVector.crossVectors(northPoleVector, tempVec).normalize();
    // console.log(
    //   "normal",
    //   segmentNormalVector.toFixed(2),
    //   "north ",
    //   northPoleVector.toFixed(2),
    //   "south ",
    //   southPoleVector.toFixed(2),
    //   "temp ",
    //   tempVec.toFixed(2)
    // );

    super(
      segmentStartSEPoint,
      segmentNormalVector,
      Math.PI,
      segmentEndSEPoint,
      true
    );
    this._longitude = longitude;
    //turn off the fill of the ref circle
    SENodule.store.changeStyle({
      selected: [this.ref],
      panel: StyleEditPanels.Front,
      payload: {
        strokeColor: "hsla(0, 0%, 0%, 1)",
        fillColor: "hsla(0, 0%, 0%, 0)"
      }
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
