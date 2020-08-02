/** @format */

// import SETTINGS from "@/global-settings";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { Vector3 } from "three";
import { StyleOptions } from "@/types/Styles";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

export default class NonFreePoint extends Point {
  /**
   * The styling variables for the drawn point. The user can modify these.

   */
  // Front
  private fillColorFront = SETTINGS.point.drawn.fillColor.front;
  private strokeColorFront = SETTINGS.point.drawn.strokeColor.front;
  private pointRadiusPercentFront = 100;
  private opacityFront = SETTINGS.point.drawn.opacity.front;
  // Back
  private fillColorBack = SETTINGS.point.dynamicBackStyle
    ? Nodule.contrastFillColor(SETTINGS.point.drawn.fillColor.front)
    : SETTINGS.point.drawn.fillColor.back;
  private strokeColorBack = SETTINGS.point.dynamicBackStyle
    ? Nodule.contrastStrokeColor(SETTINGS.point.drawn.strokeColor.front)
    : SETTINGS.point.drawn.strokeColor.back;
  private pointRadiusPercentBack = SETTINGS.point.dynamicBackStyle
    ? Nodule.contrastPointRadiusPercent(
        SETTINGS.point.drawn.pointStrokeWidth.front
      )
    : 100;
  private opacityBack = SETTINGS.point.dynamicBackStyle
    ? Nodule.contrastOpacity(SETTINGS.point.drawn.opacity.front)
    : SETTINGS.point.drawn.opacity.back;
  private dynamicBackStyle = SETTINGS.point.dynamicBackStyle;

  /**
   * Initialize the current point scale factor that is adjusted by the zoom level and the user pointRadiusPercent
   * The initial size of the points are
   */
  static currentPointRadiusFront = SETTINGS.point.drawn.radius.front;
  static currentPointRadiusBack = SETTINGS.point.drawn.radius.back;
  static currentGlowingPointRadiusFront =
    SETTINGS.point.drawn.radius.front + SETTINGS.point.glowing.annularWidth;
  static currentGlowingPointRadiusBack =
    SETTINGS.point.drawn.radius.back + SETTINGS.point.glowing.annularWidth;
  static pointScaleFactor = 1;

  constructor() {
    super();
  }

  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * Two.js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(options: StyleOptions): void {
    console.debug("Point: Update style of", this.name, "using", options);
    if (options.front) {
      // Set the front options
      if (options.pointRadiusPercent) {
        this.pointRadiusPercentFront = options.pointRadiusPercent;
      }
      if (options.fillColor) {
        this.fillColorFront = options.fillColor;
      }
      if (options.strokeColor) {
        this.strokeColorFront = options.strokeColor;
      }
      if (options.opacity) {
        this.opacityFront = options.opacity;
      }
    } else {
      // Set the back options
      // options.dynamicBackStyle is true, so we need to explicitly check for undefined otherwise
      // when it is false, this doesn't execute and this.dynamicBackStyle is not set
      if (options.dynamicBackStyle != undefined) {
        this.dynamicBackStyle = options.dynamicBackStyle;
      }
      if (options.pointRadiusPercent) {
        this.pointRadiusPercentBack = options.pointRadiusPercent;
      }
      if (options.fillColor) {
        this.fillColorBack = options.fillColor;
      }
      if (options.strokeColor) {
        this.strokeColorBack = options.strokeColor;
      }
      if (options.opacity) {
        this.opacityBack = options.opacity;
      }
    }
    // Now apply the style and size
    this.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
    this.adjustSize();
  }
  /**
   * Return the current style state
   */
  currentStyleState(front: boolean): StyleOptions {
    if (front) {
      return {
        front: front,
        pointRadiusPercent: this.pointRadiusPercentFront,
        strokeColor: this.strokeColorFront,
        fillColor: this.fillColorFront,
        opacity: this.opacityFront
      };
    } else {
      return {
        front: front,
        pointRadiusPercent: this.pointRadiusPercentBack,
        strokeColor: this.strokeColorBack,
        fillColor: this.fillColorBack,
        opacity: this.opacityBack,
        dynamicBackStyle: this.dynamicBackStyle
      };
    }
  }
  /**
   * Return the default style state
   */
  defaultStyleState(front: boolean): StyleOptions {
    if (front) {
      return {
        front: front,
        pointRadiusPercent: 100,
        strokeColor: SETTINGS.point.drawn.strokeColor.front,
        fillColor: SETTINGS.point.drawn.fillColor.front,
        opacity: SETTINGS.point.drawn.opacity.front
      };
      // Back
    } else {
      return {
        front: front,

        pointRadiusPercent: SETTINGS.point.dynamicBackStyle
          ? Nodule.contrastPointRadiusPercent(100)
          : 100,

        strokeColor: SETTINGS.point.dynamicBackStyle
          ? Nodule.contrastStrokeColor(SETTINGS.point.drawn.strokeColor.front)
          : SETTINGS.circle.drawn.strokeColor.back,

        fillColor: SETTINGS.point.dynamicBackStyle
          ? Nodule.contrastFillColor(SETTINGS.point.drawn.fillColor.front)
          : SETTINGS.circle.drawn.fillColor.back,

        opacity: SETTINGS.point.dynamicBackStyle
          ? Nodule.contrastOpacity(SETTINGS.point.drawn.opacity.front)
          : SETTINGS.point.drawn.opacity.back,

        dynamicBackStyle: SETTINGS.point.dynamicBackStyle
      };
    }
  }
  /**
   * Sets the variables for point radius glowing/not
   */
  adjustSize(): void {
    this.frontPoint.scale =
      (Point.pointScaleFactor * this.pointRadiusPercentFront) / 100;

    this.backPoint.scale =
      (Point.pointScaleFactor *
        (this.dynamicBackStyle
          ? Nodule.contrastPointRadiusPercent(this.pointRadiusPercentFront)
          : this.pointRadiusPercentBack)) /
      100;

    this.glowingFrontPoint.scale =
      (Point.pointScaleFactor * this.pointRadiusPercentFront) / 100;

    this.glowingBackPoint.scale =
      (Point.pointScaleFactor *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.pointRadiusPercentFront)
          : this.pointRadiusPercentBack)) /
      100;
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables, ResetVariablesToDefaults) of the line
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual Two.js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual Two.js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual Two.js objects
   *
   * ResetVariablesToDefaults means that all the private style variables are set to their defaults from SETTINGS.
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.APPLYTEMPORARYVARIABLES: {
        // Use the SETTINGS temporary options to directly modify the Two.js objects.
        // FRONT
        if (SETTINGS.point.temp.fillColor.front === "noFill") {
          this.frontPoint.noFill();
        } else {
          this.frontPoint.fill = SETTINGS.point.temp.fillColor.front;
        }
        this.frontPoint.stroke = SETTINGS.point.temp.strokeColor.front;
        // strokeWidth is not user modifiable, strokeWidth is always the default drawn one
        this.frontPoint.vertices.forEach(v => {
          v.normalize().multiplyScalar(Point.currentPointRadiusFront);
        }); // temporary points are always the currentPointSize (accounts for zoom)
        this.frontPoint.opacity = SETTINGS.point.temp.opacity.front;

        // BACK
        if (SETTINGS.point.temp.fillColor.back === "noFill") {
          this.backPoint.noFill();
        } else {
          this.backPoint.fill = SETTINGS.point.temp.fillColor.back;
        }
        this.backPoint.stroke = SETTINGS.point.temp.strokeColor.back;
        // strokeWidth is not user modifiable, strokeWidth is always the default drawn one
        this.backPoint.vertices.forEach(v => {
          v.normalize().multiplyScalar(Point.currentPointRadiusBack);
        }); // temporary points are always the currentPointSize (accounts for zoom)
        this.backPoint.opacity = SETTINGS.point.temp.opacity.back;

        break;
      }

      case DisplayStyle.APPLYCURRENTVARIABLES: {
        // Use the current variables to directly modify the Two.js objects.
        // FRONT
        if (this.fillColorFront === "noFill") {
          this.frontPoint.noFill();
        } else {
          this.frontPoint.fill = this.fillColorFront;
        }
        if (this.strokeColorFront == "noStroke") {
          this.frontPoint.noStroke();
        } else {
          this.frontPoint.stroke = this.strokeColorFront;
        }
        //stroke width is not user modifiable - set in the constructor
        // pointRadiusPercent applied by adjustSize();
        this.frontPoint.opacity = this.opacityFront;

        // BACK
        if (this.dynamicBackStyle) {
          if (Nodule.contrastFillColor(this.fillColorFront) === "noFill") {
            this.backPoint.noFill();
          } else {
            this.backPoint.fill = Nodule.contrastFillColor(this.fillColorFront);
          }
        } else {
          if (this.fillColorBack === "noFill") {
            this.backPoint.noFill();
          } else {
            this.backPoint.fill = this.fillColorBack;
          }
        }
        if (this.dynamicBackStyle) {
          if (
            Nodule.contrastStrokeColor(this.strokeColorFront) === "noStroke"
          ) {
            this.backPoint.noStroke();
          } else {
            this.backPoint.stroke = Nodule.contrastStrokeColor(
              this.strokeColorFront
            );
          }
        } else {
          if (this.strokeColorBack === "noStroke") {
            this.backPoint.noStroke();
          } else {
            this.backPoint.stroke = this.strokeColorBack;
          }
        }
        //stroke width is not user modifiable - set in the constructor
        // pointRadiusPercent applied by adjustSize();
        this.backPoint.opacity = this.dynamicBackStyle
          ? Nodule.contrastOpacity(this.opacityFront)
          : this.opacityBack;

        break;
      }
    }
  }
}
