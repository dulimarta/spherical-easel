import { Curve, Vector3 } from "three";

/* This class generate a hyperbola on a plane through the X-axis by
 * computing the intersection between the plane and the hyperboloid.
 * The calculation is based on the following paper:
 *
 * Peter Paul Klein, "On the Intersection Equation of a Hyperboloid and a Plane",
 *   Applied Mathematics, 2013, 4, 40-49
 */
export class Hyperbola extends Curve<Vector3> {
  // Compute the points of a hyperbola on a plane
  // rotated on the X-axis
  dir1: Vector3 = new Vector3(0, 0, 1);
  dir2: Vector3 = new Vector3(1, 0, 0); // Second vector is alway the X-axis
  outVec = new Vector3();
  aCoeff: number = 1;
  bCoeff: number = 1;
  tMin: number = Number.MAX_VALUE;
  tMax: number = Number.MIN_VALUE;
  // maxZ: number = Number.MIN_VALUE;
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
    p1: Vector3, // Position of the first point
    p2: Vector3, // Position of the second point
    d1: Vector3,
    d2: Vector3,
    isInfinite: boolean
  ): void {
    this.dir1.copy(d1);
    this.dir2.copy(d2);
    // The curve is on the uppoer sheet when the Z-coordinate is positive
    this.upperSheet = p1.z > 0;
    // console.debug(`D1:${d1.z.toFixed(3)}  D2:${d2.z.toFixed(3)}`);
    const innerA = d1.x * d1.x + d1.y * d1.y - d1.z * d1.z;
    const innerB = d2.x * d2.x + d2.y * d2.y - d2.z * d2.z;
    this.aCoeff = Math.sqrt(1 / innerA);
    this.bCoeff = Math.sqrt(-1 / innerB);
    /* In the getPoint function the coordinates of each point on the curve is computed from   
         aCoeff * sinh(t) * dir1 + bCoeff * cosh(t) * dir2
       Hence it Z-coordinate is computed from
         aCoeff * sinh(t) * dir1.z + bCoeff * cosh(t) * dir2.z
       But dir1.z is intentionally chosen such that dir1.z is zero. Therefore the Z-coordinate
       depends only on
          bCoeff * cosh(t) * dir2.z
       The min and max of the t values that correspond the the Z-coordinate of P1 and P2
       can be computed as follows.
    */
    const denom = this.bCoeff * d2.z;
    if (isInfinite) {
      this.tMin = -Math.acosh(Math.cosh(2) / denom);
      this.tMax = Math.acosh(Math.cosh(2) / denom);
    } else {
      this.tMin = -Math.acosh(p2.z / denom);
      this.tMax = Math.acosh(p1.z / denom);
    }
    this.updateArcLengths(); // Must call this after the curve shape is modified
  }

  getPoint(tInput: number, optionalTarget: Vector3 = new Vector3()): Vector3 {
    const t = tInput * (this.tMax - this.tMin) + this.tMin;
    const lambda = this.aCoeff * Math.sinh(t);
    const mu = this.bCoeff * Math.cosh(t);
    // const out = optionalTarget ?? this.outVec;
    optionalTarget
      .set(0, 0, 0)
      .addScaledVector(this.dir1, lambda)
      .addScaledVector(this.dir2, mu)
      .multiplyScalar(this.upperSheet ? +1 : -1);
    return optionalTarget;
  }
}
