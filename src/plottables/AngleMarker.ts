/** @format */

import {
  Vector3,
  Vector2,
  Matrix4,
  UnsignedShort4444Type,
  ShortType
} from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import AppStore from "@/store";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const transformMatrixCircular = new Matrix4();
const transformMatrixCircularDA = new Matrix4();
const transformMatrixStraightStart = new Matrix4();
const transformMatrixStraightEnd = new Matrix4();
const CIRCLEEDGESUBDIVISIONS = SETTINGS.angleMarker.numCirclePoints;
const STRIAGHTEDGESUBDIVISIONS = SETTINGS.angleMarker.numEdgePoints;
const BOUNDARYCIRCLEEDGESUBDIVISIONS =
  SETTINGS.angleMarker.numBoundaryCirclePoints;

let ANGLEMARKER_COUNT = 0;

/**
 * For drawing angle markers. The circular part of an angle marker consists of two paths (front and back) and a storage path
 * the total number of vertices in the front/back/storage is 2*CIRCLEEDGESUBDIVISIONS.
 * We initially assign the same number of segments/subdivisions to each front/back path and storage empty,
 * but as the angle marker is being deformed and moved the number of subdivisions on each path (front/back/storage)
 * may change: longer path will hold more subdivision points (while keeping the
 * total points 2*CIRCLEEDGESUBDIVISIONS so we don't create/remove new points)
 */
export default class AngleMarker extends Nodule {
  /**
   * The vertex vector of the angle marker in ideal unit sphere.
   */
  private _vertexVector = new Vector3();

  /**
   * The start vector of the angle marker in ideal unit sphere. The righthand rule is used to determine the
   * direction of the angle marker. Put your righthand at the _vertexVector (thumb away from center of sphere)
   *  and your fingers in the direction of _startVector. The region swept out is the angle marker.
   */
  private _startVector = new Vector3();

  /**
   * The end vector of the angle marker in ideal unit sphere.
   */
  private _endVector = new Vector3();

  /**
   *
   * NOTE: Once the above three variables are set, the updateDisplay() will correctly render the angleMarker.
   * These are the only pieces of information that are need to do the rendering. All other
   * calculations in this class are only for the purpose of rendering the segment.
   */

  /**
   * The radius of the angle marker. This get scaled by angleMarkerRadiusPercent
   */
  private _angleMarkerRadius = SETTINGS.angleMarker.defaultRadius;
  private _angleMarkerRadiusDoubleArc =
    SETTINGS.angleMarker.defaultRadius + SETTINGS.angleMarker.doubleArcGap;

  /**
   * The angleMarkerDecorations
   */
  private _angleMarkerTickMark = SETTINGS.angleMarker.defaultTickMark;
  private _angleMarkerDoubleArc = SETTINGS.angleMarker.defaultDoubleArc;
  /**
   * Vuex global state
   */
  protected store = AppStore; //

  /**
   * The TwoJS objects to display the *circular* front/back start/tail single/double parts and their glowing counterparts.
   */
  private frontCirclePathStart: Two.Path;
  private frontCirclePathTail: Two.Path;
  private backCirclePathStart: Two.Path;
  private backCirclePathTail: Two.Path;
  private frontCirclePathDoubleArcStart: Two.Path;
  private frontCirclePathDoubleArcTail: Two.Path;
  private backCirclePathDoubleArcStart: Two.Path;
  private backCirclePathDoubleArcTail: Two.Path;

  private glowingFrontCirclePathStart: Two.Path;
  private glowingFrontCirclePathTail: Two.Path;
  private glowingBackCirclePathStart: Two.Path;
  private glowingBackCirclePathTail: Two.Path;
  private glowingFrontCirclePathDoubleArcStart: Two.Path;
  private glowingFrontCirclePathDoubleArcTail: Two.Path;
  private glowingBackCirclePathDoubleArcStart: Two.Path;
  private glowingBackCirclePathDoubleArcTail: Two.Path;

  /**
   * The TwoJS objects to display the straight front/back start (from vertex to start)/end (from vertex end) parts and their glowing counterparts.
   */

  private frontStraightStart: Two.Path;
  private backStraightStart: Two.Path;
  private frontStraightEnd: Two.Path;
  private backStraightEnd: Two.Path;
  private glowingFrontStraightStart: Two.Path;
  private glowingBackStraightStart: Two.Path;
  private glowingFrontStraightEnd: Two.Path;
  private glowingBackStraightEnd: Two.Path;

  /**
   * The TwoJS objects to display the front/back fill. These are different than the front/back parts
   *  because when the angle marker is dragged between the front and back, the fill region includes some
   *  of the boundary circle and is therefore different from the front/back parts. Also there are six ways that
   *  the boundary circle can intersect an angle marker and one of the has a disconnected pair of regions on the
   *  same side of the front/back divide. This means that we need two of each front/back fill region.
   */
  private frontFill1: Two.Path;
  private backFill1: Two.Path;
  private frontFill2: Two.Path;
  private backFill2: Two.Path;

  /**
   * The styling variables for the drawn angle marker. The user can modify these.
   */
  // Front
  private fillColorFront = SETTINGS.angleMarker.drawn.fillColor.front;
  private strokeColorFront = SETTINGS.angleMarker.drawn.strokeColor.front;
  private glowingStrokeColorFront =
    SETTINGS.angleMarker.glowing.strokeColor.front;
  private strokeWidthPercentFront = 100;
  private dashArrayFront = [] as number[]; // Initialize in constructor
  // Back -- use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
  private fillColorBack = SETTINGS.angleMarker.drawn.fillColor.back;
  private strokeColorBack = SETTINGS.angleMarker.drawn.strokeColor.back;
  private glowingStrokeColorBack =
    SETTINGS.angleMarker.glowing.strokeColor.back;
  private strokeWidthPercentBack = 100;
  private dashArrayBack = [] as number[]; // Initialize in constructor
  private dynamicBackStyle = SETTINGS.angleMarker.dynamicBackStyle;

  // Applies to both sides
  private _angleMarkerRadiusPercent = 100;

  /**
   * The stops and gradient for front/back fill
   */
  private frontGradientColorCenter = new Two.Stop(
    0,
    SETTINGS.fill.frontWhite,
    1
  );
  private frontGradientColor = new Two.Stop(
    2 * SETTINGS.boundaryCircle.radius,
    this.fillColorFront,
    1
  );
  private frontGradient = new Two.RadialGradient(
    SETTINGS.fill.lightSource.x,
    SETTINGS.fill.lightSource.y,
    1 * SETTINGS.boundaryCircle.radius,
    [this.frontGradientColorCenter, this.frontGradientColor]
  );
  private backGradientColorCenter = new Two.Stop(0, SETTINGS.fill.backGray, 1);
  private backGradientColor = new Two.Stop(
    1 * SETTINGS.boundaryCircle.radius,
    this.fillColorBack,
    1
  );
  private backGradient = new Two.RadialGradient(
    -SETTINGS.fill.lightSource.x,
    -SETTINGS.fill.lightSource.y,
    2 * SETTINGS.boundaryCircle.radius,
    [this.backGradientColorCenter, this.backGradientColor]
  );

  /** Initialize the current line width that is *NOT* user adjustable (but does scale for zoom) */
  static currentAngleMarkerStraightStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.straight.front;
  static currentAngleMarkerStraightStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.straight.back;
  static currentGlowingAngleMarkerStraightStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.straight.front +
    SETTINGS.angleMarker.glowing.straight.edgeWidth;
  static currentGlowingAngleMarkerStraightStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.straight.back +
    SETTINGS.angleMarker.glowing.straight.edgeWidth;

  /** Initialize the current line width that is adjust by the zoom level and the user widthPercent */
  static currentAngleMarkerCircularStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.circular.front;
  static currentAngleMarkerCircularStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.circular.back;
  static currentGlowingAngleMarkerCircularStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.circular.front +
    SETTINGS.angleMarker.glowing.circular.edgeWidth;
  static currentGlowingAngleMarkerCircularStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.circular.back +
    SETTINGS.angleMarker.glowing.circular.edgeWidth;

  /**
   * Initialize the current radius scale factor that is adjusted by the zoom level and the user angleMarkerRadiusPercent
   * The initial radius of the angle marker is set by the defaults in SETTINGS
   */
  static currentAngleMarkerRadius = SETTINGS.angleMarker.defaultRadius;
  static currentAngleMarkerRadiusDoubleArc =
    SETTINGS.angleMarker.defaultRadius + SETTINGS.angleMarker.doubleArcGap;

  /**
   * Update all the current stroke widths
   * @param factor The ratio of the current magnification factor over the old magnification factor
   */
  static updateCurrentStrokeWidthAndRadiusForZoom(factor: number): void {
    AngleMarker.currentAngleMarkerCircularStrokeWidthFront *= factor;
    AngleMarker.currentAngleMarkerCircularStrokeWidthBack *= factor;
    AngleMarker.currentGlowingAngleMarkerCircularStrokeWidthFront *= factor;
    AngleMarker.currentGlowingAngleMarkerCircularStrokeWidthBack *= factor;

    AngleMarker.currentAngleMarkerStraightStrokeWidthFront *= factor;
    AngleMarker.currentAngleMarkerStraightStrokeWidthBack *= factor;
    AngleMarker.currentGlowingAngleMarkerStraightStrokeWidthFront *= factor;
    AngleMarker.currentGlowingAngleMarkerStraightStrokeWidthBack *= factor;

    AngleMarker.currentAngleMarkerRadius *= factor;
    AngleMarker.currentAngleMarkerRadiusDoubleArc *= factor;
  }

  /**
   * For temporary calculation with ThreeJS objects
   */
  private tmpVector = new Vector3();
  private tmpMatrix = new Matrix4();
  private tmpVectorDA = new Vector3();
  private tmpMatrixDA = new Matrix4();
  private tmpVectorStraight = new Vector3();

  constructor() {
    super();
    this.name = "AngleMarker-" + ANGLEMARKER_COUNT++;

    // Circular Part Initialize
    // Create the initial front and back vertices (glowing/not doubleArc/not start/tail)

    const vertices: Two.Vector[] = [];
    for (let k = 0; k < CIRCLEEDGESUBDIVISIONS; k++) {
      vertices.push(new Two.Vector(0, 0));
    }
    this.frontCirclePathStart = new Two.Path(
      vertices,
      /* closed */ false,
      /* curve */ false
    );

    // Create the other parts cloning the front circle path start
    this.frontCirclePathDoubleArcStart = this.frontCirclePathStart.clone();
    this.frontCirclePathTail = this.frontCirclePathStart.clone();
    this.frontCirclePathDoubleArcTail = this.frontCirclePathStart.clone();

    this.backCirclePathStart = this.frontCirclePathStart.clone();
    this.backCirclePathDoubleArcStart = this.frontCirclePathStart.clone();
    this.backCirclePathTail = this.frontCirclePathStart.clone();
    this.backCirclePathDoubleArcTail = this.frontCirclePathStart.clone();

    this.glowingFrontCirclePathStart = this.frontCirclePathStart.clone();
    this.glowingFrontCirclePathDoubleArcStart = this.frontCirclePathStart.clone();
    this.glowingFrontCirclePathTail = this.frontCirclePathStart.clone();
    this.glowingFrontCirclePathDoubleArcTail = this.frontCirclePathStart.clone();

    this.glowingBackCirclePathStart = this.frontCirclePathStart.clone();
    this.glowingBackCirclePathDoubleArcStart = this.frontCirclePathStart.clone();
    this.glowingBackCirclePathTail = this.frontCirclePathStart.clone();
    this.glowingBackCirclePathDoubleArcTail = this.frontCirclePathStart.clone();

    // The clear() extension function works only on JS Array, but
    // not on Two.JS Collection class. Use splice() instead. Clear only tails so there are 2*circleSubdivions in the union of frontCirclePathStart and endCirclePathStart

    this.frontCirclePathTail.vertices.splice(0);
    this.frontCirclePathDoubleArcTail.vertices.splice(0);

    this.backCirclePathTail.vertices.splice(0);
    this.backCirclePathDoubleArcTail.vertices.splice(0);

    this.glowingFrontCirclePathTail.vertices.splice(0);
    this.glowingFrontCirclePathDoubleArcTail.vertices.splice(0);

    this.glowingBackCirclePathTail.vertices.splice(0);
    this.glowingBackCirclePathDoubleArcTail.vertices.splice(0);

    // Set the style that never changes -- Fill
    this.frontCirclePathStart.noFill();
    this.frontCirclePathDoubleArcStart.noFill();
    this.frontCirclePathTail.noFill();
    this.frontCirclePathDoubleArcTail.noFill();

    this.backCirclePathStart.noFill();
    this.backCirclePathDoubleArcStart.noFill();
    this.backCirclePathTail.noFill();
    this.backCirclePathDoubleArcTail.noFill();

    this.glowingFrontCirclePathStart.noFill();
    this.glowingFrontCirclePathDoubleArcStart.noFill();
    this.glowingFrontCirclePathTail.noFill();
    this.glowingFrontCirclePathDoubleArcTail.noFill();

    this.glowingBackCirclePathStart.noFill();
    this.glowingBackCirclePathDoubleArcStart.noFill();
    this.glowingBackCirclePathTail.noFill();
    this.glowingBackCirclePathDoubleArcTail.noFill();

    // The segment is not initially glowing
    this.frontCirclePathStart.visible = true;
    this.frontCirclePathDoubleArcStart.visible = true;
    this.frontCirclePathTail.visible = true;
    this.frontCirclePathDoubleArcTail.visible = true;

    this.backCirclePathStart.visible = true;
    this.backCirclePathDoubleArcStart.visible = true;
    this.backCirclePathTail.visible = true;
    this.backCirclePathDoubleArcTail.visible = true;

    this.glowingFrontCirclePathStart.visible = false;
    this.glowingFrontCirclePathDoubleArcStart.visible = false;
    this.glowingFrontCirclePathTail.visible = false;
    this.glowingFrontCirclePathDoubleArcTail.visible = false;

    this.glowingBackCirclePathStart.visible = false;
    this.glowingBackCirclePathDoubleArcStart.visible = false;
    this.glowingBackCirclePathTail.visible = false;
    this.glowingBackCirclePathDoubleArcTail.visible = false;

    if (SETTINGS.angleMarker.drawn.dashArray.front.length > 0) {
      SETTINGS.angleMarker.drawn.dashArray.front.forEach(v =>
        this.dashArrayFront.push(v)
      );
    }
    if (SETTINGS.angleMarker.drawn.dashArray.back.length > 0) {
      SETTINGS.angleMarker.drawn.dashArray.back.forEach(v =>
        this.dashArrayBack.push(v)
      );
    }

    //Straight part initialize
    const verticesStraight: Two.Vector[] = [];
    for (let k = 0; k < STRIAGHTEDGESUBDIVISIONS; k++) {
      verticesStraight.push(new Two.Vector(0, 0));
    }
    this.frontStraightStart = new Two.Path(
      verticesStraight,
      /* closed */ false,
      /* curve */ false
    );

    // Create the other parts cloning the front straight path start
    this.backStraightStart = this.frontStraightStart.clone();
    this.frontStraightEnd = this.frontStraightStart.clone();
    this.backStraightEnd = this.frontStraightStart.clone();

    this.glowingFrontStraightStart = this.frontStraightStart.clone();
    this.glowingBackStraightStart = this.frontStraightStart.clone();
    this.glowingFrontStraightEnd = this.frontStraightStart.clone();
    this.glowingBackStraightEnd = this.frontStraightStart.clone();

    // Set the style that never changes -- Fill
    this.frontStraightStart.noFill();
    this.backStraightStart.noFill();
    this.frontStraightEnd.noFill();
    this.backStraightEnd.noFill();

    this.glowingFrontStraightStart.noFill();
    this.glowingBackStraightStart.noFill();
    this.glowingFrontStraightEnd.noFill();
    this.glowingBackStraightEnd.noFill();

    // The segment is not initially glowing
    this.frontStraightStart.visible = true;
    this.backStraightStart.visible = true;
    this.frontStraightEnd.visible = true;
    this.backStraightEnd.visible = true;

    this.glowingFrontStraightStart.visible = false;
    this.glowingBackStraightStart.visible = false;
    this.glowingFrontStraightEnd.visible = false;
    this.glowingBackStraightEnd.visible = false;

    // Now organize the fills
    // In total there are 2*CIRCLEEDGESUBDIVISIONS + 4*STRIAGHTEDGESUBDIVISIONS +2*BOUNDARYCIRCLEEDGESUBDIVISIONS
    // anchors a cross all four fill regions.

    const verticesFill: Two.Vector[] = [];
    for (
      let k = 0;
      k <
      CIRCLEEDGESUBDIVISIONS +
        2 * STRIAGHTEDGESUBDIVISIONS +
        BOUNDARYCIRCLEEDGESUBDIVISIONS;
      k++
    ) {
      verticesFill.push(new Two.Vector(0, 0));
    }
    this.frontFill1 = new Two.Path(
      verticesStraight,
      /* closed */ true,
      /* curve */ false
    );

    // Create the other parts cloning the front straight path start
    this.frontFill2 = this.frontFill1.clone();
    this.backFill1 = this.frontFill1.clone();
    this.backFill2 = this.frontFill1.clone();

    // Strip out some of the anchors so that
    // frontFill1.length + frontFill2.length + backFill1.length + backFill2.length =
    // 2*CIRCLEEDGESUBDIVISIONS + 4*STRIAGHTEDGESUBDIVISIONS +2*BOUNDARYCIRCLEEDGESUBDIVISIONS
    this.frontFill2.vertices.splice(0);
    this.backFill2.vertices.splice(0);

    // Set the style that never changes -- stroke
    this.frontFill1.noStroke();
    this.frontFill2.noStroke();
    this.backFill1.noStroke();
    this.backFill2.noStroke();

    // The show the fill glowing
    this.frontFill1.visible = true;
    this.frontFill2.visible = true;
    this.backFill1.visible = true;
    this.backFill2.visible = true;
  }
  /**
   * Map part of a circle in standard position to the location and orientation of the angleMarker
   * This method updates the TwoJS objects (frontCirclePath, , ...) for display
   * This is only accurate if the vertexVector, startVector, and endVector are correct so only
   * call this method once those variables are updated.
   */
  public updateDisplay(): void {
    // Create a matrix4 in the three.js package (called transformMatrix) that maps a circle in standard position (i.e. the
    //  original circle with vertices forming a circle in the plane z=0 of radius SETTINGS.boundaryCircle.radius) onto
    //  the one in the target desired (updated) position (i.e. the target circle). In the final mapping only part of the circle will be
    //  used to trace out the angle marker which is a segment of a circle.

    // First set up the coordinate system of the target circle
    // The vector to the circle center is ALSO the normal direction of the circle
    desiredZAxis.copy(this._vertexVector).normalize();
    // Any vector perpendicular the desired z axis can be the desired x axis, but we want one that points from the origin to the
    // the projection of the startVector onto the plane perpendicular to the desiredZAxis.
    this.tmpVector
      .crossVectors(this._vertexVector, this._startVector)
      .normalize();
    desiredXAxis.crossVectors(this.tmpVector, this._vertexVector).normalize();

    // Use the cross product to create the vector perpendicular to both the desired z and x axis
    desiredYAxis.crossVectors(desiredZAxis, desiredXAxis).normalize();

    // Set up the local coordinates from for the circle,
    //  transformMatrix will now map (1,0,0) to the point on the desired x axis a unit from the origin in the positive direction.
    transformMatrixCircular.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);
    transformMatrixCircularDA.makeBasis(
      desiredXAxis,
      desiredYAxis,
      desiredZAxis
    );

    //Now appropriately translate and scale the circle in standard position to the one in the desired location

    // //Compute the angular/intrinsic radius of the circle
    // const angleMarkerRadius = this._vertexVector.angleTo(this._startVector);

    // console.log("AM Radius inside update display ", angleMarkerRadius);

    // translate along the Z of the local coordinate frame
    // The standard circle plane (z=0) is below the plane of the target circle so translate the plane z=0 to the
    // the target circle plane
    const distanceFromOrigin = Math.cos(this._angleMarkerRadius);
    const distanceFromOriginDoubleArc = Math.cos(
      this._angleMarkerRadiusDoubleArc
    );
    this.tmpMatrix.makeTranslation(
      0,
      0,
      distanceFromOrigin * SETTINGS.boundaryCircle.radius
    );
    this.tmpMatrixDA.makeTranslation(
      0,
      0,
      distanceFromOriginDoubleArc * SETTINGS.boundaryCircle.radius
    );
    transformMatrixCircular.multiply(this.tmpMatrix);
    transformMatrixCircularDA.multiply(this.tmpMatrixDA);
    // The target circle is scaled version of the original circle (but now in the plane of the target circle)
    // so scale XYZ space in the XY directions by the projected radius (z direction by 1)
    // this will make the original circle (in the plane of the target circle) finally coincide with the target circle
    this.tmpMatrix.makeScale(
      Math.sin(this._angleMarkerRadius),
      Math.sin(this._angleMarkerRadius),
      1
    );
    this.tmpMatrixDA.makeScale(
      Math.sin(this._angleMarkerRadiusDoubleArc),
      Math.sin(this._angleMarkerRadiusDoubleArc),
      1
    );
    transformMatrixCircular.multiply(this.tmpMatrix); // transformMatrix now maps the original circle to the target circle
    transformMatrixCircularDA.multiply(this.tmpMatrixDA);
    // Now figure out the angular length of the angle marker using the endVector
    // First project endVector on the plane perpendicular to the vertexVector
    this.tmpVector.copy(this._endVector);
    this.tmpVector.addScaledVector(
      this._vertexVector,
      -1 * this._vertexVector.dot(this._endVector)
    );

    // Now use the atan2 function in the plane perpendicular to vertexVector where the positive x axis is the desiredXAxis
    //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
    // Returns angle in the range (-pi,pi] to convert to [0,2pi) use modulus 2*Pi operator
    // Note that while in most languages, ‘%’ is a remainder operator, in some (e.g. Python, Perl) it is a
    // modulo operator. For positive values, the two are equivalent, but when the dividend and divisor are
    // of different signs, they give different results. To obtain a modulo in JavaScript,
    // in place of a % n, use ((a % n ) + n ) % n.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder

    const angularLengthOfMarker = Math.atan2(
      desiredYAxis.dot(this.tmpVector),
      desiredXAxis.dot(this.tmpVector)
    ).modTwoPi();
    // console.log("angularLength", angularLengthOfMarker);

    // Bring all the anchor points to a common pool
    // Each half (and extra) path will pull anchor points from
    // this pool as needed
    const pool: Two.Anchor[] = [];
    pool.push(...this.frontCirclePathStart.vertices.splice(0));
    pool.push(...this.frontCirclePathTail.vertices.splice(0));
    pool.push(...this.backCirclePathStart.vertices.splice(0));
    pool.push(...this.backCirclePathTail.vertices.splice(0));
    const glowingPool: Two.Anchor[] = [];
    glowingPool.push(...this.glowingFrontCirclePathStart.vertices.splice(0));
    glowingPool.push(...this.glowingFrontCirclePathTail.vertices.splice(0));
    glowingPool.push(...this.glowingBackCirclePathStart.vertices.splice(0));
    glowingPool.push(...this.glowingBackCirclePathTail.vertices.splice(0));

    // Variables to keep track of when the z coordinate of the transformed vector changes sign
    const toPos = []; // Remember the indices of neg-to-pos crossing
    const toNeg = []; // Remember the indices of pos-to-neg crossing
    let posIndex = 0;
    let negIndex = 0;
    let lastSign = 0;

    // We begin with the "main" paths as the current active paths
    // As we find additional zero-crossing, we then switch to the
    // "extra" paths
    let activeFront = this.frontCirclePathStart.vertices;
    let activeBack = this.backCirclePathStart.vertices;
    let glowingActiveFront = this.glowingFrontCirclePathStart.vertices;
    let glowingActiveBack = this.glowingBackCirclePathStart.vertices;
    for (let pos = 0; pos < 2 * CIRCLEEDGESUBDIVISIONS; pos++) {
      // Generate a vector point on the equator of the Default Sphere
      const angle =
        (pos / (2 * CIRCLEEDGESUBDIVISIONS - 1)) *
        Math.abs(angularLengthOfMarker);
      this.tmpVector
        .set(Math.cos(angle), Math.sin(angle), 0)
        .multiplyScalar(SETTINGS.boundaryCircle.radius);

      // Transform that vector/point to one on the current segment
      this.tmpVector.applyMatrix4(transformMatrixCircular);
      const thisSign = Math.sign(this.tmpVector.z);

      // CHeck for zero-crossing
      if (lastSign !== thisSign) {
        // We have a zero crossing
        if (thisSign > 0) {
          // If we already had a positive crossing
          // The next chunk is a split front part
          if (toPos.length > 0) {
            activeFront = this.frontCirclePathTail.vertices;
            glowingActiveFront = this.glowingFrontCirclePathTail.vertices;
            posIndex = 0;
          }
          toPos.push(pos);
        }
        // If we already had a negative crossing
        // The next chunk is a split back part
        if (thisSign < 0) {
          if (toNeg.length > 0) {
            activeBack = this.backCirclePathTail.vertices;
            glowingActiveBack = this.glowingBackCirclePathTail.vertices;
            negIndex = 0;
          }
          toNeg.push(pos);
        }
      }
      lastSign = thisSign;
      if (this.tmpVector.z > 0) {
        if (posIndex === activeFront.length) {
          // transfer one cell from the common pool
          activeFront.push(pool.pop()!);
          glowingActiveFront.push(glowingPool.pop()!);
        }
        activeFront[posIndex].x = this.tmpVector.x;
        activeFront[posIndex].y = this.tmpVector.y;
        glowingActiveFront[posIndex].x = this.tmpVector.x;
        glowingActiveFront[posIndex].y = this.tmpVector.y;
        posIndex++;
      } else {
        if (negIndex === activeBack.length) {
          // transfer one cell from the common pool
          activeBack.push(pool.pop()!);
          glowingActiveBack.push(glowingPool.pop()!);
        }
        activeBack[negIndex].x = this.tmpVector.x;
        activeBack[negIndex].y = this.tmpVector.y;
        glowingActiveBack[negIndex].x = this.tmpVector.x;
        glowingActiveBack[negIndex].y = this.tmpVector.y;
        negIndex++;
      }
    }

    // Now do the same thing for the DoubleArc(DA) Paths

    const poolDA: Two.Anchor[] = [];
    poolDA.push(...this.frontCirclePathDoubleArcStart.vertices.splice(0));
    poolDA.push(...this.frontCirclePathDoubleArcTail.vertices.splice(0));
    poolDA.push(...this.backCirclePathDoubleArcStart.vertices.splice(0));
    poolDA.push(...this.backCirclePathDoubleArcTail.vertices.splice(0));
    const glowingPoolDA: Two.Anchor[] = [];
    glowingPoolDA.push(
      ...this.glowingFrontCirclePathDoubleArcStart.vertices.splice(0)
    );
    glowingPoolDA.push(
      ...this.glowingFrontCirclePathDoubleArcTail.vertices.splice(0)
    );
    glowingPoolDA.push(
      ...this.glowingBackCirclePathDoubleArcStart.vertices.splice(0)
    );
    glowingPoolDA.push(
      ...this.glowingBackCirclePathDoubleArcTail.vertices.splice(0)
    );

    // Variables to keep track of when the z coordinate of the transformed vector changes sign
    const toPosDA = []; // Remember the indices of neg-to-pos crossing
    const toNegDA = []; // Remember the indices of pos-to-neg crossing
    let posIndexDA = 0;
    let negIndexDA = 0;
    let lastSignDA = 0;

    // We begin with the "main" paths as the current active paths
    // As we find additional zero-crossing, we then switch to the
    // "extra" paths
    let activeFrontDA = this.frontCirclePathDoubleArcStart.vertices;
    let activeBackDA = this.backCirclePathDoubleArcStart.vertices;
    let glowingActiveFrontDA = this.glowingFrontCirclePathDoubleArcStart
      .vertices;
    let glowingActiveBackDA = this.glowingBackCirclePathDoubleArcStart.vertices;
    for (let pos = 0; pos < 2 * CIRCLEEDGESUBDIVISIONS; pos++) {
      // Generate a vector point on the equator of the Default Sphere
      const angle =
        (pos / (2 * CIRCLEEDGESUBDIVISIONS - 1)) *
        Math.abs(angularLengthOfMarker);
      this.tmpVectorDA
        .set(Math.cos(angle), Math.sin(angle), 0)
        .multiplyScalar(SETTINGS.boundaryCircle.radius);

      // Transform that vector/point to one on the current segment
      this.tmpVectorDA.applyMatrix4(transformMatrixCircularDA);
      const thisSignDA = Math.sign(this.tmpVectorDA.z);

      // CHeck for zero-crossing
      if (lastSignDA !== thisSignDA) {
        // We have a zero crossing
        if (thisSignDA > 0) {
          // If we already had a positive crossing
          // The next chunk is a split front part
          if (toPosDA.length > 0) {
            activeFrontDA = this.frontCirclePathDoubleArcTail.vertices;
            glowingActiveFrontDA = this.glowingFrontCirclePathDoubleArcTail
              .vertices;
            posIndexDA = 0;
          }
          toPosDA.push(pos);
        }
        // If we already had a negative crossing
        // The next chunk is a split back part
        if (thisSignDA < 0) {
          if (toNegDA.length > 0) {
            activeBackDA = this.backCirclePathDoubleArcTail.vertices;
            glowingActiveBackDA = this.glowingBackCirclePathDoubleArcTail
              .vertices;
            negIndexDA = 0;
          }
          toNegDA.push(pos);
        }
      }
      lastSignDA = thisSignDA;
      if (this.tmpVectorDA.z > 0) {
        if (posIndexDA === activeFrontDA.length) {
          // transfer one cell from the common pool
          activeFrontDA.push(poolDA.pop()!);
          glowingActiveFrontDA.push(glowingPoolDA.pop()!);
        }
        activeFrontDA[posIndexDA].x = this.tmpVectorDA.x;
        activeFrontDA[posIndexDA].y = this.tmpVectorDA.y;
        glowingActiveFrontDA[posIndexDA].x = this.tmpVectorDA.x;
        glowingActiveFrontDA[posIndexDA].y = this.tmpVectorDA.y;
        posIndexDA++;
      } else {
        if (negIndexDA === activeBackDA.length) {
          // transfer one cell from the common pool
          activeBackDA.push(poolDA.pop()!);
          glowingActiveBackDA.push(glowingPoolDA.pop()!);
        }
        activeBackDA[negIndexDA].x = this.tmpVectorDA.x;
        activeBackDA[negIndexDA].y = this.tmpVectorDA.y;
        glowingActiveBackDA[negIndexDA].x = this.tmpVectorDA.x;
        glowingActiveBackDA[negIndexDA].y = this.tmpVectorDA.y;
        negIndexDA++;
      }
    }

    //  Now build the straight edge from vertex to start

    // First set up the coordinate system of the target straight line segment
    // The cross of the vertex and start is normal to the plane of them and is the z axis
    desiredZAxis
      .crossVectors(this._vertexVector, this._startVector)
      .normalize();

    // Any vector perpendicular the desired z axis can be the desired x axis, but we want one that is the vertex vector (so we start drawing from there).
    desiredXAxis.copy(this._vertexVector);

    // Use the cross product to create the vector perpendicular to both the desired z and x axis
    desiredYAxis.crossVectors(desiredZAxis, desiredXAxis).normalize();

    // Set up the local coordinates from for the circle,
    //  transformMatrix will now map (1,0,0) to the point on the desired x axis a unit from the origin in the positive direction.
    transformMatrixStraightStart.makeBasis(
      desiredXAxis,
      desiredYAxis,
      desiredZAxis
    );

    const angularLengthOfStraight = this._vertexVector.angleTo(
      this._startVector
    );
    // console.log("angularLength", angularLengthOfMarker);

    // Bring all the anchor points to a common pool
    // Each half  path will pull anchor points from
    // this pool as needed

    const poolStart: Two.Anchor[] = [];
    poolStart.push(...this.frontStraightStart.vertices.splice(0));
    poolStart.push(...this.backStraightStart.vertices.splice(0));
    const glowingPoolStart: Two.Anchor[] = [];
    glowingPoolStart.push(...this.glowingFrontStraightStart.vertices.splice(0));
    glowingPoolStart.push(...this.glowingBackStraightStart.vertices.splice(0));

    let posIndexStraight = 0;
    let negIndexStraight = 0;

    /** This works because the length of the straight segment is *never* bigger than Pi so there is only one
     * crossing from pos to neg or vice versa
     */
    for (let pos = 0; pos < 2 * STRIAGHTEDGESUBDIVISIONS; pos++) {
      // Generate a vector point on the equator of the Default Sphere
      const angle =
        (pos / (2 * STRIAGHTEDGESUBDIVISIONS - 1)) *
        Math.abs(angularLengthOfStraight);
      this.tmpVectorStraight
        .set(Math.cos(angle), Math.sin(angle), 0)
        .multiplyScalar(SETTINGS.boundaryCircle.radius);

      // Transform that vector/point to one on the current segment
      this.tmpVectorStraight.applyMatrix4(transformMatrixStraightStart);

      if (this.tmpVectorStraight.z > 0) {
        if (posIndexStraight === this.frontStraightStart.vertices.length) {
          // transfer one cell from the common pool
          this.frontStraightStart.vertices.push(poolStart.pop()!);
          this.glowingFrontStraightStart.vertices.push(glowingPoolStart.pop()!);
        }
        this.frontStraightStart.vertices[
          posIndexStraight
        ].x = this.tmpVectorStraight.x;
        this.frontStraightStart.vertices[
          posIndexStraight
        ].y = this.tmpVectorStraight.y;
        this.glowingFrontStraightStart.vertices[
          posIndexStraight
        ].x = this.tmpVectorStraight.x;
        this.glowingFrontStraightStart.vertices[
          posIndexStraight
        ].y = this.tmpVectorStraight.y;
        posIndexStraight++;
      } else {
        if (negIndexStraight === this.backStraightStart.vertices.length) {
          // transfer one cell from the common pool
          this.backStraightStart.vertices.push(poolStart.pop()!);
          this.glowingBackStraightStart.vertices.push(glowingPoolStart.pop()!);
        }
        this.backStraightStart.vertices[
          negIndexStraight
        ].x = this.tmpVectorStraight.x;
        this.backStraightStart.vertices[
          negIndexStraight
        ].y = this.tmpVectorStraight.y;
        this.glowingBackStraightStart.vertices[
          negIndexStraight
        ].x = this.tmpVectorStraight.x;
        this.glowingBackStraightStart.vertices[
          negIndexStraight
        ].y = this.tmpVectorStraight.y;
        negIndexStraight++;
      }
    }

    //  Now build the straight edge from end to vertex (so that the angle marker is traces vertex -> start -> end -> vertex in order)
    // First set up the coordinate system of the target straight line segment
    // The cross of the vertex and start is normal to the plane of them and is the z axis
    desiredZAxis.crossVectors(this._endVector, this._vertexVector).normalize();

    // Any vector perpendicular the desired z axis can be the desired x axis, but we want one that is the end vector (so we start drawing from there).
    desiredXAxis.copy(this._endVector);

    // Use the cross product to create the vector perpendicular to both the desired z and x axis
    desiredYAxis.crossVectors(desiredZAxis, desiredXAxis).normalize();

    // Set up the local coordinates from for the circle,
    //  transformMatrix will now map (1,0,0) to the point on the desired x axis a unit from the origin in the positive direction.
    transformMatrixStraightEnd.makeBasis(
      desiredXAxis,
      desiredYAxis,
      desiredZAxis
    );

    // Bring all the anchor points to a common pool
    // Each half  path will pull anchor points from
    // this pool as needed
    const poolEnd: Two.Anchor[] = [];
    poolEnd.push(...this.frontStraightEnd.vertices.splice(0));
    poolEnd.push(...this.backStraightEnd.vertices.splice(0));
    const glowingPoolEnd: Two.Anchor[] = [];
    glowingPoolEnd.push(...this.glowingFrontStraightEnd.vertices.splice(0));
    glowingPoolEnd.push(...this.glowingBackStraightEnd.vertices.splice(0));

    // reset the indices
    posIndexStraight = 0;
    negIndexStraight = 0;

    /** This works because the length of the straight segment is *never* bigger than Pi so there is only one
     * crossing from pos to neg or vice versa
     */
    for (let pos = 0; pos < 2 * STRIAGHTEDGESUBDIVISIONS; pos++) {
      // Generate a vector point on the equator of the Default Sphere
      const angle =
        (pos / (2 * STRIAGHTEDGESUBDIVISIONS - 1)) *
        Math.abs(angularLengthOfStraight);
      this.tmpVectorStraight
        .set(Math.cos(angle), Math.sin(angle), 0)
        .multiplyScalar(SETTINGS.boundaryCircle.radius);

      // Transform that vector/point to one on the current segment
      this.tmpVectorStraight.applyMatrix4(transformMatrixStraightEnd);

      if (this.tmpVectorStraight.z > 0) {
        if (posIndexStraight === this.frontStraightEnd.vertices.length) {
          // transfer one cell from the common pool
          this.frontStraightEnd.vertices.push(poolEnd.pop()!);
          this.glowingFrontStraightEnd.vertices.push(glowingPoolEnd.pop()!);
        }
        this.frontStraightEnd.vertices[
          posIndexStraight
        ].x = this.tmpVectorStraight.x;
        this.frontStraightEnd.vertices[
          posIndexStraight
        ].y = this.tmpVectorStraight.y;
        this.glowingFrontStraightEnd.vertices[
          posIndexStraight
        ].x = this.tmpVectorStraight.x;
        this.glowingFrontStraightEnd.vertices[
          posIndexStraight
        ].y = this.tmpVectorStraight.y;
        posIndexStraight++;
      } else {
        if (negIndexStraight === this.backStraightEnd.vertices.length) {
          // transfer one cell from the common pool
          this.backStraightEnd.vertices.push(poolEnd.pop()!);
          this.glowingBackStraightEnd.vertices.push(glowingPoolEnd.pop()!);
        }
        this.backStraightEnd.vertices[
          negIndexStraight
        ].x = this.tmpVectorStraight.x;
        this.backStraightEnd.vertices[
          negIndexStraight
        ].y = this.tmpVectorStraight.y;
        this.glowingBackStraightEnd.vertices[
          negIndexStraight
        ].x = this.tmpVectorStraight.x;
        this.glowingBackStraightEnd.vertices[
          negIndexStraight
        ].y = this.tmpVectorStraight.y;
        negIndexStraight++;
      }
    }
    //Now build the front/back fill objects based on the front/back straight and circular parts

    // Bring all the anchor points to a common pool
    // Each half  path will pull anchor points from
    // this pool as needed
    const poolFill: Two.Anchor[] = [];
    poolFill.push(...this.frontFill1.vertices.splice(0));
    poolFill.push(...this.frontFill2.vertices.splice(0));
    poolFill.push(...this.backFill1.vertices.splice(0));
    poolFill.push(...this.backFill2.vertices.splice(0));
    // there should be 2*CIRCLEEDGESUBDIVISIONS + 4*STRIAGHTEDGESUBDIVISIONS
    //                                    + 2*BOUNDARYCIRCLEEDGESUBDIVISIONS
    // anchors in poolFill

    const leg1F = this.frontStraightStart.vertices.map(node => [
      node.x,
      node.y
    ]);
    const leg1B = this.backStraightStart.vertices.map(node => [node.x, node.y]);
    const leg2F = this.frontCirclePathStart.vertices.map(node => [
      node.x,
      node.y
    ]);
    const leg2B = this.backCirclePathStart.vertices.map(node => [
      node.x,
      node.y
    ]);
    const leg3F = this.frontCirclePathTail.vertices.map(node => [
      node.x,
      node.y
    ]);
    const leg3B = this.backCirclePathTail.vertices.map(node => [
      node.x,
      node.y
    ]);
    const leg4F = this.frontStraightEnd.vertices.map(node => [node.x, node.y]);
    const leg4B = this.backStraightEnd.vertices.map(node => [node.x, node.y]);
    const boundaryVertices1: Two.Anchor[] = []; // The new anchors on the boundary of the circle
    const boundaryVertices2: Two.Anchor[] = []; // The new anchors on the boundary of the circle

    const fillRegion1AnchorList = [];
    const fillRegion2AnchorList = [];
    const fillRegion3AnchorList = [];
    //Check the convexity of the angle Marker
    if (angularLengthOfMarker <= Math.PI) {
      // This two dimensional array describes the outline of the 5 ways that a line can cross a convex
      // angle marker. This always starts at the vertex and then along the edge to the _startVector,
      //  then along the circular edge to the _endVector, and finally along the edge back to the _vertexVector
      //
      // In each row:
      //   Entries 0 & 1 are the front or back StraightStart (SS)
      //   Entries 2 & 3 are the front or back CirclePathStart (CPS)
      //   Entries 4 & 5 are the front or back CirclePathTail (CPT)
      //   Entries 6 & 7 are the front or back StraightEnd (ES)
      //
      // A zero means that the corresponding entry is empty
      // +1 means that the corresponding entry is on the front side of the sphere
      // -1 means that the corresponding entry is on the back side of the sphere
      //
      // See the file "Convex Angle Marker Intersection With Boundary Circle" in the Google drive folder
      const convexOutlines = [
        [1, 0, 1, 0, 0, 0, 1, 0],
        [1, -1, -1, 0, 0, 0, -1, 1],
        [1, -1, -1, 1, 0, 0, 1, 0],
        [1, 0, 1, -1, 0, 0, -1, 1],
        [1, 0, 1, -1, 1, 0, 1, 0]
      ];
      // The side the vertex is on determines if we start with the front or back
      if (this._vertexVector.z < 0) {
        // the vertex is on the back of the sphere so reverse all of the convexOutlines to start on the back
        convexOutlines.forEach(arr => arr.map(num => -1 * num));
      }
      // Now figure out which case we are in (i.e. how the boundary circle is crossing the angle Marker - if at all)
      const ind = convexOutlines.findIndex(arr => {
        const returnBoolean = true;
        if (arr[0] * arr[1] === 0) {
          // at least one of the these two entries is zero so leg1F or/and leg1B must be an empty array depending on the non-zero value (if any)
          if (arr[0] === 0 && arr[1] === 0) {
            // both F and B leg1 must be empty
            if (leg1F.length !== 0 || leg1B.length !== 0) {
              return false; // this is not the arr you are looking for
            }
          } else {
            // arr[1] must be zero because recall that in each pair (0,1) or (2,3) or (4,5) or (6,7) of entries in an array, the first is *never* zero because you *alway* start a leg of the outline on the front or back (but you may or may not return to the other side)
            if (
              (arr[0] === 1 && leg1B.length !== 0) ||
              (arr[0] === -1 && leg1F.length !== 0)
            ) {
              return false; // this is not the arr you are looking for
            }
          }
        }
        if (arr[2] * arr[3] === 0) {
          // at least one of the these two entries is zero so leg2F or/and leg2B must be an empty array depending on the non-zero value (if any)
          if (arr[2] === 0 && arr[3] === 0) {
            // both F and B leg2 must be empty
            if (leg2F.length !== 0 || leg2B.length !== 0) {
              return false; // this is not the arr you are looking for
            }
          } else {
            // arr[3] must be zero because recall that in each pair (0,1) or (2,3) or (4,5) or (6,7) of entries in an array, the first is *never* zero because you *alway* start a leg of the outline on the front or back (but you may or may not return to the other side)
            if (
              (arr[2] === 1 && leg2B.length !== 0) ||
              (arr[2] === -1 && leg2F.length !== 0)
            ) {
              return false; // this is not the arr you are looking for
            }
          }
        }
        if (arr[4] * arr[5] === 0) {
          // at least one of the these two entries is zero so leg3F or/and leg3B must be an empty array depending on the non-zero value (if any)
          if (arr[4] === 0 && arr[5] === 0) {
            // both F and B leg3 must be empty
            if (leg3F.length !== 0 || leg3B.length !== 0) {
              return false; // this is not the arr you are looking for
            }
          } else {
            // arr[5] must be zero because recall that in each pair (0,1) or (2,3) or (4,5) or (6,7) of entries in an array, the first is *never* zero because you *alway* start a leg of the outline on the front or back (but you may or may not return to the other side)
            if (
              (arr[4] === 1 && leg3B.length !== 0) ||
              (arr[4] === -1 && leg3F.length !== 0)
            ) {
              return false; // this is not the arr you are looking for
            }
          }
        }
        if (arr[6] * arr[7] === 0) {
          // at least one of the these two entries is zero so leg4F or/and leg4B must be an empty array depending on the non-zero value (if any)
          if (arr[6] === 0 && arr[7] === 0) {
            // both F and B leg4 must be empty
            if (leg4F.length !== 0 || leg4B.length !== 0) {
              return false; // this is not the arr you are looking for
            }
          } else {
            // arr[7] must be zero because recall that in each pair (0,1) or (2,3) or (4,5) or (6,7) of entries in an array, the first is *never* zero because you *alway* start a leg of the outline on the front or back (but you may or may not return to the other side)
            if (
              (arr[6] === 1 && leg4B.length !== 0) ||
              (arr[6] === -1 && leg4F.length !== 0)
            ) {
              return false; // this is not the arr you are looking for
            }
          }
        }
        return returnBoolean;
      });
      if (ind === -1) {
        console.log("Angle Marker Error - Convex Pattern not found!");
      }
      // Now build the fillRegionVertexList(s)
      switch (ind) {
        case 0: {
          if (convexOutlines[0][0] === 1) {
            fillRegion1AnchorList.push(...leg1F);
          } else {
            fillRegion1AnchorList.push(...leg1B);
          }
          if (convexOutlines[0][2] === 1) {
            fillRegion1AnchorList.push(...leg2F);
          } else {
            fillRegion1AnchorList.push(...leg2B);
          }

          if (convexOutlines[0][6] === 1) {
            fillRegion1AnchorList.push(...leg4F);
          } else {
            fillRegion1AnchorList.push(...leg4B);
          }
          break;
        }
        case 1: {
          break;
        }
      }
    }
    // // The circle interior is only on the front of the sphere
    // if (backCircleLen === 0 && this._circleRadius < Math.PI / 2) {
    //   // In this case the frontFillVertices are the same as the frontVertices
    //   this.frontFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     v.x = this.frontPart.vertices[index].x;
    //     v.y = this.frontPart.vertices[index].y;
    //   });
    //   // Only the front fill is displayed
    //   this.frontFill.visible = true;
    //   this.backFill.visible = false;
    // }

    // // The circle interior is split between front and back
    // if (backCircleLen !== 0 && frontCircleLen !== 0) {
    //   //} && this.arcRadius < Math.PI / 2) {
    //   //find the angular width of the part of the boundary circle to be copied
    //   // Compute the angle from the positive x axis to the last frontPartVertex
    //   const startAngle = Math.atan2(
    //     this.frontPart.vertices[frontCircleLen - 1].y,
    //     this.frontPart.vertices[frontCircleLen - 1].x
    //   );

    //   // Compute the angle from the positive x axis to the first frontPartVertex
    //   const endAngle = Math.atan2(
    //     this.frontPart.vertices[0].y,
    //     this.frontPart.vertices[0].x
    //   );

    //   // Compute the angular width of the section of the boundary circle to add to the front/back fill
    //   // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
    //   let angularWidth = endAngle - startAngle;
    //   if (angularWidth < 0) {
    //     angularWidth += 2 * Math.PI;
    //   }
    //   //console.log(angularWidth);
    //   // When tracing the boundary circle we start from fromVector = this.frontPart.vertices[frontCircleLen - 1]
    //   const fromVector = new Two.Vector(
    //     this.frontPart.vertices[frontCircleLen - 1].x,
    //     this.frontPart.vertices[frontCircleLen - 1].y
    //   );
    //   // then
    //   // trace in the direction of a toVector that is perpendicular to this.frontPart.vertices[frontCircleLen - 1]
    //   // and points in the same direction as this.frontPart.vertices[0]
    //   const toVector = new Two.Vector(
    //     -this.frontPart.vertices[frontCircleLen - 1].y,
    //     this.frontPart.vertices[frontCircleLen - 1].x
    //   );
    //   if (toVector.dot(this.frontPart.vertices[0]) < 0) {
    //     toVector.multiplyScalar(-1);
    //   }

    //   // If the arcRadius is bigger than Pi/2 then reverse the toVector
    //   if (this._circleRadius > Math.PI / 2) {
    //     toVector.multiplyScalar(-1);
    //   }

    //   // Build the frontFill
    //   // First copy the frontPart into the first part of the frontFill
    //   this.frontFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     if (index < frontCircleLen) {
    //       v.x = this.frontPart.vertices[index].x;
    //       v.y = this.frontPart.vertices[index].y;
    //     } else {
    //       const angle =
    //         (angularWidth / (SUBDIVISIONS - 1 - frontCircleLen)) *
    //         (index - frontCircleLen);
    //       v.x = Math.cos(angle) * fromVector.x + Math.sin(angle) * toVector.x;
    //       v.y = Math.cos(angle) * fromVector.y + Math.sin(angle) * toVector.y;
    //     }
    //   });

    //   // Build the backFill
    //   // First copy the backPart into the first part of the backFill
    //   this.backFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     if (index < backCircleLen) {
    //       v.x = this.backPart.vertices[backCircleLen - 1 - index].x;
    //       v.y = this.backPart.vertices[backCircleLen - 1 - index].y;
    //     } else {
    //       const angle =
    //         (angularWidth / (SUBDIVISIONS - 1 - backCircleLen)) *
    //         (index - backCircleLen);
    //       v.x = Math.cos(angle) * fromVector.x + Math.sin(angle) * toVector.x;
    //       v.y = Math.cos(angle) * fromVector.y + Math.sin(angle) * toVector.y;
    //     }
    //   });
    //   // console.log("front", frontCircleLen, "back", backCircleLen);

    //   // Display front and back
    //   this.frontFill.visible = true;
    //   this.backFill.visible = true;
    // }

    // // The circle interior is only on the back of the sphere
    // if (frontCircleLen === 0 && this._circleRadius < Math.PI / 2) {
    //   // The circle interior is only on the back of the sphere
    //   // In this case the backFillVertices are the same as the backVertices
    //   this.backFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     v.x = this.backPart.vertices[index].x;
    //     v.y = this.backPart.vertices[index].y;
    //   });
    //   // Only the back fill is displayed
    //   this.frontFill.visible = false;
    //   this.backFill.visible = true;
    // }

    // // The circle interior covers the entire front half of the sphere and is a 'hole' on the back
    // if (frontCircleLen === 0 && this._circleRadius > Math.PI / 2) {
    //   // In this case set the frontFillVertices to the entire front of the sphere
    //   this.frontFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     const angle = (index / SUBDIVISIONS) * 2 * Math.PI;
    //     v.x = SETTINGS.boundaryCircle.radius * Math.cos(angle);
    //     v.y = SETTINGS.boundaryCircle.radius * Math.sin(angle);
    //   });

    //   // In this case the backFillVertices must trace out first the boundary circle and then
    //   //  the circle, to trace an annular region.  To help with the rendering, start tracing
    //   //  the boundary circle directly across from the vertex on the circle at index zero
    //   const backStartTrace = Math.atan2(
    //     this.backPart.vertices[0].y,
    //     this.backPart.vertices[0].x
    //   );

    //   this.backFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     if (index <= Math.floor(SUBDIVISIONS / 2) - 2) {
    //       const angle = -((2 * index) / SUBDIVISIONS) * 2 * Math.PI; //must trace in the opposite direction on the back to render the annular region
    //       v.x =
    //         SETTINGS.boundaryCircle.radius * Math.cos(angle + backStartTrace);
    //       v.y =
    //         SETTINGS.boundaryCircle.radius * Math.sin(angle + backStartTrace);
    //       //console.log(index, angle);
    //     } else if (index == Math.floor(SUBDIVISIONS / 2) - 1) {
    //       //make sure the last point on the boundary is the same as the first
    //       v.x = SETTINGS.boundaryCircle.radius * Math.cos(0 + backStartTrace);
    //       v.y = SETTINGS.boundaryCircle.radius * Math.sin(0 + backStartTrace);
    //       //console.log(index, 0);
    //     } else if (
    //       Math.floor(SUBDIVISIONS / 2) <= index &&
    //       index <= SUBDIVISIONS - 2
    //     ) {
    //       v.x = this.backPart.vertices[
    //         2 * (index - Math.floor(SUBDIVISIONS / 2))
    //       ].x;
    //       v.y = this.backPart.vertices[
    //         2 * (index - Math.floor(SUBDIVISIONS / 2))
    //       ].y;
    //       //console.log(index, Math.atan2(v.y, v.x));
    //     } else if (index == SUBDIVISIONS - 1) {
    //       // make sure the last point on the (inner) circle is the same as the first
    //       v.x = this.backPart.vertices[0].x;
    //       v.y = this.backPart.vertices[0].y;
    //       //console.log(index, Math.atan2(v.y, v.x));
    //     }
    //   });

    //   // Both front/back fill are displayed
    //   this.frontFill.visible = true;
    //   this.backFill.visible = true;
    // }

    // // The circle interior covers the entire back half of the sphere and is a 'hole' on the front
    // if (backCircleLen === 0 && this._circleRadius > Math.PI / 2) {
    //   // In this case set the frontFillVertices to the entire front of the sphere
    //   this.backFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     const angle = (index / SUBDIVISIONS) * 2 * Math.PI;
    //     v.x = SETTINGS.boundaryCircle.radius * Math.cos(angle);
    //     v.y = SETTINGS.boundaryCircle.radius * Math.sin(angle);
    //   });

    //   // In this case the backFillVertices must trace out first the boundary circle and then
    //   //  the circle, to trace an annular region.  To help with the rendering, start tracing
    //   //  the boundary circle directly across from the vertex on the circle at index zero
    //   const frontStartTrace = Math.atan2(
    //     this.frontPart.vertices[0].y,
    //     this.frontPart.vertices[0].x
    //   );

    //   this.frontFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     if (index <= Math.floor(SUBDIVISIONS / 2) - 2) {
    //       const angle = ((2 * index) / SUBDIVISIONS) * 2 * Math.PI;
    //       v.x =
    //         SETTINGS.boundaryCircle.radius * Math.cos(angle + frontStartTrace);
    //       v.y =
    //         SETTINGS.boundaryCircle.radius * Math.sin(angle + frontStartTrace);
    //     } else if (index == Math.floor(SUBDIVISIONS / 2) - 1) {
    //       //make sure the last point on the boundary is the same as the first
    //       v.x = SETTINGS.boundaryCircle.radius * Math.cos(0 + frontStartTrace);
    //       v.y = SETTINGS.boundaryCircle.radius * Math.sin(0 + frontStartTrace);
    //     } else if (
    //       Math.floor(SUBDIVISIONS / 2) <= index &&
    //       index <= SUBDIVISIONS - 2
    //     ) {
    //       v.x = this.frontPart.vertices[
    //         2 * (index - Math.floor(SUBDIVISIONS / 2))
    //       ].x;
    //       v.y = this.frontPart.vertices[
    //         2 * (index - Math.floor(SUBDIVISIONS / 2))
    //       ].y;
    //     } else if (index == SUBDIVISIONS - 1) {
    //       // make sure the last point on the (inner) circle is the same as the first
    //       v.x = this.frontPart.vertices[0].x;
    //       v.y = this.frontPart.vertices[0].y;
    //     }
    //   });

    //   // Both front/back fill are displayed
    //   this.frontFill.visible = true;
    //   this.backFill.visible = true;
    // }
  }
  /**
   * pt1 and pt2 are points on the boundary of the display circle
   * this method returns an ordered list of numPoints points from pt1 to pt2 along the
   * boundary circle so that that the angle subtended at the origin between
   * any two of them is equal and equal to the angle between the first returned to pt1 and
   * equal to the angle between the last returned and pt2
   */
  private boundryCircleCoordinates(
    pt1: number[],
    pt2: number[],
    numPoints: number
  ): number[] {
    // first use atan2 to figure out the angle from pt1 to pt2
    const angularLength = Math.atan2();
    return [];
  }

  /**
   * Set the vertex/start/end vectors of the angle marker plottable.
   */
  set vertexVector(newVertex: Vector3) {
    this._vertexVector.copy(newVertex);
  }
  get vertexVector(): Vector3 {
    return this._vertexVector;
  }
  set startVector(newStartVector: Vector3) {
    this._startVector.copy(newStartVector);
  }
  get startVector(): Vector3 {
    return this._startVector;
  }
  set endVector(newEndVector: Vector3) {
    this._endVector.copy(newEndVector);
  }
  get endVector(): Vector3 {
    return this._endVector;
  }
  get angleMarkerRadius(): number {
    return this._angleMarkerRadius;
  }

  /**
   * Use this method to set the display of the angle marker using three vectors. The angle from vertex to start is *not* necessary the
   * the same aa the angle form vertex to end. This method sets the _vertex, _start, _end vectors (all non-zero and unit) so that
   *  1) angle(_vertex,_start) = angle (_vertex,_end) = angleMarkerRadius
   *  2) _vertex, _start, start are all co-planar (and in this plane, when divided by the line containing _vertex, _start & start are on the same side)
   *  3) _vertex, _end, end are all co-planar (and in this plane, when divided by the line containing _vertex, _end & end are on the same side)
   * @param startVector The *direction* of the start of the angleMarker from tempVertex (assume not parallel with tempVertex)
   * @param vertexVector The vertex of the angle Marker
   * @param endVector The *direction* of the end of the angleMarker from tempVertex (assume not parallel with tempVertex)
   * @param angleMarkerRadius The radius of the angleMarker
   * @returns returns the _start,_vertex,_end vectors and sets those same vectors in AngleMarker
   */
  public setAngleMarkerFromThreeVectors(
    startVector: Vector3,
    vertexVector: Vector3,
    endVector: Vector3,
    angleMarkerRadius: number
  ): Vector3[] {
    // In this case the parents are three points and we have already checked that the (1st and 2nd) and (2nd and 3rd) are not the same or antipodal
    // The vertex of the angle marker is the second selected one
    this._vertexVector.copy(vertexVector).normalize();

    // Create a orthonormal frame using the first and second parent points to set the startVector
    this.tmpVector.crossVectors(this._vertexVector, startVector).normalize(); // tmpVector is now perpendicular to the plane containing the first and second parent vectors
    this.tmpVector.crossVectors(this.tmpVector, this._vertexVector).normalize(); // tmpVector is now perpendicular to the vertexVector and in the plane containing the first(start) and second(vertex) parent vectors

    // Now set the _startVector
    this._startVector.set(0, 0, 0);
    this._startVector.addScaledVector(
      this._vertexVector,
      Math.cos(angleMarkerRadius)
    );
    this._startVector
      .addScaledVector(this.tmpVector, Math.sin(angleMarkerRadius))
      .normalize();

    // Create a orthonormal frame using the third and second parent points to set the endVector
    this.tmpVector.crossVectors(this._vertexVector, endVector).normalize(); // tmpVector is now perpendicular to the plane containing the first and third parent vectors
    this.tmpVector.crossVectors(this.tmpVector, this._vertexVector).normalize(); // tmpVector is now perpendicular to the vertexVector and in the plane containing the first and third parent vectors

    // Now set the _endVector
    this._endVector.set(0, 0, 0);
    this._endVector.addScaledVector(
      this._vertexVector,
      Math.cos(angleMarkerRadius)
    );
    this._endVector
      .addScaledVector(this.tmpVector, Math.sin(angleMarkerRadius))
      .normalize();
    return [this._startVector, this._vertexVector, this._endVector];
  }

  frontGlowingDisplay(): void {
    this.frontCirclePathStart.visible = true;
    this.frontCirclePathTail.visible = true;
    this.frontStraightStart.visible = true;
    this.frontStraightEnd.visible = true;
    this.glowingFrontCirclePathStart.visible = true;
    this.glowingFrontCirclePathTail.visible = true;
    this.glowingFrontStraightStart.visible = true;
    this.glowingFrontStraightEnd.visible = true;
    if (this._angleMarkerDoubleArc) {
      this.frontCirclePathDoubleArcStart.visible = true;
      this.frontCirclePathDoubleArcTail.visible = true;
      this.glowingFrontCirclePathDoubleArcStart.visible = true;
      this.glowingFrontCirclePathDoubleArcTail.visible = true;
    } else {
      this.frontCirclePathDoubleArcStart.visible = false;
      this.frontCirclePathDoubleArcTail.visible = false;
      this.glowingFrontCirclePathDoubleArcStart.visible = false;
      this.glowingFrontCirclePathDoubleArcTail.visible = false;
    }
  }
  backGlowingDisplay(): void {
    this.backCirclePathStart.visible = true;
    this.backCirclePathTail.visible = true;
    this.backStraightStart.visible = true;
    this.backStraightEnd.visible = true;
    this.glowingBackCirclePathStart.visible = true;
    this.glowingBackCirclePathTail.visible = true;
    this.glowingBackStraightStart.visible = true;
    this.glowingBackStraightEnd.visible = true;
    if (this._angleMarkerDoubleArc) {
      this.backCirclePathDoubleArcStart.visible = true;
      this.backCirclePathDoubleArcTail.visible = true;
      this.glowingBackCirclePathDoubleArcStart.visible = true;
      this.glowingBackCirclePathDoubleArcTail.visible = true;
    } else {
      this.backCirclePathDoubleArcStart.visible = false;
      this.backCirclePathDoubleArcTail.visible = false;
      this.glowingBackCirclePathDoubleArcStart.visible = false;
      this.glowingBackCirclePathDoubleArcTail.visible = false;
    }
  }
  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }
  frontNormalDisplay(): void {
    this.frontCirclePathStart.visible = true;
    this.frontCirclePathTail.visible = true;
    this.frontStraightStart.visible = true;
    this.frontStraightEnd.visible = true;
    this.glowingFrontCirclePathStart.visible = false;
    this.glowingFrontCirclePathTail.visible = false;
    this.glowingFrontStraightStart.visible = false;
    this.glowingFrontStraightEnd.visible = false;
    if (this._angleMarkerDoubleArc) {
      this.frontCirclePathDoubleArcStart.visible = true;
      this.frontCirclePathDoubleArcTail.visible = true;
      this.glowingFrontCirclePathDoubleArcStart.visible = false;
      this.glowingFrontCirclePathDoubleArcTail.visible = false;
    } else {
      this.frontCirclePathDoubleArcStart.visible = false;
      this.frontCirclePathDoubleArcTail.visible = false;
      this.glowingFrontCirclePathDoubleArcStart.visible = false;
      this.glowingFrontCirclePathDoubleArcTail.visible = false;
    }
  }
  backNormalDisplay(): void {
    this.backCirclePathStart.visible = true;
    this.backCirclePathTail.visible = true;
    this.backStraightStart.visible = true;
    this.backStraightEnd.visible = true;
    this.glowingBackCirclePathStart.visible = false;
    this.glowingBackCirclePathTail.visible = false;
    this.glowingBackStraightStart.visible = false;
    this.glowingBackStraightEnd.visible = false;
    if (this._angleMarkerDoubleArc) {
      this.backCirclePathDoubleArcStart.visible = true;
      this.backCirclePathDoubleArcTail.visible = true;
      this.glowingBackCirclePathDoubleArcStart.visible = false;
      this.glowingBackCirclePathDoubleArcTail.visible = false;
    } else {
      this.backCirclePathDoubleArcStart.visible = false;
      this.backCirclePathDoubleArcTail.visible = false;
      this.glowingBackCirclePathDoubleArcStart.visible = false;
      this.glowingBackCirclePathDoubleArcTail.visible = false;
    }
  }
  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }
  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontCirclePathStart.visible = false;
      this.frontCirclePathTail.visible = false;
      this.backCirclePathStart.visible = false;
      this.backCirclePathTail.visible = false;

      this.frontStraightStart.visible = false;
      this.frontStraightEnd.visible = false;
      this.backStraightStart.visible = false;
      this.backStraightEnd.visible = false;

      this.frontCirclePathDoubleArcStart.visible = false;
      this.frontCirclePathDoubleArcTail.visible = false;
      this.backCirclePathDoubleArcStart.visible = false;
      this.backCirclePathDoubleArcTail.visible = false;

      this.glowingFrontCirclePathStart.visible = false;
      this.glowingFrontCirclePathTail.visible = false;
      this.glowingBackCirclePathStart.visible = false;
      this.glowingBackCirclePathTail.visible = false;

      this.glowingFrontStraightStart.visible = false;
      this.glowingFrontStraightEnd.visible = false;
      this.glowingBackStraightStart.visible = false;
      this.glowingBackStraightEnd.visible = false;

      this.glowingFrontCirclePathDoubleArcStart.visible = false;
      this.glowingFrontCirclePathDoubleArcTail.visible = false;
      this.glowingBackCirclePathDoubleArcStart.visible = false;
      this.glowingBackCirclePathDoubleArcTail.visible = false;
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
      this.glowingStrokeColorFront =
        SETTINGS.angleMarker.glowing.strokeColor.front;
      this.glowingStrokeColorBack =
        SETTINGS.angleMarker.glowing.strokeColor.back;
    }
    // apply the new color variables to the object
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }
  /**
   * This method is used to copy the temporary angleMarker created with the Angle Tool (in the midground) into a
   * permanent one in the scene (in the the correct layer).
   */
  clone(): this {
    // Use the constructor for this class to create a template to copy over the
    // values from the current (the `this`) Angle Marker object
    const dup = new AngleMarker();
    dup._vertexVector.copy(this._vertexVector);
    dup._startVector.copy(this._startVector);
    dup._endVector.copy(this._endVector);

    // Duplicate the important non-glowing path properties
    dup.frontCirclePathStart.rotation = this.frontCirclePathStart.rotation;
    dup.frontCirclePathStart.translation.copy(
      this.frontCirclePathStart.translation
    );
    dup.backCirclePathStart.rotation = this.backCirclePathStart.rotation;
    dup.backCirclePathStart.translation.copy(
      this.backCirclePathStart.translation
    );
    dup.glowingFrontCirclePathStart.rotation = this.glowingFrontCirclePathStart.rotation;
    dup.glowingFrontCirclePathStart.translation.copy(
      this.glowingFrontCirclePathStart.translation
    );
    dup.glowingBackCirclePathStart.rotation = this.glowingBackCirclePathStart.rotation;
    dup.glowingBackCirclePathStart.translation.copy(
      this.glowingBackCirclePathStart.translation
    );

    dup.frontStraightStart.rotation = this.frontStraightStart.rotation;
    dup.frontStraightStart.translation.copy(
      this.frontStraightStart.translation
    );
    dup.backStraightStart.rotation = this.backStraightStart.rotation;
    dup.backStraightStart.translation.copy(this.backStraightStart.translation);
    dup.glowingFrontStraightStart.rotation = this.glowingFrontStraightStart.rotation;
    dup.glowingFrontStraightStart.translation.copy(
      this.glowingFrontStraightStart.translation
    );
    dup.glowingBackStraightStart.rotation = this.glowingBackStraightStart.rotation;
    dup.glowingBackStraightStart.translation.copy(
      this.glowingBackStraightStart.translation
    );

    dup.frontCirclePathDoubleArcStart.rotation = this.frontCirclePathDoubleArcStart.rotation;
    dup.frontCirclePathDoubleArcStart.translation.copy(
      this.frontCirclePathDoubleArcStart.translation
    );
    dup.backCirclePathDoubleArcStart.rotation = this.backCirclePathDoubleArcStart.rotation;
    dup.backCirclePathDoubleArcStart.translation.copy(
      this.backCirclePathDoubleArcStart.translation
    );
    dup.glowingFrontCirclePathDoubleArcStart.rotation = this.glowingFrontCirclePathDoubleArcStart.rotation;
    dup.glowingFrontCirclePathDoubleArcStart.translation.copy(
      this.glowingFrontCirclePathDoubleArcStart.translation
    );
    dup.glowingBackCirclePathDoubleArcStart.rotation = this.glowingBackCirclePathDoubleArcStart.rotation;
    dup.glowingBackCirclePathDoubleArcStart.translation.copy(
      this.glowingBackCirclePathDoubleArcStart.translation
    );

    dup.frontCirclePathTail.rotation = this.frontCirclePathTail.rotation;
    dup.frontCirclePathTail.translation.copy(
      this.frontCirclePathTail.translation
    );
    dup.backCirclePathTail.rotation = this.backCirclePathTail.rotation;
    dup.backCirclePathTail.translation.copy(
      this.backCirclePathTail.translation
    );
    dup.glowingFrontCirclePathTail.rotation = this.glowingFrontCirclePathTail.rotation;
    dup.glowingFrontCirclePathTail.translation.copy(
      this.glowingFrontCirclePathTail.translation
    );
    dup.glowingBackCirclePathTail.rotation = this.glowingBackCirclePathTail.rotation;
    dup.glowingBackCirclePathTail.translation.copy(
      this.glowingBackCirclePathTail.translation
    );

    dup.frontStraightEnd.rotation = this.frontStraightEnd.rotation;
    dup.frontStraightEnd.translation.copy(this.frontStraightEnd.translation);
    dup.backStraightEnd.rotation = this.backStraightEnd.rotation;
    dup.backStraightEnd.translation.copy(this.backStraightEnd.translation);
    dup.glowingFrontStraightEnd.rotation = this.glowingFrontStraightEnd.rotation;
    dup.glowingFrontStraightEnd.translation.copy(
      this.glowingFrontStraightEnd.translation
    );
    dup.glowingBackStraightEnd.rotation = this.glowingBackStraightEnd.rotation;
    dup.glowingBackStraightEnd.translation.copy(
      this.glowingBackStraightEnd.translation
    );

    dup.frontCirclePathDoubleArcTail.rotation = this.frontCirclePathDoubleArcTail.rotation;
    dup.frontCirclePathDoubleArcTail.translation.copy(
      this.frontCirclePathDoubleArcTail.translation
    );
    dup.backCirclePathDoubleArcTail.rotation = this.backCirclePathDoubleArcTail.rotation;
    dup.backCirclePathDoubleArcTail.translation.copy(
      this.backCirclePathDoubleArcTail.translation
    );
    dup.glowingFrontCirclePathDoubleArcTail.rotation = this.glowingFrontCirclePathDoubleArcTail.rotation;
    dup.glowingFrontCirclePathDoubleArcTail.translation.copy(
      this.glowingFrontCirclePathDoubleArcTail.translation
    );
    dup.glowingBackCirclePathDoubleArcTail.rotation = this.glowingBackCirclePathDoubleArcTail.rotation;
    dup.glowingBackCirclePathDoubleArcTail.translation.copy(
      this.glowingBackCirclePathDoubleArcTail.translation
    );

    // The clone (i.e. dup) initially has equal number of vertices for the front and back path
    //  so adjust to match `this`. If one of the this.front or this.back has more vertices then
    //  the corresponding dup part, then remove the excess vertices from the one with more and
    //  move them to the other.

    // First add (if necessary) vertices to the frontCirclePath from the backCirclePath
    while (
      dup.frontCirclePathStart.vertices.length >
      this.frontCirclePathStart.vertices.length
    ) {
      // Transfer from frontPath to backPath
      dup.backCirclePathStart.vertices.push(
        dup.frontCirclePathStart.vertices.pop()!
      );
      dup.glowingBackCirclePathStart.vertices.push(
        dup.glowingFrontCirclePathStart.vertices.pop()!
      );
    }

    while (
      dup.frontStraightStart.vertices.length >
      this.frontStraightStart.vertices.length
    ) {
      // Transfer from frontPath to backPath
      dup.backStraightStart.vertices.push(
        dup.frontStraightStart.vertices.pop()!
      );
      dup.glowingBackStraightStart.vertices.push(
        dup.glowingFrontStraightStart.vertices.pop()!
      );
    }

    while (
      dup.frontCirclePathDoubleArcStart.vertices.length >
      this.frontCirclePathDoubleArcStart.vertices.length
    ) {
      // Transfer from frontPath to backPath
      dup.backCirclePathDoubleArcStart.vertices.push(
        dup.frontCirclePathDoubleArcStart.vertices.pop()!
      );
      dup.glowingBackCirclePathDoubleArcStart.vertices.push(
        dup.glowingFrontCirclePathDoubleArcStart.vertices.pop()!
      );
    }

    while (
      dup.frontCirclePathTail.vertices.length >
      this.frontCirclePathTail.vertices.length
    ) {
      // Transfer from frontPath to backPath
      dup.backCirclePathTail.vertices.push(
        dup.frontCirclePathTail.vertices.pop()!
      );
      dup.glowingBackCirclePathTail.vertices.push(
        dup.glowingFrontCirclePathTail.vertices.pop()!
      );
    }

    while (
      dup.frontStraightEnd.vertices.length >
      this.frontStraightEnd.vertices.length
    ) {
      // Transfer from frontPath to backPath
      dup.backStraightEnd.vertices.push(dup.frontStraightEnd.vertices.pop()!);
      dup.glowingBackStraightEnd.vertices.push(
        dup.glowingFrontStraightEnd.vertices.pop()!
      );
    }

    while (
      dup.frontCirclePathDoubleArcTail.vertices.length >
      this.frontCirclePathDoubleArcTail.vertices.length
    ) {
      // Transfer from frontPath to backPath
      dup.backCirclePathDoubleArcTail.vertices.push(
        dup.frontCirclePathDoubleArcTail.vertices.pop()!
      );
      dup.glowingBackCirclePathDoubleArcTail.vertices.push(
        dup.glowingFrontCirclePathDoubleArcTail.vertices.pop()!
      );
    }

    // Second remove (if necessary) vertices from the frontCirclePath to backCirclePath
    while (
      dup.frontCirclePathStart.vertices.length <
      this.frontCirclePathStart.vertices.length
    ) {
      // Transfer from backPath to frontPath
      dup.frontCirclePathStart.vertices.push(
        dup.backCirclePathStart.vertices.pop()!
      );
      dup.glowingFrontCirclePathStart.vertices.push(
        dup.glowingBackCirclePathStart.vertices.pop()!
      );
    }

    while (
      dup.frontStraightStart.vertices.length <
      this.frontStraightStart.vertices.length
    ) {
      // Transfer from backPath to frontPath
      dup.frontStraightStart.vertices.push(
        dup.backStraightStart.vertices.pop()!
      );
      dup.glowingFrontStraightStart.vertices.push(
        dup.glowingBackStraightStart.vertices.pop()!
      );
    }

    while (
      dup.frontCirclePathDoubleArcStart.vertices.length <
      this.frontCirclePathDoubleArcStart.vertices.length
    ) {
      // Transfer from backPath to frontPath
      dup.frontCirclePathDoubleArcStart.vertices.push(
        dup.backCirclePathDoubleArcStart.vertices.pop()!
      );
      dup.glowingFrontCirclePathDoubleArcStart.vertices.push(
        dup.glowingBackCirclePathDoubleArcStart.vertices.pop()!
      );
    }

    while (
      dup.frontCirclePathTail.vertices.length <
      this.frontCirclePathTail.vertices.length
    ) {
      // Transfer from backPath to frontPath
      dup.frontCirclePathTail.vertices.push(
        dup.backCirclePathTail.vertices.pop()!
      );
      dup.glowingFrontCirclePathTail.vertices.push(
        dup.glowingBackCirclePathTail.vertices.pop()!
      );
    }

    while (
      dup.frontStraightEnd.vertices.length <
      this.frontStraightEnd.vertices.length
    ) {
      // Transfer from backPath to frontPath
      dup.frontStraightEnd.vertices.push(dup.backStraightEnd.vertices.pop()!);
      dup.glowingFrontStraightEnd.vertices.push(
        dup.glowingBackStraightEnd.vertices.pop()!
      );
    }

    while (
      dup.frontCirclePathDoubleArcTail.vertices.length <
      this.frontCirclePathDoubleArcTail.vertices.length
    ) {
      // Transfer from backPath to frontPath
      dup.frontCirclePathDoubleArcTail.vertices.push(
        dup.backCirclePathDoubleArcTail.vertices.pop()!
      );
      dup.glowingFrontCirclePathDoubleArcTail.vertices.push(
        dup.glowingBackCirclePathDoubleArcTail.vertices.pop()!
      );
    }

    // Now we know that the dup.bach/front CirclePath start/tail and this.back/front CirclePath start/tail have the same length

    // After the above statements execute this.front/back/start/tail and dup.front/back/start/tail are the same length

    // Now we can copy the vertices from the this.front/back start/tail to the dup.front/back start/tail
    dup.frontCirclePathStart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.frontCirclePathStart.vertices[pos]);
    });
    dup.backCirclePathStart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.backCirclePathStart.vertices[pos]);
    });
    dup.glowingFrontCirclePathStart.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingFrontCirclePathStart.vertices[pos]);
      }
    );
    dup.glowingBackCirclePathStart.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingBackCirclePathStart.vertices[pos]);
      }
    );

    dup.frontStraightStart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.frontStraightStart.vertices[pos]);
    });
    dup.backStraightStart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.backCirclePathStart.vertices[pos]);
    });
    dup.glowingFrontStraightStart.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingFrontStraightStart.vertices[pos]);
      }
    );
    dup.glowingBackStraightStart.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingBackStraightStart.vertices[pos]);
      }
    );

    dup.frontCirclePathDoubleArcStart.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.frontCirclePathDoubleArcStart.vertices[pos]);
      }
    );
    dup.backCirclePathDoubleArcStart.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.backCirclePathDoubleArcStart.vertices[pos]);
      }
    );
    dup.glowingFrontCirclePathDoubleArcStart.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingFrontCirclePathDoubleArcStart.vertices[pos]);
      }
    );
    dup.glowingBackCirclePathDoubleArcStart.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingBackCirclePathDoubleArcStart.vertices[pos]);
      }
    );

    dup.frontCirclePathTail.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.frontCirclePathTail.vertices[pos]);
    });
    dup.backCirclePathTail.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.backCirclePathTail.vertices[pos]);
    });
    dup.glowingFrontCirclePathTail.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingFrontCirclePathTail.vertices[pos]);
      }
    );
    dup.glowingBackCirclePathTail.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingBackCirclePathTail.vertices[pos]);
      }
    );

    dup.frontStraightEnd.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.frontStraightEnd.vertices[pos]);
    });
    dup.backStraightEnd.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.backStraightEnd.vertices[pos]);
    });
    dup.glowingFrontStraightEnd.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingFrontStraightEnd.vertices[pos]);
      }
    );
    dup.glowingBackStraightEnd.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingBackStraightEnd.vertices[pos]);
      }
    );

    dup.frontCirclePathDoubleArcTail.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.frontCirclePathDoubleArcTail.vertices[pos]);
      }
    );
    dup.backCirclePathDoubleArcTail.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.backCirclePathDoubleArcTail.vertices[pos]);
      }
    );
    dup.glowingFrontCirclePathDoubleArcTail.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingFrontCirclePathDoubleArcTail.vertices[pos]);
      }
    );
    dup.glowingBackCirclePathDoubleArcTail.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingBackCirclePathDoubleArcTail.vertices[pos]);
      }
    );

    // //Clone the front/back fill
    // dup.frontFill.vertices.forEach((v: Two.Anchor, pos: number) => {
    //   v.copy(this.frontFill.vertices[pos]);
    // });
    // dup.backFill.vertices.forEach((v: Two.Anchor, pos: number) => {
    //   v.copy(this.backFill.vertices[pos]);
    // });
    // // Clone the visibility of the front/back fill
    // dup.frontFill.visible = this.frontFill.visible;
    // dup.backFill.visible = this.backFill.visible;

    return dup as this;
  }
  /**
   * Adds the front/back/glowing/not parts to the correct layers
   * @param layers
   */
  addToLayers(layers: Two.Group[]): void {
    // These must always be executed even if the front/back part is empty
    // Otherwise when they become non-empty they are not displayed
    // this.frontFill.addTo(layers[LAYER.foreground]);
    this.frontCirclePathStart.addTo(layers[LAYER.foregroundAngleMarkers]);
    this.glowingFrontCirclePathStart.addTo(
      layers[LAYER.foregroundAngleMarkersGlowing]
    );
    this.frontStraightStart.addTo(layers[LAYER.foregroundAngleMarkers]);
    this.glowingFrontStraightStart.addTo(
      layers[LAYER.foregroundAngleMarkersGlowing]
    );
    this.frontCirclePathDoubleArcStart.addTo(
      layers[LAYER.foregroundAngleMarkers]
    );
    this.glowingFrontCirclePathDoubleArcStart.addTo(
      layers[LAYER.foregroundAngleMarkersGlowing]
    );
    // this.backFill.addTo(layers[LAYER.background]);
    this.backCirclePathStart.addTo(layers[LAYER.backgroundAngleMarkers]);
    this.glowingBackCirclePathStart.addTo(
      layers[LAYER.backgroundAngleMarkersGlowing]
    );
    this.backStraightStart.addTo(layers[LAYER.backgroundAngleMarkers]);
    this.glowingBackStraightStart.addTo(
      layers[LAYER.backgroundAngleMarkersGlowing]
    );
    this.backCirclePathDoubleArcStart.addTo(
      layers[LAYER.backgroundAngleMarkers]
    );
    this.glowingBackCirclePathDoubleArcStart.addTo(
      layers[LAYER.backgroundAngleMarkersGlowing]
    );

    this.frontCirclePathTail.addTo(layers[LAYER.foregroundAngleMarkers]);
    this.glowingFrontCirclePathTail.addTo(
      layers[LAYER.foregroundAngleMarkersGlowing]
    );
    this.frontStraightEnd.addTo(layers[LAYER.foregroundAngleMarkers]);
    this.glowingFrontStraightEnd.addTo(
      layers[LAYER.foregroundAngleMarkersGlowing]
    );
    this.frontCirclePathDoubleArcTail.addTo(
      layers[LAYER.foregroundAngleMarkers]
    );
    this.glowingFrontCirclePathDoubleArcTail.addTo(
      layers[LAYER.foregroundAngleMarkersGlowing]
    );
    // this.backFill.addTo(layers[LAYER.background]);
    this.backCirclePathTail.addTo(layers[LAYER.backgroundAngleMarkers]);
    this.glowingBackCirclePathTail.addTo(
      layers[LAYER.backgroundAngleMarkersGlowing]
    );
    this.backStraightEnd.addTo(layers[LAYER.backgroundAngleMarkers]);
    this.glowingBackStraightEnd.addTo(
      layers[LAYER.backgroundAngleMarkersGlowing]
    );
    this.backCirclePathDoubleArcTail.addTo(
      layers[LAYER.backgroundAngleMarkers]
    );
    this.glowingBackCirclePathDoubleArcTail.addTo(
      layers[LAYER.backgroundAngleMarkersGlowing]
    );
  }
  removeFromLayers(): void {
    this.frontCirclePathStart.remove();
    this.frontCirclePathDoubleArcStart.remove();
    // this.frontFill.remove();
    this.glowingFrontCirclePathStart.remove();
    this.glowingFrontCirclePathDoubleArcStart.remove();
    this.backCirclePathStart.remove();
    this.backCirclePathDoubleArcStart.remove();
    // this.backFill.remove();
    this.glowingBackCirclePathStart.remove();
    this.glowingBackCirclePathDoubleArcStart.remove();

    this.frontCirclePathTail.remove();
    this.frontCirclePathDoubleArcTail.remove();
    this.glowingFrontCirclePathTail.remove();
    this.glowingFrontCirclePathDoubleArcTail.remove();
    this.backCirclePathTail.remove();
    this.backCirclePathDoubleArcTail.remove();
    this.glowingBackCirclePathTail.remove();
    this.glowingBackCirclePathDoubleArcTail.remove();

    this.frontStraightStart.remove();
    this.glowingFrontStraightStart.remove();
    this.backStraightStart.remove();
    this.glowingBackStraightStart.remove();

    this.frontStraightEnd.remove();
    this.glowingFrontStraightEnd.remove();
    this.backStraightEnd.remove();
    this.glowingBackStraightEnd.remove();
  }
  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * Two.js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(options: StyleOptions): void {
    console.debug("Angle Marker Update style of", this.name, "using", options);
    if (options.angleMarkerRadiusPercent !== undefined) {
      this._angleMarkerRadiusPercent = options.angleMarkerRadiusPercent;
    }

    if (options.angleMarkerTickMark !== undefined) {
      this._angleMarkerTickMark = options.angleMarkerTickMark;
    }

    if (options.angleMarkerDoubleArc !== undefined) {
      this._angleMarkerDoubleArc = options.angleMarkerDoubleArc;
    }

    if (options.panel === StyleEditPanels.Front) {
      // Set the front options
      if (options.strokeWidthPercent !== undefined) {
        this.strokeWidthPercentFront = options.strokeWidthPercent;
      }
      if (options.fillColor !== undefined) {
        this.fillColorFront = options.fillColor;
      }
      if (options.strokeColor !== undefined) {
        this.strokeColorFront = options.strokeColor;
      }
      if (options.dashArray !== undefined) {
        this.dashArrayFront.clear();
        for (let i = 0; i < options.dashArray.length; i++) {
          this.dashArrayFront.push(options.dashArray[i]);
        }
      }
    } else if (options.panel == StyleEditPanels.Back) {
      // Set the back options
      // options.dynamicBackStyle is boolean, so we need to explicitly check for undefined otherwise
      // when it is false, this doesn't execute and this.dynamicBackStyle is not set
      if (options.dynamicBackStyle !== undefined) {
        this.dynamicBackStyle = options.dynamicBackStyle;
      }
      // overwrite the back options only in the case the dynamic style is not enabled
      if (!this.dynamicBackStyle) {
        if (options.strokeWidthPercent !== undefined) {
          this.strokeWidthPercentBack = options.strokeWidthPercent;
        }
        if (options.fillColor !== undefined) {
          this.fillColorBack = options.fillColor;
        }
        if (options.strokeColor !== undefined) {
          this.strokeColorBack = options.strokeColor;
        }
        if (options.dashArray !== undefined) {
          // clear the dashArray
          this.dashArrayBack.clear();
          for (let i = 0; i < options.dashArray.length; i++) {
            this.dashArrayBack.push(options.dashArray[i]);
          }
        }
      }
    }
    // Now apply the style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
  }
  /**
   * Return the current style state
   */
  currentStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        const dashArrayFront = [] as number[];
        if (this.dashArrayFront.length > 0) {
          this.dashArrayFront.forEach(v => dashArrayFront.push(v));
        }
        return {
          panel: panel,
          strokeWidthPercent: this.strokeWidthPercentFront,
          strokeColor: this.strokeColorFront,
          fillColor: this.fillColorFront,
          dashArray: dashArrayFront,
          angleMarkerRadiusPercent: this._angleMarkerRadiusPercent,
          angleMarkerTickMark: this._angleMarkerTickMark,
          angleMarkerDoubleArc: this._angleMarkerDoubleArc
        };
        break;
      }
      case StyleEditPanels.Back: {
        const dashArrayBack = [] as number[];
        if (this.dashArrayBack.length > 0) {
          this.dashArrayBack.forEach(v => dashArrayBack.push(v));
        }
        return {
          panel: panel,
          strokeWidthPercent: this.strokeWidthPercentBack,
          strokeColor: this.strokeColorBack,
          fillColor: this.fillColorBack,
          dashArray: dashArrayBack,
          dynamicBackStyle: this.dynamicBackStyle
          // angleMarkerRadiusPercent: this._angleMarkerRadiusPercent,
          // angleMarkerTickMark: this._angleMarkerTickMark,
          // angleMarkerDoubleArc: this._angleMarkerDoubleArc
        };
      }
      default:
      case StyleEditPanels.Label: {
        return {
          panel: panel
        };
      }
    }
  }
  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        const dashArrayFront = [] as number[];
        if (SETTINGS.angleMarker.drawn.dashArray.front.length > 0) {
          SETTINGS.angleMarker.drawn.dashArray.front.forEach(v =>
            dashArrayFront.push(v)
          );
        }
        return {
          panel: panel,
          strokeWidthPercent: 100,
          fillColor: SETTINGS.angleMarker.drawn.fillColor.front,
          strokeColor: SETTINGS.angleMarker.drawn.strokeColor.front,
          dashArray: dashArrayFront,
          angleMarkerRadiusPercent: 100,
          angleMarkerTickMark: SETTINGS.angleMarker.defaultTickMark,
          angleMarkerDoubleArc: SETTINGS.angleMarker.defaultDoubleArc
        };
      }
      case StyleEditPanels.Back: {
        const dashArrayBack = [] as number[];

        if (SETTINGS.angleMarker.drawn.dashArray.back.length > 0) {
          SETTINGS.angleMarker.drawn.dashArray.back.forEach(v =>
            dashArrayBack.push(v)
          );
        }
        return {
          panel: panel,

          strokeWidthPercent: SETTINGS.angleMarker.dynamicBackStyle
            ? Nodule.contrastStrokeWidthPercent(100)
            : 100,

          strokeColor: SETTINGS.angleMarker.dynamicBackStyle
            ? Nodule.contrastStrokeColor(
                SETTINGS.angleMarker.drawn.strokeColor.front
              )
            : SETTINGS.angleMarker.drawn.strokeColor.back,

          fillColor: SETTINGS.angleMarker.dynamicBackStyle
            ? Nodule.contrastFillColor(
                SETTINGS.angleMarker.drawn.fillColor.front
              )
            : SETTINGS.angleMarker.drawn.fillColor.back,

          dashArray: dashArrayBack,

          dynamicBackStyle: SETTINGS.angleMarker.dynamicBackStyle
        };
      }
      default:
      case StyleEditPanels.Label: {
        return {
          panel: panel
        };
      }
    }
  }
  /**
   * Sets the variables for stroke width glowing/not
   */
  adjustSize(): void {
    this.frontCirclePathStart.linewidth =
      (AngleMarker.currentAngleMarkerCircularStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;

    this.frontCirclePathTail.linewidth =
      (AngleMarker.currentAngleMarkerCircularStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;

    this.frontCirclePathDoubleArcStart.linewidth =
      (AngleMarker.currentAngleMarkerCircularStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;

    this.frontCirclePathDoubleArcTail.linewidth =
      (AngleMarker.currentAngleMarkerCircularStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;

    this.backCirclePathStart.linewidth =
      (AngleMarker.currentAngleMarkerCircularStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;

    this.backCirclePathTail.linewidth =
      (AngleMarker.currentAngleMarkerCircularStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;

    this.backCirclePathDoubleArcStart.linewidth =
      (AngleMarker.currentAngleMarkerCircularStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;

    this.backCirclePathDoubleArcTail.linewidth =
      (AngleMarker.currentAngleMarkerCircularStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;

    this.glowingFrontCirclePathStart.linewidth =
      (AngleMarker.currentGlowingAngleMarkerCircularStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;

    this.glowingFrontCirclePathTail.linewidth =
      (AngleMarker.currentGlowingAngleMarkerCircularStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;

    this.glowingFrontCirclePathDoubleArcStart.linewidth =
      (AngleMarker.currentGlowingAngleMarkerCircularStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;

    this.glowingFrontCirclePathDoubleArcTail.linewidth =
      (AngleMarker.currentGlowingAngleMarkerCircularStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;

    this.glowingBackCirclePathStart.linewidth =
      (AngleMarker.currentGlowingAngleMarkerCircularStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;

    this.glowingBackCirclePathTail.linewidth =
      (AngleMarker.currentGlowingAngleMarkerCircularStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;

    this.glowingBackCirclePathDoubleArcStart.linewidth =
      (AngleMarker.currentGlowingAngleMarkerCircularStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;

    this.glowingBackCirclePathDoubleArcTail.linewidth =
      (AngleMarker.currentGlowingAngleMarkerCircularStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;

    // adjust the radius of the angle marker
    this._angleMarkerRadius =
      (AngleMarker.currentAngleMarkerRadius * this._angleMarkerRadiusPercent) /
      100;

    this._angleMarkerRadiusDoubleArc =
      (AngleMarker.currentAngleMarkerRadiusDoubleArc *
        this._angleMarkerRadiusPercent) /
      100;
    // console.log("AM Radius", this._angleMarkerRadius);
    // recompute the three vectors that determine the angle marker with the new angle marker radius
    this.setAngleMarkerFromThreeVectors(
      this._startVector,
      this._vertexVector,
      this._endVector,
      this._angleMarkerRadius
    );
    // finally update the display
    this.updateDisplay();
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the angle marker
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

        //FRONT
        // if (SETTINGS.angleMarker.temp.fillColor.front === "noFill") {
        //   this.frontFill.noFill();
        // } else {
        //   this.frontGradientColor.color = SETTINGS.angleMarker.temp.fillColor.front;
        //   this.frontFill.fill = this.frontGradient;
        // }
        if (SETTINGS.angleMarker.temp.strokeColor.front === "noStroke") {
          this.frontCirclePathStart.noStroke();
          this.frontCirclePathTail.noStroke();
          this.frontStraightStart.noStroke();
          this.frontStraightEnd.noStroke();
        } else {
          this.frontCirclePathStart.stroke =
            SETTINGS.angleMarker.temp.strokeColor.front;
          this.frontCirclePathTail.stroke =
            SETTINGS.angleMarker.temp.strokeColor.front;
          this.frontStraightStart.stroke =
            SETTINGS.angleMarker.temp.strokeColor.front;
          this.frontStraightEnd.stroke =
            SETTINGS.angleMarker.temp.strokeColor.front;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this.frontCirclePathStart.linewidth =
          AngleMarker.currentAngleMarkerCircularStrokeWidthFront;
        this.frontCirclePathTail.linewidth =
          AngleMarker.currentAngleMarkerCircularStrokeWidthFront;
        this.frontStraightStart.linewidth =
          AngleMarker.currentAngleMarkerStraightStrokeWidthFront;
        this.frontStraightEnd.linewidth =
          AngleMarker.currentAngleMarkerStraightStrokeWidthFront;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.angleMarker.drawn.dashArray.front.length > 0) {
          this.frontCirclePathStart.dashes.clear();
          this.frontCirclePathTail.dashes.clear();
          SETTINGS.angleMarker.drawn.dashArray.front.forEach(v => {
            this.frontCirclePathStart.dashes.push(v);
            this.frontCirclePathTail.dashes.push(v);
          });
        }
        //BACK
        // if (SETTINGS.angleMarker.temp.fillColor.back === "noFill") {
        //   this.backFill.noFill();
        // } else {
        //   this.backGradientColor.color = SETTINGS.angleMarker.temp.fillColor.back;
        //   this.backFill.fill = this.backGradient;
        // }
        if (SETTINGS.angleMarker.temp.strokeColor.back === "noStroke") {
          this.backCirclePathStart.noStroke();
          this.backCirclePathTail.noStroke();
          this.backStraightStart.noStroke();
          this.backStraightEnd.noStroke();
        } else {
          this.backCirclePathStart.stroke =
            SETTINGS.angleMarker.temp.strokeColor.back;
          this.backCirclePathTail.stroke =
            SETTINGS.angleMarker.temp.strokeColor.back;
          this.backStraightStart.stroke =
            SETTINGS.angleMarker.temp.strokeColor.back;
          this.backStraightEnd.stroke =
            SETTINGS.angleMarker.temp.strokeColor.back;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this.backCirclePathStart.linewidth =
          AngleMarker.currentAngleMarkerCircularStrokeWidthBack;
        this.backCirclePathTail.linewidth =
          AngleMarker.currentAngleMarkerCircularStrokeWidthBack;
        this.backStraightStart.linewidth =
          AngleMarker.currentAngleMarkerStraightStrokeWidthBack;
        this.backStraightEnd.linewidth =
          AngleMarker.currentAngleMarkerStraightStrokeWidthBack;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.angleMarker.drawn.dashArray.back.length > 0) {
          this.backCirclePathStart.dashes.clear();
          this.backCirclePathTail.dashes.clear();
          SETTINGS.angleMarker.drawn.dashArray.back.forEach(v => {
            this.backCirclePathStart.dashes.push(v);
            this.backCirclePathTail.dashes.push(v);
          });
        }
        // The temporary display is never highlighted
        this.glowingFrontCirclePathStart.visible = false;
        this.glowingBackCirclePathStart.visible = false;
        this.glowingFrontStraightStart.visible = false;
        this.glowingBackStraightStart.visible = false;
        this.glowingFrontCirclePathDoubleArcStart.visible = false;
        this.glowingBackCirclePathDoubleArcStart.visible = false;

        this.glowingFrontCirclePathTail.visible = false;
        this.glowingBackCirclePathTail.visible = false;
        this.glowingFrontStraightEnd.visible = false;
        this.glowingBackStraightEnd.visible = false;
        this.glowingFrontCirclePathDoubleArcTail.visible = false;
        this.glowingBackCirclePathDoubleArcTail.visible = false;

        //The double arc is never shown in the temporary display
        this.backCirclePathDoubleArcStart.visible = false;
        this.frontCirclePathDoubleArcStart.visible = false;
        this.backCirclePathDoubleArcTail.visible = false;
        this.frontCirclePathDoubleArcTail.visible = false;
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.

        // FRONT
        // if (this.fillColorFront === "noFill") {
        //   this.frontFill.noFill();
        // } else {
        //   this.frontGradientColor.color = this.fillColorFront;
        //   this.frontFill.fill = this.frontGradient;
        // }

        if (this.strokeColorFront === "noStroke") {
          this.frontCirclePathStart.noStroke();
          this.frontStraightStart.noStroke();
          this.frontCirclePathDoubleArcStart.noStroke();
          this.frontCirclePathTail.noStroke();
          this.frontStraightEnd.noStroke();
          this.frontCirclePathDoubleArcTail.noStroke();
        } else {
          this.frontCirclePathStart.stroke = this.strokeColorFront;
          this.frontStraightStart.stroke = this.strokeColorFront;
          this.frontCirclePathDoubleArcStart.stroke = this.strokeColorFront;
          this.frontCirclePathTail.stroke = this.strokeColorFront;
          this.frontStraightEnd.stroke = this.strokeColorFront;
          this.frontCirclePathDoubleArcTail.stroke = this.strokeColorFront;
        }
        // strokeWidthPercent is applied by adjustSize()
        if (this.dashArrayFront.length > 0) {
          this.frontCirclePathStart.dashes.clear();
          this.frontCirclePathDoubleArcStart.dashes.clear();
          this.frontCirclePathTail.dashes.clear();
          this.frontCirclePathDoubleArcTail.dashes.clear();
          this.dashArrayFront.forEach(v => {
            this.frontCirclePathStart.dashes.push(v);
            this.frontCirclePathDoubleArcStart.dashes.push(v);
            this.frontCirclePathTail.dashes.push(v);
            this.frontCirclePathDoubleArcTail.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.frontCirclePathStart.dashes.clear();
          this.frontCirclePathStart.dashes.push(0);
          this.frontCirclePathDoubleArcStart.dashes.clear();
          this.frontCirclePathDoubleArcStart.dashes.push(0);

          this.frontCirclePathTail.dashes.clear();
          this.frontCirclePathTail.dashes.push(0);
          this.frontCirclePathDoubleArcTail.dashes.clear();
          this.frontCirclePathDoubleArcTail.dashes.push(0);
        }
        // BACK
        // if (this.dynamicBackStyle) {
        //   if (Nodule.contrastFillColor(this.fillColorFront) === "noFill") {
        //     this.backFill.noFill();
        //   } else {
        //     this.backGradientColor.color = Nodule.contrastFillColor(
        //       this.fillColorFront
        //     );
        //     this.backFill.fill = this.backGradient;
        //   }
        // } else {
        //   if (this.fillColorBack === "noFill") {
        //     this.backFill.noFill();
        //   } else {
        //     this.backGradientColor.color = this.fillColorBack;
        //     this.backFill.fill = this.backGradient;
        //   }
        // }

        if (this.dynamicBackStyle) {
          if (
            Nodule.contrastStrokeColor(this.strokeColorFront) === "noStroke"
          ) {
            this.backCirclePathStart.noStroke();
            this.backStraightStart.noStroke();
            this.backCirclePathDoubleArcStart.noStroke();
            this.backCirclePathTail.noStroke();
            this.backStraightEnd.noStroke();
            this.backCirclePathDoubleArcTail.noStroke();
          } else {
            this.backCirclePathStart.stroke = Nodule.contrastStrokeColor(
              this.strokeColorFront
            );
            this.backStraightStart.stroke = Nodule.contrastStrokeColor(
              this.strokeColorFront
            );
            this.backCirclePathDoubleArcStart.stroke = Nodule.contrastStrokeColor(
              this.strokeColorFront
            );
            this.backCirclePathTail.stroke = Nodule.contrastStrokeColor(
              this.strokeColorFront
            );
            this.backStraightEnd.stroke = Nodule.contrastStrokeColor(
              this.strokeColorFront
            );
            this.backCirclePathDoubleArcTail.stroke = Nodule.contrastStrokeColor(
              this.strokeColorFront
            );
          }
        } else {
          if (this.strokeColorBack === "noStroke") {
            this.backCirclePathStart.noStroke();
            this.backStraightStart.noStroke();
            this.backCirclePathDoubleArcStart.noStroke();
            this.backCirclePathTail.noStroke();
            this.backStraightEnd.noStroke();
            this.backCirclePathDoubleArcTail.noStroke();
          } else {
            this.backCirclePathStart.stroke = this.strokeColorBack;
            this.backStraightStart.stroke = this.strokeColorBack;
            this.backCirclePathDoubleArcStart.stroke = this.strokeColorBack;
            this.backCirclePathTail.stroke = this.strokeColorBack;
            this.backStraightEnd.stroke = this.strokeColorBack;
            this.backCirclePathDoubleArcTail.stroke = this.strokeColorBack;
          }
        }

        // strokeWidthPercent applied by adjustSizer()
        if (this.dashArrayBack.length > 0) {
          this.backCirclePathStart.dashes.clear();
          this.backCirclePathDoubleArcStart.dashes.clear();
          this.backCirclePathTail.dashes.clear();
          this.backCirclePathDoubleArcTail.dashes.clear();
          this.dashArrayBack.forEach(v => {
            this.backCirclePathStart.dashes.push(v);
            this.backCirclePathDoubleArcStart.dashes.push(v);
            this.backCirclePathTail.dashes.push(v);
            this.backCirclePathDoubleArcTail.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.backCirclePathStart.dashes.clear();
          this.backCirclePathStart.dashes.push(0);
          this.backCirclePathDoubleArcStart.dashes.clear();
          this.backCirclePathDoubleArcStart.dashes.push(0);

          this.backCirclePathTail.dashes.clear();
          this.backCirclePathTail.dashes.push(0);
          this.backCirclePathDoubleArcTail.dashes.clear();
          this.backCirclePathDoubleArcTail.dashes.push(0);
        }

        // UPDATE the glowing object

        // Glowing Front
        // no fillColor for glowing circles
        this.glowingFrontCirclePathStart.stroke = this.glowingStrokeColorFront;
        this.glowingFrontStraightStart.stroke = this.glowingStrokeColorFront;
        this.glowingFrontCirclePathDoubleArcStart.stroke = this.glowingStrokeColorFront;
        this.glowingFrontCirclePathTail.stroke = this.glowingStrokeColorFront;
        this.glowingFrontStraightEnd.stroke = this.glowingStrokeColorFront;
        this.glowingFrontCirclePathDoubleArcTail.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()
        // Copy the front dash properties to the glowing object
        if (this.dashArrayFront.length > 0) {
          this.glowingFrontCirclePathStart.dashes.clear();
          this.glowingFrontCirclePathDoubleArcStart.dashes.clear();
          this.glowingFrontCirclePathTail.dashes.clear();
          this.glowingFrontCirclePathDoubleArcTail.dashes.clear();
          this.dashArrayFront.forEach(v => {
            this.glowingFrontCirclePathStart.dashes.push(v);
            this.glowingFrontCirclePathDoubleArcStart.dashes.push(v);
            this.glowingFrontCirclePathTail.dashes.push(v);
            this.glowingFrontCirclePathDoubleArcTail.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.glowingFrontCirclePathStart.dashes.clear();
          this.glowingFrontCirclePathStart.dashes.push(0);
          this.glowingFrontCirclePathDoubleArcStart.dashes.clear();
          this.glowingFrontCirclePathDoubleArcStart.dashes.push(0);

          this.glowingFrontCirclePathTail.dashes.clear();
          this.glowingFrontCirclePathTail.dashes.push(0);
          this.glowingFrontCirclePathDoubleArcTail.dashes.clear();
          this.glowingFrontCirclePathDoubleArcTail.dashes.push(0);
        }

        // Glowing Back
        // no fillColor for glowing circles
        this.glowingBackCirclePathStart.stroke = this.glowingStrokeColorBack;
        this.glowingBackStraightStart.stroke = this.glowingStrokeColorBack;
        this.glowingBackCirclePathDoubleArcStart.stroke = this.glowingStrokeColorBack;
        this.glowingBackCirclePathTail.stroke = this.glowingStrokeColorBack;
        this.glowingBackStraightEnd.stroke = this.glowingStrokeColorBack;
        this.glowingBackCirclePathDoubleArcTail.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()
        // Copy the back dash properties to the glowing object
        if (this.dashArrayBack.length > 0) {
          this.glowingBackCirclePathStart.dashes.clear();
          this.glowingBackCirclePathDoubleArcStart.dashes.clear();
          this.glowingBackCirclePathTail.dashes.clear();
          this.glowingBackCirclePathDoubleArcTail.dashes.clear();
          this.dashArrayBack.forEach(v => {
            this.glowingBackCirclePathStart.dashes.push(v);
            this.glowingBackCirclePathDoubleArcStart.dashes.push(v);
            this.glowingBackCirclePathTail.dashes.push(v);
            this.glowingBackCirclePathDoubleArcTail.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.glowingBackCirclePathStart.dashes.clear();
          this.glowingBackCirclePathStart.dashes.push(0);
          this.glowingBackCirclePathDoubleArcStart.dashes.clear();
          this.glowingBackCirclePathDoubleArcStart.dashes.push(0);
          this.glowingBackCirclePathTail.dashes.clear();
          this.glowingBackCirclePathTail.dashes.push(0);
          this.glowingBackCirclePathDoubleArcTail.dashes.clear();
          this.glowingBackCirclePathDoubleArcTail.dashes.push(0);
        }
        break;
      }
    }
  }
}
