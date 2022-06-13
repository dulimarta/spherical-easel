// Declaration of all internal data types

import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SENodule } from "@/models/SENodule";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { Matrix4, Vector3 } from "three";
import { StyleEditPanels } from "@/types/Styles";
import { SEEllipse } from "@/models/SEEllipse";
import { SEParametric } from "@/models/SEParametric";
import { SyntaxTree } from "@/expression/ExpressionParser";
import { SEPolygon } from "@/models/SEPolygon";
import { Socket } from "socket.io-client";

export interface Selectable {
  hit(x: number, y: number, coord: unknown, who: unknown): boolean;
}

export type PiniaAppState = {
  actionMode: ActionMode;
  previousActionMode: ActionMode;
  activeToolName: string;
  previousActiveToolName: string;
  zoomMagnificationFactor: number;
  zoomTranslation: number[];
  hasUnsavedNodules: boolean;
  svgCanvas: HTMLDivElement | null;
  canvasWidth: number;
  inverseTotalRotationMatrix: Matrix4; // Initially the identity. This is the composition of all the inverses of the rotation matrices applied to the sphere.
  styleSavedFromPanel: StyleEditPanels;
};
export interface AccountState {
  temporaryProfilePicture: string;
  userRole: string | undefined;
  userEmail: string | undefined;
  includedTools: Array<ActionMode>;
  excludedTools: Array<ActionMode>;
}

export type StudioState = {
  // Socket.io associated with a teacher Studio
  studioSocket: Socket | null;
  // The Socket "room" id to which this user connects to
  studioID: string | null;
  // Should drawing commands be broadcasted?
  broadcast: boolean;
};

/* This interface lists all the properties that each tool/button must have. */
export type ToolButtonGroup = {
  group: string;
  children: Array<ToolButtonType>;
};

export type ToolButtonType = {
  id: number;
  actionModeValue: ActionMode;
  displayToolUseMessage: boolean;
  displayedName: string;
  icon: string;
  // toolGroup: string;
  toolUseMessage: string;
  toolTipMessage: string;
};

export type SavedNames =
  | "objectName"
  | "objectExists"
  | "objectShowing"
  | "objectFrontStyle"
  | "objectBackStyle"
  | "labelName"
  | "labelStyle"
  | "labelVector"
  | "labelShowing"
  | "labelExists"
  | "pointVector"
  | "antipodalPointsParentName"
  | "angleMarkerMode"
  | "angleMarkerFirstParentName"
  | "angleMarkerSecondParentName"
  | "angleMarkerThirdParentName"
  | "circleRadius"
  | "circleCenterPointName"
  | "circlePointOnCircleName"
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
  | "intersectionPointParent1Name"
  | "intersectionPointParent2Name"
  | "intersectionPointUserCreated"
  | "intersectionPointOrder"
  | "intersectionPointVector"
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
  | "calculationExpressionString"
  | "calculationParentsNames"
  | "locationMeasurementParentPointName"
  | "locationMeasurementSelector"
  | "sliderMeasurementMin"
  | "sliderMeasurementMax"
  | "sliderMeasurementStep"
  | "sliderMeasurementValue";

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
  | "nSectLine";

export type IconNames =
  | ActionMode
  | "slider"
  | "toolsTab"
  | "objectsTab"
  | "constructionsTab"
  | "calculationObject"
  | "measurementObject"
  | "stylePanel"
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
  | "redo";

/**
 * Intersection Vector3 and if that intersection exists
 */
export interface IntersectionReturnType {
  vector: Vector3;
  exists: boolean;
}

/**
 * Intersection Vector3 and if that intersection exists
 */
export interface SEIntersectionReturnType {
  SEIntersectionPoint: SEIntersectionPoint;
  parent1: SEOneDimensional;
  parent2: SEOneDimensional;
}

/**
 * For a parametric equation P(t), this is the pair P(t), t
 */
export type ParametricVectorAndTValue = {
  vector: Vector3;
  tVal: number;
};
export type NormalVectorAndTValue = {
  normal: Vector3;
  tVal: number;
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
  ): Array<NormalVectorAndTValue>;
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
export type plottableType =
  | "boundaryCircle"
  | "point"
  | "line"
  | "segment"
  | "circle"
  | "angleMarker"
  | "ellipse"
  | "parametric"
  | "polygon";
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

export type SEOneDimensionalNotStraight = SECircle | SEEllipse | SEParametric;

export type hslaColorType = {
  h: number;
  s: number;
  l: number;
  a: number;
};

/**
 * There are three modes for displaying a value of a measurement.
 */
export enum ValueDisplayMode {
  Number, // just the raw number is displayed
  MultipleOfPi, // convert to multiples of pi for display
  DegreeDecimals // convert to degrees for display
}

export enum LabelDisplayMode {
  NameOnly, // display only the name
  CaptionOnly, // display the caption only
  ValueOnly, // display the value only (if any)
  NameAndCaption, // display the name and caption
  NameAndValue // display the name and value (if any)
}

/*******************************************UPDATE TYPES **********************/

export type ObjectNames =
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
  | "tangentLineThruPoint";

export interface ObjectState {
  kind: ObjectNames;
  object: SENodule;
  normalVector?: Vector3;
  arcLength?: number;
  locationVector?: Vector3;
  sliderValue?: number;
}

export type ConstructionScript = Array<string | Array<string>>;

export interface SphericalConstruction extends ConstructionInFirestore {
  id: string;
  parsedScript: ConstructionScript;
  sphereRotationMatrix: Matrix4;
  objectCount: number;
  previewData: string;
}

export interface ConstructionInFirestore {
  author: string;
  dateCreated: string;
  script: string;
  description: string;
  rotationMatrix?: string;
  preview?: string;
  // A list of enabled tool buttons associated with this construction
  tools: Array<ActionMode> | undefined;
}
/* UserProfile as stored in Firestore "users" collection */
export interface UserProfile {
  profilePictureURL?: string;
  displayName?: string;
  location?: string;
  role?: string;
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
