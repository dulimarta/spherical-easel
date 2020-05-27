// Declaration of all internal data types

import Two from "two.js";
import Line from "@/3d-objs/Line";
import Circle from "@/3d-objs/Circle";
import { SEPoint } from "@/models/SEPoint";

/**
 * Each visual object has its own way of making itself "glow"
 */

// import Two from "two.js";

export interface SELine {
  ref: Line;
  start: SEPoint;
  end: SEPoint;
  isSegment: boolean;
}

export interface SECircle {
  ref: Circle;
  center: SEPoint;
  point: SEPoint;
}
export interface AppState {
  sphere: Two.Group | null;
  editMode: string;
  points: SEPoint[];
  lines: SELine[];
  circles: SECircle[];
}
/* This interface lists all the properties that each tool/button must have. */
export interface ToolButtonType {
  id: number;
  editModeValue: string;
  displayToolUseMessage: boolean;
  displayedName: string;
  icon: string;
  toolGroup: string;
  toolUseMessage: string;
  toolTipMessage: string;
}

// }
