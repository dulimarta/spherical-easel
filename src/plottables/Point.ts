/** @format */

// import SETTINGS from "@/global-settings";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule from "./Nodule";
import { Vector3 } from "three";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

const defaultRadiusFront = SETTINGS.point.drawn.radius.front;
const defaultRadiusBack = SETTINGS.point.drawn.radius.back;

export default class Point extends Nodule {
  /**
   * The vector location of the Point on the ideal unit sphere
   */
  public vectorLocation = new Vector3();

  /**
   * The TwoJS objects that are used to display the point.
   * One is for the front, the other for the back. Only one is displayed at a time
   * The companion glowing objects are also declared, they are always larger than there
   * drawn counterparts so that a glowing edge shows.
   */
  private frontPoint: Two.Circle;
  private backPoint: Two.Circle;
  private glowingFrontPoint: Two.Circle;
  private glowingBackPoint: Two.Circle;

  /**
   * The styling variables for the drawn point. The user can modify these.
   * Created with the Google Sheet "Point Styling Code" in the "Set Drawn Variables" tab
   */
  // FRONT
  private fillColorFront = SETTINGS.point.drawn.fillColor.front;
  private strokeColorFront = SETTINGS.point.drawn.strokeColor.front;
  private strokeWidthFront = SETTINGS.point.drawn.strokeWidth.front;
  private opacityFront = SETTINGS.point.drawn.opacity.front;
  // BACK
  private fillColorBack = SETTINGS.point.dynamicBackStyle
    ? Nodule.contrastFillColor(SETTINGS.point.drawn.fillColor.front)
    : SETTINGS.point.drawn.fillColor.back;
  private strokeColorBack = SETTINGS.point.dynamicBackStyle
    ? Nodule.contrastStrokeColor(SETTINGS.point.drawn.strokeColor.front)
    : SETTINGS.point.drawn.strokeColor.back;
  private strokeWidthBack = SETTINGS.point.dynamicBackStyle
    ? Nodule.contractStrokeWidth(SETTINGS.point.drawn.strokeWidth.front)
    : SETTINGS.point.drawn.strokeWidth.back;
  private opacityBack = SETTINGS.point.dynamicBackStyle
    ? Nodule.contrastOpacity(SETTINGS.point.drawn.opacity.front)
    : SETTINGS.point.drawn.opacity.back;

  constructor() {
    super();

    //Create the front/back/glowing/drawn TwoJS objects
    this.frontPoint = new Two.Circle(0, 0, defaultRadiusFront);
    this.backPoint = new Two.Circle(0, 0, defaultRadiusBack);
    this.glowingFrontPoint = new Two.Circle(
      0,
      0,
      defaultRadiusFront + SETTINGS.point.glowing.annularWidth
    );
    this.glowingBackPoint = new Two.Circle(
      0,
      0,
      defaultRadiusBack + SETTINGS.point.glowing.annularWidth
    );
    // Add them to this object. TODO: Why do we do this?
    this.add(
      this.glowingBackPoint,
      this.backPoint,
      this.glowingFrontPoint,
      this.frontPoint
    );

    // Set the location of the points front/back/glowing/drawn
    // The location of all points front/back/glowing/drawn is controlled by the
    //  Two.Group that they are all members of. To translate the group is to translate all points
    this.glowingFrontPoint.translation = this.translation;
    this.frontPoint.translation = this.translation;
    this.glowingBackPoint.translation = this.translation;
    this.backPoint.translation = this.translation;

    // Name the point
    this.name = "Point-" + this.id;

    // The points are not initially glowing
    (this.frontPoint as any).visible = true;
    (this.glowingFrontPoint as any).visible = false;
    (this.backPoint as any).visible = true;
    (this.glowingBackPoint as any).visible = false;
  }

  /**
   * Get and Set the location of the point
   */
  set positionVector(newPositionVector: Vector3) {
    this.vectorLocation.copy(newPositionVector).normalize;
    // Set the style based on the z-coordinate of the position
    if (newPositionVector.z < 0) {
      this.backNormalDisplay();
    } else {
      this.frontNormalDisplay();
    }
    // Translate the whole group (i.e. all points front/back/glowing/drawn) to the new center vector
    this.frontPoint.translation
      .set(newPositionVector.x, newPositionVector.y)
      .multiplyScalar(SETTINGS.boundaryCircle.radius);
  }
  get positionVector(): Vector3 {
    return this.vectorLocation;
  }

  /**
   * Adjust the size of the point (by scaling) so that zooming doesn't make the point too big and
   * zooming out doesn't make the point too small
   * @param factor The scale factor of the current zoom port
   */
  adjustSizeForZoom(factor: number): void {
    const newRadius = defaultRadiusFront * factor;
    let newScale = 1;
    if (newRadius > SETTINGS.point.drawn.radius.rmax) {
      // debugger; // eslint-disable-line
      newScale = SETTINGS.point.drawn.radius.rmax / newRadius;
    }
    if (newRadius < SETTINGS.point.drawn.radius.rmin) {
      // debugger; // eslint-disable-line
      newScale = SETTINGS.point.drawn.radius.rmin / newRadius;
    }

    this.frontPoint.scale = newScale;
  }

  frontGlowingDisplay(): void {
    (this.frontPoint as any).visible = true;
    (this.glowingFrontPoint as any).visible = true;
    (this.backPoint as any).visible = false;
    (this.glowingBackPoint as any).visible = false;
  }

  backGlowingDisplay(): void {
    (this.frontPoint as any).visible = false;
    (this.glowingFrontPoint as any).visible = false;
    (this.backPoint as any).visible = true;
    (this.glowingBackPoint as any).visible = true;
  }

  glowingDisplay(): void {
    if (this.vectorLocation.z > 0) {
      this.frontGlowingDisplay();
    } else {
      this.backGlowingDisplay();
    }
  }

  frontNormalDisplay(): void {
    (this.frontPoint as any).visible = true;
    (this.glowingFrontPoint as any).visible = false;
    (this.backPoint as any).visible = false;
    (this.glowingBackPoint as any).visible = false;
  }

  backNormalDisplay(): void {
    (this.frontPoint as any).visible = false;
    (this.glowingFrontPoint as any).visible = false;
    (this.backPoint as any).visible = true;
    (this.glowingBackPoint as any).visible = false;
  }

  normalDisplay(): void {
    if (this.vectorLocation.z > 0) {
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
    this.normalDisplay();
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontPoint.remove();
    this.glowingFrontPoint.remove();
    this.backPoint.remove();
    this.glowingBackPoint.remove();
  }

  public update(): void {
    this.normalDisplay();
  }

  /**
   * Set the rendering style (flags: temporary, default, glowing, update) of the point
   * Update flag means at least one of the private variables storing style information has
   * changed and should be applied to the displayed point.
   */
  stylize(flag: string): void {
    switch (flag) {
      case "temporary": {
        // The style for the temporary circle display.  These options are not user modifiable.
        // Created with the Google Sheet "Point Styling Code" in the "Temporary" tab
        // FRONT
        if (SETTINGS.point.temp.fillColor.front === "noFill") {
          this.frontPoint.noFill();
        } else {
          this.frontPoint.fill = SETTINGS.point.temp.fillColor.front;
        }
        if (SETTINGS.point.temp.strokeColor.front === "noStroke") {
          this.frontPoint.noStroke();
        } else {
          this.frontPoint.stroke = SETTINGS.point.temp.strokeColor.front;
        }
        this.frontPoint.linewidth = SETTINGS.point.temp.strokeWidth.front;
        this.frontPoint.opacity = SETTINGS.point.temp.opacity.front;
        // BACK
        if (SETTINGS.point.temp.fillColor.back === "noFill") {
          this.backPoint.noFill();
        } else {
          this.backPoint.fill = SETTINGS.point.temp.fillColor.back;
        }
        if (SETTINGS.point.temp.strokeColor.back === "noStroke") {
          this.backPoint.noStroke();
        } else {
          this.backPoint.stroke = SETTINGS.point.temp.strokeColor.back;
        }
        this.backPoint.linewidth = SETTINGS.point.temp.strokeWidth.back;
        this.backPoint.opacity = SETTINGS.point.temp.opacity.back;
        break;
      }

      case "glowing": {
        // The style for the glowing circle display.  These options are not user modifiable.
        // Created with the Google Sheet "Point Styling Code" in the "Glowing" tab
        // FRONT
        if (SETTINGS.point.glowing.fillColor.front === "noFill") {
          this.glowingFrontPoint.noFill();
        } else {
          this.glowingFrontPoint.fill = SETTINGS.point.glowing.fillColor.front;
        }
        if (SETTINGS.point.glowing.strokeColor.front === "noStroke") {
          this.glowingFrontPoint.noStroke();
        } else {
          this.glowingFrontPoint.stroke =
            SETTINGS.point.glowing.strokeColor.front;
        }
        this.glowingFrontPoint.linewidth =
          SETTINGS.point.glowing.strokeWidth.front;
        this.glowingFrontPoint.opacity = SETTINGS.point.glowing.opacity.front;
        // BACK
        if (SETTINGS.point.glowing.fillColor.back === "noFill") {
          this.glowingBackPoint.noFill();
        } else {
          this.glowingBackPoint.fill = SETTINGS.point.glowing.fillColor.back;
        }
        if (SETTINGS.point.glowing.strokeColor.back === "noStroke") {
          this.glowingBackPoint.noStroke();
        } else {
          this.glowingBackPoint.stroke =
            SETTINGS.point.glowing.strokeColor.back;
        }
        this.glowingBackPoint.linewidth =
          SETTINGS.point.glowing.strokeWidth.back;
        this.glowingBackPoint.opacity = SETTINGS.point.glowing.opacity.back;
        break;
      }
      case "update": {
        // Use the current variables to update the display style
        // Created with the Google Sheet "Point Styling Code" in the "Drawn Update" tab
        // FRONT
        if (this.fillColorFront === "noFill") {
          this.frontPoint.noFill();
        } else {
          this.frontPoint.fill = this.fillColorFront;
        }
        this.frontPoint.stroke = this.strokeColorFront;
        this.frontPoint.linewidth = this.strokeWidthFront;
        this.frontPoint.opacity = this.opacityFront;
        // BACK
        if (this.fillColorBack === "noFill") {
          this.backPoint.noFill();
        } else {
          this.backPoint.fill = this.fillColorBack;
        }
        this.backPoint.stroke = this.strokeColorBack;
        this.backPoint.linewidth = this.strokeWidthBack;
        this.backPoint.opacity = this.opacityBack;
        break;
      }
      case "default":
      default: {
        // Reset the style to the defaults i.e. Use the global defaults to update the display style
        // Created with the Google Sheet "Point Styling Code" in the "Drawn Set To Defaults" tab
        // FRONT
        if (SETTINGS.point.drawn.fillColor.front === "noFill") {
          this.frontPoint.noFill();
        } else {
          this.frontPoint.fill = SETTINGS.point.drawn.fillColor.front;
        }
        if (SETTINGS.point.drawn.strokeColor.front === "noStroke") {
          this.frontPoint.noStroke();
        } else {
          this.frontPoint.stroke = SETTINGS.point.drawn.strokeColor.front;
        }
        this.frontPoint.linewidth = SETTINGS.point.drawn.strokeWidth.front;
        this.frontPoint.opacity = SETTINGS.point.drawn.opacity.front;
        // BACK
        if (SETTINGS.point.drawn.fillColor.back === "noFill") {
          this.backPoint.noFill();
        } else {
          this.backPoint.fill = SETTINGS.point.drawn.fillColor.back;
        }
        if (SETTINGS.point.drawn.strokeColor.back === "noStroke") {
          this.backPoint.noStroke();
        } else {
          this.backPoint.stroke = SETTINGS.point.drawn.strokeColor.back;
        }
        this.backPoint.linewidth = SETTINGS.point.drawn.strokeWidth.back;
        this.backPoint.opacity = SETTINGS.point.drawn.opacity.back;

        break;
      }
    }
  }
}
