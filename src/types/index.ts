// Declaration of all internal data types

import { Mesh } from "three";
import Vertex from "@/3d-objs/Vertex";
import Line from "@/3d-objs/Line";
import Circle from "@/3d-objs/Circle";
export interface SEVertex {
  ref: Vertex;
  startOf: SELine[];
  endOf: SELine[];
  centerOf: SERing[];
  circumOf: SERing[];
}

export interface SELine {
  ref: Line;
  start: SEVertex;
  end: SEVertex;
  isSegment: boolean;
}
export interface SERing {
  ref: Circle;
  center: SEVertex;
  point: SEVertex;
}
export interface AppState {
  sphere: Mesh | null;
  editMode: string;
  vertices: SEVertex[];
  lines: SELine[];
  rings: SERing[];
}
// }
