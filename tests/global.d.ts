import { Vector3 } from "three";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeVector3CloseTo(expected: Vector3, precision: number): R;
    }
  }
}
