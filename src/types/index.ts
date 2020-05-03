// Declaration of all internal data types

// declare module "SphericalEasel" {
import { Mesh } from "three";

export interface SEVertex {
  ref: Mesh;
  incidentLines: SELine[];
}

export interface SELine {
  ref: Mesh;
  start: SEVertex;
  end: SEVertex;
  isSegment: boolean;
}

export interface AppState {
  sphere: Mesh | null;
  editMode: string;
  vertices: SEVertex[];
  lines: SELine[];
}
// }
