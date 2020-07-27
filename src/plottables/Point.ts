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
  private frontPoint: Two.Circle;
  private backPoint: Two.Circle;
  private glowingFrontPoint: Two.Circle;
  private glowingBackPoint: Two.Circle;

  /**
   * The styling variables for the drawn point. The user can modify these.
   * Created with the Google Sheet "Point Styling Code" in the "Declare Private Variables" tab
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

  /**
   * Update all the current stroke widths
   * @param factor The ratio of the current magnification factor over the old magnification factor
   */
  static updateCurrentStrokeWidthForZoom(factor: number): void {
    Point.pointScaleFactor *= factor;
    console.log("point scale facgtor", Point.pointScaleFactor);
    Point.currentPointRadiusFront *= factor;
    Point.currentPointRadiusBack *= factor;
    Point.currentGlowingPointRadiusFront *= factor;
    Point.currentGlowingPointRadiusBack *= factor;
  }

  constructor() {
    super();

    //Create the front/back/glowing/drawn TwoJS objects of the default size
    this.frontPoint = new Two.Circle(0, 0, SETTINGS.point.drawn.radius.front);
    this.backPoint = new Two.Circle(0, 0, SETTINGS.point.drawn.radius.back);
    console.log(
      "point radius front construxtor",
      this.frontPoint.vertices[0].length()
    );
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

    // Set the location of the points front/back/glowing/drawn
    // The location of all points front/back/glowing/drawn is controlled by the
    //  Two.Group that they are all members of. To translate the group is to translate all points

    this.glowingFrontPoint.translation = this.defaultScreenVectorLocation;
    this.frontPoint.translation = this.defaultScreenVectorLocation;
    this.glowingBackPoint.translation = this.defaultScreenVectorLocation;
    this.backPoint.translation = this.defaultScreenVectorLocation;

    // The points are not initially glowing
    this.frontPoint.visible = false;
    this.glowingFrontPoint.visible = false;
    this.backPoint.visible = false;
    this.glowingBackPoint.visible = false;

    // Set the properties of the points that never change - stroke width
    this.frontPoint.linewidth = SETTINGS.point.drawn.pointStrokeWidth.front;
    this.backPoint.linewidth = SETTINGS.point.drawn.pointStrokeWidth.back;
    this.glowingFrontPoint.noStroke();
    this.glowingBackPoint.noStroke();
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
  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * Two.js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(options: StyleOptions): void {
    console.debug("Update style of", this.name, "using", options);
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
      if (options.dynamicBackStyle) {
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
    // Now update the style and size
    this.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
    this.adjustSize();
  }

  /**
   * Sets the variables for point radius glowing/not
   */
  adjustSize(): void {
    console.log("pt rad percent", this.pointRadiusPercentFront);
    console.log("point scalar factor", Point.pointScaleFactor);
    console.log(
      "point radius front before adjust size()",
      this.frontPoint.vertices[0].length()
    );
    this.frontPoint.vertices.forEach(v => {
      v.normalize().multiplyScalar(
        (Point.currentPointRadiusFront * this.pointRadiusPercentFront) / 100
      );
    });
    console.log(
      "point radius front after adjust size()",
      this.frontPoint.vertices[0].length()
    );
    this.backPoint.vertices.forEach(v => {
      v.normalize().multiplyScalar(
        (Point.currentPointRadiusBack *
          (this.dynamicBackStyle
            ? Nodule.contrastPointRadiusPercent(this.pointRadiusPercentFront)
            : this.pointRadiusPercentBack)) /
          100
      );
    });
    this.glowingFrontPoint.vertices.forEach(v => {
      v.normalize().multiplyScalar(
        (Point.currentGlowingPointRadiusFront * this.pointRadiusPercentFront) /
          100
      );
    });
    this.glowingBackPoint.vertices.forEach(v => {
      v.normalize().multiplyScalar(
        (Point.currentGlowingPointRadiusBack *
          (this.dynamicBackStyle
            ? Nodule.contrastStrokeWidthPercent(this.pointRadiusPercentFront)
            : this.pointRadiusPercentBack)) /
          100
      );
    });
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
        this.frontPoint.linewidth = SETTINGS.point.drawn.pointStrokeWidth.front; // not user modifiable, strokeWidth is always the default drawn one
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
        this.backPoint.linewidth = SETTINGS.point.drawn.pointStrokeWidth.back; // not user modifiable, strokeWidth is always the default drawn one
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
        this.frontPoint.stroke = this.strokeColorFront;
        this.frontPoint.linewidth = SETTINGS.point.drawn.pointStrokeWidth.front; //not user modifiable
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
        this.backPoint.stroke = this.dynamicBackStyle
          ? Nodule.contrastStrokeColor(this.strokeColorFront)
          : this.strokeColorBack;
        this.backPoint.linewidth = SETTINGS.point.drawn.pointStrokeWidth.back; //not user modifiable
        // pointRadiusPercent applied by adjustSize();
        this.backPoint.opacity = this.dynamicBackStyle
          ? Nodule.contrastOpacity(this.opacityFront)
          : this.opacityBack;
        break;
      }
      case DisplayStyle.RESETVARIABLESTODEFAULTS:
      default: {
        // Set the current variables to the SETTINGS variables
        // FRONT
        this.fillColorFront = SETTINGS.point.drawn.fillColor.front;
        this.strokeColorFront = SETTINGS.point.drawn.strokeColor.front;
        // strokeWidth not user modifiable
        this.pointRadiusPercentFront = 100;
        this.opacityFront = SETTINGS.point.drawn.opacity.front;

        // BACK
        if (SETTINGS.point.dynamicBackStyle) {
          this.fillColorBack = Nodule.contrastFillColor(
            SETTINGS.point.drawn.fillColor.front
          );
        } else {
          this.fillColorBack = SETTINGS.point.drawn.fillColor.back;
        }
        if (SETTINGS.point.dynamicBackStyle) {
          this.strokeColorBack = Nodule.contrastStrokeColor(
            SETTINGS.point.drawn.strokeColor.front
          );
        } else {
          this.strokeColorBack = SETTINGS.point.drawn.strokeColor.back;
        }
        // strokeWidth not user modifiable
        if (SETTINGS.point.dynamicBackStyle) {
          this.pointRadiusPercentBack = Nodule.contrastPointRadiusPercent(
            this.pointRadiusPercentFront
          );
        } else {
          this.pointRadiusPercentBack = 100;
        }
        if (SETTINGS.point.dynamicBackStyle) {
          this.opacityBack = Nodule.contrastOpacity(
            SETTINGS.point.drawn.opacity.front
          );
        } else {
          this.opacityBack = SETTINGS.point.drawn.opacity.back;
        }
        break;
      }
    }
  }
}
