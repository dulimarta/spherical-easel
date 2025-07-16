import { Curve, Vector3 } from "three";

/* This class generate a hyperbola on a plane through the X-axis.
 */
const X_AXIS = new Vector3(1, 0, 0);
export class HyperbolaCurve extends Curve<Vector3> {
  // Compute the points of a hyperbola on a plane
  // rotated on the X-axis
  v1: Vector3 = new Vector3(0, 0, 1);
  v2: Vector3 = new Vector3(1, 0, 0); // Second vector is alway the X-axis
  outVec = new Vector3();
  a: number = 1;
  b: number = 1;
  maxT: number = Number.MIN_VALUE;
  upperSheet = true;
  // minT: number = Number.MAX_VALUE;
  constructor() {
    super();
  }

  // The setDirection() method allows the plane to be rotated along the X-axis
  // The 'd' vector must be a vector on the YZ-plane. Together with the X-axis
  // this vector spans the plane where the hyperbola lives
  setDirection(d1: Vector3, d2: Vector3 = X_AXIS, upper: boolean = true) {
    this.v1.copy(d1);
    this.v2.copy(d2);
    this.upperSheet = upper;
    console.debug(`D1:${d1.toFixed(3)}  D2:${d2.toFixed(3)}`);
    const innerA = d1.x * d1.x + d1.y * d1.y - d1.z * d1.z;
    const innerB = d2.x * d2.x + d2.y * d2.y - d2.z * d2.z;
    this.a = Math.sqrt(1 / innerA);
    this.b = Math.sqrt(-1 / innerB);
    // The max Z of the hyperboloid is cosh(2)
    this.maxT = Math.acosh(Math.cosh(2) / (this.b * this.v2.z));
    // console.debug(`Coefficients ${this.a} ${this.b} MaxT at ${this.maxT}`);
  }

  getPoint(tInput: number, optionalTarget: Vector3 = new Vector3()): Vector3 {
    const t = (2 * tInput - 1) * 2;
    const lambda = this.a * Math.sinh(t);
    const mu = this.b * Math.cosh(t);
    // const out = optionalTarget ?? this.outVec;
    optionalTarget
      .set(0, 0, 0)
      .addScaledVector(this.v1, lambda)
      .addScaledVector(this.v2, mu)
      .multiplyScalar(this.upperSheet ? +1 : -1);
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
