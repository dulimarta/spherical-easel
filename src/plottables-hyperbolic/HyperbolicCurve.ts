import {
  ArrowHelper,
  Curve,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  Vector3
} from "three/webgpu";

/* This class generates a hyperbola on a plane through the origin by
 * computing the intersection between the plane and the hyperboloid.
 * The technique is based on the following paper:
 *
 * Peter Paul Klein, "On the Intersection Equation of a Hyperboloid and a Plane",
 *   Applied Mathematics, 2013, 4, 40-49
 * http://dx.doi.org/10.4236/am.2013.412A005
 */

const MAX_Z_HYPERBOLOID = 2.07;
const Y_AXIS = new Vector3(0, 1, 0);
const Z_AXIS = new Vector3(0, 0, 1);
export class HyperbolicCurve extends Curve<Vector3> {
  // Compute the points of a hyperbola on a plane
  // rotated on the X-axis
  startPoint: Vector3 = new Vector3(0, 0, 0);
  endPoint: Vector3 = new Vector3(0, 1, 0);
  planeNormal: Vector3 = new Vector3();
  curveTangent: Vector3 = new Vector3();
  curveNormal: Vector3 = new Vector3();
  chordCenter: Vector3 = new Vector3();
  // Second vector is always the X-axis
  outVec = new Vector3();
  aCoeff: number = 1;
  bCoeff: number = 1;
  tMin: number = Number.MAX_VALUE;
  tMax: number = Number.MIN_VALUE;
  upperSheet = true;
  oneSheet = false;
  private d1Arrow = new ArrowHelper(
    undefined,
    undefined,
    1,
    0xff0000,
    0.2,
    0.1
  );
  private d2Arrow = new ArrowHelper(
    undefined,
    undefined,
    1,
    0x0000ff,
    0.2,
    0.1
  );
  private cuttingPlane = new Mesh(
    new PlaneGeometry(5, 5),
    new MeshStandardMaterial({
      color: 0x0000ff,
      side: DoubleSide,
      transparent: true,
      opacity: 0.5
    })
  );

  constructor(
    private isInfinite: boolean,
    private mirror: boolean,
    private scene: Scene
  ) {
    super();
    this.reconstructAroundZ();
    this.scene.add(this.d1Arrow);
    this.scene.add(this.d2Arrow);
    // this.scene.add(this.cuttingPlane);
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
  setPoints(
    p1: Vector3, // Position of the first point
    p2: Vector3, // Position of the second point
    oneSheet: boolean
  ): void {
    // console.debug(
    //   `HyperbolicCurve::setPoints p1:${p1.toFixed(3)} p2:${p2.toFixed(3)}`
    // );
    this.startPoint.copy(p1);
    this.endPoint.copy(p2);
    this.oneSheet = oneSheet;
    if (oneSheet) this.reconstructAroundUltra();
    else this.reconstructAroundZ();
  }
  private reconstructAroundZ() {
    this.planeNormal.crossVectors(this.startPoint, this.endPoint).normalize();
    // console.debug("Plane normal:", this.planeNormal);
    this.curveTangent.crossVectors(Z_AXIS, this.planeNormal);
    this.curveNormal.crossVectors(this.planeNormal, this.curveTangent);
    this.curveNormal.normalize();
    this.curveTangent.normalize();
    this.d1Arrow.setDirection(this.curveTangent);
    this.d2Arrow.setDirection(this.curveNormal);
    this.cuttingPlane.lookAt(this.planeNormal);
    if (this.isInfinite) {
      /**
       * To draw an "infinite" line, we replace the start and end points with
       * the intersection points of the cutting plane the the top disk (i.e.
       * the disk parallel to the xy-plane at the maximum height (H) of the hyperboloid).
       * These two intersection points are on a chord whose center is along this.curveNormal.
       * The center of the chord can be determine by scaling the curveNormal vector to the height of the top disk. The length of the chord can be determined by the angle of the cutting plane with respect to the xy-plane. The angle can be computed from the z-component of the cuttingPlaneNormal vector. The tangent of this angle is equal to the ratio of the distance from the center of the chord to the edge of the disk (i.e. half the chord length) and the height of the disk (H).
       * The radius of the disk is R = sqrt(H^2 - 1). The chord length can be computed using the
       * Pythagorean theorem from the topdisk radius and the offset of the chord from the center.
       */
      this.chordCenter
        .copy(this.curveNormal)
        .multiplyScalar(MAX_Z_HYPERBOLOID / this.curveNormal.z);
      const planeAngle = Math.asin(this.planeNormal.z);
      const halfChordLength = Math.sqrt(
        MAX_Z_HYPERBOLOID *
          MAX_Z_HYPERBOLOID *
          (1 - Math.pow(Math.tan(planeAngle), 2)) -
          1
      );
      this.startPoint
        .copy(this.chordCenter)
        .addScaledVector(this.curveTangent, halfChordLength);
      this.endPoint
        .copy(this.chordCenter)
        .addScaledVector(this.curveTangent, -halfChordLength);
    }
    // The curve is on the upper sheet when the Z-coordinate is positive
    this.upperSheet = this.startPoint.z > 0;
    const dt = this.curveTangent;
    const d2 = this.curveNormal;
    // console.debug(`D1:${dt.z.toFixed(3)}  D2:${d2.z.toFixed(3)}`);
    const innerA = dt.x * dt.x + dt.y * dt.y - dt.z * dt.z;
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
    // curveTangent is also the normal vector of the plane of symmetry of the hyperbola.
    // "Below" this plane of symmetry, the t-values are negative.
    // "Above" this plane of symmetry, the t-values are positive.
    // If P1 and P2 are on different sides of this plane,
    // then the T values span from negative to positive
    // If both P1 and P2 are "below" this plane, the T values span in the negative range
    // Otherwise the T values span in the positive range
    // Determine which "side" the two points reside.
    const side1 = this.startPoint.dot(dt);
    const side2 = this.endPoint.dot(dt);
    // T-value should not cause the curve to extend beyond the
    // maximum height of the hyperboloid
    this.tMin = -Math.acosh(this.endPoint.z / denom);
    this.tMax = Math.acosh(this.startPoint.z / denom);
    if (side1 < 0 && side2 < 0) {
      // Both tMin and tMax are negative
      this.tMax *= -1;
    } else if (side1 > 0 && side2 > 0) {
      // Both tMin and tMax are positive
      this.tMin *= -1;
    }
    this.updateArcLengths(); // Must call this after the curve shape is modified
  }

  private reconstructAroundUltra() {
    this.planeNormal.crossVectors(this.startPoint, this.endPoint).normalize();
    this.cuttingPlane.lookAt(this.planeNormal);
    // console.debug("Plane normal:", this.planeNormal);
    if (!this.mirror) {
      this.curveNormal.crossVectors(Z_AXIS, this.planeNormal);
      this.curveTangent.crossVectors(this.planeNormal, this.curveNormal);
    } else {
      this.curveNormal.crossVectors(this.planeNormal, Z_AXIS);
      this.curveTangent.crossVectors(this.curveNormal, this.planeNormal);
    }
    this.curveTangent.normalize();
    this.curveNormal.normalize();
    this.d1Arrow.setDirection(this.curveTangent);
    this.d2Arrow.setDirection(this.curveNormal);
    this.upperSheet = this.startPoint.z > 0;
    const dt = this.curveTangent;
    const d2 = this.curveNormal;
    // console.debug(`D1:${dt.z.toFixed(3)}  D2:${d2.z.toFixed(3)}`);
    const innerA = dt.x * dt.x + dt.y * dt.y - dt.z * dt.z;
    const innerB = d2.x * d2.x + d2.y * d2.y - d2.z * d2.z;
    this.aCoeff = Math.sqrt(-1 / innerA);
    this.bCoeff = Math.sqrt(1 / innerB);
    // console.debug(
    //   "AroundY:",
    //   innerA.toFixed(2),
    //   this.aCoeff,
    //   innerB.toFixed(2),
    //   this.bCoeff
    // );
    this.updateArcLengths();
  }

  getPoint(tInput: number, optionalTarget: Vector3 = new Vector3()): Vector3 {
    optionalTarget.set(0, 0, 0);
    if (!this.oneSheet) {
      const t = tInput * (this.tMax - this.tMin) + this.tMin;
      // console.debug(`tInput:${tInput.toFixed(3)}  t:${t.toFixed(3)}`);
      const lambda = this.aCoeff * Math.sinh(t);
      const mu = this.bCoeff * Math.cosh(t);
      // const out = optionalTarget ?? this.outVec;
      optionalTarget
        .addScaledVector(this.curveTangent, lambda)
        .addScaledVector(this.curveNormal, mu)
        .multiplyScalar(this.upperSheet ? +1 : -1);
    } else {
      const t = (this.upperSheet ? 1.5 : -1.5) * tInput;
      const lambda = this.aCoeff * Math.sinh(t);
      const mu = this.bCoeff * Math.cosh(t);
      optionalTarget
        .addScaledVector(this.curveTangent, lambda)
        .addScaledVector(this.curveNormal, mu);
    }
    return optionalTarget;
  }

  dispose() {
    this.d1Arrow.removeFromParent();
    this.d2Arrow.removeFromParent();
    this.cuttingPlane.removeFromParent();
  }
}
