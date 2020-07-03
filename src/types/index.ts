// Declaration of all internal data types

import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SENodule } from "@/models/SENodule";
import { SEIntersection } from "@/models/SEIntersection";

export interface Selectable {
  hit(x: number, y: number, coord: unknown, who: unknown): boolean;
}
// export interface Moveable {}

export interface AppState {
  layers: Two.Group[];
  sphereRadius: /* in pixel */ number; // When the window is resized, the actual size of the sphere (in pixel may change)
  zoomTranslation: number[]; // current zoom translation vector
  zoomMagnificationFactor: number; // current zoom magnification factor
  actionMode: string;
  activeToolName: string;
  // nodes: SENodule[], Do we need this?
  points: SEPoint[];
  lines: SELine[];
  segments: SESegment[];
  circles: SECircle[];
  nodules: SENodule[];
  intersections: SEIntersection[];
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

// }
