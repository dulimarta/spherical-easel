import { Vector3, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { StyleOptions } from "@/types/Styles";

// The number of vectors used to render the front half (and the same number in the back half)
const SUBDIVS = SETTINGS.line.numPoints;
let LINE_COUNT = 0;

/**
 * A line segment
 *
 * @export
 * @class Segment
 * @extends Nodule
 */
export default class Line extends Nodule {
  /** The normal vector to the plane containing the line*/
  private _normalVector: Vector3;

  /**
   * NOTE: Once the above variable is set, the updateDisplay() will correctly render the line.
   * This are the only piece of information that is need to do the rendering, so the updateDisplay() is automatically
   * class when the setter is used to update the normal Vector All other
   * calculations in this class are only for the purpose of rendering the line.
   */

  /**
   * A line has half on the front and half on the back.There are glowing counterparts for each part.
   */
  private frontHalf: Two.Path;
  private backHalf: Two.Path;
  private glowingFrontHalf: Two.Path;
  private glowingBackHalf: Two.Path;

  /**
   * What are these for?
   */
  private backArcLen = 0;
  private frontArcLen = 0;

  /**
   * A list of Vector3s that trace the the equator of the sphere
   */

  private points: Vector3[];

  /**
   * The styling variables for the drawn segment. The user can modify these.
   * Created with the Google Sheet "Segment Styling Code" in the "Set Drawn Variables" tab
   */
  // Front
  private strokeColorFront = SETTINGS.line.drawn.strokeColor.front;
  private opacityFront = SETTINGS.line.drawn.opacity.front;
  private dashArrayFront = [] as number[]; // Initialize in constructor
  private strokeWidthPercentFront = 100;

  // Back
  private dynamicBackStyle = SETTINGS.line.dynamicBackStyle;
  private strokeColorBack = SETTINGS.line.dynamicBackStyle
    ? Nodule.contrastStrokeColor(SETTINGS.line.drawn.strokeColor.front)
    : SETTINGS.line.drawn.strokeColor.back;
  private opacityBack = SETTINGS.line.dynamicBackStyle
    ? Nodule.contrastOpacity(SETTINGS.line.drawn.opacity.front)
    : SETTINGS.line.drawn.opacity.back;
  private dashArrayBack = [] as number[]; // Initialize in constructor
  private strokeWidthPercentBack = SETTINGS.line.dynamicBackStyle
    ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
    : 100;

  /** Initialize the current line width that is adjust by the zoom level and the user widthPercent */
  static currentLineStrokeWidthFront = SETTINGS.line.drawn.strokeWidth.front;
  static currentLineStrokeWidthBack = SETTINGS.line.drawn.strokeWidth.back;
  static currentGlowingLineStrokeWidthFront =
    SETTINGS.line.drawn.strokeWidth.front + SETTINGS.line.glowing.edgeWidth;
  static currentGlowingLineStrokeWidthBack =
    SETTINGS.line.drawn.strokeWidth.back + SETTINGS.line.glowing.edgeWidth;

  /**
   * Update all the current stroke widths
   * @param factor The ratio of the current magnification factor over the old magnification factor
   */
  static updateCurrentStrokeWidthForZoom(factor: number): void {
    Line.currentLineStrokeWidthFront *= factor;
    Line.currentLineStrokeWidthBack *= factor;
    Line.currentGlowingLineStrokeWidthFront *= factor;
    Line.currentGlowingLineStrokeWidthBack *= factor;
  }

  /** Temporary ThreeJS objects for computing */
  private tmpVector = new Vector3();
  private desiredXAxis = new Vector3();
  private desiredYAxis = new Vector3();
  private transformMatrix = new Matrix4();
  constructor() {
    super();
    this.name = "Line-" + LINE_COUNT++;
    const radius = SETTINGS.boundaryCircle.radius;
    const vertices: Two.Vector[] = [];
    const glowingVertices: Two.Vector[] = [];

    // Generate 2D coordinates of a half circle
    for (let k = 0; k < SUBDIVS; k++) {
      const angle = (k * Math.PI) / SUBDIVS;
      const px = radius * Math.cos(angle);
      const py = radius * Math.sin(angle);
      vertices.push(new Two.Vector(px, py));
      glowingVertices.push(new Two.Vector(px, py));
    }

    this.frontHalf = new Two.Path(
      vertices,
      /* closed */ false,
      /* curve */ false
    );

    // Create the back half, glowing front half, glowing back half circle by cloning the front half
    this.backHalf = this.frontHalf.clone();
    this.glowingBackHalf = this.frontHalf.clone();
    this.glowingFrontHalf = this.frontHalf.clone();

    // Set the style that never changes -- Fill
    this.frontHalf.noFill();
    this.glowingFrontHalf.noFill();
    this.backHalf.noFill();
    this.glowingBackHalf.noFill();

    // Be sure to clone() the incoming start and end points
    // Otherwise update by other Line will affect this one!
    this._normalVector = new Vector3();
    // this.normalDirection.crossVectors(this.start, this.end);
    // The back half will be dynamically added to the group
    //this.name = "Line-" + this.id;

    // Generate 3D coordinates of the entire line in a standard position -- the equator of the Default Sphere
    this.points = [];
    for (let k = 0; k < 2 * SUBDIVS; k++) {
      const angle = (2 * k * Math.PI) / (2 * SUBDIVS);
      const px = radius * Math.cos(angle);
      const py = radius * Math.sin(angle);
      this.points.push(new Vector3(px, py, 0));
    }
    if (SETTINGS.line.drawn.dashArray.front.length > 0) {
      SETTINGS.line.drawn.dashArray.front.forEach(v =>
        this.dashArrayFront.push(v)
      );
    }
    if (SETTINGS.line.drawn.dashArray.back.length > 0) {
      SETTINGS.line.drawn.dashArray.back.forEach(v =>
        this.dashArrayBack.push(v)
      );
    }
  }

  frontGlowingDisplay(): void {
    this.frontHalf.visible = true;
    this.glowingFrontHalf.visible = true;
  }

  backGlowingDisplay(): void {
    this.backHalf.visible = true;
    this.glowingBackHalf.visible = true;
  }

  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }

  frontNormalDisplay(): void {
    this.frontHalf.visible = true;
    this.glowingFrontHalf.visible = false;
  }

  backNormalDisplay(): void {
    this.backHalf.visible = true;
    this.glowingBackHalf.visible = false;
  }

  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  /**
   * Update the display of line by Reorient the unit circle in 3D and then project the points to 2D
   * Reorient the unit circle in 3D and then project the points to 2D
   * This method updates the TwoJS objects (frontHalf, backHalf, ...) for display
   * This is only accurate if the normal vector are correct so only
   * call this method once that vector is updated.
   */
  public updateDisplay(): void {
    //Form the X Axis perpendicular to the normalDirection, this is where the plotting will start.
    this.desiredXAxis
      .set(-this._normalVector.y, this._normalVector.x, 0)
      .normalize();

    // Form the Y axis perpendicular to the normal vector and the XAxis
    this.desiredYAxis.crossVectors(this._normalVector, this.desiredXAxis)
      .normalize;
    // Form the transformation matrix that will map the vectors along the equation of the Default Sphere to
    // to the current position of the line.
    this.transformMatrix.makeBasis(
      this.desiredXAxis,
      this.desiredYAxis,
      this._normalVector
    );

    // Variables to keep track of when the z coordinate of the transformed object changes sign
    let firstPos = -1;
    let posIndex = 0;
    let firstNeg = -1;
    let negIndex = 0;
    let lastSign = 0;

    this.points.forEach((v, pos) => {
      // v is a vector location on the equator of the Default Sphere
      this.tmpVector.copy(v);
      // Transform that vector to one on the current segment
      this.tmpVector.applyMatrix4(this.transformMatrix);
      const thisSign = Math.sign(this.tmpVector.z);
      if (lastSign !== thisSign) {
        // We have a zero crossing
        if (thisSign > 0) firstPos = pos;
        if (thisSign < 0) firstNeg = pos;
      }
      lastSign = thisSign;
      if (this.tmpVector.z > 0) {
        if (posIndex === this.frontHalf.vertices.length) {
          const extra = this.backHalf.vertices.pop();
          this.frontHalf.vertices.push(extra!);
        }
        this.frontHalf.vertices[posIndex].x = this.tmpVector.x;
        this.frontHalf.vertices[posIndex].y = this.tmpVector.y;
        this.glowingFrontHalf.vertices[posIndex].x = this.tmpVector.x;
        this.glowingFrontHalf.vertices[posIndex].y = this.tmpVector.y;
        posIndex++;
      } else {
        if (negIndex === this.backHalf.vertices.length) {
          const extra = this.frontHalf.vertices.pop();
          this.backHalf.vertices.push(extra!);
        }
        this.backHalf.vertices[negIndex].x = this.tmpVector.x;
        this.backHalf.vertices[negIndex].y = this.tmpVector.y;
        this.glowingBackHalf.vertices[negIndex].x = this.tmpVector.x;
        this.glowingBackHalf.vertices[negIndex].y = this.tmpVector.y;
        negIndex++;
      }
    });
    if (0 < firstPos && firstPos < SUBDIVS) {
      // Gap in backhalf
      this.backHalf.vertices.rotate(firstPos);
      this.glowingBackHalf.vertices.rotate(firstPos);
    }
    if (0 < firstNeg && firstNeg < SUBDIVS) {
      // Gap in fronthalf
      this.frontHalf.vertices.rotate(firstNeg);
      this.glowingFrontHalf.vertices.rotate(firstNeg);
    }
  }

  /**
   * This is the only vector that needs to be set in order to render the line.  This also updates the display
   */
  set normalVector(dir: Vector3) {
    this._normalVector.copy(dir).normalize();
    this.updateDisplay();
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontHalf.visible = false;
      this.glowingFrontHalf.visible = false;
      this.backHalf.visible = false;
      this.glowingBackHalf.visible = false;
    } else {
      this.normalDisplay();
    }
  }
  // It looks like we have to define our own clone() function
  // The builtin clone() does not seem to work correctly
  clone(): this {
    const dup = new Line();
    dup.name = this.name;
    dup._normalVector.copy(this._normalVector);
    dup.frontHalf.rotation = this.frontHalf.rotation;
    dup.backHalf.rotation = this.backHalf.rotation;
    dup.frontArcLen = this.frontArcLen;
    dup.backArcLen = this.backArcLen;
    dup.frontHalf.vertices.forEach((v, pos) => {
      v.copy(this.frontHalf.vertices[pos]);
    });
    dup.backHalf.vertices.forEach((v, pos) => {
      v.copy(this.backHalf.vertices[pos]);
    });
    dup.glowingFrontHalf.vertices.forEach((v, pos) => {
      v.copy(this.glowingFrontHalf.vertices[pos]);
    });
    dup.glowingBackHalf.vertices.forEach((v, pos) => {
      v.copy(this.glowingBackHalf.vertices[pos]);
    });
    return dup as this;
  }

  addToLayers(layers: Two.Group[]): void {
    this.frontHalf.addTo(layers[LAYER.foreground]);
    this.glowingFrontHalf.addTo(layers[LAYER.foregroundGlowing]);
    this.backHalf.addTo(layers[LAYER.background]);
    this.glowingBackHalf.addTo(layers[LAYER.backgroundGlowing]);
  }

  removeFromLayers(): void {
    this.frontHalf.remove();
    this.backHalf.remove();
    this.glowingFrontHalf.remove();
    this.glowingBackHalf.remove();
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
      if (options.strokeWidthPercent) {
        this.strokeWidthPercentFront = options.strokeWidthPercent;
      }
      if (options.strokeColor) {
        this.strokeColorFront = options.strokeColor;
      }
      if (options.opacity) {
        this.opacityFront = options.opacity;
      }
      if (options.dashArray) {
        // clear the dashArray
        this.dashArrayFront.clear();
        for (let i = 0; i < options.dashArray.length; i++) {
          this.dashArrayFront.push(options.dashArray[i]);
        }
      }
    } else {
      // Set the back options
      if (options.dynamicBackStyle) {
        this.dynamicBackStyle = options.dynamicBackStyle;
      }
      if (options.strokeWidthPercent) {
        this.strokeWidthPercentBack = options.strokeWidthPercent;
      }
      if (options.strokeColor) {
        this.strokeColorBack = options.strokeColor;
      }
      if (options.opacity) {
        this.opacityBack = options.opacity;
      }
      if (options.dashArray) {
        // clear the dashArray
        this.dashArrayBack.clear();
        for (let i = 0; i < options.dashArray.length; i++) {
          this.dashArrayBack.push(options.dashArray[i]);
        }
      }
    }
    // Now update the style and size
    this.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
    this.adjustSize();
  }
  /**
   * Return the current style state
   */
  currentStyleState(front: boolean): StyleOptions {
    if (front) {
      const dashArrayFront = [] as number[];
      if (this.dashArrayFront.length > 0) {
        this.dashArrayFront.forEach(v => dashArrayFront.push(v));
      }
      return {
        front: front,
        strokeWidthPercent: this.strokeWidthPercentFront,
        strokeColor: this.strokeColorFront,
        dashArray: dashArrayFront,
        opacity: this.opacityFront
      };
    } else {
      const dashArrayBack = [] as number[];
      if (this.dashArrayBack.length > 0) {
        this.dashArrayBack.forEach(v => dashArrayBack.push(v));
      }
      return {
        front: front,
        strokeWidthPercent: this.strokeWidthPercentBack,
        strokeColor: this.strokeColorBack,
        dashArray: dashArrayBack,
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
      const dashArrayFront = [] as number[];
      if (SETTINGS.line.drawn.dashArray.front.length > 0) {
        SETTINGS.line.drawn.dashArray.front.forEach(v =>
          dashArrayFront.push(v)
        );
      }
      return {
        front: front,
        strokeWidthPercent: 100,
        strokeColor: SETTINGS.line.drawn.strokeColor.front,
        dashArray: dashArrayFront,
        opacity: SETTINGS.line.drawn.opacity.front
      };
    } else {
      const dashArrayBack = [] as number[];

      if (SETTINGS.line.drawn.dashArray.back.length > 0) {
        SETTINGS.line.drawn.dashArray.back.forEach(v => dashArrayBack.push(v));
      }
      return {
        front: front,

        strokeWidthPercent: SETTINGS.line.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(100)
          : 100,

        strokeColor: SETTINGS.line.dynamicBackStyle
          ? Nodule.contrastStrokeColor(SETTINGS.line.drawn.strokeColor.front)
          : SETTINGS.line.drawn.strokeColor.back,

        dashArray: dashArrayBack,

        opacity: SETTINGS.line.dynamicBackStyle
          ? Nodule.contrastOpacity(SETTINGS.line.drawn.opacity.front)
          : SETTINGS.line.drawn.opacity.back,

        dynamicBackStyle: SETTINGS.line.dynamicBackStyle
      };
    }
  }
  /**
   * Sets the variables for stroke width glowing/not
   */
  adjustSize(): void {
    this.frontHalf.linewidth =
      (Line.currentLineStrokeWidthFront * this.strokeWidthPercentFront) / 100;
    this.backHalf.linewidth =
      (Line.currentLineStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;
    this.glowingFrontHalf.linewidth =
      (Line.currentGlowingLineStrokeWidthFront * this.strokeWidthPercentFront) /
      100;
    this.glowingBackHalf.linewidth =
      (Line.currentGlowingLineStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables, ResetVariablesToDefaults) of the line
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.line.temp are copied into the actual Two.js objects
   *    2) Dash pattern for temporary is copied  from the SETTINGS.line.drawn into the actual Two.js objects
   *    3) The line width is copied from the currentLineStrokeWidth (which accounts for the Zoom magnification) into the actual Two.js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual Two.js objects
   *
   * ResetVariablesToDefaults means that all the private style variables are set to their defaults from SETTINGS.
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.APPLYTEMPORARYVARIABLES: {
        // Use the SETTINGS temporary options to directly modify the Two.js objects.

        // Front
        // no fillColor
        this.frontHalf.stroke = SETTINGS.line.temp.strokeColor.front;
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this.frontHalf.linewidth = Line.currentLineStrokeWidthFront;
        this.frontHalf.opacity = SETTINGS.line.temp.opacity.front;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.line.drawn.dashArray.front.length > 0) {
          this.frontHalf.dashes.clear();
          SETTINGS.line.drawn.dashArray.front.forEach(v => {
            this.frontHalf.dashes.push(v);
          });
        }

        // Back
        // no fill color
        this.backHalf.stroke = SETTINGS.line.temp.strokeColor.back;
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this.backHalf.linewidth = Line.currentLineStrokeWidthBack;
        this.backHalf.opacity = SETTINGS.line.temp.opacity.back;
        // Copy the back dash properties from the back default drawn dash properties
        if (SETTINGS.line.drawn.dashArray.back.length > 0) {
          this.backHalf.dashes.clear();
          SETTINGS.line.drawn.dashArray.back.forEach(v => {
            this.backHalf.dashes.push(v);
          });
        }

        // The temporary display is never highlighted
        this.glowingFrontHalf.visible = false;
        this.glowingBackHalf.visible = false;
        break;
      }

      case DisplayStyle.APPLYCURRENTVARIABLES: {
        // Use the current variables to directly modify the Two.js objects.

        // Front
        // no fillColor
        this.frontHalf.stroke = this.strokeColorFront;
        // strokeWidthPercent applied by adjustSize()
        this.frontHalf.opacity = this.opacityFront;
        if (this.dashArrayFront.length > 0) {
          this.frontHalf.dashes.clear();
          this.dashArrayFront.forEach(v => {
            this.frontHalf.dashes.push(v);
          });
        }

        // Back
        // no fillColor
        this.backHalf.stroke = this.dynamicBackStyle
          ? Nodule.contrastStrokeColor(this.strokeColorFront)
          : this.strokeColorBack;
        // strokeWidthPercent applied by adjustSize()
        this.backHalf.opacity = this.dynamicBackStyle
          ? Nodule.contrastOpacity(this.opacityFront)
          : this.opacityBack;
        if (this.dashArrayBack.length > 0) {
          this.backHalf.dashes.clear();
          this.dashArrayBack.forEach(v => {
            this.backHalf.dashes.push(v);
          });
        }

        // Glowing Front
        // no fillColor
        this.glowingFrontHalf.stroke = SETTINGS.line.glowing.strokeColor.front;
        // strokeWidthPercent applied by adjustSize()
        this.glowingFrontHalf.opacity = SETTINGS.line.glowing.opacity.front;
        // Copy the front dash properties to the glowing object
        if (this.dashArrayFront.length > 0) {
          this.glowingFrontHalf.dashes.clear();
          this.dashArrayFront.forEach(v => {
            this.glowingFrontHalf.dashes.push(v);
          });
        }

        // Glowing Back
        // no fillColor
        this.glowingBackHalf.stroke = SETTINGS.line.glowing.strokeColor.back;
        // strokeWidthPercent applied by adjustSize()
        this.glowingBackHalf.opacity = SETTINGS.line.glowing.opacity.back;
        // Copy the back dash properties to the glowing object
        if (this.dashArrayBack.length > 0) {
          this.glowingBackHalf.dashes.clear();
          this.dashArrayBack.forEach(v => {
            this.glowingBackHalf.dashes.push(v);
          });
        }
        break;
      }
      case DisplayStyle.RESETVARIABLESTODEFAULTS:
      default: {
        // Set the current variables to the SETTINGS variables

        // FRONT
        // no fillColor
        this.strokeColorFront = SETTINGS.line.drawn.strokeColor.front;
        this.strokeWidthPercentFront = 100;
        this.opacityFront = SETTINGS.line.drawn.opacity.front;
        if (SETTINGS.line.drawn.dashArray.front.length > 0) {
          this.dashArrayFront.clear();
          SETTINGS.line.drawn.dashArray.front.forEach(v =>
            this.dashArrayFront.push(v)
          );
        }

        // Back
        this.dynamicBackStyle = SETTINGS.line.dynamicBackStyle;
        // no fillColor
        this.strokeColorBack = SETTINGS.line.dynamicBackStyle
          ? Nodule.contrastStrokeColor(SETTINGS.line.drawn.strokeColor.front)
          : SETTINGS.line.drawn.strokeColor.back;
        this.strokeWidthPercentBack = SETTINGS.line.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : 100;
        this.opacityBack = SETTINGS.line.dynamicBackStyle
          ? Nodule.contrastOpacity(SETTINGS.line.drawn.opacity.front)
          : SETTINGS.line.drawn.opacity.back;
        if (SETTINGS.line.drawn.dashArray.back.length > 0) {
          this.dashArrayBack.clear();
          SETTINGS.line.drawn.dashArray.back.forEach(v =>
            this.dashArrayBack.push(v)
          );
        }
        break;
      }
    }
  }
}
