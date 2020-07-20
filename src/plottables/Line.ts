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
  // FRONT
  private strokeColorFront = SETTINGS.line.drawn.strokeColor.front;
  private strokeWidthFront = SETTINGS.line.drawn.strokeWidth.front;
  private opacityFront = SETTINGS.line.drawn.opacity.front;
  private dashArrayFront = SETTINGS.line.drawn.dashArray.front;
  private dashArrayOffsetFront = SETTINGS.line.drawn.dashArray.offset.front;
  //BACK
  private strokeColorBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastStrokeColor(SETTINGS.line.drawn.strokeColor.front)
    : SETTINGS.line.drawn.strokeColor.back;
  private strokeWidthBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contractStrokeWidth(SETTINGS.line.drawn.strokeWidth.front)
    : SETTINGS.line.drawn.strokeWidth.back;
  private opacityBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastOpacity(SETTINGS.line.drawn.opacity.front)
    : SETTINGS.line.drawn.opacity.back;
  private dashArrayBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastDashArray(SETTINGS.line.drawn.dashArray.front)
    : SETTINGS.line.drawn.dashArray.back;
  private dashArrayOffsetBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastDashArrayOffset(SETTINGS.line.drawn.dashArray.offset.front)
    : SETTINGS.line.drawn.dashArray.offset.back;

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
  }

  adjustSizeForZoom(factor: number): void {
    const newThickness = this.strokeWidthFront * factor;
    console.log("Attempt to change line thickness to", newThickness);
    if (factor > 1)
      this.frontHalf.linewidth = Math.min(
        newThickness,
        SETTINGS.line.drawn.strokeWidth.max
      );
    else
      this.frontHalf.linewidth = Math.max(
        newThickness,
        SETTINGS.line.drawn.strokeWidth.min
      );
  }

  frontGlowingDisplay(): void {
    (this.frontHalf as any).visible = true;
    (this.glowingFrontHalf as any).visible = true;
  }

  backGlowingDisplay(): void {
    (this.backHalf as any).visible = true;
    (this.glowingBackHalf as any).visible = true;
  }

  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }

  frontNormalDisplay(): void {
    (this.frontHalf as any).visible = true;
    (this.glowingFrontHalf as any).visible = false;
  }

  backNormalDisplay(): void {
    (this.backHalf as any).visible = true;
    (this.glowingBackHalf as any).visible = false;
  }

  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  updateStyle(options: StyleOptions): void {
    console.debug("Update style of", this.name, "using", options);
    if (options.strokeWidth) {
      // TODO: separate front and back options
      this.frontHalf.linewidth = options.strokeWidth;
      this.backHalf.linewidth = options.strokeWidth;
      this.glowingFrontHalf.linewidth =
        options.strokeWidth + SETTINGS.line.glowing.edgeWidth;
      this.glowingBackHalf.linewidth =
        options.strokeWidth + SETTINGS.line.glowing.edgeWidth;
    }
    if (options.strokeColor) {
      // TODO: separate front and back options
      this.frontHalf.stroke = options.strokeColor;
      this.backHalf.stroke = options.strokeColor;
      this.glowingFrontHalf.stroke = options.strokeColor;
      this.glowingBackHalf.stroke = options.strokeColor;
    }
    if (options.dashPattern) {
      (this.backHalf as any).dashes = options.dashPattern;
      (this.glowingBackHalf as any).dashes = options.dashPattern;
    }
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
      (this.frontHalf as any).visible = false;
      (this.glowingFrontHalf as any).visible = false;
      (this.backHalf as any).visible = false;
      (this.glowingBackHalf as any).visible = false;
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
    // if (this.frontArcLen > 0 || !this.isSegment) {
    // Copy the group rotation to individual group member
    // this.frontHalf.rotation = this.rotation;
    // }
    this.backHalf.addTo(layers[LAYER.background]);
    this.glowingBackHalf.addTo(layers[LAYER.backgroundGlowing]);
    // if (this.backArcLen > 0 || !this.isSegment) {
    // Copy the group rotation to individual group member
    // this.backHalf.rotation = this.rotation;
    // }
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontHalf.remove();
    this.backHalf.remove();
    this.glowingFrontHalf.remove();
    this.glowingBackHalf.remove();
  }

  /**
   * Set the rendering style (flags: temporary, default, glowing, update) of the line
   * Update flag means at least one of the private variables storing style information has
   * changed and should be applied to the displayed line.
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.TEMPORARY: {
        // The style for the temporary segment display.  These options are not user modifiable.
        // Created with the Google Sheet "Segment Styling Code" in the "Temporary" tab

        // FRONT PART
        this.frontHalf.stroke = SETTINGS.line.temp.strokeColor.front;
        this.frontHalf.linewidth = SETTINGS.line.temp.strokeWidth.front;
        this.frontHalf.opacity = SETTINGS.line.temp.opacity.front;
        if (SETTINGS.line.temp.dashArray.front.length > 0) {
          SETTINGS.line.temp.dashArray.front.forEach(v => {
            (this.frontHalf as any).dashes.push(v);
          });
          (this.frontHalf as any).offset =
            SETTINGS.line.temp.dashArray.offset.front;
        }
        // BACK PART
        this.backHalf.stroke = SETTINGS.line.temp.strokeColor.back;
        this.backHalf.linewidth = SETTINGS.line.temp.strokeWidth.back;
        this.backHalf.opacity = SETTINGS.line.temp.opacity.back;
        if (SETTINGS.line.temp.dashArray.back.length > 0) {
          SETTINGS.line.temp.dashArray.back.forEach(v => {
            (this.backHalf as any).dashes.push(v);
          });
          (this.backHalf as any).offset =
            SETTINGS.line.temp.dashArray.offset.back;
        }
        // The temporary display is never highlighted
        (this.glowingFrontHalf as any).visible = false;
        (this.glowingBackHalf as any).visible = false;
        break;
      }
      case DisplayStyle.GLOWING: {
        // The style for the glowing circle display.  These options are not user modifiable.
        // Created with the Google Sheet "Segment Styling Code" in the "Glowing" tab

        // FRONT PART
        this.glowingFrontHalf.stroke = SETTINGS.line.glowing.strokeColor.front;
        this.glowingFrontHalf.linewidth =
          SETTINGS.line.glowing.edgeWidth +
          SETTINGS.line.drawn.strokeWidth.front;
        this.glowingFrontHalf.opacity = SETTINGS.line.glowing.opacity.front;
        if (SETTINGS.line.glowing.dashArray.front.length > 0) {
          SETTINGS.line.glowing.dashArray.front.forEach(v => {
            (this.glowingFrontHalf as any).dashes.push(v);
          });
          (this.glowingFrontHalf as any).offset =
            SETTINGS.line.glowing.dashArray.offset.front;
        }
        // BACK PART
        this.glowingBackHalf.stroke = SETTINGS.line.glowing.strokeColor.back;
        this.glowingBackHalf.linewidth =
          SETTINGS.line.glowing.edgeWidth +
          SETTINGS.line.drawn.strokeWidth.back;
        this.glowingBackHalf.opacity = SETTINGS.line.glowing.opacity.back;
        if (SETTINGS.line.glowing.dashArray.back.length > 0) {
          SETTINGS.line.glowing.dashArray.back.forEach(v => {
            (this.glowingBackHalf as any).dashes.push(v);
          });
          (this.glowingBackHalf as any).offset =
            SETTINGS.line.glowing.dashArray.offset.back;
        }
        break;
      }
      case DisplayStyle.UPDATE: {
        // Use the current variables to update the display style
        // Created with the Google Sheet "Segment Styling Code" in the "Drawn Update" tab
        // FRONT PART
        this.frontHalf.stroke = this.strokeColorFront;
        this.frontHalf.linewidth = this.strokeWidthFront;
        this.frontHalf.opacity = this.opacityFront;
        if (this.dashArrayFront.length > 0) {
          (this.frontHalf as any).dashes.length = 0;
          this.dashArrayFront.forEach(v => {
            (this.frontHalf as any).dashes.push(v);
          });
          (this.frontHalf as any).offset = this.dashArrayOffsetFront;
        }
        // BACK PART
        this.backHalf.stroke = this.strokeColorBack;
        this.backHalf.linewidth = this.strokeWidthBack;
        this.backHalf.opacity = this.opacityBack;
        if (this.dashArrayBack.length > 0) {
          (this.backHalf as any).dashes.length = 0;
          this.dashArrayBack.forEach(v => {
            (this.backHalf as any).dashes.push(v);
          });
          (this.backHalf as any).offset = this.dashArrayOffsetBack;
        }
        // UPDATE the glowing width so it is always bigger than the drawn width
        this.glowingFrontHalf.linewidth =
          this.strokeWidthFront + SETTINGS.line.glowing.edgeWidth;
        this.glowingBackHalf.linewidth =
          this.strokeWidthBack + SETTINGS.line.glowing.edgeWidth;
        break;
      }
      case DisplayStyle.DEFAULT:
      default: {
        // Reset the style to the defaults i.e. Use the global defaults to update the display style
        // Created with the Google Sheet "Segment Styling Code" in the "Drawn Set To Defaults" tab
        // FRONT PART
        this.frontHalf.stroke = SETTINGS.line.drawn.strokeColor.front;
        this.frontHalf.linewidth = SETTINGS.line.drawn.strokeWidth.front;
        this.frontHalf.opacity = SETTINGS.line.drawn.opacity.front;
        if (SETTINGS.line.drawn.dashArray.front.length > 0) {
          (this.frontHalf as any).dashes.length = 0;
          SETTINGS.line.drawn.dashArray.front.forEach(v => {
            (this.frontHalf as any).dashes.push(v);
          });
          (this.frontHalf as any).offset =
            SETTINGS.line.drawn.dashArray.offset.front;
        }
        // BACK PART
        this.backHalf.stroke = SETTINGS.line.drawn.strokeColor.back;
        this.backHalf.linewidth = SETTINGS.line.drawn.strokeWidth.back;
        this.backHalf.opacity = SETTINGS.line.drawn.opacity.back;
        if (SETTINGS.line.drawn.dashArray.back.length > 0) {
          (this.backHalf as any).dashes.length = 0;
          SETTINGS.line.drawn.dashArray.back.forEach(v => {
            (this.backHalf as any).dashes.push(v);
          });
          (this.backHalf as any).offset =
            SETTINGS.line.drawn.dashArray.offset.back;
        }
        // UPDATE the glowing width so it is always bigger than the drawn width
        this.glowingFrontHalf.linewidth =
          SETTINGS.line.glowing.edgeWidth +
          SETTINGS.line.drawn.strokeWidth.front;
        this.glowingBackHalf.linewidth =
          SETTINGS.line.glowing.edgeWidth +
          SETTINGS.line.drawn.strokeWidth.back;
        break;
      }
    }
  }
}
