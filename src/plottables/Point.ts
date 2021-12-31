/** @format */

import Two, { Color } from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { Vector3 } from "three";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_POINT_FRONT_STYLE,
  DEFAULT_POINT_BACK_STYLE
} from "@/types/Styles";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

export default class Point extends Nodule {
  /**
   * The vector location of the Point on the default sphere
   * The location vector in the Default Screen Plane
   * It will always be the case the x and y coordinates of these two vectors are the same.
   * The sign of the z coordinate indicates if the Point is on the back of the sphere
   */
  public _locationVector = new Vector3(1, 0, 0);
  public defaultScreenVectorLocation = new Two.Vector(1, 0);

  /**
   * The TwoJS objects that are used to display the point.
   * One is for the front, the other for the back. Only one is displayed at a time
   * The companion glowing objects are also declared, they are always larger than there
   * drawn counterparts so that a glowing edge shows.
   */
  protected frontPoint: Two.Circle;
  protected backPoint: Two.Circle;
  protected glowingFrontPoint: Two.Circle;
  protected glowingBackPoint: Two.Circle;

  /**
   * The styling variables for the drawn point. The user can modify these.
   */
  // Front
  protected glowingFillColorFront = SETTINGS.point.glowing.fillColor.front;
  protected glowingStrokeColorFront = SETTINGS.point.glowing.strokeColor.front;
  // Back - use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
  protected glowingFillColorBack = SETTINGS.point.glowing.fillColor.back;
  protected glowingStrokeColorBack = SETTINGS.point.glowing.strokeColor.back;

  /**
   * Initialize the current point scale factor that is adjusted by the zoom level and the user pointRadiusPercent
   * The initial size of the points are set by the defaults in SETTINGS
   */
  static pointScaleFactor = 1;

  /**
   * Update the point scale factor -- the points are drawn of the default size in the constructor
   * so to account for the zoom magnification we only need to keep track of the scale factor (which is
   * really just one over the current magnification factor) and then scale the point on the zoom event.
   * This is accomplished by the adjustSize() method
   * @param factor The ratio of the old magnification factor over the new magnification factor
   */
  static updatePointScaleFactorForZoom(factor: number): void {
    Point.pointScaleFactor *= factor;
  }

  constructor() {
    super();

    //Create the front/back/glowing/drawn TwoJS objects of the default size
    this.frontPoint = new Two.Circle(0, 0, SETTINGS.point.drawn.radius.front);
    this.backPoint = new Two.Circle(0, 0, SETTINGS.point.drawn.radius.back);
    this.glowingFrontPoint = new Two.Circle(
      0,
      0,
      SETTINGS.point.drawn.radius.front + SETTINGS.point.glowing.annularWidth
    );
    this.glowingBackPoint = new Two.Circle(
      0,
      0,
      SETTINGS.point.drawn.radius.back + SETTINGS.point.glowing.annularWidth
    );

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this.frontPoint.id), {
      type: "point",
      side: "front",
      fill: true,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this.backPoint.id), {
      type: "point",
      side: "back",
      fill: true,
      part: ""
    });

    // Set the location of the points front/back/glowing/drawn
    // The location of all points front/back/glowing/drawn is controlled by the
    //  Two.Group that they are all members of. To translate the group is to translate all points

    this.glowingFrontPoint.translation = this.defaultScreenVectorLocation;
    this.frontPoint.translation = this.defaultScreenVectorLocation;
    this.glowingBackPoint.translation = this.defaultScreenVectorLocation;
    this.backPoint.translation = this.defaultScreenVectorLocation;

    // The points are not initially glowing but are visible for the temporary object
    this.frontPoint.visible = true;
    this.glowingFrontPoint.visible = false;
    this.backPoint.visible = true;
    this.glowingBackPoint.visible = false;

    // Set the properties of the points that never change - stroke width and glowing options
    this.frontPoint.linewidth = SETTINGS.point.drawn.pointStrokeWidth.front;
    this.backPoint.linewidth = SETTINGS.point.drawn.pointStrokeWidth.back;
    this.glowingFrontPoint.linewidth =
      SETTINGS.point.drawn.pointStrokeWidth.front;
    this.glowingBackPoint.linewidth =
      SETTINGS.point.drawn.pointStrokeWidth.back;
    this.styleOptions.set(StyleEditPanels.Front, DEFAULT_POINT_FRONT_STYLE);
    this.styleOptions.set(StyleEditPanels.Back, DEFAULT_POINT_BACK_STYLE);
  }

  /**
   * Get and Set the location of the point in the Default Sphere, this also updates the display
   */
  set positionVector(idealUnitSphereVectorLocation: Vector3) {
    this._locationVector
      .copy(idealUnitSphereVectorLocation)
      .multiplyScalar(SETTINGS.boundaryCircle.radius);
    // Translate the whole group (i.e. all points front/back/glowing/drawn) to the new center vector
    this.defaultScreenVectorLocation.set(
      this._locationVector.x,
      this._locationVector.y
    );
    this.updateDisplay();
  }
  get positionVector(): Vector3 {
    return this._locationVector;
  }

  /**
   * The percent that the default radius point is scaled relative to the current magnification factor
   */
  get pointRadiusPercent(): number {
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
    if (!frontStyle) return 100;
    const radiusPercentFront = frontStyle.pointRadiusPercent ?? 100;
    const radiusPercentBack = backStyle?.pointRadiusPercent ?? 90;
    if (this._locationVector.z < 0) {
      return backStyle?.dynamicBackStyle ?? false
        ? Nodule.contrastPointRadiusPercent(radiusPercentFront)
        : radiusPercentBack;
    } else {
      return radiusPercentFront;
    }
  }

  frontGlowingDisplay(): void {
    this.frontPoint.visible = true;
    this.glowingFrontPoint.visible = true;
    this.backPoint.visible = false;
    this.glowingBackPoint.visible = false;
  }

  backGlowingDisplay(): void {
    this.frontPoint.visible = false;
    this.glowingFrontPoint.visible = false;
    this.backPoint.visible = true;
    this.glowingBackPoint.visible = true;
  }

  glowingDisplay(): void {
    if (this._locationVector.z > 0) {
      this.frontGlowingDisplay();
    } else {
      this.backGlowingDisplay();
    }
  }

  frontNormalDisplay(): void {
    this.frontPoint.visible = true;
    this.glowingFrontPoint.visible = false;
    this.backPoint.visible = false;
    this.glowingBackPoint.visible = false;
  }

  backNormalDisplay(): void {
    this.frontPoint.visible = false;
    this.glowingFrontPoint.visible = false;
    this.backPoint.visible = true;
    this.glowingBackPoint.visible = false;
  }

  normalDisplay(): void {
    if (this._locationVector.z > 0) {
      this.frontNormalDisplay();
    } else {
      this.backNormalDisplay();
    }
  }

  addToLayers(layers: Two.Group[]): void {
    this.frontPoint.addTo(layers[LAYER.foregroundPoints]);
    this.glowingFrontPoint.addTo(layers[LAYER.foregroundPointsGlowing]);
    this.backPoint.addTo(layers[LAYER.backgroundPoints]);
    this.glowingBackPoint.addTo(layers[LAYER.backgroundPointsGlowing]);
  }

  removeFromLayers(): void {
    this.frontPoint.remove();
    this.glowingFrontPoint.remove();
    this.backPoint.remove();
    this.glowingBackPoint.remove();
  }

  updateDisplay(): void {
    this.normalDisplay();
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontPoint.visible = false;
      this.glowingFrontPoint.visible = false;
      this.backPoint.visible = false;
      this.glowingBackPoint.visible = false;
    } else {
      this.normalDisplay();
    }
  }

  setSelectedColoring(flag: boolean): void {
    //set the new colors into the variables
    if (flag) {
      this.glowingFillColorFront = SETTINGS.style.selectedColor.front;
      this.glowingFillColorBack = SETTINGS.style.selectedColor.back;
      this.glowingStrokeColorFront = SETTINGS.style.selectedColor.front;
      this.glowingStrokeColorBack = SETTINGS.style.selectedColor.back;
    } else {
      this.glowingFillColorFront = SETTINGS.point.glowing.fillColor.front;
      this.glowingFillColorBack = SETTINGS.point.glowing.fillColor.back;
      this.glowingStrokeColorFront = SETTINGS.point.glowing.strokeColor.front;
      this.glowingStrokeColorBack = SETTINGS.point.glowing.strokeColor.back;
    }
    // apply the new color variables to the object
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_POINT_FRONT_STYLE;

      case StyleEditPanels.Back:
        if (SETTINGS.point.dynamicBackStyle)
          return {
            ...DEFAULT_POINT_BACK_STYLE,
            pointRadiusPercent: Nodule.contrastPointRadiusPercent(
              SETTINGS.point.radiusPercent.front
            ),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.point.drawn.strokeColor.front
            ),
            fillColor: Nodule.contrastFillColor(
              SETTINGS.point.drawn.fillColor.front
            )
          };
        else return DEFAULT_POINT_BACK_STYLE;

      default:
        return {};
    }
  }
  /**
   * Sets the variables for point radius glowing/not
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
    const radiusPercentFront = frontStyle?.pointRadiusPercent ?? 100;
    const radiusPercentBack = backStyle?.pointRadiusPercent ?? 90;
    this.frontPoint.scale = (Point.pointScaleFactor * radiusPercentFront) / 100;

    this.backPoint.scale =
      (Point.pointScaleFactor *
        (backStyle?.dynamicBackStyle ?? false
          ? Nodule.contrastPointRadiusPercent(radiusPercentFront)
          : radiusPercentBack)) /
      100;

    this.glowingFrontPoint.scale =
      (Point.pointScaleFactor * radiusPercentFront) / 100;

    this.glowingBackPoint.scale =
      (Point.pointScaleFactor *
        (backStyle?.dynamicBackStyle ?? false
          ? Nodule.contrastPointRadiusPercent(radiusPercentFront)
          : radiusPercentBack)) /
      100;
  }
  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the point
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual Two.js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual Two.js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual Two.js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // Use the SETTINGS temporary options to directly modify the Two.js objects.
        // FRONT
        if (
          Nodule.hlsaIsNoFillOrNoStroke(SETTINGS.point.temp.fillColor.front)
        ) {
          this.frontPoint.noFill();
        } else {
          this.frontPoint.fill = SETTINGS.point.temp.fillColor.front;
        }
        this.frontPoint.stroke = SETTINGS.point.temp.strokeColor.front;
        // strokeWidth is not user modifiable, strokeWidth is always the default drawn one
        // front pointRadiusPercent applied by adjustSize(); (accounts for zoom)

        // BACK
        if (Nodule.hlsaIsNoFillOrNoStroke(SETTINGS.point.temp.fillColor.back)) {
          this.backPoint.noFill();
        } else {
          this.backPoint.fill = SETTINGS.point.temp.fillColor.back;
        }
        this.backPoint.stroke = SETTINGS.point.temp.strokeColor.back;
        // strokeWidth is not user modifiable, strokeWidth is always the default drawn one
        // back pointRadiusPercent applied by adjustSize(); (accounts for zoom)

        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.
        // FRONT
        const frontStyle = this.styleOptions.get(StyleEditPanels.Front)!;
        if (Nodule.hlsaIsNoFillOrNoStroke(frontStyle.fillColor)) {
          this.frontPoint.noFill();
        } else {
          this.frontPoint.fill = frontStyle.fillColor as Two.Color;
        }
        if (Nodule.hlsaIsNoFillOrNoStroke(frontStyle.strokeColor)) {
          this.frontPoint.noStroke();
        } else {
          this.frontPoint.stroke = frontStyle.strokeColor as Two.Color;
        }
        //stroke width is not user modifiable - set in the constructor
        // pointRadiusPercent applied by adjustSize();

        // BACK
        const backStyle = this.styleOptions.get(StyleEditPanels.Back)!;
        if (backStyle.dynamicBackStyle) {
          if (
            Nodule.hlsaIsNoFillOrNoStroke(
              Nodule.contrastFillColor(frontStyle.fillColor)
            )
          ) {
            this.backPoint.noFill();
          } else {
            this.backPoint.fill = Nodule.contrastFillColor(
              frontStyle.fillColor!
            );
          }
        } else {
          if (Nodule.hlsaIsNoFillOrNoStroke(backStyle.fillColor)) {
            this.backPoint.noFill();
          } else {
            this.backPoint.fill = backStyle.fillColor as Two.Color;
          }
        }
        if (backStyle.dynamicBackStyle) {
          if (
            Nodule.hlsaIsNoFillOrNoStroke(
              Nodule.contrastStrokeColor(frontStyle.strokeColor)
            )
          ) {
            this.backPoint.noStroke();
          } else {
            this.backPoint.stroke = Nodule.contrastStrokeColor(
              frontStyle.strokeColor!
            );
          }
        } else {
          if (Nodule.hlsaIsNoFillOrNoStroke(backStyle.strokeColor)) {
            this.backPoint.noStroke();
          } else {
            this.backPoint.stroke = backStyle.strokeColor as Two.Color;
          }
        }
        //stroke width is not user modifiable - set in the constructor
        // pointRadiusPercent applied by adjustSize();

        // FRONT Glowing
        if (Nodule.hlsaIsNoFillOrNoStroke(this.glowingFillColorFront)) {
          this.glowingFrontPoint.noFill();
        } else {
          this.glowingFrontPoint.fill = this.glowingFillColorFront;
        }
        if (Nodule.hlsaIsNoFillOrNoStroke(this.glowingStrokeColorBack)) {
          this.glowingFrontPoint.noStroke();
        } else {
          this.glowingFrontPoint.stroke = this.glowingStrokeColorBack;
        }

        // points have no dashing

        // Back Glowing
        if (
          Nodule.hlsaIsNoFillOrNoStroke(SETTINGS.point.glowing.fillColor.back)
        ) {
          this.glowingBackPoint.noFill();
        } else {
          this.glowingBackPoint.fill = this.glowingFillColorBack;
        }
        if (Nodule.hlsaIsNoFillOrNoStroke(this.glowingStrokeColorBack)) {
          this.glowingBackPoint.noStroke();
        } else {
          this.glowingBackPoint.stroke = this.glowingStrokeColorBack;
        }

        // points have no dashing

        break;
      }
    }
  }
}
