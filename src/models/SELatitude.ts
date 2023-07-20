import { SENodule } from "./SENodule";
import {
  SEPoint,
  SELabel,
  SELine,
  SEThreePointCircleCenter,
  SEInversionCircleCenter,
  SECircle
} from "./internal";
import Circle from "@/plottables/Circle";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import {
  NormalAndPerpendicularPoint,
  NormalAndTangentPoint,
  ObjectState,
  OneDimensional
} from "@/types";
import SETTINGS from "@/global-settings";
import {
  DEFAULT_CIRCLE_BACK_STYLE,
  DEFAULT_CIRCLE_FRONT_STYLE,
  StyleEditPanels
} from "@/types/Styles";
import { Labelable } from "@/types";
import { intersectCircles } from "@/utils/intersections";
import i18n from "@/i18n";
import NonFreeCircle from "@/plottables/NonFreeCircle";
import { DisplayStyle } from "@/plottables/Nodule";
// import { SEThreePointCircleCenter } from "./SEThreePointCircleCenter";
// import { SEInversionCircleCenter } from "./SEInversionCircleCenter";
// import { SELine } from "./SELine";
const { t } = i18n.global;

export class SELatitude extends SECircle {
  private _latitude = 0;

  /**
   * Create a model SECircle using:
   * @param latitude, the latitude of the circle IN DEGREES
   */
  constructor(latitude: number) {
    const centerSEPoint = new SEPoint(true); // Should never be displayed
    centerSEPoint.locationVector = new Vector3(0, 0, 1);
    const circleSEPoint = new SEPoint(true); // Should never be displayed
    const angleRad = (latitude * Math.PI) / 180;
    circleSEPoint.locationVector = new Vector3(
      0,
      Math.cos(angleRad),
      Math.sin(angleRad)
    );
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
    // this.ref.stylize(DisplayStyle.ApplyCurrentVariables);
    // this._centerSEPoint = centerPoint;
    // this._circleSEPoint = circlePoint;
    // this.ref = createNonFreeCircle ? new NonFreeCircle() : new Circle();
    // this.ref.centerVector = centerPoint.locationVector;
    // this.ref.circleRadius = this.circleRadius;
    // this.ref.updateDisplay();
    // this.ref.stylize(DisplayStyle.ApplyCurrentVariables);
    // this.ref.adjustSize();
    // SECircle.CIRCLE_COUNT++;
    // this.name = `C${SECircle.CIRCLE_COUNT}`;
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
