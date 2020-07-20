import { Vector3, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { StyleOptions } from "@/types/Styles";

// The number of vectors used to render the one part of the segment (like the frontPart, frontExtra, etc.)
const SUBDIVS = SETTINGS.segment.numPoints;
let SEGMENT_COUNT = 0;
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
  private midMarker = new Two.Circle(0, 0, 5);
  private glowingFrontPart: Two.Path;
  private glowingFrontExtra: Two.Path;
  private glowingBackPart: Two.Path;
  private glowingBackExtra: Two.Path;

  /**
   * The styling variables for the drawn segment. The user can modify these.
   * Created with the Google Sheet "Segment Styling Code" in the "Set Drawn Variables" tab
   */
  // FRONT
  private strokeColorFront = SETTINGS.segment.drawn.strokeColor.front;
  private strokeWidthFront = SETTINGS.segment.drawn.strokeWidth.front;
  private opacityFront = SETTINGS.segment.drawn.opacity.front;
  private dashArrayFront = SETTINGS.segment.drawn.dashArray.front;
  private dashArrayOffsetFront = SETTINGS.segment.drawn.dashArray.offset.front;
  // BACK
  private strokeColorBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastStrokeColor(SETTINGS.segment.drawn.strokeColor.front)
    : SETTINGS.segment.drawn.strokeColor.back;
  private strokeWidthBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contractStrokeWidth(SETTINGS.segment.drawn.strokeWidth.front)
    : SETTINGS.segment.drawn.strokeWidth.back;
  private opacityBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastOpacity(SETTINGS.segment.drawn.opacity.front)
    : SETTINGS.segment.drawn.opacity.back;
  private dashArrayBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastDashArray(SETTINGS.segment.drawn.dashArray.front)
    : SETTINGS.segment.drawn.dashArray.back;
  private dashArrayOffsetBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastDashArrayOffset(
        SETTINGS.segment.drawn.dashArray.offset.front
      )
    : SETTINGS.segment.drawn.dashArray.offset.back;

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
    this.name = "Segment-" + SEGMENT_COUNT++;
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

    // The clear() extension functio works only of JS Array, but
    // not on Two.JS Collection class. Use splice() instead.
    this.frontExtra.vertices.splice(0);
    this.glowingFrontExtra.vertices.splice(0);
    this.backExtra.vertices.splice(0);
    this.glowingBackExtra.vertices.splice(0);

    // Set the style that never changes -- Fill
    this.frontPart.noFill();
    this.glowingFrontPart.noFill();
    this.backPart.noFill();
    this.glowingBackPart.noFill();
    this.frontExtra.noFill();
    this.glowingFrontExtra.noFill();
    this.backExtra.noFill();
    this.glowingBackExtra.noFill();

    // The segment is not initially glowing
    (this.frontPart as any).visible = true;
    (this.glowingFrontPart as any).visible = false;
    (this.backPart as any).visible = true;
    (this.glowingBackPart as any).visible = false;
    (this.frontExtra as any).visible = true;
    (this.glowingFrontExtra as any).visible = false;
    (this.backExtra as any).visible = true;
    (this.glowingBackExtra as any).visible = false;
  }

  // TODO: adjust size of frontextra, backextra and glowing parts use stylize("update")
  adjustSizeForZoom(factor: number): void {
    const newThickness = this.strokeWidthFront * factor;
    console.debug("Attempt to change line thickness to", newThickness);
    if (factor > 1)
      this.frontPart.linewidth = Math.min(
        newThickness,
        SETTINGS.segment.drawn.strokeWidth.max
      );
    else
      this.frontPart.linewidth = Math.max(
        newThickness,
        SETTINGS.segment.drawn.strokeWidth.min
      );
  }

  frontGlowingDisplay(): void {
    (this.frontPart as any).visible = true;
    (this.glowingFrontPart as any).visible = true;
    (this.frontExtra as any).visible = true;
    (this.glowingFrontExtra as any).visible = true;
  }

  backGlowingDisplay(): void {
    (this.backPart as any).visible = true;
    (this.glowingBackPart as any).visible = true;
    (this.backExtra as any).visible = true;
    (this.glowingBackExtra as any).visible = true;
  }

  backNormalDisplay(): void {
    (this.backPart as any).visible = true;
    (this.glowingBackPart as any).visible = false;
    (this.backExtra as any).visible = true;
    (this.glowingBackExtra as any).visible = false;
  }

  frontNormalDisplay(): void {
    (this.frontPart as any).visible = true;
    (this.glowingFrontPart as any).visible = false;
    (this.frontExtra as any).visible = true;
    (this.glowingFrontExtra as any).visible = false;
  }

  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }

  updateStyle(options: StyleOptions): void {
    console.debug("Update style of", this.name);
    if (options.strokeColor) {
      this.frontPart.stroke = options.strokeColor;
      this.frontExtra.stroke = options.strokeColor;
      this.glowingFrontPart.stroke = options.strokeColor;
      this.glowingFrontExtra.stroke = options.strokeColor;
    }
    if (options.strokeWidth) {
      this.frontPart.linewidth = options.strokeWidth;
      this.frontExtra.linewidth = options.strokeWidth;
      this.glowingFrontPart.linewidth =
        options.strokeWidth + SETTINGS.segment.glowing.edgeWidth;
      this.glowingFrontExtra.linewidth =
        options.strokeWidth + SETTINGS.segment.glowing.edgeWidth;
    }
    if (options.dashPattern) {
      (this.backPart as any).dashes = options.dashPattern;
      (this.backExtra as any).dashes = options.dashPattern;
      (this.glowingBackPart as any).dashes = options.dashPattern;
      (this.glowingBackExtra as any).dashes = options.dashPattern;
    }
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
      .multiplyScalar(this._arcLength > Math.PI ? -1 : 1).normalize;

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
          activeFront.push(pool.pop()!);
          glowingActiveFront.push(glowingPool.pop()!);
        }
        activeFront[posIndex].x = this.tmpVector1.x;
        activeFront[posIndex].y = this.tmpVector1.y;
        glowingActiveFront[posIndex].x = this.tmpVector1.x;
        glowingActiveFront[posIndex].y = this.tmpVector1.y;
        posIndex++;
      } else {
        if (negIndex === activeBack.length) {
          // transfer one cell from the common pool
          activeBack.push(pool.pop()!);
          glowingActiveBack.push(glowingPool.pop()!);
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
      (this.frontPart as any).visible = false;
      (this.glowingFrontPart as any).visible = false;
      (this.frontExtra as any).visible = false;
      (this.glowingFrontExtra as any).visible = false;
      (this.backPart as any).visible = false;
      (this.glowingBackPart as any).visible = false;
      (this.backExtra as any).visible = false;
      (this.glowingBackExtra as any).visible = false;
    } else {
      this.normalDisplay();
    }
  }

  /**
   * Clone the segment - We have to define our own clone() function
   * The builtin clone() does not seem to work correctly
   */
  clone(): this {
    // Create a new segment and copy all this's properties into it
    const dup = new Segment();
    //Copy name and start/end/mid/normal vectors
    dup.name = this.name;
    dup._arcLength = this._arcLength;
    dup._startVector.copy(this._startVector);
    dup._normalVector.copy(this._normalVector);
    //Copy the vertices of front/back/part
    const pool: Two.Anchor[] = [];
    pool.push(...dup.frontPart.vertices.splice(0)); //concatenates the pool array and the front vertices array and empties the frontPart array
    pool.push(...dup.backPart.vertices.splice(0)); //concatenates the pool array and the back vertices array and empties the backPart array

    // The length of the Pool array is 2*SUBDIVISIONS = this.frontPart.length + this.frontExtra.length + this.backPart.length + this.backExtra.length because dup.frontPart and dup.backPart initially contains all the vertices and frontExtra and backExtra are empty.
    this.frontPart.vertices.forEach((v, pos: number) => {
      // Add a vertex in the frontPart (while taking one away from the pool)
      dup.frontPart.vertices.push(pool.pop()!); // Exclamation point means that the linter assumes that the popped object is non-null
      // Copy the this.frontPart vertex v into the newly added vertex in frontPart
      dup.frontPart.vertices[pos].copy(v); //
    });
    // Repeat for the frontExtra/backPart/backExtra
    this.frontExtra.vertices.forEach((v, pos: number) => {
      dup.frontExtra.vertices.push(pool.pop()!);
      dup.frontExtra.vertices[pos].copy(v);
    });
    this.backPart.vertices.forEach((v, pos: number) => {
      dup.backPart.vertices.push(pool.pop()!);
      dup.backPart.vertices[pos].copy(v);
    });
    this.backExtra.vertices.forEach((v, pos: number) => {
      dup.backExtra.vertices.push(pool.pop()!);
      dup.backExtra.vertices[pos].copy(v);
    });

    // Repeat for all glowing parts/extras
    const glowingPool: Two.Anchor[] = [];
    glowingPool.push(...dup.glowingFrontPart.vertices.splice(0));
    glowingPool.push(...dup.glowingBackPart.vertices.splice(0));
    this.glowingFrontPart.vertices.forEach((v, pos: number) => {
      dup.glowingFrontPart.vertices.push(glowingPool.pop()!);
      dup.glowingFrontPart.vertices[pos].copy(v);
    });
    this.glowingFrontExtra.vertices.forEach((v, pos: number) => {
      dup.glowingFrontExtra.vertices.push(glowingPool.pop()!);
      dup.glowingFrontExtra.vertices[pos].copy(v);
    });
    this.glowingBackPart.vertices.forEach((v, pos: number) => {
      dup.glowingBackPart.vertices.push(glowingPool.pop()!);
      dup.glowingBackPart.vertices[pos].copy(v);
    });
    this.backExtra.vertices.forEach((v, pos: number) => {
      dup.glowingBackExtra.vertices.push(glowingPool.pop()!);
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

  removeFromLayers(/*layers: Two.Group[]*/): void {
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
   * Set the rendering style (flags: temporary, default, glowing, update) of the segment
   * Update flag means at least one of the private variables storing style information has
   * changed and should be applied to the displayed segment.
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.TEMPORARY: {
        // The style for the temporary segment display.  These options are not user modifiable.
        // Created with the Google Sheet "Segment Styling Code" in the "Temporary" tab

        // FRONT PART
        this.frontPart.stroke = SETTINGS.segment.temp.strokeColor.front;
        this.frontPart.linewidth = SETTINGS.segment.temp.strokeWidth.front;
        this.frontPart.opacity = SETTINGS.segment.temp.opacity.front;
        if (SETTINGS.segment.temp.dashArray.front.length > 0) {
          SETTINGS.segment.temp.dashArray.front.forEach(v => {
            (this.frontPart as any).dashes.push(v);
          });
          (this.frontPart as any).offset =
            SETTINGS.segment.temp.dashArray.offset.front;
        }
        // FRONT EXTRA
        this.frontExtra.stroke = SETTINGS.segment.temp.strokeColor.front;
        this.frontExtra.linewidth = SETTINGS.segment.temp.strokeWidth.front;
        this.frontExtra.opacity = SETTINGS.segment.temp.opacity.front;
        if (SETTINGS.segment.temp.dashArray.front.length > 0) {
          SETTINGS.segment.temp.dashArray.front.forEach(v => {
            (this.frontExtra as any).dashes.push(v);
          });
          (this.frontExtra as any).offset =
            SETTINGS.segment.temp.dashArray.offset.front;
        }
        // BACK PART
        this.backPart.stroke = SETTINGS.segment.temp.strokeColor.back;
        this.backPart.linewidth = SETTINGS.segment.temp.strokeWidth.back;
        this.backPart.opacity = SETTINGS.segment.temp.opacity.back;
        if (SETTINGS.segment.temp.dashArray.back.length > 0) {
          SETTINGS.segment.temp.dashArray.back.forEach(v => {
            (this.backPart as any).dashes.push(v);
          });
          (this.backPart as any).offset =
            SETTINGS.segment.temp.dashArray.offset.back;
        }
        // BACK EXTRA
        this.backExtra.stroke = SETTINGS.segment.temp.strokeColor.back;
        this.backExtra.linewidth = SETTINGS.segment.temp.strokeWidth.back;
        this.backExtra.opacity = SETTINGS.segment.temp.opacity.back;
        if (SETTINGS.segment.temp.dashArray.back.length > 0) {
          SETTINGS.segment.temp.dashArray.back.forEach(v => {
            (this.backExtra as any).dashes.push(v);
          });
          (this.backExtra as any).offset =
            SETTINGS.segment.temp.dashArray.offset.back;
        }
        // The temporary display is never highlighted
        (this.glowingFrontPart as any).visible = false;
        (this.glowingBackPart as any).visible = false;
        (this.glowingFrontExtra as any).visible = false;
        (this.glowingBackExtra as any).visible = false;
        break;
      }
      case DisplayStyle.GLOWING: {
        // The style for the glowing circle display.  These options are not user modifiable.
        // Created with the Google Sheet "Segment Styling Code" in the "Glowing" tab

        // FRONT PART
        this.glowingFrontPart.stroke =
          SETTINGS.segment.glowing.strokeColor.front;
        this.glowingFrontPart.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.front;
        this.glowingFrontPart.opacity = SETTINGS.segment.glowing.opacity.front;
        if (SETTINGS.segment.glowing.dashArray.front.length > 0) {
          SETTINGS.segment.glowing.dashArray.front.forEach(v => {
            (this.glowingFrontPart as any).dashes.push(v);
          });
          (this.glowingFrontPart as any).offset =
            SETTINGS.segment.glowing.dashArray.offset.front;
        }
        // FRONT EXTRA
        this.glowingFrontExtra.stroke =
          SETTINGS.segment.glowing.strokeColor.front;
        this.glowingFrontExtra.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.front;
        this.glowingFrontExtra.opacity = SETTINGS.segment.glowing.opacity.front;
        if (SETTINGS.segment.glowing.dashArray.front.length > 0) {
          SETTINGS.segment.glowing.dashArray.front.forEach(v => {
            (this.glowingFrontExtra as any).dashes.push(v);
          });
          (this.glowingFrontExtra as any).offset =
            SETTINGS.segment.glowing.dashArray.offset.front;
        }

        // BACK PART
        this.glowingBackPart.stroke = SETTINGS.segment.glowing.strokeColor.back;
        this.glowingBackPart.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.back;
        this.glowingBackPart.opacity = SETTINGS.segment.glowing.opacity.back;
        if (SETTINGS.segment.glowing.dashArray.back.length > 0) {
          SETTINGS.segment.glowing.dashArray.back.forEach(v => {
            (this.glowingBackPart as any).dashes.push(v);
          });
          (this.glowingBackPart as any).offset =
            SETTINGS.segment.glowing.dashArray.offset.back;
        }
        // BACK EXTRA
        this.glowingBackExtra.stroke =
          SETTINGS.segment.glowing.strokeColor.back;
        this.glowingBackExtra.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.back;
        this.glowingBackExtra.opacity = SETTINGS.segment.glowing.opacity.back;
        if (SETTINGS.segment.glowing.dashArray.back.length > 0) {
          SETTINGS.segment.glowing.dashArray.back.forEach(v => {
            (this.glowingBackExtra as any).dashes.push(v);
          });
          (this.glowingBackExtra as any).offset =
            SETTINGS.segment.glowing.dashArray.offset.back;
        }
        break;
      }
      case DisplayStyle.UPDATE: {
        // Use the current variables to update the display style
        // Created with the Google Sheet "Segment Styling Code" in the "Drawn Update" tab
        // FRONT PART
        this.frontPart.stroke = this.strokeColorFront;
        this.frontPart.linewidth = this.strokeWidthFront;
        this.frontPart.opacity = this.opacityFront;
        if (this.dashArrayFront.length > 0) {
          (this.frontPart as any).dashes.length = 0;
          this.dashArrayFront.forEach(v => {
            (this.frontPart as any).dashes.push(v);
          });
          (this.frontPart as any).offset = this.dashArrayOffsetFront;
        }
        // FRONT EXTRA
        this.frontExtra.stroke = this.strokeColorFront;
        this.frontExtra.linewidth = this.strokeWidthFront;
        this.frontExtra.opacity = this.opacityFront;
        if (this.dashArrayFront.length > 0) {
          (this.frontExtra as any).dashes.length = 0;
          this.dashArrayFront.forEach(v => {
            (this.frontExtra as any).dashes.push(v);
          });
          (this.frontExtra as any).offset = this.dashArrayOffsetFront;
        }
        // BACK PART
        this.backPart.stroke = this.strokeColorBack;
        this.backPart.linewidth = this.strokeWidthBack;
        this.backPart.opacity = this.opacityBack;
        if (this.dashArrayBack.length > 0) {
          (this.backPart as any).dashes.length = 0;
          this.dashArrayBack.forEach((v: number) => {
            (this.backPart as any).dashes.push(v);
          });
          (this.backPart as any).offset = this.dashArrayOffsetBack;
        }
        // BACK EXTRA
        this.backExtra.stroke = this.strokeColorBack;
        this.backExtra.linewidth = this.strokeWidthBack;
        this.backExtra.opacity = this.opacityBack;
        if (this.dashArrayBack.length > 0) {
          (this.backExtra as any).dashes.length = 0;
          this.dashArrayBack.forEach((v: number) => {
            (this.backExtra as any).dashes.push(v);
          });
          (this.backExtra as any).offset = this.dashArrayOffsetBack;
        }
        // UPDATE the glowing width so it is always bigger than the drawn width
        this.glowingFrontPart.linewidth =
          this.strokeWidthFront + SETTINGS.segment.glowing.edgeWidth;
        this.glowingFrontExtra.linewidth =
          this.strokeWidthFront + SETTINGS.segment.glowing.edgeWidth;
        this.glowingBackPart.linewidth =
          this.strokeWidthBack + SETTINGS.segment.glowing.edgeWidth;
        this.glowingBackExtra.linewidth =
          this.strokeWidthBack + SETTINGS.segment.glowing.edgeWidth;
        break;
      }
      case DisplayStyle.DEFAULT:
      default: {
        // Reset the style to the defaults i.e. Use the global defaults to update the display style
        // Created with the Google Sheet "Segment Styling Code" in the "Drawn Set To Defaults" tab
        // FRONT PART
        this.frontPart.stroke = SETTINGS.segment.drawn.strokeColor.front;
        this.frontPart.linewidth = SETTINGS.segment.drawn.strokeWidth.front;
        this.frontPart.opacity = SETTINGS.segment.drawn.opacity.front;
        if (SETTINGS.segment.drawn.dashArray.front.length > 0) {
          (this.frontPart as any).dashes.length = 0;
          SETTINGS.segment.drawn.dashArray.front.forEach(v => {
            (this.frontPart as any).dashes.push(v);
          });
          (this.frontPart as any).offset =
            SETTINGS.segment.drawn.dashArray.offset.front;
        }
        // FRONT EXTRA
        this.frontExtra.stroke = SETTINGS.segment.drawn.strokeColor.front;
        this.frontExtra.linewidth = SETTINGS.segment.drawn.strokeWidth.front;
        this.frontExtra.opacity = SETTINGS.segment.drawn.opacity.front;
        if (SETTINGS.segment.drawn.dashArray.front.length > 0) {
          (this.frontExtra as any).dashes.length = 0;
          SETTINGS.segment.drawn.dashArray.front.forEach(v => {
            (this.frontExtra as any).dashes.push(v);
          });
          (this.frontExtra as any).offset =
            SETTINGS.segment.drawn.dashArray.offset.front;
        }
        // BACK PART
        this.backPart.stroke = SETTINGS.segment.drawn.strokeColor.back;
        this.backPart.linewidth = SETTINGS.segment.drawn.strokeWidth.back;
        this.backPart.opacity = SETTINGS.segment.drawn.opacity.back;
        if (SETTINGS.segment.drawn.dashArray.back.length > 0) {
          (this.backPart as any).dashes.length = 0;
          SETTINGS.segment.drawn.dashArray.back.forEach(v => {
            (this.backPart as any).dashes.push(v);
          });
          (this.backPart as any).offset =
            SETTINGS.segment.drawn.dashArray.offset.back;
        }
        // BACK EXTRA
        this.backExtra.stroke = SETTINGS.segment.drawn.strokeColor.back;
        this.backExtra.linewidth = SETTINGS.segment.drawn.strokeWidth.back;
        this.backExtra.opacity = SETTINGS.segment.drawn.opacity.back;
        if (SETTINGS.segment.drawn.dashArray.back.length > 0) {
          (this.backExtra as any).dashes.length = 0;
          SETTINGS.segment.drawn.dashArray.back.forEach(v => {
            (this.backExtra as any).dashes.push(v);
          });
          (this.backExtra as any).offset =
            SETTINGS.segment.drawn.dashArray.offset.back;
        }
        // UPDATE the glowing width so it is always bigger than the drawn width
        this.glowingFrontPart.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.front;
        this.glowingFrontExtra.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.front;
        this.glowingBackPart.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.back;
        this.glowingBackExtra.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.back;
        break;
      }
    }
  }
}
