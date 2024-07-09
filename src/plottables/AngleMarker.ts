/** @format */

import { Vector3, Matrix4 } from "three";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_ANGLE_MARKER_FRONT_STYLE,
  DEFAULT_ANGLE_MARKER_BACK_STYLE
} from "@/types/Styles";
import { Arc } from "two.js/extras/jsm/arc";
import { Group } from "two.js/src/group";
import { Anchor } from "two.js/src/anchor";
import { Path } from "two.js/src/path";
import { Line } from "two.js/src/shapes/line";
import { Vector } from "two.js/src/vector";

const NUMCIRCLEVERTICES = SETTINGS.angleMarker.numCirclePoints;

export default class AngleMarker extends Nodule {
  /**
   * The vertex vector of the angle marker in ideal unit sphere.
   */
  private _vertexVector = new Vector3();

  /**
   * The start vector of the angle marker in ideal unit sphere. The righthand rule is used to determine the
   * direction of the angle marker. Put your righthand at the _vertexVector (thumb away from center of sphere)
   *  and your fingers in the direction of _startVector. The region swept out as you move your finger to the _endVector
   * is the angle marker.
   */
  private _startVector = new Vector3();

  /**
   * The end vector of the angle marker in ideal unit sphere.
   */
  private _endVector = new Vector3();

  /**
   * NOTE: Once the above three variables are set, the updateDisplay() will correctly render the angleMarker.
   * These are the only pieces of information that are need to do the rendering. All other
   * calculations in this class are only for the purpose of rendering the segment.
   */

  /**
   * Angle markers are either completely on the front (when the vertex is on the front) or on the back (when the vertex is on the back)
   * _angleMarkerOnFront controls if the all front or all back parts are displayed
   */
  private _angleMarkerOnFront = true;

  /**
   * The radius of the angle marker. This get scaled by angleMarkerRadiusPercent
   */
  private _radius = SETTINGS.angleMarker.defaultRadius;
  private _radiusDouble =
    SETTINGS.angleMarker.defaultRadius + SETTINGS.angleMarker.doubleArcGap;

  /**
   * The angleMarkerDecorations
   */
  private _tickMarkLength = SETTINGS.angleMarker.defaultTickMarkLength;

  /**
   * The TwoJS objects to display the *circular* front/back single/double parts and their glowing counterparts.
   */
  private _frontCircle: Arc;
  private _backCircle: Arc;

  private _frontDouble: Arc;
  private _backDouble: Arc;

  private _glowingFrontCircle: Arc;
  private _glowingBackCircle: Arc;

  private _glowingFrontDouble: Arc;
  private _glowingBackDouble: Arc;

  // Data for both circular or double arcs
  private _startParameter = 0; //Controls where the arc (circular or double) starts
  private _endParameter = 0; //Controls where the arc (circular or double) ends

  private _rotation = 0; //equal -Math.atan2(this._vertexVector.x, this._vertexVector.y); This is the amount to rotate the ellipse about its center
  private _beta: number = 0; // equal to acos(this._vertexVector.z), the angle between the north pole <0,0,1> and the center vector

  // Data for the circular arc
  private _circleCenter = new Anchor(0, 0); // equal to  (boundary circle radius)* < (Sin[_beta + r] + Sin[_beta - r])/2, 0 >,  and then rotated by Math.atan2(this._vertexVector.y, this._vertexVector.x)). r= this._radius
  private _circleHalfMinorAxis = 0; // equal to (Sin[_beta + r] - Sin[_beta - r])/2 r = this._radius
  private _circleHalfMajorAxis = 0; // // equal to Sqrt[2 - Cos[r]^2]/Sqrt[Cot[r]^2 + 2] r = this._radius
  private _circleWidth = 0; // equal to Sqrt[2 - Cos[r]^2]/Sqrt[Cot[r]^2 + 2] r = this._radius

  //Data for the the double circular arc
  private _doubleCenter = new Anchor(0, 0); // equal to  (boundary circle radius)* < (Sin[_beta + r] + Sin[_beta - r])/2, 0 >,  and then rotated by Math.atan2(this._vertexVector.y, this._vertexVector.x)). r= this._radiusDouble
  private _doubleHalfMinorAxis = 0; // equal to (Sin[_beta + r] - Sin[_beta - r])/2 r = this._radiusDouble
  private _doubleHalfMajorAxis = 0; // // equal to Sqrt[2 - Cos[r]^2]/Sqrt[Cot[r]^2 + 2] r = this._radiusDouble
  private _doubleWidth = 0; // equal to Sqrt[2 - Cos[r]^2]/Sqrt[Cot[r]^2 + 2] r = this._radiusDouble

  /**
   * The TwoJS objects to display the straight front/back parts and their glowing counterparts.
   */
  private _frontStraightVertexToStart: Line;
  private _backStraightVertexToStart: Line;
  private _glowingFrontStraightVertexToStart: Line;
  private _glowingBackStraightVertexToStart: Line;
  private _frontStraightEndToVertex: Line;
  private _backStraightEndToVertex: Line;
  private _glowingFrontStraightEndToVertex: Line;
  private _glowingBackStraightEndToVertex: Line;

  // Fills need NUMCIRCLEVERTICES + 1 vertices (the +1 is the vertex vector, rest are vertices along the circular edge)
  private _frontFill: Path;
  private _backFill: Path;

  /**
   * The TwoJS objects to display the tick mark front/back parts and their glowing counterparts
   */
  private _frontTick: Line;
  private _backTick: Line;
  private _glowingFrontTick: Line;
  private _glowingBackTick: Line;
  private _frontTickDouble: Line;
  private _backTickDouble: Line;
  private _glowingFrontTickDouble: Line;
  private _glowingBackTickDouble: Line;

  /**
   * The TwoJS object to display the arrow head for beginners.
   */
  private _frontArrowHeadPath: Path;
  private _backArrowHeadPath: Path;
  private _glowingFrontArrowHeadPath: Path;
  private _glowingBackArrowHeadPath: Path;
  private _angleIsBigEnoughToDrawArrowHeads = true;

  /**
   * The styling variables for the drawn angle marker. The user can modify these.
   */
  // Front
  private glowingStrokeColorFront =
    SETTINGS.angleMarker.glowing.strokeColor.front;
  // Back -- use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
  private glowingStrokeColorBack =
    SETTINGS.angleMarker.glowing.strokeColor.back;

  /** Initialize the current line width that is *NOT* user adjustable (but does scale for zoom) */
  static currentStraightStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.straight.front;

  static currentStraightStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.straight.back;

  static currentGlowingStraightStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.straight.front +
    SETTINGS.angleMarker.glowing.straight.edgeWidth;

  static currentGlowingStraightStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.straight.back +
    SETTINGS.angleMarker.glowing.straight.edgeWidth;

  /** Initialize the current line width that is adjusted by the zoom level and the user widthPercent */
  static currentCircularStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.circular.front;

  static currentCircularStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.circular.back;

  static currentGlowingCircularStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.circular.front +
    SETTINGS.angleMarker.glowing.circular.edgeWidth;

  static currentGlowingCircularStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.circular.back +
    SETTINGS.angleMarker.glowing.circular.edgeWidth;

  /** Initialize the current line width that is adjusted by the zoom level and the user widthPercent */
  static currentTickLength = SETTINGS.angleMarker.defaultTickMarkLength;

  static currentTickStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.tick.front;

  static currentTickStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.tick.back;

  static currentGlowingTickStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.tick.front +
    SETTINGS.angleMarker.glowing.tick.edgeWidth;

  static currentGlowingTickStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.tick.back +
    SETTINGS.angleMarker.glowing.tick.edgeWidth;
  /**
   * Initialize the current radius scale factor that is adjusted by the zoom level and the user angleMarkerRadiusPercent
   * The initial radius of the angle marker is set by the defaults in SETTINGS
   */
  static currentRadius = SETTINGS.angleMarker.defaultRadius;
  static currentRadiusDoubleArc =
    SETTINGS.angleMarker.defaultRadius + SETTINGS.angleMarker.doubleArcGap;

  /** The size of the arrow head needs to scale with the zoom factor */
  static currentArrowHeadLength = SETTINGS.angleMarker.arrowHeadLength;
  /**
   * Update all the current stroke widths
   * @param factor The ratio of the current magnification factor over the old magnification factor
   */
  static updateCurrentStrokeWidthAndRadiusForZoom(factor: number): void {
    AngleMarker.currentCircularStrokeWidthFront *= factor;
    AngleMarker.currentCircularStrokeWidthBack *= factor;
    AngleMarker.currentGlowingCircularStrokeWidthFront *= factor;
    AngleMarker.currentGlowingCircularStrokeWidthBack *= factor;

    AngleMarker.currentStraightStrokeWidthFront *= factor;
    AngleMarker.currentStraightStrokeWidthBack *= factor;
    AngleMarker.currentGlowingStraightStrokeWidthFront *= factor;
    AngleMarker.currentGlowingStraightStrokeWidthBack *= factor;

    AngleMarker.currentTickLength *= factor;
    AngleMarker.currentTickStrokeWidthFront *= factor;
    AngleMarker.currentTickStrokeWidthBack *= factor;
    AngleMarker.currentGlowingTickStrokeWidthFront *= factor;
    AngleMarker.currentGlowingTickStrokeWidthBack *= factor;

    AngleMarker.currentRadius *= factor;
    AngleMarker.currentRadiusDoubleArc *= factor;

    AngleMarker.currentArrowHeadLength *= factor;
  }

  /**
   * For temporary calculation with ThreeJS objects
   */
  private tmpVector = new Vector3();
  private projectedEndVector = new Vector3();
  private desiredXAxis = new Vector3();
  private desiredYAxis = new Vector3();
  private desiredZAxis = new Vector3();
  private tmpArrowHeadRear = new Vector3();
  private transformMatrixCircular = new Matrix4();
  private transformMatrixCircularDA = new Matrix4();

  private tmpVector1 = new Vector3();
  private tmpMatrix = new Matrix4();
  private tmpMatrixDA = new Matrix4();
  private tmpArrowHeadTip = new Vector3();
  private tmpArrowHeadInner = new Vector3();
  private tmpArrowHeadOuter = new Vector3();
  private tmpNormal1 = new Vector3();
  private tmpNormal2 = new Vector3();
  private tmpNormal = new Vector3();

  constructor() {
    super("None");

    // Initialize the circular (and double ) arcs
    this._frontCircle = new Arc(0, 0, 0, 0, 0, 0, NUMCIRCLEVERTICES);
    this._backCircle = new Arc(0, 0, 0, 0, 0, 0, NUMCIRCLEVERTICES);
    this._frontDouble = new Arc(0, 0, 0, 0, 0, 0, NUMCIRCLEVERTICES);
    this._backDouble = new Arc(0, 0, 0, 0, 0, 0, NUMCIRCLEVERTICES);
    this._glowingFrontCircle = new Arc(0, 0, 0, 0, 0, 0, NUMCIRCLEVERTICES);
    this._glowingBackCircle = new Arc(0, 0, 0, 0, 0, 0, NUMCIRCLEVERTICES);
    this._glowingFrontDouble = new Arc(0, 0, 0, 0, 0, 0, NUMCIRCLEVERTICES);
    this._glowingBackDouble = new Arc(0, 0, 0, 0, 0, 0, NUMCIRCLEVERTICES);

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this._frontCircle.id), {
      type: "angleMarker",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this._frontDouble.id), {
      type: "angleMarker",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this._backCircle.id), {
      type: "angleMarker",
      side: "back",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this._backDouble.id), {
      type: "angleMarker",
      side: "back",
      fill: false,
      part: ""
    });

    // Set the styles that never changes -- Fill & Cap
    this._frontCircle.noFill();
    this._frontDouble.noFill();
    this._backCircle.noFill();
    this._backDouble.noFill();
    this._glowingFrontCircle.noFill();
    this._glowingFrontDouble.noFill();
    this._glowingBackCircle.noFill();
    this._glowingBackDouble.noFill();

    this._frontCircle.cap = "butt";
    this._frontDouble.cap = "butt";
    this._backCircle.cap = "butt";
    this._backDouble.cap = "butt";
    this._glowingFrontCircle.cap = "butt";
    this._glowingFrontDouble.cap = "butt";
    this._glowingBackCircle.cap = "butt";
    this._glowingBackDouble.cap = "butt";

    // Initialize the straight parts
    this._frontStraightVertexToStart = new Line();
    this._backStraightVertexToStart = new Line();
    this._glowingFrontStraightVertexToStart = new Line();
    this._glowingBackStraightVertexToStart = new Line();

    this._frontStraightEndToVertex = new Line();
    this._backStraightEndToVertex = new Line();
    this._glowingFrontStraightEndToVertex = new Line();
    this._glowingBackStraightEndToVertex = new Line();
    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(
      String(this._frontStraightVertexToStart.id),
      {
        type: "angleMarker",
        side: "front",
        fill: false,
        part: "edge"
      }
    );
    Nodule.idPlottableDescriptionMap.set(
      String(this._backStraightVertexToStart.id),
      {
        type: "angleMarker",
        side: "back",
        fill: false,
        part: "edge"
      }
    );
    Nodule.idPlottableDescriptionMap.set(
      String(this._frontStraightEndToVertex.id),
      {
        type: "angleMarker",
        side: "front",
        fill: false,
        part: "edge"
      }
    );
    Nodule.idPlottableDescriptionMap.set(
      String(this._backStraightEndToVertex.id),
      {
        type: "angleMarker",
        side: "back",
        fill: false,
        part: "edge"
      }
    );

    // Set the style that never changes -- Fill & Cap
    this._frontStraightVertexToStart.noFill();
    this._backStraightVertexToStart.noFill();
    this._glowingFrontStraightVertexToStart.noFill();
    this._glowingBackStraightVertexToStart.noFill();

    this._frontStraightEndToVertex.noFill();
    this._backStraightEndToVertex.noFill();
    this._glowingFrontStraightEndToVertex.noFill();
    this._glowingBackStraightEndToVertex.noFill();

    this._frontStraightVertexToStart.cap = "square";
    this._backStraightVertexToStart.cap = "square";
    this._glowingFrontStraightVertexToStart.cap = "square";
    this._glowingBackStraightVertexToStart.cap = "square";

    this._frontStraightEndToVertex.cap = "square";
    this._backStraightEndToVertex.cap = "square";
    this._glowingFrontStraightEndToVertex.cap = "square";
    this._glowingBackStraightEndToVertex.cap = "square";

    // Arrow Head Path Initialize
    // Create the initial front and back vertices (front/back glowing/not)

    const arrowHeadVertices0: Anchor[] = [];
    const arrowHeadVertices1: Anchor[] = [];
    const arrowHeadVertices2: Anchor[] = [];
    const arrowHeadVertices3: Anchor[] = [];
    for (let k = 0; k < 4; k++) {
      arrowHeadVertices0.push(new Anchor(0, 0));
      arrowHeadVertices1.push(new Anchor(0, 0));
      arrowHeadVertices2.push(new Anchor(0, 0));
      arrowHeadVertices3.push(new Anchor(0, 0));
    }
    this._frontArrowHeadPath = new Path(
      arrowHeadVertices0,
      /* closed */ true,
      /* curve */ false
    );

    // Create the other parts cloning the front arrow head path
    this._glowingFrontArrowHeadPath = new Path(
      arrowHeadVertices1,
      /* closed */ true,
      /* curve */ false
    );
    this._backArrowHeadPath = new Path(
      arrowHeadVertices2,
      /* closed */ true,
      /* curve */ false
    );
    this._glowingBackArrowHeadPath = new Path(
      arrowHeadVertices3,
      /* closed */ true,
      /* curve */ false
    );

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this._frontArrowHeadPath.id), {
      type: "angleMarker",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this._backArrowHeadPath.id), {
      type: "angleMarker",
      side: "back",
      fill: false,
      part: ""
    });

    // Set the style that never changes -- join & glowing fill
    this._frontArrowHeadPath.join = "miter";
    this._backArrowHeadPath.join = "miter";
    this._glowingFrontArrowHeadPath.join = "miter";
    this._glowingBackArrowHeadPath.join = "miter";
    this._glowingFrontArrowHeadPath.noFill();
    this._glowingBackArrowHeadPath.noFill();

    // Now organize the fills
    // In total there are NUMCIRCLEVERTICES + 1 in each fill

    const frontFillVertices: Anchor[] = [];
    for (let k = 0; k < NUMCIRCLEVERTICES + 1; k++) {
      frontFillVertices.push(new Anchor(0, 0));
    }
    this._frontFill = new Path(
      frontFillVertices,
      /* closed */ true,
      /* curve */ false
    );

    const backFillVertices: Anchor[] = [];
    for (let k = 0; k < NUMCIRCLEVERTICES + 1; k++) {
      backFillVertices.push(new Anchor(0, 0));
    }
    this._backFill = new Path(
      backFillVertices,
      /* closed */ true,
      /* curve */ false
    );

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this._frontFill.id), {
      type: "angleMarker",
      side: "front",
      fill: true,
      part: ""
    });

    Nodule.idPlottableDescriptionMap.set(String(this._backFill.id), {
      type: "angleMarker",
      side: "back",
      fill: true,
      part: ""
    });

    // Set the style that never changes -- stroke
    this._frontFill.noStroke();
    this._backFill.noStroke();

    // Initialize the ticks
    this._frontTick = new Line();
    this._backTick = new Line();
    this._glowingFrontTick = new Line();
    this._glowingBackTick = new Line();
    this._frontTickDouble = new Line();
    this._backTickDouble = new Line();
    this._glowingFrontTickDouble = new Line();
    this._glowingBackTickDouble = new Line();

    // Set the style that never changes -- fill
    this._frontTick.noFill();
    this._backTick.noFill();
    this._frontTickDouble.noFill();
    this._backTickDouble.noFill();
    this._glowingFrontTick.noFill();
    this._glowingBackTick.noFill();
    this._glowingFrontTickDouble.noFill();
    this._glowingBackTickDouble.noFill();

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this._frontTick.id), {
      type: "angleMarker",
      side: "front",
      fill: true,
      part: ""
    });

    Nodule.idPlottableDescriptionMap.set(String(this._backTick.id), {
      type: "angleMarker",
      side: "back",
      fill: true,
      part: ""
    });

    // Set the style that never changes -- cap
    this._frontTick.cap = "square";
    this._backTick.cap = "square";
    this._glowingFrontTick.cap = "square";
    this._glowingBackTick.cap = "square";
    this._frontTickDouble.cap = "square";
    this._backTickDouble.cap = "square";
    this._glowingFrontTickDouble.cap = "square";
    this._glowingBackTickDouble.cap = "square";

    this.styleOptions.set(
      StyleCategory.Front,
      DEFAULT_ANGLE_MARKER_FRONT_STYLE
    );
    this.styleOptions.set(StyleCategory.Back, DEFAULT_ANGLE_MARKER_BACK_STYLE);
  }

  /**
   * This method updates the TwoJS objects (frontCircle, backCircle, frontDouble, ...) for display
   * This is only accurate if the vertexVector, startVector, and endVector are correct so only
   * call this method once those variables are updated.
   */
  public updateDisplay(): void {
    //Set all the parameters that control the size and location of the projected circle (but not the part of the ellipse that is drawn)
    if (this._vertexVector.z > 0) {
      this._angleMarkerOnFront = true;
    } else {
      this._angleMarkerOnFront = false;
    }

    /**  Set the common data */
    this._beta = Math.acos(this._vertexVector.z);
    this._rotation = -Math.atan2(this._vertexVector.x, this._vertexVector.y);

    /** Set the data for the circular part */
    this._circleHalfMinorAxis =
      (Math.sin(this._beta + this._radius) -
        Math.sin(this._beta - this._radius)) /
      2;
    this._circleHalfMajorAxis =
      Math.sqrt(2 - Math.cos(this._radius) ** 2) /
      Math.sqrt(Nodule.ctg(this._radius) ** 2 + 2);
    this._circleCenter.x =
      (SETTINGS.boundaryCircle.radius *
        (Math.sin(this._beta + this._radius) +
          Math.sin(this._beta - this._radius))) /
      2;
    this._circleCenter.y = 0; // y component is always zero
    // Now rotate the center vector
    this._circleCenter.rotate(
      Math.atan2(this._vertexVector.y, this._vertexVector.x)
    ); //DO NOT Rotate the center vector at the same time you set it equal to this._frontPart.position, this causes unexpected results

    /**  Set the data for the double part */
    this._doubleHalfMinorAxis =
      (Math.sin(this._beta + this._radiusDouble) -
        Math.sin(this._beta - this._radiusDouble)) /
      2;
    this._doubleHalfMajorAxis =
      Math.sqrt(2 - Math.cos(this._radiusDouble) ** 2) /
      Math.sqrt(Nodule.ctg(this._radiusDouble) ** 2 + 2);
    this._doubleCenter.x =
      (SETTINGS.boundaryCircle.radius *
        (Math.sin(this._beta + this._radiusDouble) +
          Math.sin(this._beta - this._radiusDouble))) /
      2;
    this._doubleCenter.y = 0; // y component is always zero
    // Now rotate the center vector
    this._doubleCenter.rotate(
      Math.atan2(this._vertexVector.y, this._vertexVector.x)
    ); //DO NOT Rotate the center vector at the same time you set it equal to this._frontPart.position, this causes unexpected results

    //Copy the updated information into the glowing/not front/back circle/double parts
    this._frontCircle.height =
      2 * this._circleHalfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._frontCircle.width =
      2 * this._circleHalfMajorAxis * SETTINGS.boundaryCircle.radius;
    this._frontCircle.rotation = this._rotation;
    this._frontCircle.position = this._circleCenter;

    this._backCircle.height =
      2 * this._circleHalfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._backCircle.width =
      2 * this._circleHalfMajorAxis * SETTINGS.boundaryCircle.radius;
    this._backCircle.position = this._circleCenter;
    this._backCircle.rotation = this._rotation;

    this._glowingFrontCircle.height =
      2 * this._circleHalfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._glowingFrontCircle.width =
      2 * this._circleHalfMajorAxis * SETTINGS.boundaryCircle.radius;
    this._glowingFrontCircle.position = this._circleCenter;
    this._glowingFrontCircle.rotation = this._rotation;

    this._glowingBackCircle.height =
      2 * this._circleHalfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._glowingBackCircle.width =
      2 * this._circleHalfMajorAxis * SETTINGS.boundaryCircle.radius;
    this._glowingBackCircle.position = this._circleCenter;
    this._glowingBackCircle.rotation = this._rotation;

    this._frontDouble.height =
      2 * this._doubleHalfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._frontDouble.width =
      2 * this._doubleHalfMajorAxis * SETTINGS.boundaryCircle.radius;
    this._frontDouble.rotation = this._rotation;
    this._frontDouble.position = this._doubleCenter;

    this._backDouble.height =
      2 * this._doubleHalfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._backDouble.width =
      2 * this._doubleHalfMajorAxis * SETTINGS.boundaryCircle.radius;
    this._backDouble.position = this._doubleCenter;
    this._backDouble.rotation = this._rotation;

    this._glowingFrontDouble.height =
      2 * this._doubleHalfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._glowingFrontDouble.width =
      2 * this._doubleHalfMajorAxis * SETTINGS.boundaryCircle.radius;
    this._glowingFrontDouble.position = this._doubleCenter;
    this._glowingFrontDouble.rotation = this._rotation;

    this._glowingBackDouble.height =
      2 * this._doubleHalfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._glowingBackDouble.width =
      2 * this._doubleHalfMajorAxis * SETTINGS.boundaryCircle.radius;
    this._glowingBackDouble.position = this._doubleCenter;
    this._glowingBackDouble.rotation = this._rotation;

    // Now Determine the parameters of the glowing/not front/back circle/double to display the correct portion of the projected circle
    // First set up the coordinate system of the actual circle
    // The vector to the circle center is ALSO the normal direction of the circle
    this.desiredZAxis.copy(this._vertexVector).normalize();
    // Any vector perpendicular the desired z axis can be the desired x axis, but we want one that points from the origin to the
    // the projection of the startVector onto the plane perpendicular to the this.desiredZAxis.
    this.tmpVector
      .crossVectors(this._vertexVector, this._startVector)
      .normalize();
    this.desiredXAxis
      .crossVectors(this.tmpVector, this._vertexVector)
      .normalize();

    // Use the cross product to create the vector perpendicular to both the desired z and x axis
    this.desiredYAxis
      .crossVectors(this.desiredZAxis, this.desiredXAxis)
      .normalize();

    // Now figure out the angular length of the angle marker using the endVector
    // First project endVector on the plane perpendicular to the vertexVector
    this.projectedEndVector.copy(this._endVector);
    this.projectedEndVector.addScaledVector(
      this._vertexVector,
      -1 * this._vertexVector.dot(this._endVector)
    );

    // Now use the atan2 function in the plane perpendicular to vertexVector where the positive x axis is the this.desiredXAxis
    //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
    // Returns angle in the range (-pi,pi] to convert to [0,2pi) use modulus 2*Pi operator
    const angularLengthOfMarker = Math.atan2(
      this.desiredYAxis.dot(this.projectedEndVector),
      this.desiredXAxis.dot(this.projectedEndVector)
    ).modTwoPi();

    // adjust drawn angular length (in the circle of the angle marker) if the arrowhead is drawn
    const miterLength =
      this._frontArrowHeadPath.linewidth /
      (2 *
        SETTINGS.boundaryCircle.radius *
        Math.sin(
          (SETTINGS.angleMarker.arrowHeadTipAngleInner +
            SETTINGS.angleMarker.arrowHeadTipAngleOuter) /
            2
        )); // divide by the radius of the boundary circle because miter length without that is a length on the sphere of radius boundaryCircle.radius.
    const rearDeltaAngle = Math.atan(
      Math.tan(AngleMarker.currentArrowHeadLength + miterLength) /
        Math.sin(this._radius)
    ); // right triangle trigonometry edges: vertex of angle marker to the point on the angle marker so
    // that the tangent at that point to the circle of the angle marker has length miter length + arrow head
    // length to the line that is the end of the angle marker. Since this is an angle computation, the radius of
    // the sphere on which miter length, angle marker radius, and arrow head length don't matter, so
    // long as they are all on the same size sphere. (miter length, arrow head length, and angle marker radius are all
    // lengths on the unit sphere)

    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    let angularLengthOfMarkerDraw: number;
    if (
      angularLengthOfMarker > 2 * rearDeltaAngle &&
      frontStyle?.angleMarkerArrowHeads &&
      frontStyle.angleMarkerArrowHeads === true
    ) {
      angularLengthOfMarkerDraw = angularLengthOfMarker - rearDeltaAngle;
      this._angleIsBigEnoughToDrawArrowHeads = true;
    } else {
      angularLengthOfMarkerDraw = angularLengthOfMarker;
      this._angleIsBigEnoughToDrawArrowHeads = false;
    }

    //now compute the parameters for the portion of the projected circle (i.e. ellipse) that is drawn
    // first un-rotate the start, vertex, and end vectors
    const unrotatedVertexVector = new Vector(
      this._vertexVector.x,
      this._vertexVector.y
    ).rotate(-this._rotation);
    const unrotatedStartVector = new Vector(
      this._startVector.x,
      this._startVector.y
    ).rotate(-this._rotation);
    const unrotatedEndVector = new Vector(
      this._endVector.x,
      this._endVector.y
    ).rotate(-this._rotation);

    this._startParameter = Math.atan2(
      (unrotatedStartVector.y - unrotatedVertexVector.y) /
        this._circleHalfMinorAxis,
      (unrotatedStartVector.x - unrotatedVertexVector.x) /
        this._circleHalfMajorAxis
    );
    this._endParameter = Math.atan2(
      (unrotatedEndVector.y - unrotatedVertexVector.y) /
        this._circleHalfMinorAxis,
      (unrotatedEndVector.x - unrotatedVertexVector.x) /
        this._circleHalfMajorAxis
    );

    // if end is smaller than start, adjust the start by 2PI so that it is before the end
    if (this._endParameter - this._startParameter < 0) {
      this._startParameter -= 2 * Math.PI;
    }

    //now copy these values into the correct two.js objects
    this._frontCircle.startAngle = this._startParameter;
    this._frontDouble.startAngle = this._startParameter;
    this._glowingFrontCircle.startAngle = this._startParameter;
    this._glowingFrontDouble.startAngle = this._startParameter;

    this._backCircle.startAngle = this._startParameter;
    this._backDouble.startAngle = this._startParameter;
    this._glowingBackCircle.startAngle = this._startParameter;
    this._glowingBackDouble.startAngle = this._startParameter;

    this._frontCircle.endAngle = this._endParameter;
    this._frontDouble.endAngle = this._endParameter;
    this._glowingFrontCircle.endAngle = this._endParameter;
    this._glowingFrontDouble.endAngle = this._endParameter;

    this._backCircle.endAngle = this._endParameter;
    this._backDouble.endAngle = this._endParameter;
    this._glowingBackCircle.endAngle = this._endParameter;
    this._glowingBackDouble.endAngle = this._endParameter;

    // Compute the tick marks
    // The tick mark is drawn in the middle of the angle so compute the vector that is the to_direction of the drawn tick
    this.tmpVector.set(0, 0, 0);
    this.tmpVector.addScaledVector(
      this.desiredXAxis,
      Math.cos(angularLengthOfMarker / 2)
    );
    this.tmpVector.addScaledVector(
      this.desiredYAxis,
      Math.sin(angularLengthOfMarker / 2)
    );

    // Now compute the location of the start of the tick mark
    this.tmpVector1.set(0, 0, 0);
    this.tmpVector1.addScaledVector(
      this.desiredZAxis,
      Math.cos(this._radius - SETTINGS.angleMarker.defaultTickMarkLength / 2)
    );
    this.tmpVector1.addScaledVector(
      this.tmpVector,
      Math.sin(this._radius - SETTINGS.angleMarker.defaultTickMarkLength / 2)
    );

    // Now set the first vertex of the glowing/not glowing, front/back, not double/double tick marks
    this._frontTick.vertices[0].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._frontTick.vertices[0].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;
    this._frontTickDouble.vertices[0].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._frontTickDouble.vertices[0].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;

    this._backTick.vertices[0].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._backTick.vertices[0].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;
    this._backTickDouble.vertices[0].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._backTickDouble.vertices[0].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;

    this._glowingFrontTick.vertices[0].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._glowingFrontTick.vertices[0].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;
    this._glowingFrontTickDouble.vertices[0].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._glowingFrontTickDouble.vertices[0].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;

    this._glowingBackTick.vertices[0].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._glowingBackTick.vertices[0].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;
    this._glowingBackTickDouble.vertices[0].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._glowingBackTickDouble.vertices[0].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;

    // Now compute the end of the glowing/not glowing, front/back, not double tick marks
    this.tmpVector1.set(0, 0, 0);
    this.tmpVector1.addScaledVector(
      this.desiredZAxis,
      Math.cos(this._radius + SETTINGS.angleMarker.defaultTickMarkLength / 2)
    );
    this.tmpVector1.addScaledVector(
      this.tmpVector,
      Math.sin(this._radius + SETTINGS.angleMarker.defaultTickMarkLength / 2)
    );

    this._frontTick.vertices[1].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._frontTick.vertices[1].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;
    this._backTick.vertices[1].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._backTick.vertices[1].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;
    this._glowingFrontTick.vertices[1].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._glowingFrontTick.vertices[1].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;
    this._glowingBackTick.vertices[1].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._glowingBackTick.vertices[1].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;

    // Now compute the end of the glowing/not glowing, front/back, not double tick marks
    this.tmpVector1.set(0, 0, 0);
    this.tmpVector1.addScaledVector(
      this.desiredZAxis,
      Math.cos(this._radiusDouble + this._tickMarkLength / 2)
    );
    this.tmpVector1.addScaledVector(
      this.tmpVector,
      Math.sin(this._radiusDouble + 3*this._tickMarkLength / 4)
    );
    this._frontTickDouble.vertices[1].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._frontTickDouble.vertices[1].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;
    this._backTickDouble.vertices[1].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._backTickDouble.vertices[1].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;
    this._glowingFrontTickDouble.vertices[1].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._glowingFrontTickDouble.vertices[1].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;
    this._glowingBackTickDouble.vertices[1].x = this.tmpVector1.x*SETTINGS.boundaryCircle.radius;
    this._glowingBackTickDouble.vertices[1].y = this.tmpVector1.y*SETTINGS.boundaryCircle.radius;

    // Compute the arrow head vertices.
    // The arrow head is a non-convex non-crossed quadrilateral (almost a kite whose diagonals don't intersect)
    // Set up the local coordinates from for the circle,
    //  transformMatrix will now map (1,0,0) to the point on the desired x axis a unit from the origin in the positive direction.
    this.transformMatrixCircular.makeBasis(
      this.desiredXAxis,
      this.desiredYAxis,
      this.desiredZAxis
    );
    this.transformMatrixCircularDA.makeBasis(
      //DA = double arc
      this.desiredXAxis,
      this.desiredYAxis,
      this.desiredZAxis
    );

    //Now appropriately translate and scale the circle in standard position to the one in the desired location

    // translate along the Z of the local coordinate frame
    // The standard circle plane (z=0) is below the plane of the target circle so translate the plane z=0 to the
    // the target circle plane
    const distanceFromOrigin = Math.cos(this._radius);
    const distanceFromOriginDoubleArc = Math.cos(this._radiusDouble);
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
    this.transformMatrixCircular.multiply(this.tmpMatrix);
    this.transformMatrixCircularDA.multiply(this.tmpMatrixDA);
    // The target circle is scaled version of the original circle (but now in the plane of the target circle)
    // so scale XYZ space in the XY directions by the projected radius (z direction by 1)
    // this will make the original circle (in the plane of the target circle) finally coincide with the target circle
    this.tmpMatrix.makeScale(Math.sin(this._radius), Math.sin(this._radius), 1);
    this.tmpMatrixDA.makeScale(
      Math.sin(this._radiusDouble),
      Math.sin(this._radiusDouble),
      1
    );
    this.transformMatrixCircular.multiply(this.tmpMatrix); // transformMatrix now maps the original circle to the target circle
    this.transformMatrixCircularDA.multiply(this.tmpMatrixDA);

    // determine the rear arrow head vector
    // offset from the end of the angle by the angular miter length plus the angular arrow head length
    // This is in terms of the angle drawing the angle marker
    this.tmpArrowHeadRear
      .set(
        Math.cos(angularLengthOfMarkerDraw),
        Math.sin(angularLengthOfMarkerDraw),
        0
      )
      .multiplyScalar(SETTINGS.boundaryCircle.radius)
      .applyMatrix4(this.transformMatrixCircular);

    // determine the tip vector of the arrow head
    // the tip vector is the vector so that the line containing the tip vector and the rear vector is tangent to the
    // the anglemarker circle and the distance from tip vector to rear vector is AngleMarker.currentAngleMarkerArrowHeadLength

    this.tmpVector.crossVectors(this.tmpArrowHeadRear, this._vertexVector); // tmpVector is now the normal to the line through the vertex vector and the rear arrow head vector
    this.tmpVector.cross(this.tmpArrowHeadRear).normalize(); // tmpVector is now the normal to the tangent line to the anglemarker at the arrow head rear
    this.tmpVector1
      .crossVectors(this.tmpVector, this.tmpArrowHeadRear)
      .normalize()
      .multiplyScalar(SETTINGS.boundaryCircle.radius); // tmpVector1 is the vector in the plane of the tangent to the anglemarker 90 degrees from rear arrow vector. It is the To vector

    this.tmpArrowHeadTip
      .copy(this.tmpArrowHeadRear)
      .multiplyScalar(Math.cos(AngleMarker.currentArrowHeadLength));
    this.tmpArrowHeadTip.addScaledVector(
      this.tmpVector1,
      Math.sin(AngleMarker.currentArrowHeadLength)
    );
    // Now determine the other two vertices of the arrow head
    this.tmpNormal
      .crossVectors(this.tmpArrowHeadRear, this.tmpArrowHeadTip)
      .normalize(); // normal to the line from tip to rear of arrowhead
    this.tmpNormal1
      .crossVectors(this.tmpNormal, this.tmpArrowHeadTip)
      .normalize(); // a vector 90 degrees from the tip vector in the opposite direction of the rear vector

    this.tmpNormal1
      .multiplyScalar(Math.sin(SETTINGS.angleMarker.arrowHeadTipAngleInner))
      .addScaledVector(
        this.tmpNormal,
        Math.cos(SETTINGS.angleMarker.arrowHeadTipAngleInner)
      ); // this.tmpNormal1 is the vector that normal to the plane containing the tip vector that is at angle arrowHeadTipAngle from the plane containing the tip and rear vectors

    this.tmpNormal2
      .crossVectors(this.tmpNormal, this.tmpArrowHeadRear)
      .normalize(); // a vector 90 degrees from the rear vector in the direction of the tip vector

    this.tmpNormal2
      .multiplyScalar(Math.sin(SETTINGS.angleMarker.arrowHeadRearAngleInner))
      .addScaledVector(
        this.tmpNormal,
        Math.cos(SETTINGS.angleMarker.arrowHeadRearAngleInner)
      ); // this.tmpNormal2 is the vector that normal to the plane containing the rear vector that is at angle arrowHeadRearAngle from the plane containing the tip and rear vectors

    this.tmpArrowHeadInner
      .crossVectors(this.tmpNormal1, this.tmpNormal2)
      .normalize()
      .multiplyScalar(SETTINGS.boundaryCircle.radius);
    // make sure that the first arrow head 1 vector is near the tip

    if (this.tmpArrowHeadTip.dot(this.tmpArrowHeadInner) < 0) {
      this.tmpArrowHeadInner.multiplyScalar(-1);
    }

    // Now determine the other vertex of the arrow head
    this.tmpNormal1
      .crossVectors(this.tmpNormal, this.tmpArrowHeadTip)
      .normalize(); // a vector 90 degrees from the tip vector in the opposite direction of the rear vector

    this.tmpNormal1
      .multiplyScalar(Math.sin(-SETTINGS.angleMarker.arrowHeadTipAngleOuter))
      .addScaledVector(
        this.tmpNormal,
        Math.cos(-SETTINGS.angleMarker.arrowHeadTipAngleOuter)
      ); // this.tmpNormal1 is the vector that normal to the plane containing the tip vector that is at angle arrowHeadTipAngleOuter from the plane containing the tip and rear vectors

    this.tmpNormal2
      .crossVectors(this.tmpNormal, this.tmpArrowHeadRear)
      .normalize(); // a vector 90 degrees from the rear vector in the direction of the tip vector

    this.tmpNormal2
      .multiplyScalar(Math.sin(-SETTINGS.angleMarker.arrowHeadRearAngleOuter))
      .addScaledVector(
        this.tmpNormal,
        Math.cos(-SETTINGS.angleMarker.arrowHeadRearAngleOuter)
      ); // this.tmpNormal2 is the vector that normal to the plane containing the rear vector that is at angle arrowHeadRearAngle from the plane containing the tip and rear vectors

    this.tmpArrowHeadOuter
      .crossVectors(this.tmpNormal1, this.tmpNormal2)
      .normalize()
      .multiplyScalar(SETTINGS.boundaryCircle.radius);
    // make sure that the first arrow head 1 vector is near the tip

    if (this.tmpArrowHeadTip.dot(this.tmpArrowHeadOuter) < 0) {
      this.tmpArrowHeadOuter.multiplyScalar(-1);
    }

    // determine if the arrow head is on the front or the back of the sphere. This is
    // determine by the z coordinate of the vertex vector. The arrow should be so small that it
    // doesn't matter if some of the vertices are on the front and some on the back. They will be lost in the
    // thickness of the boundary circle

    // the arrow head is on the front
    this._frontArrowHeadPath.vertices[0].x = this.tmpArrowHeadTip.x;
    this._frontArrowHeadPath.vertices[0].y = this.tmpArrowHeadTip.y;

    this._frontArrowHeadPath.vertices[1].x = this.tmpArrowHeadInner.x;
    this._frontArrowHeadPath.vertices[1].y = this.tmpArrowHeadInner.y;

    this._frontArrowHeadPath.vertices[2].x = this.tmpArrowHeadRear.x;
    this._frontArrowHeadPath.vertices[2].y = this.tmpArrowHeadRear.y;

    this._frontArrowHeadPath.vertices[3].x = this.tmpArrowHeadOuter.x;
    this._frontArrowHeadPath.vertices[3].y = this.tmpArrowHeadOuter.y;

    // set the glowing front arrow head
    this._glowingFrontArrowHeadPath.vertices[0].x = this.tmpArrowHeadTip.x;
    this._glowingFrontArrowHeadPath.vertices[0].y = this.tmpArrowHeadTip.y;

    this._glowingFrontArrowHeadPath.vertices[1].x = this.tmpArrowHeadInner.x;
    this._glowingFrontArrowHeadPath.vertices[1].y = this.tmpArrowHeadInner.y;

    this._glowingFrontArrowHeadPath.vertices[2].x = this.tmpArrowHeadRear.x;
    this._glowingFrontArrowHeadPath.vertices[2].y = this.tmpArrowHeadRear.y;

    this._glowingFrontArrowHeadPath.vertices[3].x = this.tmpArrowHeadOuter.x;
    this._glowingFrontArrowHeadPath.vertices[3].y = this.tmpArrowHeadOuter.y;

    // the arrow head is on the back
    this._backArrowHeadPath.vertices[0].x = this.tmpArrowHeadTip.x;
    this._backArrowHeadPath.vertices[0].y = this.tmpArrowHeadTip.y;

    this._backArrowHeadPath.vertices[1].x = this.tmpArrowHeadInner.x;
    this._backArrowHeadPath.vertices[1].y = this.tmpArrowHeadInner.y;

    this._backArrowHeadPath.vertices[2].x = this.tmpArrowHeadRear.x;
    this._backArrowHeadPath.vertices[2].y = this.tmpArrowHeadRear.y;

    this._backArrowHeadPath.vertices[3].x = this.tmpArrowHeadOuter.x;
    this._backArrowHeadPath.vertices[3].y = this.tmpArrowHeadOuter.y;

    // set the glowing back arrow head
    this._glowingBackArrowHeadPath.vertices[0].x = this.tmpArrowHeadTip.x;
    this._glowingBackArrowHeadPath.vertices[0].y = this.tmpArrowHeadTip.y;

    this._glowingBackArrowHeadPath.vertices[1].x = this.tmpArrowHeadInner.x;
    this._glowingBackArrowHeadPath.vertices[1].y = this.tmpArrowHeadInner.y;

    this._glowingBackArrowHeadPath.vertices[2].x = this.tmpArrowHeadRear.x;
    this._glowingBackArrowHeadPath.vertices[2].y = this.tmpArrowHeadRear.y;

    this._glowingBackArrowHeadPath.vertices[3].x = this.tmpArrowHeadOuter.x;
    this._glowingBackArrowHeadPath.vertices[3].y = this.tmpArrowHeadOuter.y;

    //  Now build the straight edge from vertex to start

    this._frontStraightVertexToStart.vertices[0].x =
      this.vertexVector.x * SETTINGS.boundaryCircle.radius;
    this._frontStraightVertexToStart.vertices[0].y =
      this.vertexVector.y * SETTINGS.boundaryCircle.radius;
    this._frontStraightVertexToStart.vertices[1].x =
      this.startVector.x * SETTINGS.boundaryCircle.radius;
    this._frontStraightVertexToStart.vertices[1].y =
      this.startVector.y * SETTINGS.boundaryCircle.radius;

    this._backStraightVertexToStart.vertices[0].x =
      this.vertexVector.x * SETTINGS.boundaryCircle.radius;
    this._backStraightVertexToStart.vertices[0].y =
      this.vertexVector.y * SETTINGS.boundaryCircle.radius;
    this._backStraightVertexToStart.vertices[1].x =
      this.startVector.x * SETTINGS.boundaryCircle.radius;
    this._backStraightVertexToStart.vertices[1].y =
      this.startVector.y * SETTINGS.boundaryCircle.radius;

    this._glowingFrontStraightVertexToStart.vertices[0].x =
      this.vertexVector.x * SETTINGS.boundaryCircle.radius;
    this._glowingFrontStraightVertexToStart.vertices[0].y =
      this.vertexVector.y * SETTINGS.boundaryCircle.radius;
    this._glowingFrontStraightVertexToStart.vertices[1].x =
      this.startVector.x * SETTINGS.boundaryCircle.radius;
    this._glowingFrontStraightVertexToStart.vertices[1].y =
      this.startVector.y * SETTINGS.boundaryCircle.radius;

    this._glowingBackStraightVertexToStart.vertices[0].x =
      this.vertexVector.x * SETTINGS.boundaryCircle.radius;
    this._glowingBackStraightVertexToStart.vertices[0].y =
      this.vertexVector.y * SETTINGS.boundaryCircle.radius;
    this._glowingBackStraightVertexToStart.vertices[1].x =
      this.startVector.x * SETTINGS.boundaryCircle.radius;
    this._glowingBackStraightVertexToStart.vertices[1].y =
      this.startVector.y * SETTINGS.boundaryCircle.radius;

    // //  Now build the straight edge from end to vertex (so that the angle marker is traces vertex -> start -> end -> vertex in order)

    this._frontStraightEndToVertex.vertices[0].x =
      this.endVector.x * SETTINGS.boundaryCircle.radius;
    this._frontStraightEndToVertex.vertices[0].y =
      this.endVector.y * SETTINGS.boundaryCircle.radius;
    this._frontStraightEndToVertex.vertices[1].x =
      this.vertexVector.x * SETTINGS.boundaryCircle.radius;
    this._frontStraightEndToVertex.vertices[1].y =
      this.vertexVector.y * SETTINGS.boundaryCircle.radius;

    this._backStraightEndToVertex.vertices[0].x =
      this.endVector.x * SETTINGS.boundaryCircle.radius;
    this._backStraightEndToVertex.vertices[0].y =
      this.endVector.y * SETTINGS.boundaryCircle.radius;
    this._backStraightEndToVertex.vertices[1].x =
      this.vertexVector.x * SETTINGS.boundaryCircle.radius;
    this._backStraightEndToVertex.vertices[1].y =
      this.vertexVector.y * SETTINGS.boundaryCircle.radius;

    this._glowingFrontStraightEndToVertex.vertices[0].x =
      this.endVector.x * SETTINGS.boundaryCircle.radius;
    this._glowingFrontStraightEndToVertex.vertices[0].y =
      this.endVector.y * SETTINGS.boundaryCircle.radius;
    this._glowingFrontStraightEndToVertex.vertices[1].x =
      this.vertexVector.x * SETTINGS.boundaryCircle.radius;
    this._glowingFrontStraightEndToVertex.vertices[1].y =
      this.vertexVector.y * SETTINGS.boundaryCircle.radius;

    this._glowingBackStraightEndToVertex.vertices[0].x =
      this.endVector.x * SETTINGS.boundaryCircle.radius;
    this._glowingBackStraightEndToVertex.vertices[0].y =
      this.endVector.y * SETTINGS.boundaryCircle.radius;
    this._glowingBackStraightEndToVertex.vertices[1].x =
      this.vertexVector.x * SETTINGS.boundaryCircle.radius;
    this._glowingBackStraightEndToVertex.vertices[1].y =
      this.vertexVector.y * SETTINGS.boundaryCircle.radius;

    //Now build the front/back fill objects based on the front/back straight and circular parts
    // get the local matrix for the frontCircle vertices
    const localMatrix = this._frontCircle.matrix;
    const coords = localMatrix.multiply(
      this.vertexVector.x,
      this.vertexVector.y,
      1
    );
    // Start at the vertex
    this._frontFill.vertices[0].x = coords[0];
    this._frontFill.vertices[0].y = coords[1];
    this._backFill.vertices[0].x = coords[0];
    this._backFill.vertices[0].y = coords[1];

    // now copy the vertices from the circle, it doesn't matter (front|back)Circle because the vertex locations are the same
    this._frontCircle.vertices.forEach((vert: Anchor, index: number) => {
      const coords = localMatrix.multiply(vert.x, vert.y, 1);
      this._frontFill.vertices[index + 1].x = coords[0];
      this._frontFill.vertices[index + 1].y = coords[1];
      this._backFill.vertices[index + 1].x = coords[0];
      this._backFill.vertices[index + 1].y = coords[1];
    });

    // the line from the end to the vertex will be drawn because the _(front|back)fill is closed
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
    return this._radius;
  }

  /**
   * Use this method to set the display of the angle marker using three vectors. The angle from vertex to start is *not* necessary the
   * the same as the angle form vertex to end. This method sets the _vertex, _start, _end vectors (all non-zero and unit) so that
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
    // turn off all display
    this.setVisible(false);

    // turn on only the ones needed for front normal display
    this._frontStraightVertexToStart.visible = true;
    this._glowingFrontStraightVertexToStart.visible = true;
    this._frontCircle.visible = true;
    this._glowingFrontCircle.visible = true;
    this._frontStraightEndToVertex.visible = true;
    this._glowingFrontStraightEndToVertex.visible = true;
    this._frontFill.visible = true;

    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    if (
      frontStyle?.angleMarkerDoubleArc &&
      frontStyle.angleMarkerDoubleArc === true
    ) {
      this._frontDouble.visible = true;
      this._glowingFrontDouble.visible = true;
    }
    if (
      frontStyle?.angleMarkerArrowHeads &&
      frontStyle.angleMarkerArrowHeads === true &&
      this._angleIsBigEnoughToDrawArrowHeads === true
    ) {
      this._frontArrowHeadPath.visible = true;
      this._glowingFrontArrowHeadPath.visible = true;
    }
    if (
      frontStyle?.angleMarkerTickMark &&
      frontStyle.angleMarkerTickMark === true
    ) {
      if (
        frontStyle?.angleMarkerDoubleArc &&
        frontStyle.angleMarkerDoubleArc === true
      ) {
        this._frontTickDouble.visible = true;
        this._glowingFrontTickDouble.visible = true;
      } else {
        this._frontTick.visible = true;
        this._glowingFrontTick.visible = true;
      }
    }
  }
  backGlowingDisplay(): void {
    // turn off all display
    this.setVisible(false);

    // turn on only the ones needed for back normal display
    this._backStraightVertexToStart.visible = true;
    this._glowingBackStraightVertexToStart.visible = true;
    this._backCircle.visible = true;
    this._glowingBackCircle.visible = true;
    this._backStraightEndToVertex.visible = true;
    this._glowingBackStraightEndToVertex.visible = true;
    this._backFill.visible = true;

    //const backStyle = this.styleOptions.get(StyleCategory.Back);
    // Double arc display on the back side is the same as the display on the front.
    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    if (
      frontStyle?.angleMarkerDoubleArc &&
      frontStyle.angleMarkerDoubleArc === true
    ) {
      this._backDouble.visible = true;
      this._glowingBackDouble.visible = true;
    }
    if (
      frontStyle?.angleMarkerArrowHeads &&
      frontStyle.angleMarkerArrowHeads === true &&
      this._angleIsBigEnoughToDrawArrowHeads === true
    ) {
      this._backArrowHeadPath.visible = true;
      this._glowingBackArrowHeadPath.visible = true;
    }
    if (
      frontStyle?.angleMarkerTickMark &&
      frontStyle.angleMarkerTickMark === true
    ) {
      if (
        frontStyle?.angleMarkerDoubleArc &&
        frontStyle.angleMarkerDoubleArc === true
      ) {
        this._backTickDouble.visible = true;
        this._glowingBackTickDouble.visible = true;
      } else {
        this._backTick.visible = true;
        this._glowingBackTick.visible = true;
      }
    }
  }
  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }
  frontNormalDisplay(): void {
    // turn off all display
    this.setVisible(false);

    // turn on only the ones needed for front normal display
    this._frontStraightVertexToStart.visible = true;
    this._frontCircle.visible = true;
    this._frontStraightEndToVertex.visible = true;
    this._frontFill.visible = true;

    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    if (
      frontStyle?.angleMarkerDoubleArc &&
      frontStyle.angleMarkerDoubleArc === true
    ) {
      this._frontDouble.visible = true;
    }

    if (
      frontStyle?.angleMarkerArrowHeads &&
      frontStyle.angleMarkerArrowHeads === true &&
      this._angleIsBigEnoughToDrawArrowHeads
    ) {
      this._frontArrowHeadPath.visible = true;
    }
    if (
      frontStyle?.angleMarkerTickMark &&
      frontStyle.angleMarkerTickMark === true
    ) {
      if (
        frontStyle?.angleMarkerDoubleArc &&
        frontStyle.angleMarkerDoubleArc === true
      ) {
        this._frontTickDouble.visible = true;
      } else {
        this._frontTick.visible = true;
      }
    }
  }
  backNormalDisplay(): void {
    // turn off all display
    this.setVisible(false);

    // turn on only the ones needed for back normal display
    this._backStraightVertexToStart.visible = true;
    this._backCircle.visible = true;
    this._backStraightEndToVertex.visible = true;
    this._backFill.visible = true;

    //const backStyle = this.styleOptions.get(StyleCategory.Back);
    // Double arc display on the back side is the same as the display on the front.
    const frontStyle = this.styleOptions.get(StyleCategory.Front);

    if (
      frontStyle?.angleMarkerDoubleArc &&
      frontStyle.angleMarkerDoubleArc === true
    ) {
      this._backDouble.visible = true;
    }
    if (
      frontStyle?.angleMarkerArrowHeads &&
      frontStyle.angleMarkerArrowHeads === true &&
      this._angleIsBigEnoughToDrawArrowHeads
    ) {
      this._backArrowHeadPath.visible = true;
    }
    if (
      frontStyle?.angleMarkerTickMark &&
      frontStyle.angleMarkerTickMark === true
    ) {
      if (
        frontStyle?.angleMarkerDoubleArc &&
        frontStyle.angleMarkerDoubleArc === true
      ) {
        this._backTickDouble.visible = true;
      } else {
        this._backTick.visible = true;
      }
    }
  }
  normalDisplay(): void {
    if (this._angleMarkerOnFront) {
      this.frontNormalDisplay();
    } else {
      this.backNormalDisplay();
    }
  }
  setVisible(flag: boolean): void {
    if (!flag) {
      // front
      this._frontStraightVertexToStart.visible = false;
      this._glowingFrontStraightVertexToStart.visible = false;

      this._frontCircle.visible = false;
      this._glowingFrontCircle.visible = false;

      this._frontStraightEndToVertex.visible = false;
      this._glowingFrontStraightEndToVertex.visible = false;

      this._frontFill.visible = false;

      // front decorators
      this._frontDouble.visible = false;
      this._glowingFrontDouble.visible = false;

      this._frontArrowHeadPath.visible = false;
      this._glowingFrontArrowHeadPath.visible = false;

      this._frontTick.visible = false;
      this._glowingFrontTick.visible = false;

      this._frontTickDouble.visible = false;
      this._glowingFrontTickDouble.visible = false;

      //back
      this._backStraightVertexToStart.visible = false;
      this._glowingBackStraightVertexToStart.visible = false;

      this._backCircle.visible = false;
      this._glowingBackCircle.visible = false;

      this._backStraightEndToVertex.visible = false;
      this._glowingBackStraightEndToVertex.visible = false;

      this._backFill.visible = false;

      // back decorators
      this._backDouble.visible = false;
      this._glowingBackDouble.visible = false;

      this._backArrowHeadPath.visible = false;
      this._glowingBackArrowHeadPath.visible = false;

      this._backTick.visible = false;
      this._glowingBackTick.visible = false;

      this._backTickDouble.visible = false;
      this._glowingBackTickDouble.visible = false;
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
   * Adds the front/back/glowing/not parts to the correct layers
   * @param layers
   */
  addToLayers(layers: Group[]): void {
    //front //added first is deeper
    this._frontFill.addTo(layers[LAYER.foregroundAngleMarkers]);

    this._frontCircle.addTo(layers[LAYER.foregroundAngleMarkers]);
    this._glowingFrontCircle.addTo(layers[LAYER.foregroundAngleMarkersGlowing]);

    this._frontStraightVertexToStart.addTo(
      layers[LAYER.foregroundAngleMarkers]
    );
    this._glowingFrontStraightVertexToStart.addTo(
      layers[LAYER.foregroundAngleMarkersGlowing]
    );

    this._frontStraightEndToVertex.addTo(layers[LAYER.foregroundAngleMarkers]);
    this._glowingFrontStraightEndToVertex.addTo(
      layers[LAYER.foregroundAngleMarkersGlowing]
    );

    // front decorators
    this._frontArrowHeadPath.addTo(layers[LAYER.foregroundAngleMarkers]);
    this._glowingFrontArrowHeadPath.addTo(
      layers[LAYER.foregroundAngleMarkersGlowing]
    );

    this._frontDouble.addTo(layers[LAYER.foregroundAngleMarkers]);
    this._glowingFrontDouble.addTo(layers[LAYER.foregroundAngleMarkersGlowing]);

    this._frontTick.addTo(layers[LAYER.foregroundAngleMarkers]);
    this._glowingFrontTick.addTo(layers[LAYER.foregroundAngleMarkersGlowing]);

    this._frontTickDouble.addTo(layers[LAYER.foregroundAngleMarkers]);
    this._glowingFrontTickDouble.addTo(
      layers[LAYER.foregroundAngleMarkersGlowing]
    );

    // back
    this._backFill.addTo(layers[LAYER.backgroundAngleMarkers]);

    this._backStraightVertexToStart.addTo(layers[LAYER.backgroundAngleMarkers]);
    this._glowingBackStraightVertexToStart.addTo(
      layers[LAYER.backgroundAngleMarkersGlowing]
    );

    this._backCircle.addTo(layers[LAYER.backgroundAngleMarkers]);
    this._glowingBackCircle.addTo(layers[LAYER.backgroundAngleMarkersGlowing]);

    this._backStraightEndToVertex.addTo(layers[LAYER.backgroundAngleMarkers]);
    this._glowingBackStraightEndToVertex.addTo(
      layers[LAYER.backgroundAngleMarkersGlowing]
    );

    // back decorators

    this._backArrowHeadPath.addTo(layers[LAYER.backgroundAngleMarkers]);
    this._glowingBackArrowHeadPath.addTo(
      layers[LAYER.backgroundAngleMarkersGlowing]
    );

    this._backDouble.addTo(layers[LAYER.backgroundAngleMarkers]);
    this._glowingBackDouble.addTo(layers[LAYER.backgroundAngleMarkersGlowing]);

    this._backTick.addTo(layers[LAYER.backgroundAngleMarkers]);
    this._glowingBackTick.addTo(layers[LAYER.backgroundAngleMarkersGlowing]);

    this._backTickDouble.addTo(layers[LAYER.backgroundAngleMarkers]);
    this._glowingBackTickDouble.addTo(
      layers[LAYER.backgroundAngleMarkersGlowing]
    );
  }

  removeFromLayers(): void {
    //front

    this._frontStraightVertexToStart.remove();
    this._glowingFrontStraightVertexToStart.remove();

    this._frontCircle.remove();
    this._glowingFrontCircle.remove();

    this._frontStraightEndToVertex.remove();
    this._glowingFrontStraightEndToVertex.remove();

    this._frontFill.remove();

    //front decorators
    this._frontArrowHeadPath.remove();
    this._glowingFrontArrowHeadPath.remove();

    this._frontDouble.remove();
    this._glowingFrontDouble.remove();

    this._frontTick.remove();
    this._glowingFrontTick.remove();

    this._frontTickDouble.remove();
    this._glowingFrontTickDouble.remove();

    //back
    this._backStraightVertexToStart.remove();
    this._glowingBackStraightVertexToStart.remove();

    this._backCircle.remove();
    this._glowingBackCircle.remove();

    this._backStraightEndToVertex.remove();
    this._glowingBackStraightEndToVertex.remove();

    this._backFill.remove();

    // back decorators
    this._backArrowHeadPath.remove();
    this._glowingBackArrowHeadPath.remove();

    this._backDouble.remove();
    this._glowingBackDouble.remove();

    this._backTick.remove();
    this._glowingBackTick.remove();

    this._backTickDouble.remove();
    this._glowingBackTickDouble.remove();
  }

  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(mode: StyleCategory, options: StyleOptions): void {
    // console.debug("Update style of Angle Marker using", options);
    super.updateStyle(mode, options);
    this.setVisible(true); // applies the decoration changes (we know that the angle marker is visible because the style panel won't let you edit hidden objects)
  }
  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleCategory): StyleOptions {
    switch (panel) {
      case StyleCategory.Front:
        return DEFAULT_ANGLE_MARKER_FRONT_STYLE;
      case StyleCategory.Back:
        if (SETTINGS.angleMarker.dynamicBackStyle) {
          return {
            ...DEFAULT_ANGLE_MARKER_BACK_STYLE,
            strokeWidthPercent: Nodule.contrastStrokeWidthPercent(100),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.angleMarker.drawn.strokeColor.front
            ),
            fillColor: Nodule.contrastStrokeColor(
              SETTINGS.angleMarker.drawn.fillColor.front
            )
          };
        } else return DEFAULT_ANGLE_MARKER_BACK_STYLE;

      default:
        return {};
    }
  }

  /**
   * Sets the variables for stroke width glowing/not
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    const backStyle = this.styleOptions.get(StyleCategory.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;

    //front
    this._frontStraightVertexToStart.linewidth =
      (AngleMarker.currentStraightStrokeWidthFront * frontStrokeWidthPercent) /
      100;
    this._glowingFrontStraightVertexToStart.linewidth =
      (AngleMarker.currentGlowingStraightStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;

    this._frontCircle.linewidth =
      (AngleMarker.currentCircularStrokeWidthFront * frontStrokeWidthPercent) /
      100;
    this._glowingFrontCircle.linewidth =
      (AngleMarker.currentGlowingCircularStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;

    this._frontStraightEndToVertex.linewidth =
      (AngleMarker.currentStraightStrokeWidthFront * frontStrokeWidthPercent) /
      100;
    this._glowingFrontStraightEndToVertex.linewidth =
      (AngleMarker.currentGlowingStraightStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;

    // front decorators
    this._frontArrowHeadPath.linewidth =
      (AngleMarker.currentCircularStrokeWidthFront * frontStrokeWidthPercent) /
      100;
    this._glowingFrontArrowHeadPath.linewidth =
      (AngleMarker.currentGlowingCircularStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;

    this._frontTick.linewidth =
      (AngleMarker.currentTickStrokeWidthFront * frontStrokeWidthPercent) / 100;

    this._glowingFrontTick.linewidth =
      (AngleMarker.currentGlowingTickStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;

    this._frontTickDouble.linewidth =
      (AngleMarker.currentTickStrokeWidthFront * frontStrokeWidthPercent) / 100;

    this._glowingFrontTickDouble.linewidth =
      (AngleMarker.currentGlowingTickStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;

    this._frontDouble.linewidth =
      (AngleMarker.currentCircularStrokeWidthFront * frontStrokeWidthPercent) /
      100;
    this._glowingFrontDouble.linewidth =
      (AngleMarker.currentGlowingCircularStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;

    // back
    this._backStraightVertexToStart.linewidth =
      (AngleMarker.currentStraightStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this._glowingBackStraightVertexToStart.linewidth =
      (AngleMarker.currentGlowingStraightStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;

    this._backCircle.linewidth =
      (AngleMarker.currentCircularStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this._glowingBackCircle.linewidth =
      (AngleMarker.currentGlowingCircularStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;

    this._backStraightEndToVertex.linewidth =
      (AngleMarker.currentStraightStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this._glowingBackStraightEndToVertex.linewidth =
      (AngleMarker.currentGlowingStraightStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;

    //back decorators
    this._backArrowHeadPath.linewidth =
      (AngleMarker.currentCircularStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this._glowingBackArrowHeadPath.linewidth =
      (AngleMarker.currentGlowingCircularStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;

    this._backTick.linewidth =
      (AngleMarker.currentTickStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;

    this._glowingBackTick.linewidth =
      (AngleMarker.currentGlowingTickStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;

    this._backTickDouble.linewidth =
      (AngleMarker.currentTickStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;

    this._glowingBackTickDouble.linewidth =
      (AngleMarker.currentGlowingTickStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;

    this._backDouble.linewidth =
      (AngleMarker.currentCircularStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this._glowingBackDouble.linewidth =
      (AngleMarker.currentGlowingCircularStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;

    // adjust the radius of the angle marker and the length of the tick mark using the angle marker radius scaling
    this._radius =
      (AngleMarker.currentRadius *
        (frontStyle?.angleMarkerRadiusPercent ?? 100)) /
      100;

    this._radiusDouble =
      (AngleMarker.currentRadiusDoubleArc *
        (frontStyle?.angleMarkerRadiusPercent ?? 100)) /
      100;

    this._tickMarkLength =
      (AngleMarker.currentTickLength *
        (frontStyle?.angleMarkerRadiusPercent ?? 100)) /
      100;

    // recompute the three vectors that determine the angle marker with the new angle marker radius
    this.setAngleMarkerFromThreeVectors(
      this._startVector,
      this._vertexVector,
      this._endVector,
      this._radius
    );
    // finally update the display
    this.updateDisplay();
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the angle marker
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // Use the SETTINGS temporary options to directly modify the js objects.

        //FRONT
        if (
          Nodule.hslaIsNoFillOrNoStroke(
            SETTINGS.angleMarker.temp.fillColor.front
          )
        ) {
          this._frontFill.noFill();
        } else {
          //If shading is not used
          this._frontFill.fill = SETTINGS.angleMarker.temp.fillColor.front;
        }
        if (
          Nodule.hslaIsNoFillOrNoStroke(
            SETTINGS.angleMarker.temp.strokeColor.front
          )
        ) {
          this._frontStraightVertexToStart.noStroke();
          this._frontCircle.noStroke();
          this._frontStraightEndToVertex.noStroke();
          this._frontArrowHeadPath.noStroke();
          this._frontArrowHeadPath.noFill(); // arrow head fill is the same as the stroke of the circle path
          //There are never tick marks or double decorators on temporary angle markers
        } else {
          this._frontStraightVertexToStart.stroke =
            SETTINGS.angleMarker.temp.strokeColor.front;

          this._frontCircle.stroke =
            SETTINGS.angleMarker.temp.strokeColor.front;

          this._frontStraightEndToVertex.stroke =
            SETTINGS.angleMarker.temp.strokeColor.front;

          this._frontArrowHeadPath.stroke =
            SETTINGS.angleMarker.temp.strokeColor.front;

          this._frontArrowHeadPath.fill =
            SETTINGS.angleMarker.temp.strokeColor.front; // arrow head fill is the same as the stroke of the circle path
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this._frontStraightVertexToStart.linewidth =
          AngleMarker.currentStraightStrokeWidthFront;

        this._frontCircle.linewidth =
          AngleMarker.currentCircularStrokeWidthFront;

        this._frontStraightEndToVertex.linewidth =
          AngleMarker.currentStraightStrokeWidthFront;

        this._backArrowHeadPath.linewidth =
          AngleMarker.currentCircularStrokeWidthFront;

        //There are never tick marks or double decorators on temporary angle markers

        // Copy the front dash properties from the front default drawn dash properties
        if (
          SETTINGS.angleMarker.drawn.dashArray.front.length > 0 &&
          SETTINGS.angleMarker.drawn.dashArray.front[0] !== 0 &&
          SETTINGS.angleMarker.drawn.dashArray.front[1] !== 0
        ) {
          this._frontCircle.dashes.clear();
          SETTINGS.angleMarker.drawn.dashArray.front.forEach(v => {
            this._frontCircle.dashes.push(v);
          });
          if (SETTINGS.angleMarker.drawn.dashArray.reverse.front) {
            this._frontCircle.dashes.reverse();
          }
        }
        //BACK
        if (
          Nodule.hslaIsNoFillOrNoStroke(
            SETTINGS.angleMarker.temp.fillColor.back
          )
        ) {
          this._backFill.noFill();
        } else {
          this._backFill.fill = SETTINGS.angleMarker.temp.fillColor.back;
        }
        if (
          Nodule.hslaIsNoFillOrNoStroke(
            SETTINGS.angleMarker.temp.strokeColor.back
          )
        ) {
          this._backStraightVertexToStart.noStroke();
          this._backCircle.noStroke();
          this._backStraightEndToVertex.noStroke();
          this._backArrowHeadPath.noStroke();
          this._backArrowHeadPath.noFill(); // arrow head fill is the same as the stroke of the circle path
          //There are never tick marks or double decorators on temporary angle markers
        } else {
          this._backStraightVertexToStart.stroke =
            SETTINGS.angleMarker.temp.strokeColor.back;

          this._backCircle.stroke = SETTINGS.angleMarker.temp.strokeColor.back;

          this._backStraightEndToVertex.stroke =
            SETTINGS.angleMarker.temp.strokeColor.back;

          this._backArrowHeadPath.stroke =
            SETTINGS.angleMarker.temp.strokeColor.back;
          this._backArrowHeadPath.fill =
            SETTINGS.angleMarker.temp.strokeColor.back; // arrow head fill is the same as the stroke of the circle path

          //There are never tick marks or double decorators on temporary angle markers
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this._backStraightVertexToStart.linewidth =
          AngleMarker.currentStraightStrokeWidthBack;

        this._backCircle.linewidth = AngleMarker.currentCircularStrokeWidthBack;

        this._backStraightEndToVertex.linewidth =
          AngleMarker.currentStraightStrokeWidthBack;

        this._backArrowHeadPath.linewidth =
          AngleMarker.currentCircularStrokeWidthBack;

        //There are never tick marks or double decorators on temporary angle markers

        // Copy the front dash properties from the front default drawn dash properties
        if (
          SETTINGS.angleMarker.drawn.dashArray.back.length > 0 &&
          SETTINGS.angleMarker.drawn.dashArray.back[0] !== 0 &&
          SETTINGS.angleMarker.drawn.dashArray.back[1] !== 0
        ) {
          this._backCircle.dashes.clear();
          SETTINGS.angleMarker.drawn.dashArray.back.forEach(v => {
            this._backCircle.dashes.push(v);
          });
          if (SETTINGS.angleMarker.drawn.dashArray.reverse.back) {
            this._backCircle.dashes.reverse();
          }
        }
        // The temporary display is never highlighted
        // front
        this._glowingFrontStraightVertexToStart.visible = false;
        this._glowingFrontCircle.visible = false;
        this._glowingFrontStraightEndToVertex.visible = false;

        // front decorators
        this._glowingFrontArrowHeadPath.visible = false;
        this._glowingFrontDouble.visible = false;
        this._glowingFrontTick.visible = false;

        // back
        this._glowingBackStraightVertexToStart.visible = false;
        this._glowingBackCircle.visible = false;
        this._glowingBackStraightEndToVertex.visible = false;

        // back decoratores

        this._glowingBackDouble.visible = false;
        this._glowingBackArrowHeadPath.visible = false;
        this._glowingBackTick.visible = false;

        //The double arc is never shown in the temporary display
        this._backDouble.visible = false;
        this._frontDouble.visible = false;

        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the js objects.

        // FRONT
        const frontStyle = this.styleOptions.get(StyleCategory.Front);
        if (Nodule.hslaIsNoFillOrNoStroke(frontStyle?.fillColor)) {
          this._frontFill.noFill();
        } else {
          this._frontFill.fill =
            frontStyle?.fillColor ?? SETTINGS.angleMarker.drawn.fillColor.front;
        }

        if (Nodule.hslaIsNoFillOrNoStroke(frontStyle?.strokeColor)) {
          this._frontStraightVertexToStart.noStroke();
          this._frontCircle.noStroke();
          this._frontStraightEndToVertex.noStroke();

          this._frontDouble.noStroke();
          this._frontTick.noStroke();
          this._frontTickDouble.noStroke();
          this._frontArrowHeadPath.noStroke();
          this._frontArrowHeadPath.noFill(); // arrow head fill is the same as the stroke of the circle path
        } else {
          this._frontStraightVertexToStart.stroke =
            frontStyle?.strokeColor ?? "black";
          this._frontCircle.stroke = frontStyle?.strokeColor ?? "black";
          this._frontStraightEndToVertex.stroke =
            frontStyle?.strokeColor ?? "black";

          this._frontDouble.stroke = frontStyle?.strokeColor ?? "black";
          this._frontTick.stroke = frontStyle?.strokeColor ?? "black";
          this._frontTickDouble.stroke = frontStyle?.strokeColor ?? "black";
          this._frontArrowHeadPath.stroke = frontStyle?.strokeColor ?? "black";
          this._frontArrowHeadPath.fill = frontStyle?.strokeColor ?? "black"; // arrow head fill is the same as the stroke of the circle path
        }
        // strokeWidthPercent is applied by adjustSize()
        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle.dashArray.length > 0 &&
          frontStyle.dashArray[0] !== 0 &&
          frontStyle.dashArray[1] !== 0
        ) {
          this._frontCircle.dashes.clear();
          this._frontDouble.dashes.clear();

          this._frontCircle.dashes.push(...frontStyle.dashArray);
          this._frontDouble.dashes.push(...frontStyle.dashArray);

          if (frontStyle.reverseDashArray) {
            this._frontCircle.dashes.reverse();
            this._frontDouble.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._frontCircle.dashes.clear();
          this._frontCircle.dashes.push(0);
          this._frontDouble.dashes.clear();
          this._frontDouble.dashes.push(0);
        }

        // BACK
        const backStyle = this.styleOptions.get(StyleCategory.Back);
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hslaIsNoFillOrNoStroke(
              Nodule.contrastFillColor(frontStyle?.fillColor)
            )
          ) {
            this._backFill.noFill();
          } else {
            this._backFill.fill = Nodule.contrastFillColor(
              frontStyle?.fillColor ?? "black"
            );
          }
        } else {
          if (Nodule.hslaIsNoFillOrNoStroke(backStyle?.fillColor)) {
            this._backFill.noFill();
          } else {
            this._backFill.fill = backStyle?.fillColor ?? "black";
          }
        }

        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hslaIsNoFillOrNoStroke(
              Nodule.contrastStrokeColor(frontStyle?.strokeColor)
            )
          ) {
            this._backStraightVertexToStart.noStroke();
            this._backCircle.noStroke();
            this._backStraightEndToVertex.noStroke();

            this._backDouble.noStroke();
            this._backTick.noStroke();
            this._backTickDouble.noStroke();
            this._backArrowHeadPath.noStroke();
            this._backArrowHeadPath.noFill(); // arrow head fill is the same as the stroke of the circle path
          } else {
            this._backStraightVertexToStart.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
            this._backCircle.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
            this._backStraightEndToVertex.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );

            this._backDouble.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
            this._backTick.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
            this._backTickDouble.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
            this._backArrowHeadPath.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
            this._backArrowHeadPath.fill = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black" // arrow head fill is the same as the stroke of the circle path
            );
          }
        } else {
          if (Nodule.hslaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this._backStraightVertexToStart.noStroke();
            this._backCircle.noStroke();
            this._backStraightEndToVertex.noStroke();

            this._backDouble.noStroke();
            this._backTick.noStroke();
            this._backArrowHeadPath.noStroke();
            this._backArrowHeadPath.noFill(); // arrow head fill is the same as the stroke of the circle path
          } else {
            this._backStraightVertexToStart.stroke =
              backStyle?.strokeColor ?? "black";
            this._backCircle.stroke = backStyle?.strokeColor ?? "black";
            this._backStraightEndToVertex.stroke =
              backStyle?.strokeColor ?? "black";

            this._backDouble.stroke = backStyle?.strokeColor ?? "black";
            this._backTick.stroke = backStyle?.strokeColor ?? "black";
            this._backArrowHeadPath.stroke = backStyle?.strokeColor ?? "black";
            this._backArrowHeadPath.fill = backStyle?.strokeColor ?? "black"; // arrow head fill is the same as the stroke of the circle path
          }
        }

        // strokeWidthPercent applied by adjustSizer()
        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0 &&
          backStyle.dashArray[0] !== 0 &&
          backStyle.dashArray[1] !== 0
        ) {
          this._backCircle.dashes.clear();
          this._backDouble.dashes.clear();
          this._backCircle.dashes.push(...backStyle.dashArray);
          this._backDouble.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this._backCircle.dashes.reverse();
            this._backDouble.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._backCircle.dashes.clear();
          this._backCircle.dashes.push(0);
          this._backDouble.dashes.clear();
          this._backDouble.dashes.push(0);
        }

        // UPDATE the glowing object

        // Glowing Front
        // no fillColor for glowing circles

        this._glowingFrontStraightVertexToStart.stroke =
          this.glowingStrokeColorFront;
        this._glowingFrontCircle.stroke = this.glowingStrokeColorFront;
        this._glowingFrontStraightEndToVertex.stroke =
          this.glowingStrokeColorFront;

        this._glowingFrontDouble.stroke = this.glowingStrokeColorFront;
        this._glowingFrontTick.stroke = this.glowingStrokeColorFront;
        this._glowingFrontTickDouble.stroke = this.glowingStrokeColorFront;
        this._glowingFrontArrowHeadPath.stroke = this.glowingStrokeColorFront;

        // strokeWidthPercent applied by adjustSize()
        // Copy the front dash properties to the glowing object
        if (
          frontStyle?.dashArray &&
          frontStyle.dashArray.length > 0 &&
          frontStyle.dashArray[0] !== 0 &&
          frontStyle.dashArray[1] !== 0
        ) {
          this._glowingFrontCircle.dashes.clear();
          this._glowingFrontDouble.dashes.clear();
          this._glowingFrontCircle.dashes.push(...frontStyle.dashArray);
          this._glowingFrontDouble.dashes.push(...frontStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this._glowingFrontCircle.dashes.clear();
          this._glowingFrontCircle.dashes.push(0);
          this._glowingFrontDouble.dashes.clear();
          this._glowingFrontDouble.dashes.push(0);
        }

        // Glowing Back
        // no fillColor for glowing circles
        this._glowingBackStraightVertexToStart.stroke =
          this.glowingStrokeColorBack;
        this._glowingBackCircle.stroke = this.glowingStrokeColorBack;
        this._glowingBackStraightEndToVertex.stroke =
          this.glowingStrokeColorBack;

        this._glowingBackDouble.stroke = this.glowingStrokeColorBack;
        this._glowingBackTick.stroke = this.glowingStrokeColorBack;
        this._glowingBackTickDouble.stroke = this.glowingStrokeColorBack;
        this._glowingBackArrowHeadPath.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()
        // Copy the back dash properties to the glowing object
        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0 &&
          backStyle.dashArray[0] !== 0 &&
          backStyle.dashArray[1] !== 0
        ) {
          this._glowingBackCircle.dashes.clear();
          this._glowingBackDouble.dashes.clear();
          this._glowingBackCircle.dashes.push(...backStyle.dashArray);
          this._glowingBackDouble.dashes.push(...backStyle.dashArray);

          if (backStyle.reverseDashArray) {
            this._glowingBackCircle.dashes.reverse();
            this._glowingBackDouble.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._glowingBackCircle.dashes.clear();
          this._glowingBackCircle.dashes.push(0);
          this._glowingBackDouble.dashes.clear();
          this._glowingBackDouble.dashes.push(0);
        }
        break;
      }
    }
  }
}
