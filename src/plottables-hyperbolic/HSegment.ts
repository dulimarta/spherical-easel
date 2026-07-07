import type { CKSegment } from "@/models/CKSegment";
import { Nodule } from "@/plottables/Nodule";
import { Scene } from "three";

export class HSegment extends Nodule<CKSegment> {
  constructor(name: string, modelRef: CKSegment) {
    super(name, modelRef);
  }
  show(): void {
    throw new Error("Method not implemented.");
  }
  hide(): void {
    throw new Error("Method not implemented.");
  }
  glowingDisplay(): void {
    throw new Error("Method not implemented.");
  }
  normalDisplay(): void {
    throw new Error("Method not implemented.");
  }
  modelUpdated(): void {
    throw new Error("Method not implemented.");
  }
}
