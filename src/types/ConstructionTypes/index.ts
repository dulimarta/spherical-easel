import { Matrix4 } from "three";
import { ActionMode } from "..";

export * from "./classes/TreeviewNode";
export * from "./classes/ConstructionTree";
export * from "./classes/ConstructionPath";

export type ConstructionScript = Array<string | Array<string>>;

export interface SphericalConstruction extends ConstructionInFirestore {
  starCount: number;
  id: string;
  parsedScript: ConstructionScript;
  sphereRotationMatrix: Matrix4;
  objectCount: number;
  // previewData: string;
}

export interface PublicConstructionInFirestore {
  /** Firebase Auth UID of the construction owner */
  author: string;
  /** Firebase ID for the construction this references */
  constructionDocId: string;
  /** date that this construction was made public */
  datePublicized?: string;
}

export interface ConstructionInFirestore {
  version: string;
  author: string;
  dateCreated: string;
  script: string;
  description: string;
  starCount: number;
  rotationMatrix?: string;
  preview: string; // Either the data:image of the URL to the data:image
  aspectRatio?: number /* width / height of the screen when image was captured */;
  publicDocId?: string; // linked to the document with structure PublicConstructionInFirebase
  // A list of enabled tool buttons associated with this construction
  tools: Array<ActionMode> | undefined;
  /** organizational path of the construction */
  path?: string;
}

export interface StarredConstruction {
  id: string;
  path: string;
}
