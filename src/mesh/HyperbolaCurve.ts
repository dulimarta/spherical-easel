import { Curve, Vector3 } from "three";

export class HyperbolaCurve extends Curve<Vector3> {
  // Compute the points of a hyperbola on a plane
  // rotated on the X-axis
  v1: Vector3 = new Vector3();
  v2: Vector3 = new Vector3();
  outVec = new Vector3();
  a: number = 1;
  b: number = 1;
  constructor(v1: Vector3) {
    super();
    this.v1.copy(v1); // Must be a vector perpendicular to X-axis
    if (Math.abs(v1.x) > 1e-3)
      throw "The direction vector of hyperbola must be perpendiclar to the X-axis";
    this.v2.set(1, 0, 0);
    const innerA = v1.x * v1.x + v1.y * v1.y - v1.z * v1.z;
    this.a = Math.sqrt(-1.0 / innerA);
  }

  getPoint(t: number, optionalTarget: Vector3 = new Vector3()): Vector3 {
    const theta = 4 * t - 2;
    const lambda = this.a * Math.cosh(theta);
    const mu = this.b * Math.sinh(theta);
    // const out = optionalTarget ?? this.outVec;
    optionalTarget.set(0, 0, 0);
    optionalTarget
      .addScaledVector(this.v1, lambda)
      .addScaledVector(this.v2, mu);
    // console.debug(
    //   `Get 3D point of hyperbola at time ${t} mu=${mu.toFixed(
    //     3
    //   )} lambda=${lambda.toFixed(3)}==> ${optionalTarget.toFixed(3)}`
    // );
    return optionalTarget;
  }
}
