import { ModelSubscriber, ModelPublisher } from "@/models/CKNodule";
import { StyleCategory, StyleOptions } from "@/types/Styles";
import { Group, Quaternion, Scene } from "three/webgpu";

export abstract class Nodule<T extends ModelPublisher = ModelPublisher>
  implements ModelSubscriber
{
  name: string;
  modelRef: T;
  protected styleOptions: Map<StyleCategory, StyleOptions> = new Map();
  constructor(name: string, modelRef: T) {
    this.name = name;
    this.modelRef = modelRef;
  }
  abstract show(): void;
  abstract hide(): void;
  abstract addToScene(s: Scene): void;
  abstract removeFromScene(): void;
  abstract glowingDisplay(): void;
  abstract normalDisplay(): void;
  abstract modelUpdated(): void;
  lookAtCamera(q: Quaternion): void {}
}
