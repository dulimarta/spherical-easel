import { SENodule } from "./SENodule";
import { SEPoint, SECircle } from "./internal";
import { Matrix4, Vector3 } from "three";
import { StyleEditPanels } from "@/types/Styles";
import i18n from "@/i18n";
import { geoLocationToUnitSphere } from "@/composables/earth";
// import { useSEStore } from "@/stores/se";
// import { storeToRefs } from "pinia";

// const store = useSEStore();
// const { inverseTotalRotationMatrix } = storeToRefs(store);
//const { geoLocationToUnitSphere } = useEarthCoordinate();

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

    // North Pole
    const centerSEPoint = new SEPoint(true); // Should never be displayed
    centerSEPoint.showing = false; // this never changes
    centerSEPoint.exists = true; // this never changes

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
    const northPole = geoLocationToUnitSphere(90, 0);
    const northPoleVector = new Vector3(
      northPole[0],
      northPole[2],
      northPole[1] // Switch when merging with vue3-upgrade
    ); // this never changes from the north pole
    const rotationMatrix = new Matrix4();
    rotationMatrix.copy(SENodule.store.inverseTotalRotationMatrix).invert();
    northPoleVector.applyMatrix4(rotationMatrix);
    centerSEPoint.locationVector = northPoleVector;

    //Circle Point
    const circleSEPoint = new SEPoint(true); // Should never be displayed
    centerSEPoint.showing = false; // this never changes
    centerSEPoint.exists = true; // this never changes

    //Set up the circle point location
    const pointLocation = geoLocationToUnitSphere(latitude, 0);
    const pointLocationVector = new Vector3(
      pointLocation[0],
      pointLocation[2],
      pointLocation[1] // Switch when merging with vue3-upgrade
    ); // this never changes
    pointLocationVector.applyMatrix4(rotationMatrix);
    circleSEPoint.locationVector = pointLocationVector;

    super(centerSEPoint, circleSEPoint, true);
    this._latitude = latitude;
    //turn off the fill of the ref circle
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
