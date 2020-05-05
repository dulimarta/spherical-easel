// Declaration of all internal data types

// declare module "SphericalEasel" {
import { Mesh } from "three";

export interface SEVertex {
  ref: Mesh;
  startOf: SELine[];
  endOf: SELine[];
  centerOf: SERing[];
  circumOf: SERing[];
}

export interface SELine {
  ref: Mesh;
  start: SEVertex;
  end: SEVertex;
  isSegment: boolean;
}
export interface SERing {
  ref: Mesh;
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
