import { Vector3, Matrix4 } from "three";
import Two, { Color } from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_SEGMENT_FRONT_STYLE,
  DEFAULT_SEGMENT_BACK_STYLE
} from "@/types/Styles";

// The number of vectors used to render the one part of the segment (like the frontPart, frontExtra, etc.)
const SUBDIVS = SETTINGS.segment.numPoints;
/**
 * A line segment
 *
 * @export
 * @class Segment
 * @extends Nodule
 */
export default class Segment extends Nodule {
  /** The start vector of the segment on the unit Sphere*/
  public _startVector = new Vector3();
  /** A vector perpendicular to the plane containing the segment (unit vector)
   * NOTE: normal x start gives the direction in which the segment is drawn
   */
  public _normalVector = new Vector3();
  /** The arc length of the segment*/
  private _arcLength = 0;
  /**
   * NOTE: Once the above three variables are set, the updateDisplay() will correctly render the segment.
   * These are the only pieces of information that are need to do the rendering. All other
   * calculations in this class are only for the purpose of rendering the segment.
   * NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
   *  gives the direction in which the segment is drawn
   */

  /** A temporary matrix maps a segment in standard position to the current position so we can determine which points are on the back and which are on the front*/
  private transformMatrix = new Matrix4();

  /**
   * A line segment of length longer than \pi has two pieces on one face of the sphere (say the front)
   * and on piece on the other face of the sphere (say the back). This means that any line segment
   * can have two front parts or two back parts. The frontExtra and backExtra are variables to represent those
   * extra parts. There are glowing counterparts for each part.
   */
  private frontPart: Two.Path;
  private frontExtra: Two.Path;
  private backPart: Two.Path;
  private backExtra: Two.Path;
  private glowingFrontPart: Two.Path;
  private glowingFrontExtra: Two.Path;
  private glowingBackPart: Two.Path;
  private glowingBackExtra: Two.Path;

  /**
   * The styling variables for the drawn segment. The user can modify these.
   */
  // Front
  private glowingStrokeColorFront = SETTINGS.segment.glowing.strokeColor.front;
  // Back-- use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
  private glowingStrokeColorBack = SETTINGS.segment.glowing.strokeColor.back;

  /** Initialize the current line width that is adjusted by the zoom level and the user widthPercent */
  static currentSegmentStrokeWidthFront =
    SETTINGS.segment.drawn.strokeWidth.front;
  static currentSegmentStrokeWidthBack =
    SETTINGS.segment.drawn.strokeWidth.back;
  static currentGlowingSegmentStrokeWidthFront =
    SETTINGS.segment.drawn.strokeWidth.front +
    SETTINGS.segment.glowing.edgeWidth;
  static currentGlowingSegmentStrokeWidthBack =
    SETTINGS.segment.drawn.strokeWidth.back +
    SETTINGS.segment.glowing.edgeWidth;

  /**
   * Update all the current stroke widths
   * @param factor The ratio of the current magnification factor over the old magnification factor
   */
  static updateCurrentStrokeWidthForZoom(factor: number): void {
    Segment.currentSegmentStrokeWidthFront *= factor;
    Segment.currentSegmentStrokeWidthBack *= factor;
    Segment.currentGlowingSegmentStrokeWidthFront *= factor;
    Segment.currentGlowingSegmentStrokeWidthBack *= factor;
  }

  // Temporary ThreeJS objects for computing
  private tmpMatrix = new Matrix4();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();
  private desiredXAxis = new Vector3();
  private desiredYAxis = new Vector3();

  /**
   * Create a plottable segment from three pieces of information: startVector, normalVector, arcLength
   * NOTE: normal x start gives the direction in which the segment is drawn
   */
  constructor() {
    // Initialize the Two.Group
    super();

    // Create the vertices for the segment
    const vertices: Two.Vector[] = [];
    for (let k = 0; k < SUBDIVS; k++) {
      vertices.push(new Two.Vector(0, 0));
    }
    this.frontPart = new Two.Path(
      vertices,
      /* closed */ false,
      /* curve */ false
    );
    // Create the other parts cloning the front part
    this.glowingFrontPart = this.frontPart.clone();
    this.frontExtra = this.frontPart.clone();
    this.glowingFrontExtra = this.frontPart.clone();
    this.backPart = this.frontPart.clone();
    this.glowingBackPart = this.frontPart.clone();
    this.backExtra = this.backPart.clone();
    this.glowingBackExtra = this.backPart.clone();
    // Clear the vertices from the extra parts because they will be added later as they are exchanged from other parts

    // The clear() extension function works only on JS Array, but
    // not on Two.JS Collection class. Use splice() instead.
    this.frontExtra.vertices.splice(0);
    this.glowingFrontExtra.vertices.splice(0);
    this.backExtra.vertices.splice(0);
    this.glowingBackExtra.vertices.splice(0);

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this.frontPart.id), {
      type: "segment",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this.frontExtra.id), {
      type: "segment",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this.backPart.id), {
      type: "segment",
      side: "back",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this.backExtra.id), {
      type: "segment",
      side: "back",
      fill: false,
      part: ""
    });

    // Set the style that never changes -- Fill
    this.frontPart.noFill();
    this.glowingFrontPart.noFill();
    this.backPart.noFill();
    this.glowingBackPart.noFill();
    this.frontExtra.noFill();
    this.glowingFrontExtra.noFill();
    this.backExtra.noFill();
    this.glowingBackExtra.noFill();

    // The segment is not initially glowing but leave the regular parts visible for the temporary objects
    this.frontPart.visible = true;
    this.glowingFrontPart.visible = false;
    this.backPart.visible = true;
    this.glowingBackPart.visible = false;
    this.frontExtra.visible = true;
    this.glowingFrontExtra.visible = false;
    this.backExtra.visible = true;
    this.glowingBackExtra.visible = false;

    this.styleOptions.set(StyleEditPanels.Front, DEFAULT_SEGMENT_FRONT_STYLE);
    this.styleOptions.set(StyleEditPanels.Back, DEFAULT_SEGMENT_BACK_STYLE);
  }

  frontGlowingDisplay(): void {
    this.frontPart.visible = true;
    this.glowingFrontPart.visible = true;
    this.frontExtra.visible = true;
    this.glowingFrontExtra.visible = true;
  }

  backGlowingDisplay(): void {
    this.backPart.visible = true;
    this.glowingBackPart.visible = true;
    this.backExtra.visible = true;
    this.glowingBackExtra.visible = true;
  }

  backNormalDisplay(): void {
    this.backPart.visible = true;
    this.glowingBackPart.visible = false;
    this.backExtra.visible = true;
    this.glowingBackExtra.visible = false;
  }

  frontNormalDisplay(): void {
    this.frontPart.visible = true;
    this.glowingFrontPart.visible = false;
    this.frontExtra.visible = true;
    this.glowingFrontExtra.visible = false;
  }

  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }

  /**
   * Reorient the unit circle in 3D and then project the points to 2D
   * This method updates the TwoJS objects (frontPart, frontExtra, ...) for display
   * This is only accurate if the normal, start, arcLength are correct so only
   * call this method once those vectors are updated.
   */
  public updateDisplay(): void {
    // Use the start of segment as the X-axis so the start vector
    // is at zero degrees
    this.desiredXAxis.copy(this._startVector).normalize();
    // Form the Y axis perpendicular to the normal vector and the XAxis
    this.desiredYAxis
      .crossVectors(this._normalVector, this.desiredXAxis)
      .multiplyScalar(this._arcLength > Math.PI ? -1 : 1)
      .normalize();

    // Create the rotation matrix that maps the tilted circle to the unit
    // circle on the XY-plane
    this.transformMatrix.makeBasis(
      this.desiredXAxis,
      this.desiredYAxis,
      this._normalVector
    );

    // Variables to keep track of when the z coordinate of the transformed vector changes sign
    const toPos = []; // Remember the indices of neg-to-pos crossing
    const toNeg = []; // Remember the indices of pos-to-neg crossing
    let posIndex = 0;
    let negIndex = 0;
    let lastSign = 0;

    // Bring all the anchor points to a common pool
    // Each half (and extra) path will pull anchor points from
    // this pool as needed
    const pool: Two.Anchor[] = [];
    pool.push(...this.frontPart.vertices.splice(0));
    pool.push(...this.frontExtra.vertices.splice(0));
    pool.push(...this.backPart.vertices.splice(0));
    pool.push(...this.backExtra.vertices.splice(0));
    const glowingPool: Two.Anchor[] = [];
    glowingPool.push(...this.glowingFrontPart.vertices.splice(0));
    glowingPool.push(...this.glowingFrontExtra.vertices.splice(0));
    glowingPool.push(...this.glowingBackPart.vertices.splice(0));
    glowingPool.push(...this.glowingBackExtra.vertices.splice(0));

    // We begin with the "main" paths as the current active paths
    // As we find additional zero-crossing, we then switch to the
    // "extra" paths
    let activeFront = this.frontPart.vertices;
    let activeBack = this.backPart.vertices;
    let glowingActiveFront = this.glowingFrontPart.vertices;
    let glowingActiveBack = this.glowingBackPart.vertices;
    for (let pos = 0; pos < 2 * SUBDIVS; pos++) {
      // Generate a vector point on the equator of the Default Sphere
      const angle = (pos / (2 * SUBDIVS - 1)) * Math.abs(this._arcLength);
      this.tmpVector1
        .set(Math.cos(angle), Math.sin(angle), 0)
        .multiplyScalar(SETTINGS.boundaryCircle.radius);
      // Transform that vector/point to one on the current segment
      this.tmpVector1.applyMatrix4(this.transformMatrix);
      const thisSign = Math.sign(this.tmpVector1.z);

      // CHeck for zero-crossing
      if (lastSign !== thisSign) {
        // We have a zero crossing
        if (thisSign > 0) {
          // If we already had a positive crossing
          // The next chunk is a split front part
          if (toPos.length > 0) {
            activeFront = this.frontExtra.vertices;
            glowingActiveFront = this.glowingFrontExtra.vertices;
            posIndex = 0;
          }
          toPos.push(pos);
        }
        // If we already had a negative crossing
        // The next chunk is a split back part
        if (thisSign < 0) {
          if (toNeg.length > 0) {
            activeBack = this.backExtra.vertices;
            glowingActiveBack = this.glowingBackExtra.vertices;
            negIndex = 0;
          }
          toNeg.push(pos);
        }
      }
      lastSign = thisSign;
      if (this.tmpVector1.z > 0) {
        if (posIndex === activeFront.length) {
          // transfer one cell from the common pool
          const v1 = pool.pop();
          if (v1) activeFront.push(v1);
          const v2 = glowingPool.pop();
          if (v2) glowingActiveFront.push(v2);
        }
        activeFront[posIndex].x = this.tmpVector1.x;
        activeFront[posIndex].y = this.tmpVector1.y;
        glowingActiveFront[posIndex].x = this.tmpVector1.x;
        glowingActiveFront[posIndex].y = this.tmpVector1.y;
        posIndex++;
      } else {
        if (negIndex === activeBack.length) {
          // transfer one cell from the common pool
          const v1 = pool.pop();
          if (v1) activeBack.push(v1);
          const v2 = glowingPool.pop();
          if (v2) glowingActiveBack.push(v2);
        }
        activeBack[negIndex].x = this.tmpVector1.x;
        activeBack[negIndex].y = this.tmpVector1.y;
        glowingActiveBack[negIndex].x = this.tmpVector1.x;
        glowingActiveBack[negIndex].y = this.tmpVector1.y;
        negIndex++;
      }
    }
  }

  /**
   * Set the arcLength of the segment. The start and normal
   * vector and arcLength must be correctly set before calling the updateDisplay() method on this segment.
   *  NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
   *  gives the direction in which the segment is drawn
   */
  set arcLength(len: number) {
    this._arcLength = len;
  }
  /**
   * Set the unit vector that is the start of the segment. The start and normal
   * vector and arcLength must be correctly set before calling the updateDisplay() method on this segment.
   * NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
   *  gives the direction in which the segment is drawn
   */
  set startVector(idealUnitStartVector: Vector3) {
    this._startVector.copy(idealUnitStartVector).normalize();
  }

  /**
   * Set the unit vector that is the normal of the segment. The start and normal
   * vector and arcLength must be correctly set before calling the updateDisplay() method on this segment.
   * NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
   *  gives the direction in which the segment is drawn
   */
  set normalVector(idealUnitNormalVector: Vector3) {
    this._normalVector.copy(idealUnitNormalVector).normalize();
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontPart.visible = false;
      this.glowingFrontPart.visible = false;
      this.frontExtra.visible = false;
      this.glowingFrontExtra.visible = false;
      this.backPart.visible = false;
      this.glowingBackPart.visible = false;
      this.backExtra.visible = false;
      this.glowingBackExtra.visible = false;
    } else {
      this.normalDisplay();
    }
  }

  setSelectedColoring(flag: boolean): void {
    //set the new colors into the variables
    if (flag) {
      this.glowingStrokeColorFront = SETTINGS.style.selectedColor.front;
      this.glowingStrokeColorBack = SETTINGS.style.selectedColor.back;
    } else {
      this.glowingStrokeColorFront = SETTINGS.segment.glowing.strokeColor.front;
      this.glowingStrokeColorBack = SETTINGS.segment.glowing.strokeColor.back;
    }
    // apply the new color variables to the object
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }

  /**
   * Clone the segment - We have to define our own clone() function
   * The builtin clone() does not seem to work correctly
   */
  clone(): this {
    // Create a new segment and copy all this's properties into it
    const dup = new Segment();
    //Copy name and start/end/mid/normal vectors
    dup._arcLength = this._arcLength;
    dup._startVector.copy(this._startVector);
    dup._normalVector.copy(this._normalVector);
    //Copy the vertices of front/back/part
    const pool: Two.Anchor[] = [];
    pool.push(...dup.frontPart.vertices.splice(0)); //concatenates the pool array and the front vertices array and empties the frontPart array
    pool.push(...dup.backPart.vertices.splice(0)); //concatenates the pool array and the back vertices array and empties the backPart array

    // The length of the Pool array is 2*SUBDIVISIONS = this.frontPart.length + this.frontExtra.length + this.backPart.length + this.backExtra.length because dup.frontPart and dup.backPart initially contains all the vertices and frontExtra and backExtra are empty.
    this.frontPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      // Add a vertex in the frontPart (while taking one away from the pool)
      const v1 = pool.pop();
      if (v1) dup.frontPart.vertices.push(v1); // Exclamation point means that the linter assumes that the popped object is non-null
      // Copy the this.frontPart vertex v into the newly added vertex in frontPart
      dup.frontPart.vertices[pos].copy(v); //
    });
    // Repeat for the frontExtra/backPart/backExtra
    this.frontExtra.vertices.forEach((v: Two.Anchor, pos: number) => {
      const v1 = pool.pop();
      if (v1) dup.frontExtra.vertices.push(v1);
      dup.frontExtra.vertices[pos].copy(v);
    });
    this.backPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      const v1 = pool.pop();
      if (v1) dup.backPart.vertices.push(v1);
      dup.backPart.vertices[pos].copy(v);
    });
    this.backExtra.vertices.forEach((v: Two.Anchor, pos: number) => {
      const v1 = pool.pop();
      if (v1) dup.backExtra.vertices.push(v1);
      dup.backExtra.vertices[pos].copy(v);
    });

    // Repeat for all glowing parts/extras
    const glowingPool: Two.Anchor[] = [];
    glowingPool.push(...dup.glowingFrontPart.vertices.splice(0));
    glowingPool.push(...dup.glowingBackPart.vertices.splice(0));
    this.glowingFrontPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      const v1 = glowingPool.pop();
      if (v1) dup.glowingFrontPart.vertices.push(v1);
      dup.glowingFrontPart.vertices[pos].copy(v);
    });
    this.glowingFrontExtra.vertices.forEach((v: Two.Anchor, pos: number) => {
      const v1 = glowingPool.pop();
      if (v1) dup.glowingFrontExtra.vertices.push(v1);
      dup.glowingFrontExtra.vertices[pos].copy(v);
    });
    this.glowingBackPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      const v1 = glowingPool.pop();
      if (v1) dup.glowingBackPart.vertices.push(v1);
      dup.glowingBackPart.vertices[pos].copy(v);
    });
    this.backExtra.vertices.forEach((v: Two.Anchor, pos: number) => {
      const v1 = glowingPool.pop();
      if (v1) dup.glowingBackExtra.vertices.push(v1);
      dup.glowingBackExtra.vertices[pos].copy(v);
    });
    return dup as this;
  }

  addToLayers(layers: Two.Group[]): void {
    this.frontPart.addTo(layers[LAYER.foreground]);
    this.frontExtra.addTo(layers[LAYER.foreground]);
    this.backPart.addTo(layers[LAYER.background]);
    this.backExtra.addTo(layers[LAYER.background]);
    this.glowingFrontPart.addTo(layers[LAYER.foregroundGlowing]);
    this.glowingFrontExtra.addTo(layers[LAYER.foregroundGlowing]);
    this.glowingBackPart.addTo(layers[LAYER.backgroundGlowing]);
    this.glowingBackExtra.addTo(layers[LAYER.backgroundGlowing]);
  }

  removeFromLayers(): void {
    this.frontPart.remove();
    this.frontExtra.remove();
    this.backPart.remove();
    this.backExtra.remove();
    this.glowingFrontPart.remove();
    this.glowingFrontExtra.remove();
    this.glowingBackPart.remove();
    this.glowingBackExtra.remove();
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_SEGMENT_FRONT_STYLE;
      case StyleEditPanels.Back:
        return DEFAULT_SEGMENT_BACK_STYLE;
      default:
      case StyleEditPanels.Label: {
        return {};
      }
    }
  }
  /**
   * Sets the variables for stroke width glowing/not front/back/extra
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this.frontPart.linewidth =
      (Segment.currentSegmentStrokeWidthFront * frontStrokeWidthPercent) / 100;
    this.backPart.linewidth =
      (Segment.currentSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this.glowingFrontPart.linewidth =
      (Segment.currentGlowingSegmentStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;
    this.glowingBackPart.linewidth =
      (Segment.currentGlowingSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;

    this.frontExtra.linewidth =
      (Segment.currentSegmentStrokeWidthFront * frontStrokeWidthPercent) / 100;
    this.backExtra.linewidth =
      (Segment.currentSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this.glowingFrontExtra.linewidth =
      (Segment.currentGlowingSegmentStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;
    this.glowingBackExtra.linewidth =
      (Segment.currentGlowingSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
  }
  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the segment
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

        // FRONT PART
        // no fillColor
        this.frontPart.stroke = SETTINGS.segment.temp.strokeColor.front;
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this.frontPart.linewidth = Segment.currentSegmentStrokeWidthFront;

        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.segment.drawn.dashArray.front.length > 0) {
          this.frontPart.dashes.clear();
          SETTINGS.segment.drawn.dashArray.front.forEach(v => {
            this.frontPart.dashes.push(v);
          });
        }

        // FRONT EXTRA
        // no fillColor
        this.frontExtra.stroke = SETTINGS.segment.temp.strokeColor.front;
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this.frontExtra.linewidth = Segment.currentSegmentStrokeWidthFront;

        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.segment.drawn.dashArray.front.length > 0) {
          this.frontExtra.dashes.clear();
          SETTINGS.segment.drawn.dashArray.front.forEach(v => {
            this.frontExtra.dashes.push(v);
          });
        }
        // BACK PART
        // no fill color
        this.backPart.stroke = SETTINGS.segment.temp.strokeColor.back;
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this.backPart.linewidth = Segment.currentSegmentStrokeWidthBack;

        // Copy the back dash properties from the back default drawn dash properties
        if (SETTINGS.segment.drawn.dashArray.back.length > 0) {
          this.backPart.dashes.clear();
          SETTINGS.segment.drawn.dashArray.back.forEach(v => {
            this.backPart.dashes.push(v);
          });
        }
        // BACK EXTRA
        // no fill color
        this.backExtra.stroke = SETTINGS.segment.temp.strokeColor.back;
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this.backExtra.linewidth = Segment.currentSegmentStrokeWidthBack;

        // Copy the back dash properties from the back default drawn dash properties
        if (SETTINGS.segment.drawn.dashArray.back.length > 0) {
          this.backExtra.dashes.clear();
          SETTINGS.segment.drawn.dashArray.back.forEach(v => {
            this.backExtra.dashes.push(v);
          });
        }

        // The temporary display is never highlighted
        this.glowingFrontPart.visible = false;
        this.glowingBackPart.visible = false;
        this.glowingFrontExtra.visible = false;
        this.glowingBackExtra.visible = false;
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.

        // FRONT PART
        const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
        // no fillColor
        if (frontStyle?.strokeColor == "noStroke") {
          this.frontPart.noStroke();
        } else {
          this.frontPart.stroke = frontStyle?.strokeColor as Color;
        }
        // strokeWidthPercent applied by adjustSize()

        if (frontStyle?.dashArray && frontStyle.dashArray.length > 0) {
          this.frontPart.dashes.clear();
          this.frontPart.dashes.push(...frontStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this.frontPart.dashes.clear();
          this.frontPart.dashes.push(0);
        }
        // FRONT EXTRA
        // no fillColor
        if (frontStyle?.strokeColor == "noStroke") {
          this.frontExtra.noStroke();
        } else {
          this.frontExtra.stroke = frontStyle?.strokeColor as Color;
        }
        // strokeWidthPercent applied by adjustSize()

        if (frontStyle?.dashArray && frontStyle.dashArray.length > 0) {
          this.frontExtra.dashes.clear();
          this.frontExtra.dashes.push(...frontStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this.frontExtra.dashes.clear();
          this.frontExtra.dashes.push(0);
        }

        // BACK PART
        const backStyle = this.styleOptions.get(StyleEditPanels.Back);
        // no fillColor

        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.contrastStrokeColor(frontStyle?.strokeColor ?? "black") ==
            "noStroke"
          ) {
            this.backPart.noStroke();
          } else {
            this.backPart.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
          }
        } else {
          if (backStyle?.strokeColor == "noStroke") {
            this.backPart.noStroke();
          } else {
            this.backPart.stroke = backStyle?.strokeColor as Color;
          }
        }
        // strokeWidthPercent applied by adjustSize()

        if (backStyle?.dashArray && backStyle.dashArray.length > 0) {
          this.backPart.dashes.clear();
          this.backPart.dashes.push(...backStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this.backPart.dashes.clear();
          this.backPart.dashes.push(0);
        }
        // BACK EXTRA
        // no fillColor
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.contrastStrokeColor(frontStyle?.strokeColor ?? "black") ==
            "noStroke"
          ) {
            this.backExtra.noStroke();
          } else {
            this.backExtra.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
          }
        } else {
          if (backStyle?.strokeColor == "noStroke") {
            this.backExtra.noStroke();
          } else {
            this.backExtra.stroke = backStyle?.strokeColor as Color;
          }
        }
        // strokeWidthPercent applied by adjustSize()

        if (backStyle?.dashArray && backStyle.dashArray.length > 0) {
          this.backExtra.dashes.clear();
          this.backExtra.dashes.push(...backStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this.backExtra.dashes.clear();
          this.backExtra.dashes.push(0);
        }

        // UPDATE the glowing width so it is always bigger than the drawn width
        // Glowing Front
        // no fillColor
        this.glowingFrontPart.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (frontStyle?.dashArray && frontStyle.dashArray.length > 0) {
          this.glowingFrontPart.dashes.clear();
          this.glowingFrontPart.dashes.push(...frontStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this.glowingFrontPart.dashes.clear();
          this.glowingFrontPart.dashes.push(0);
        }

        // Glowing Front Extra
        // no fillColor
        this.glowingFrontExtra.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (frontStyle?.dashArray && frontStyle.dashArray.length > 0) {
          this.glowingFrontExtra.dashes.clear();
          this.glowingFrontExtra.dashes.push(...frontStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this.glowingFrontExtra.dashes.clear();
          this.glowingFrontExtra.dashes.push(0);
        }

        // Glowing Back
        // no fillColor
        this.glowingBackPart.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (backStyle?.dashArray && backStyle.dashArray.length > 0) {
          this.glowingBackPart.dashes.clear();
          this.glowingBackPart.dashes.push(...backStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this.glowingBackPart.dashes.clear();
          this.glowingBackPart.dashes.push(0);
        }

        // Glowing Back Extra
        // no fillColor
        this.glowingBackExtra.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (backStyle?.dashArray && backStyle.dashArray.length > 0) {
          this.glowingBackExtra.dashes.clear();
          this.glowingBackExtra.dashes.push(...backStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this.glowingBackExtra.dashes.clear();
          this.glowingBackExtra.dashes.push(0);
        }

        break;
      }
    }
  }
}
