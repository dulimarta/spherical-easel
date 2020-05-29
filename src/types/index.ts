// Declaration of all internal data types

import Two from "two.js";
import Circle from "@/3d-objs/Circle";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";

export interface SECircle {
  ref: Circle;
  center: SEPoint;
  point: SEPoint;
}
export interface AppState {
  sphere: Two.Group | null;
  sphereRadius: /* in pixel */ number; // When the window is resized, the actual size of the sphere (in pixel may change)
  editMode: string;
  // nodes: SENode[], Do we need this?
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
