import { Curve, Vector3 } from "three";

/* This class generates a hyperbola on a plane through the origin by
 * computing the intersection between the plane and the hyperboloid.
 * The technique is based on the following paper:
 *
 * Peter Paul Klein, "On the Intersection Equation of a Hyperboloid and a Plane",
 *   Applied Mathematics, 2013, 4, 40-49
 * http://dx.doi.org/10.4236/am.2013.412A005
 */

const MAX_Z_HYPERBOLOID = Math.cosh(2);
export class HyperbolicCurve extends Curve<Vector3> {
  // Compute the points of a hyperbola on a plane
  // rotated on the X-axis
  dir1: Vector3 = new Vector3(0, 0, 1);
  dir2: Vector3 = new Vector3(1, 0, 0); // Second vector is alway the X-axis
  outVec = new Vector3();
  aCoeff: number = 1;
  bCoeff: number = 1;
  tMin: number = Number.MAX_VALUE;
  tMax: number = Number.MIN_VALUE;
  upperSheet = true;
  constructor() {
    super();
  }

  // The setPointsAndDirections() method sets the two points the curve passes thru.
  // The plane of intersection passes thru the origin and these two points.
  // The two direction vectors span the plane these two vectors are in general
  // different from the two points, but all the four vectors are on the same plane.
  // The two direction vectors are carefully chosen such that d1 is always on the
  // XY plane and d2 is on a plane perpendicular to the XY plane.
  // This choice of d1 also has another advantage; d1 is also the normal vector
  // of the plane of symmetry of the hyperbola, make it easier to determine whether
  // the two endpoints of the hyperbola are on the same or different halves.
  setPointsAndDirections(
    p1: Vector3, // Position of the first point
    p2: Vector3, // Position of the second point
    d1: Vector3, // The two direction vectors that define the plane
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
       But dir1.z is intentionally chosen such that dir1.z is zero. Therefore, the Z-coordinate
       depends only on
          bCoeff * cosh(t) * dir2.z
       The min and max of the t values that correspond the the Z-coordinate of P1 and P2
       can be computed as follows.
    */
    const denom = this.bCoeff * d2.z;
    if (isInfinite) {
      this.tMin = -Math.acosh(MAX_Z_HYPERBOLOID / denom);
      this.tMax = Math.acosh(MAX_Z_HYPERBOLOID / denom);
    } else {
      // d1 is the normal vector of the plane of symmetry of the hyperbola
      // If P1 and P2 are on different sides of this plane,
      // then the hyperbola is long(er) and the T values span from negative to positive
      // If both P1 and P2 are "below" this plane, the T values span in the negative range
      // Otherwise the T values span in the positive range
      const side1 = p1.dot(d1);
      const side2 = p2.dot(d1);
      // T-value should not cause the curve to extend beyond the
      // maximum height of the hyperboloid
      this.tMin = -Math.acosh(Math.min(p2.z, MAX_Z_HYPERBOLOID) / denom);
      this.tMax = Math.acosh(Math.min(p1.z, MAX_Z_HYPERBOLOID) / denom);
      if (side1 < 0 && side2 < 0) {
        // Both tMin and tMax are negative
        this.tMax *= -1;
      } else if (side1 > 0 && side2 > 0) {
        // Both tMin and tMax are positive
        this.tMin *= -1;
      }
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
