import { Curve, Vector3 } from "three";

/* This class generate a hyperbola on a plane through the X-axis by
 * computing the intersection between the plane and the hyperboloid.
 * The calculation is based on the following paper:
 *
 * Peter Paul Klein, "On the Intersection Equation of a Hyperboloid and a Plane",
 *   Applied Mathematics, 2013, 4, 40-49
 */
export class HyperbolaCurve extends Curve<Vector3> {
  // Compute the points of a hyperbola on a plane
  // rotated on the X-axis
  v1: Vector3 = new Vector3(0, 0, 1);
  v2: Vector3 = new Vector3(1, 0, 0); // Second vector is alway the X-axis
  outVec = new Vector3();
  aCoeff: number = 1;
  bCoeff: number = 1;
  maxT: number = Number.MIN_VALUE;
  maxZ: number = Number.MIN_VALUE;
  upperSheet = true;
  // minT: number = Number.MAX_VALUE;
  constructor() {
    super();
  }

  // The setPointsAndDirections() method set the two points the curve passes thru.
  // The plane of intersection passes thru the origin and these two points.
  // The two direction vectors span the plane these two vectors are in general
  // different from the two points, but all the four vectors are on the same plane.
  // The two direction vectors are carefully choses such that d1 is always on the
  // XY plane and d2 is on a plane perpendicular to the XY plane
  setPointsAndDirections(
    p1: Vector3,
    p2: Vector3,
    d1: Vector3,
    d2: Vector3
  ): HyperbolaCurve {
    this.v1.copy(d1);
    this.v2.copy(d2);
    this.upperSheet = p1.z > 0;
    console.debug(`D1:${d1.z.toFixed(3)}  D2:${d2.z.toFixed(3)}`);
    const innerA = d1.x * d1.x + d1.y * d1.y - d1.z * d1.z;
    const innerB = d2.x * d2.x + d2.y * d2.y - d2.z * d2.z;
    this.aCoeff = Math.sqrt(1 / innerA);
    this.bCoeff = Math.sqrt(-1 / innerB);
    // The max Z of the hyperboloid is cosh(2)
    console.debug(`MaxT ${this.maxT.toFixed(4)} ==> ${this.maxZ.toFixed(4)}`);
    const z = p2.z / (this.bCoeff * d2.z);
    this.maxT = Math.acosh(z);
    // this.maxT = Number.MIN_VALUE
    this.maxZ = Number.MIN_VALUE;
    console.debug(`Coefficients B=${this.bCoeff} acosh of ${z}`);
    return this;
  }

  getPoint(tInput: number, optionalTarget: Vector3 = new Vector3()): Vector3 {
    const t = 3 * tInput - 1.5;
    const lambda = this.aCoeff * Math.sinh(t);
    const mu = this.bCoeff * Math.cosh(t);
    // const out = optionalTarget ?? this.outVec;
    optionalTarget
      .set(0, 0, 0)
      .addScaledVector(this.v1, lambda)
      .addScaledVector(this.v2, mu)
      .multiplyScalar(this.upperSheet ? +1 : -1);
    if (optionalTarget.z > this.maxZ) this.maxZ = optionalTarget.z;
    // console.debug(
    //   `tInput=${tInput.toFixed(3)} t=${t.toFixed(
    //     3
    //   )} Z-coord is ${optionalTarget.z.toFixed(
    //     3
    //   )} with Tmax ${this.maxT.toFixed(3)}`
    // );
    return optionalTarget;
  }
}
