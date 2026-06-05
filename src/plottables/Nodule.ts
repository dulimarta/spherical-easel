import { ModelSubscriber, ModelPublisher } from "@/models/CKNodule";
import { StyleCategory, StyleOptions } from "@/types/Styles";
import { Scene } from "three";
import { Group } from "two.js/src/group";
export abstract class Nodule implements ModelSubscriber {
  name: string;
  modelRef: ModelPublisher;
  protected styleOptions: Map<StyleCategory, StyleOptions> = new Map();
  constructor(name: string, modelRef: ModelPublisher) {
    this.name = name;
    this.modelRef = modelRef;
  }
  abstract show(): void;
  abstract hide(): void;
  // abstract toggleVisibility(): void;
  // abstract isVisible(): boolean;
  abstract addToLayers(layers: Group[], scene: Scene | null): void;
  abstract removeFromLayers(): void;
  abstract glowingDisplay(): void;
  abstract normalDisplay(): void;
  abstract modelUpdated(): void;
}
