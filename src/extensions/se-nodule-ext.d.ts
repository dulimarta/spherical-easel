import { SELabel } from "@/models-spherical/SELabel";
import { Vector3 } from "three";

declare module "@/models-spherical/SENodule" {
  interface SENodule {
    attachLabel(): void;
    attachLabelAt(position: Vector3): void;
    attachLabelWithOffset(offset: Vector3): SELabel;
  }
}
