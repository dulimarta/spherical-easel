// Declaration of all internal data types

import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SENodule } from "@/models/SENodule";
import Nodule from "@/plottables/Nodule";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { Vector3 } from "three";

export interface Selectable {
  hit(x: number, y: number, coord: unknown, who: unknown): boolean;
}

export interface AppState {
  layers: Two.Group[];
  sphereRadius: /* in pixel */ number; // When the window is resized, the actual size of the sphere (in pixel may change)
  zoomTranslation: number[]; // current zoom translation vector
  zoomMagnificationFactor: number; // current zoom magnification factor
  previousZoomMagnificationFactor: number;
  actionMode: string;
  previousActionMode: string;
  activeToolName: string;
  previousActiveToolName: string;
  sePoints: SEPoint[];
  seLines: SELine[];
  seSegments: SESegment[];
  seCircles: SECircle[];
  seNodules: SENodule[];
  selections: SENodule[];
  temporaryNodules: Nodule[];
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

/**
 * All the one dimensional SE Classes
 */
export type SEOneDimensional = SELine | SESegment | SECircle;

export interface hslaColorType {
  h: number;
  s: number;
  l: number;
  a: number;
}
/**
 * There are three modes for updating. The DisplayOnly doesn't record information as the update(mode: , stateArray:[]) method is
 * executed
 */
export enum UpdateMode {
  DisplayOnly, // Record nothing in the state Array
  RecordStateForDelete, // All visited objects must be put into the stateArray
  RecordStateForMove // Only those objects which depend on more than their point parents need to record that information
}

export interface UpdateStateType {
  mode: UpdateMode;
  stateArray: ObjectState[];
}
/**
 * Record the information necessary to restore/undo a move or delete of the object
 */
export type ObjectState = CircleState | LineState | SegmentState | PointState;

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
export interface CircleState {
  // No fields are needed for moving circles because they are completely determined by their point parents
  kind: "circle";
  // Fields needed for undoing delete
  object: SECircle;
}
export function isCircleState(entry: ObjectState): entry is CircleState {
  return entry.kind === "circle";
}
