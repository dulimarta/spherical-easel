// Declaration of all internal data types

import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SENodule } from "@/models/SENodule";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { Vector2, Vector3 } from "three";
import { SEEllipse } from "@/models/SEEllipse";
import { SEParametric } from "@/models/SEParametric";
import { SyntaxTree } from "@/expression/ExpressionParser";
import { SEPolygon } from "@/models/SEPolygon";
import { SETranslation } from "@/models/SETranslation";
import { SERotation } from "@/models/SERotation";
import { SEReflection } from "@/models/SEReflection";
import { SEPointReflection } from "@/models/SEPointReflection";
import { SEPoint } from "@/models/SEPoint";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEExpression } from "@/models/SEExpression";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { LAYER } from "@/global-settings";
// import "@types/google.maps"

export interface Selectable {
  hit(x: number, y: number, coord: unknown, who: unknown): boolean;
}

/* This interface lists all the properties that each tool/button must have. */
export type ToolButtonGroup = {
  group: string;
  children: Array<ToolButtonType>;
};

export type ToolButtonType = {
  action: ActionMode;
  // Shortcut icons (undo, redo, clear) buttons will use this, other buttons will not use this
  clickFunc?: () => void;
  displayedName: string;
  icon?: string;
  toolGroup?: string;
  toolUseMessage: string;
  toolTipMessage: string;
};

//type Concat<S1 extends string, S2 extends string> = `${S1}${S2}`;

//type ToString<T extends string | number | boolean | bigint> = `${T}`;

// type IntersectionPointOtherParentNameType<N extends number> =
//   `intersectionPointOtherParent${N}`;

export type SavedNames =
  | "objectName"
  | "objectExists"
  | "objectShowing"
  | "objectFrontStyle"
  | "objectBackStyle"
  | "pointImmediatelyVisible"
  | "labelName"
  | "labelStyle"
  | "labelVector"
  | "labelShowing"
  | "labelExists"
  | "valueDisplayMode"
  | "pointVector"
  | "antipodalPointsParentName"
  | "antipodalPointIsUserCreated"
  | "angleMarkerMode"
  | "angleMarkerFirstParentName"
  | "angleMarkerSecondParentName"
  | "angleMarkerThirdParentName"
  | "circleRadius"
  | "circleCenterPointName"
  | "circlePointOnCircleName"
  | "measuredCircleRadiusExpression"
  | "ellipseFocus1Name"
  | "ellipseFocus2Name"
  | "ellipsePointOnEllipseName"
  | "lineNormalVector"
  | "lineStartPointName"
  | "lineEndPointName"
  | "segmentNormalVector"
  | "segmentArcLength"
  | "segmentStartPointName"
  | "segmentEndPointName"
  | "intersectionPointPrincipleParent1Name"
  | "intersectionPointPrincipleParent2Name"
  | "intersectionPointOtherParentArrayLength"
  | "intersectionPointOtherParentArrayNameList"
  | "intersectionPointName"
  | "intersectionPointOtherParentInfoName1"
  | "intersectionPointOtherParentInfoName2"
  | "intersectionPointOtherParentInfoOrder"
  | "intersectionPointInfoNewPrincipleParent1"
  | "intersectionPointInfoNewPrincipleParent2"
  | "intersectionPointOtherParentInfoNewOrder"
  | "intersectionPointUserCreated"
  | "intersectionPointOrder"
  | "intersectionPointVector"
  | "inverseRotationMatrix"
  | "pointOnOneOrTwoDimensionalParentName"
  | "pointOnOneOrTwoDimensionalVector"
  | "parametricXCoordinateExpression"
  | "parametricYCoordinateExpression"
  | "parametricZCoordinateExpression"
  | "parametricMinExpression"
  | "parametricMaxExpression"
  | "parametricMinNumber"
  | "parametricMaxNumber"
  | "parametricCurveClosed"
  | "parametricExpressionParentsNames"
  | "parametricCuspParameterValues"
  | "parametricEndPointParametricParentName"
  | "parametricEndPointseStartEndPointName"
  | "parametricEndPointseStartEndPointLocationVector"
  | "parametricEndPointseStartEndPointShowing"
  | "parametricEndPointseStartEndPointExists"
  | "parametricEndPointseStartEndPointFrontStyle"
  | "parametricEndPointseStartEndPointBackStyle"
  | "parametricEndPointseEndEndPointName"
  | "parametricEndPointseEndEndPointLocationVector"
  | "parametricEndPointseEndEndPointShowing"
  | "parametricEndPointseEndEndPointExists"
  | "parametricEndPointseEndEndPointFrontStyle"
  | "parametricEndPointseEndEndPointBackStyle"
  | "parametricEndPointseTracePointName"
  | "parametricEndPointseTracePointLocationVector"
  | "parametricEndPointseTracePointShowing"
  | "parametricEndPointseTracePointExists"
  | "parametricEndPointseTracePointFrontStyle"
  | "parametricEndPointseTracePointBackStyle"
  | "parametricEndPointseStartLabelName"
  | "parametricEndPointseStartLabelLocationVector"
  | "parametricEndPointseStartLabelShowing"
  | "parametricEndPointseStartLabelExists"
  | "parametricEndPointseStartLabelLabelStyle"
  | "parametricEndPointseEndLabelName"
  | "parametricEndPointseEndLabelLocationVector"
  | "parametricEndPointseEndLabelShowing"
  | "parametricEndPointseEndLabelExists"
  | "parametricEndPointseEndLabelLabelStyle"
  | "parametricEndPointseTraceLabelName"
  | "parametricEndPointseTraceLabelLocationVector"
  | "parametricEndPointseTraceLabelShowing"
  | "parametricEndPointseTraceLabelExists"
  | "parametricEndPointseTraceLabelLabelStyle"
  | "seNSectLineStartSEPointName"
  | "seNSectLineEndSEPointLocationVector"
  | "seNSectLineNormalVector"
  | "seNSectLineParentAngleName"
  | "seNSectLineIndex"
  | "seNSectLineN"
  | "seNSectPointVector"
  | "seNSectPointParentSegmentName"
  | "seNSectPointIndex"
  | "seNSectPointN"
  | "polarLineParentPointName"
  | "polarLineStartSEPointLocationVector"
  | "polarLineEndSEPointLocationVector"
  | "polarPointVector"
  | "polarPointParentName"
  | "polarPointIndex"
  | "perpendicularLineThruPointParentPointName"
  | "perpendicularLineThruPointEndSEPointLocationVector"
  | "perpendicularLineThruPointNormalVector"
  | "perpendicularLineThruPointParentOneDimensionalName"
  | "perpendicularLineThruPointIndex"
  | "tangentLineThruPointParentPointName"
  | "tangentLineThruPointEndSEPointLocationVector"
  | "tangentLineThruPointNormalVector"
  | "tangentLineThruPointParentOneDimensionalName"
  | "tangentLineThruPointIndex"
  | "polygonAngleMarkerParentsNames"
  | "polygonSegmentParentsNames"
  | "polygonSegmentFlippedList"
  | "lengthMeasurementSegmentParentName"
  | "distanceMeasurementParentPoint1Name"
  | "distanceMeasurementParentPoint2Name"
  | "calculationExpressionString"
  | "calculationParentsNames"
  | "locationMeasurementParentPointName"
  | "locationMeasurementSelector"
  | "sliderMeasurementMin"
  | "sliderMeasurementMax"
  | "sliderMeasurementStep"
  | "sliderMeasurementValue"
  | "threePointCircleParentPoint1Name"
  | "threePointCircleParentPoint2Name"
  | "threePointCircleParentPoint3Name"
  | "translationSegmentParentName"
  | "translationDistanceExpressionName"
  | "rotationPointName"
  | "rotationAngleExpressionName"
  | "reflectionLineOrSegmentName"
  | "pointReflectionPointName"
  | "inversionCircleName"
  | "transformedPointParentTransformationName"
  | "transformedPointParentName"
  | "isometrySegmentParentIsometryName"
  | "isometrySegmentParentName"
  | "isometrySegmentStartSEPointName"
  | "isometrySegmentEndSEPointName"
  | "isometryLineParentIsometryName"
  | "isometryLineParentName"
  | "isometryLineStartSEPointName"
  | "isometryLineEndSEPointName"
  | "isometryCircleParentIsometryName"
  | "isometryCircleParentName"
  | "isometryCircleCenterSEPointName"
  | "isometryCircleCircleSEPointName"
  | "isometryEllipseParentIsometryName"
  | "isometryEllipseParentName"
  | "isometryEllipseFocus1SEPointName"
  | "isometryEllipseFocus2SEPointName"
  | "isometryEllipseEllipseSEPointName"
  | "invertedCircleCenterLineOrCircleParentName"
  | "invertedCircleCenterParentInversionName"
  | "convertToUserCreatedIntersectionPointName"
  | "setValueDisplayModeOldValue"
  | "setValueDisplayModeNewValue"
  | "pointVisibleBefore"
  | "earthLatitude"
  | "earthLongitude"
  | "textObjectText"
  | "textStyle"
  | "currentGlobalFillStyle"
  | "pastGlobalFillStyle"
  | "currentGlobalBackStyleContrast"
  | "pastGlobalBackStyleContrast";

export type ActionMode =
  | "angle"
  | "antipodalPoint"
  | "circle"
  | "coordinate"
  | "delete"
  | "ellipse"
  | "hide"
  | "iconFactory"
  | "intersect"
  | "line"
  | "move"
  | "perpendicular"
  | "tangent"
  | "point"
  | "pointDistance"
  | "pointOnObject"
  | "polar"
  | "rotate"
  | "segment"
  | "segmentLength"
  | "select"
  | "toggleLabelDisplay"
  | "zoomFit"
  | "zoomIn"
  | "zoomOut"
  | "measureTriangle"
  | "measurePolygon"
  | "midpoint"
  | "nSectPoint"
  | "angleBisector"
  | "nSectLine"
  | "threePointCircle"
  | "measuredCircle"
  | "translation"
  | "rotation"
  | "reflection"
  | "pointReflection"
  | "inversion"
  | "applyTransformation"
  | "undoAction"
  | "redoAction"
  | "resetAction"
  | "text"
  | "dummy" /* Use this entry to create a new actionMode for a new tool */;

export type IconNames =
  | ActionMode
  | "slider"
  | "toolsTab"
  | "objectsTab"
  | "constructionsTab"
  | "earthTab"
  | "calculationObject"
  | "measurementObject"
  | "styleDrawer"
  | "closePanelRight"
  | "labelPopOverTab"
  | "labelTextEditTab"
  | "labelColorFamilyTab"
  | "labelTextFamilyTab"
  | "downloadConstruction"
  | "shareConstruction"
  | "deleteConstruction"
  | "cycleNodeValueDisplayMode"
  | "showNode"
  | "hideNode"
  | "showNodeLabel"
  | "hideNodeLabel"
  | "deleteNode"
  | "appSettings"
  | "clearConstruction"
  | "undo"
  | "redo"
  | "copyToClipboard"
  | "notifications"
  | "earthPoint"
  | "earthLatitude"
  | "earthLongitude"
  | "parametric"
  | "transformedCircle"
  | "transformedEllipse"
  | "transformedLine"
  | "transformedPoint"
  | "transformedSegment";

export enum Poles {
  NORTH,
  SOUTH
}

export enum FillStyle {
  NoFill,
  PlainFill,
  ShadeFill
}

export interface AntipodalPointPair {
  newPoint: SEPoint;
  newAntipode: SEAntipodalPoint | null;
}
/**
 * Intersection Vector3 and if that intersection exists
 */
export interface IntersectionReturnType {
  vector: Vector3;
  exists: boolean;
}

export type ParametricIntersectionType = {
  s: number;
  t: number;
  vector: Vector3;
};

/**
 * Intersection and if that intersection exists
 */
export interface SEIntersectionReturnType {
  SEIntersectionPoint: SEIntersectionPoint;
  parent1: SEOneDimensional; // parents are always ordered correctly
  parent2: SEOneDimensional;
  existingIntersectionPoint: boolean; // if this is true then SEIntersectionPoint exists, remember the possibility that this will be true if the SEIntersectionPoint existed before or *during* the execution of the commands adding a new SEOneDimensional object and its intersections.
  createAntipodalPoint: boolean; // This is true if a *new* intersection point doesn't have an existing antipode, so this is only false if parent1 and parent2 are both non-straight one dimensional objects
  order: number; // If existingIntersectionPoint is true, then this is the order of the intersection. i.e. Assuming parent1 and parent2 are in the correct order, intersectTwoObjects(parent1,parent2)[order] is this intersection point. If existingIntersectionPoint is false this number has no meaning.
}

/**
 * For a parametric equation P(t), this is the pair P(t), t
 */
export type ParametricVectorAndTValue = {
  vector: Vector3;
  tVal: number;
};
// The following type is used for calculating perpendicular lines from a point
export type NormalAndPerpendicularPoint = {
  normal: Vector3; // The normal vector of the perpendicular line
  normalAt: Vector3; // The intersection between the perpendicular line and the target
};

export type NormalAndTangentPoint = {
  normal: Vector3; // The normal vector of the tangent line
  tangentAt: Vector3; // The location of the tangent point
};
export interface OneDimensional {
  /**
   * Returns the closest vector on the one dimensional object to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector location on the sphere
   */
  closestVector(idealUnitSphereVector: Vector3): Vector3;

  /**
   * Return the normal vector(s) to the plane containing a line that is perpendicular to this one dimensional through the
   * sePoint, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned)
   * @param sePointVector A point on the line normal to this parametric
   */
  getNormalsToPerpendicularLinesThru(
    sePointVector: Vector3,
    oldNormal: Vector3, // ignored for Ellipse and Circle and Parametric, but not other one-dimensional objects
    useFullTInterval?: boolean // only used in the constructor when figuring out the maximum number of perpendiculars to a SEParametric
  ): Array<NormalAndPerpendicularPoint>;
}

export interface Labelable {
  /**
   * Returns the closest label location vector on the parent object to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector location on the sphere
   */
  closestLabelLocationVector(
    idealUnitSphereVector: Vector3,
    zoomMagnificationFactor: number
  ): Vector3;
  label?: SELabel;
}
/**
 * A variable types for polygon
 */

export type location = {
  x: number;
  y: number;
  front: boolean;
};
export type visitedIndex = {
  index: number;
  visited: boolean;
};
/**
 * The variable types for parametric objects
 */
export type CoordExpression = {
  x: string;
  y: string;
  z: string;
};

export type MinMaxExpression = {
  min: string;
  max: string;
};

export type CoordinateSyntaxTrees = {
  x: SyntaxTree;
  y: SyntaxTree;
  z: SyntaxTree;
};

export type MinMaxSyntaxTrees = {
  min: SyntaxTree;
  max: SyntaxTree;
};

export type MinMaxNumber = {
  min: number;
  max: number;
};

/**
 * The properties of a plottable object needed when creating icons
 */
export type toSVGType = {
  frontGradientDictionary: Map<
    svgGradientType,
    string | Map<svgStopType, string>[]
  > | null; // front gradient gradient dictionary (if any)
  backGradientDictionary: Map<
    svgGradientType,
    string | Map<svgStopType, string>[]
  > | null; // back gradient gradient dictionary (if any)
  frontStyleDictionary: Map<svgStyleType, string> | null; // front style dictionary (if any)
  backStyleDictionary: Map<svgStyleType, string> | null; // back style dictionary (if any)
  layerSVGArray: Array<[LAYER, string]>; // layer, SVG string array
  type: plottableType;
};

export type toSVGReturnType = null | toSVGType;

export type svgArcObject = {
  startPt: { x: number; y: number };
  radiiXYWithSpace: string;
  rotationDegrees: number;
  displayShort0OrLong1: 0 | 1;
  displayCCW0OrCW1: 0 | 1;
  endPt: { x: number; y: number };
};

export type svgStyleType =
  | "fill"
  | "fill-opacity"
  | "stroke"
  | "stroke-width"
  | "stroke-opacity"
  | "stroke-linecap"
  | "stroke-linejoin"
  | "stroke-miterlimit"
  | "stroke-dasharray"
  | "stroke-dashoffset"
  | "font-family"
  | "font-size"
  | "line-height"
  | "text-anchor"
  | "dominant-baseline"
  | "font-style"
  | "font-weight"
  | "text-decoration"
  | "direction"
  | "vector-effect";

export type svgGradientType =
  | "cx"
  | "cy"
  | "fx"
  | "fy"
  | "radius"
  | "gradientUnits"
  | "spreadMethod"
  | "r"
  | "stops";

export type svgStopType = "offset" | "stop-color" | "stop-opacity";

export type plottableType =
  | "boundaryCircle"
  | "point"
  | "line"
  | "label"
  | "segment"
  | "circle"
  | "ellipse"
  | "parametric"
  | "polygon"
  | "angleMarkerFill"
  | "angleMarkerCircle"
  | "angleMarkerTick"
  | "angleMarkerDouble"
  | "angleMarkerEdge"
  | "angleMarkerArrowHead"
  | "angleMarker"
  | "text";

export type sides = "front" | "back" | "mid";

export type plottableProperties = {
  type: plottableType;
  side: sides;
  fill: boolean;
  part: string;
};
/**
 * All the one or two dimensional SE Classes
 */
export type SEOneOrTwoDimensional =
  | SELine
  | SESegment
  | SECircle
  | SEEllipse
  | SEParametric
  | SEPolygon;

export type SEOneDimensional =
  | SELine
  | SESegment
  | SECircle
  | SEEllipse
  | SEParametric;

export type SEMeasurable =
  | SESegment
  | SECircle
  | SEPolygon
  | SEAngleMarker
  | SEExpression;

export type SEOneDimensionalNotStraight = SECircle | SEEllipse | SEParametric;

export type SEFillable = SECircle | SEEllipse | SEPolygon;
/**
 * There are three modes for displaying a value of a measurement.
 */
export enum ValueDisplayMode {
  Number, // just the raw number is displayed
  MultipleOfPi, // convert to multiples of pi for display
  DegreeDecimals, // convert to degrees for display
  EarthModeMiles, // convert lengths/areas to miles/sq miles ONLY AVAILABLE IN EARTH MODE (for point coordinates display x,y,z on Earth Coordinates)
  EarthModeKilos // convert length/areas to km/sq km ONLY AVAILABLE IN EARTH MODE (for point coordinates display longitude, latitude Coordinates)
}

export enum LabelDisplayMode {
  NameOnly, // display only the name
  CaptionOnly, // display the caption only
  ValueOnly, // display the value only (if any)
  NameAndCaption, // display the name and caption
  NameAndValue // display the name and value (if any)
}

/*******************************************UPDATE TYPES **********************/
export type SEIsometry =
  | SETranslation
  | SERotation
  | SEReflection
  | SEPointReflection;

// This type definition seems to be unused in other files
// but used only internally here
/*export */ type ObjectNames =
  | "angleMarker"
  | "antipodalPoint"
  | "calculation"
  | "circle"
  | "ellipse"
  | "intersectionPoint"
  | "label"
  | "line"
  | "nSectLine"
  | "nSectPoint"
  | "parametric"
  | "parametricEndPoint"
  | "parametricTracePoint"
  | "perpendicularLineThruPoint"
  | "point"
  | "pointCoordinate"
  | "pointDistance"
  | "pointOnOneOrTwoDimensional"
  | "polarLine"
  | "polarPoint"
  | "polygon"
  | "segment"
  | "segmentLength"
  | "slider"
  | "tangentLineThruPoint"
  | "threePointCircleCenter"
  | "translation"
  | "text"
  | "rotation"
  | "reflection"
  | "inversion"
  | "pointReflection"
  | "transformedPoint"
  | "isometrySegment"
  | "isometryLine"
  | "isometryCircle"
  | "isometryEllipse"
  | "invertedCircleCenter";

export type LabelParentTypes =
  | "angleMarker"
  | "circle"
  | "ellipse"
  | "line"
  | "parametric"
  | "point"
  | "polygon"
  | "segment";

export interface ObjectState {
  kind: ObjectNames;
  object: SENodule;
  normalVector?: Vector3;
  arcLength?: number;
  locationVector?: Vector3 | Vector2; // Vector2 is only used for the SeText objects
  sliderValue?: number;
}

/* Reference to a user's favorite tool in settings */

/* UserProfile as stored in Firestore "users" collection */
export interface UserProfile {
  profilePictureURL?: string;
  displayName: string;
  location: string;
  role: string;
  favoriteTools: string;
  preferredLanguage: string;
  userStarredConstructions: Array<string>;
  // User preferences are stored in a nested object so we can add more prefs
  // without polluting top-level fields on the user document.
  preferences?: {
    defaultFill?: FillStyle;
    easelDecimalPrecision?: number;
    hierarchyDecimalPrecision?: number;
    notificationLevels?: string[];
  };
}

export enum AngleMode {
  NONE,
  LINES,
  POINTS,
  SEGMENTS,
  LINEANDSEGMENT,
  SEGMENTSORLINEANDSEGMENT
}

export enum SliderPlaybackMode {
  ONCE,
  LOOP,
  REFLECT
}
