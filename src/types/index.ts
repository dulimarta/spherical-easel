// Declaration of all internal data types

import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SENodule } from "@/models/SENodule";
import Nodule from "@/plottables/Nodule";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { Matrix4, Vector3 } from "three";
import { StyleEditPanels, StyleOptions } from "@/types/Styles";
import { SEExpression } from "@/models/SEExpression";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import { SEEllipse } from "@/models/SEEllipse";

export interface Selectable {
  hit(x: number, y: number, coord: unknown, who: unknown): boolean;
}

export interface AppState {
  layers: Two.Group[];
  sphereRadius: /* in pixel */ number; // When the window is resized, the actual size of the sphere (in pixel may change)
  zoomTranslation: number[]; // current zoom translation vector
  zoomMagnificationFactor: number; // current zoom magnification factor
  // previousZoomMagnificationFactor: number;
  canvasWidth: number;
  actionMode: string;
  previousActionMode: string;
  activeToolName: string;
  previousActiveToolName: string;
  sePoints: SEPoint[];
  seLines: SELine[];
  seSegments: SESegment[];
  seCircles: SECircle[];
  seEllipses: SEEllipse[];
  seAngleMarkers: SEAngleMarker[];
  seLabels: SELabel[];
  seNodules: SENodule[];
  selectedSENodules: SENodule[];

  intersections: SEIntersectionPoint[];
  // measurements: SEExpression[];
  expressions: SEExpression[];
  temporaryNodules: Nodule[];
  initialStyleStates: StyleOptions[];
  defaultStyleStates: StyleOptions[];
  oldStyleSelections: SENodule[];
  styleSavedFromPanel: StyleEditPanels;
  initialBackStyleContrast: number;
  inverseTotalRotationMatrix: Matrix4; // Initially the identity. This is the composition of all the inverses of the rotation matrices applied to the sphere.
  svgCanvas: HTMLDivElement | null;
  hasUnsavedNodules: boolean;
  temporaryProfilePicture: string;
}
/* This interface lists all the properties that each tool/button must have. */
export interface ToolButtonType {
  id: number;
  actionModeValue: string;
  displayToolUseMessage: boolean;
  displayedName: string;
  icon: string;
  toolGroup: string;
  toolUseMessage: string;
  toolTipMessage: string;
}

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
  | "point"
  | "pointDistance"
  | "pointOnOneDim"
  | "polar"
  | "rotate"
  | "segment"
  | "segmentLength"
  | "select"
  | "slider"
  | "toggleLabelDisplay"
  | "zoomFit"
  | "zoomIn"
  | "zoomOut";
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

export interface OneDimensional {
  /**
   * Returns the closest vector on the one dimensional object to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector location on the sphere
   */
  closestVector(idealUnitSphereVector: Vector3): Vector3;
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

export type plottableType =
  | "boundaryCircle"
  | "point"
  | "line"
  | "segment"
  | "circle"
  | "angleMarker"
  | "ellipse";
export type sides = "front" | "back" | "mid";
/**
 * The properties of a plottable object needed when creating icons
 */
export type plottableProperties = {
  type: plottableType;
  side: sides;
  fill: boolean;
  part: string;
};
/**
 * All the one dimensional SE Classes
 */
export type SEOneDimensional = SELine | SESegment | SECircle | SEEllipse;

export type hslaColorType = {
  h: number;
  s: number;
  l: number;
  a: number;
};
/**
 * There are three modes for updating. The DisplayOnly doesn't record information as the update(mode: , stateArray:[]) method is
 * executed
 */
export enum UpdateMode {
  DisplayOnly, // Record nothing in the state Array
  RecordStateForDelete, // All visited objects must be put into the stateArray
  RecordStateForMove // Only those objects which depend on more than their point parents need to record that information
}

/**
 * There are three modes for displaying a value of a measurement.
 */
export enum ValueDisplayMode {
  Number, // just the raw number is displayed
  MultipleOfPi, // convert to multiples of pi for display
  DegreeDecimals // convert to degrees for display
}

export interface UpdateStateType {
  mode: UpdateMode;
  stateArray: ObjectState[];
}

/**
 * Record the information necessary to restore/undo a move or delete of the object
 */
export type ObjectState =
  | CircleState
  | EllipseState
  | LineState
  | SegmentState
  | PointState
  | LabelState
  | AngleMarkerState
  | PerpendicularLineThruPointState;

export interface PerpendicularLineThruPointState {
  kind: "perpendicularLineThruPoint";
  object: SEPerpendicularLineThruPoint;
}

export function isPerpendicularLineThruPointState(
  entry: ObjectState
): entry is PerpendicularLineThruPointState {
  return entry.kind === "perpendicularLineThruPoint";
}

export interface AngleMarkerState {
  kind: "angleMarker";
  object: SEAngleMarker;
  // vertexVectorX: number;
  // vertexVectorY: number;
  // vertexVectorZ: number;
  // startVectorX: number;
  // startVectorY: number;
  // startVectorZ: number;
  // endVectorX: number;
  // endVectorY: number;
  // endVectorZ: number;
}
export function isAngleMarkerState(
  entry: ObjectState
): entry is AngleMarkerState {
  return entry.kind === "angleMarker";
}

export interface LineState {
  kind: "line";
  object: SELine;
  normalVectorX: number;
  normalVectorY: number;
  normalVectorZ: number;
}
export function isLineState(entry: ObjectState): entry is LineState {
  return entry.kind === "line";
}
export interface SegmentState {
  kind: "segment";
  object: SESegment;
  normalVectorX: number;
  normalVectorY: number;
  normalVectorZ: number;
  arcLength: number;
}
export function isSegmentState(entry: ObjectState): entry is SegmentState {
  return entry.kind === "segment";
}
export interface PointState {
  kind: "point";
  object: SEPoint;
  locationVectorX: number;
  locationVectorY: number;
  locationVectorZ: number;
}
export function isPointState(entry: ObjectState): entry is PointState {
  return entry.kind === "point";
}
export interface LabelState {
  kind: "label";
  object: SELabel;
  locationVectorX: number;
  locationVectorY: number;
  locationVectorZ: number;
}
export function isLabelState(entry: ObjectState): entry is LabelState {
  return entry.kind === "label";
}

export interface CircleState {
  // No fields are needed for moving circles because they are completely determined by their point parents
  kind: "circle";
  // Fields needed for undoing delete
  object: SECircle;
}
export function isCircleState(entry: ObjectState): entry is CircleState {
  return entry.kind === "circle";
}

export interface EllipseState {
  // No fields are needed for moving ellipses because they are completely determined by their point parents
  kind: "ellipse";
  // Fields needed for undoing delete
  object: SEEllipse;
}
export function isEllipseState(entry: ObjectState): entry is EllipseState {
  return entry.kind === "ellipse";
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
