import { ModelSubscriber, ModelPublisher } from "@/models/CKNodule";
import { StyleCategory, StyleOptions } from "@/types/Styles";
import { Group, Quaternion, Scene } from "three/webgpu";

export abstract class Nodule<T extends ModelPublisher = ModelPublisher>
  implements ModelSubscriber
{
  viewGroup: Group = new Group();
  // protected styleOptions: Map<StyleCategory, StyleOptions> = new Map();
  constructor(
    public name: string,
    public modelRef: T
  ) {
    this.name = name;
    this.modelRef = modelRef;
  }
  addToScene(s: Scene): void {
    s.add(this.viewGroup);
  }
  removeFromScene(): void {
    this.viewGroup.removeFromParent();
  }

  abstract show(): void;
  abstract hide(): void;
  abstract glowingDisplay(): void;
  abstract normalDisplay(): void;
  abstract modelUpdated(): void;
  lookAtCamera(q: Quaternion): void {}
}
