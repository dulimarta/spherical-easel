import { Curve, Vector3 } from "three";

/* This class generate a hyperbola on a plane through the X-axis by
 * computing the intersection between the plane and the hyperboloid.
 * The calculation is based on the following paper:
 *
 * Peter Paul Klein, "On the Intersection Equation of a Hyperboloid and a Plane",
 *   Applied Mathematics, 2013, 4, 40-49
 */
export class CircularCurve extends Curve<Vector3> {
  // Compute the points of a hyperbola on a plane
  // rotated on the X-axis
  point1: Vector3 = new Vector3();
  point2: Vector3 = new Vector3();
  dir1: Vector3 = new Vector3(0, 0, 1);
  dir2: Vector3 = new Vector3(1, 0, 0); // Second vector is alway the X-axis
  outVec = new Vector3();
  tMin: number = Number.MAX_VALUE;
  tMax: number = Number.MIN_VALUE;
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
    this.point1.copy(p1).normalize();
    this.point2.copy(p2).normalize();
    // The curve is on the uppoer sheet when the Z-coordinate is positive
    // console.debug(`D1:${d1.z.toFixed(3)}  D2:${d2.z.toFixed(3)}`);

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
    // const denom = this.bCoeff * d2.z;
    if (isInfinite) {
      this.tMin = 0;
      this.tMax = 2 * Math.PI;
    } else {
      const x1 = this.point1.dot(d1);
      const y1 = this.point1.dot(d2);
      const angle1 = Math.atan2(y1, x1);
      const x2 = this.point2.dot(d1);
      const y2 = this.point2.dot(d2);
      const angle2 = Math.atan2(y2, x2);
      // console.debug(
      //   `Angles of P1 ${x1.toFixed(2)} ${y1.toFixed(1)} => ${angle1
      //     .toDegrees()
      //     .toFixed(1)}`
      // );
      // console.debug(
      //   `Angles of P2 ${x2.toFixed(2)} ${y2.toFixed(1)} => ${angle2
      //     .toDegrees()
      //     .toFixed(1)}`
      // );
      this.tMin = angle1;
      this.tMax = angle2;
    }
    this.updateArcLengths(); // Must call this after the curve shape is modified
  }

  getPoint(tInput: number, optionalTarget: Vector3 = new Vector3()): Vector3 {
    const t = tInput * (this.tMax - this.tMin) + this.tMin;
    const lambda = Math.cos(t);
    const mu = Math.sin(t);
    // const out = optionalTarget ?? this.outVec;
    optionalTarget
      .set(0, 0, 0)
      .addScaledVector(this.dir1, lambda)
      .addScaledVector(this.dir2, mu);
    return optionalTarget;
  }
}
