import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";

declare module "@/models/SENodule" {
  interface SENodule {
    attachLabel(): void;
    attachLabelAt(position: Vector3): void;
    attachLabelWithOffset(offset: Vector3): SELabel;
  }
}
