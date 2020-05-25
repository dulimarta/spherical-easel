// Declaration of all internal data types

import { Mesh } from "three";
import Point from "@/3d-objs/Point";
import Line from "@/3d-objs/Line";
import Circle from "@/3d-objs/Circle";

export interface HiLite {
  // fillCol: string;
  // oldFill: Two.Color;
  highlight(): void;
  noHighlight(): void;
}

// import Two from "two.js";
export interface SEPoint {
  ref: Point;
  startOf: SELine[];
  endOf: SELine[];
  centerOf: SECircle[];
  circumOf: SECircle[];
}

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
  // sphere: Mesh | null;
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
