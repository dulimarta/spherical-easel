/** @format */

// import SETTINGS from "@/global-settings";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";
import NonFreePoint from "./NonFreePoint";

export default class ThreePointCircleCenter extends NonFreePoint {
  private _vector1 = new Vector3();
  private _vector2 = new Vector3();
  private _vector3 = new Vector3();

  /**
   * Once the above three vectors are set, then the center location can be determined (this won't exist if the three vectors don't define a three point circle center)
   */

  private tempVector1 = new Vector3();
  private tempVector2 = new Vector3();
  private tempVector3 = new Vector3();

  constructor() {
    super();
  }
  updateDisplay(): void {
    // if points 1 and 2 are the same the center is the cross of points 1 and 3 that is nearest the old location vector
    if (
      this.tempVector1
        .subVectors(this._vector1, this._vector2)
        .isZero(SETTINGS.tolerance)
    ) {
      this.tempVector2
        .crossVectors(this._vector1, this._vector3)
        .normalize()
        .multiplyScalar(SETTINGS.boundaryCircle.radius);
      // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
      if (this.tempVector2.dot(this._locationVector) < 0) {
        this.tempVector2.multiplyScalar(-1);
      }
      this._locationVector.copy(this.tempVector2);
    }
    // if points 1 and 3 are the same the center is the cross of points 2 and 3 that is nearest the old location vector
    else if (
      this.tempVector1
        .subVectors(this._vector1, this._vector3)
        .isZero(SETTINGS.tolerance)
    ) {
      this.tempVector2
        .crossVectors(this._vector2, this._vector3)
        .normalize()
        .multiplyScalar(SETTINGS.boundaryCircle.radius);
      // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
      if (this.tempVector2.dot(this._locationVector) < 0) {
        this.tempVector2.multiplyScalar(-1);
      }
      this._locationVector.copy(this.tempVector2);
    }
    // if points 2 and 3 are the same the center is the cross of points 1 and 3 that is nearest the old location vector
    else if (
      this.tempVector1
        .subVectors(this._vector2, this._vector3)
        .isZero(SETTINGS.tolerance)
    ) {
      this.tempVector2
        .crossVectors(this._vector1, this._vector3)
        .normalize()
        .multiplyScalar(SETTINGS.boundaryCircle.radius);
      // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
      if (this.tempVector2.dot(this._locationVector) < 0) {
        this.tempVector2.multiplyScalar(-1);
      }
      this._locationVector.copy(this.tempVector2);
    }
    // It is the not the case that any two points are the same
    else {
      // if points 1 and 3 are antipodal then the center is th cross of points 1 and 2 that is closest to the old location
      if (
        this.tempVector1.crossVectors(this._vector1, this._vector3).isZero()
      ) {
        this.tempVector3
          .crossVectors(this._vector1, this._vector2)
          .normalize()
          .multiplyScalar(SETTINGS.boundaryCircle.radius);
        // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
        if (this.tempVector3.dot(this._locationVector) < 0) {
          this.tempVector3.multiplyScalar(-1);
        }
        this._locationVector.copy(this.tempVector3);
      }
      // if points 1 and 2 are antipodal then the center is th cross of points 1 and 3 that is closest to the old location
      else if (
        this.tempVector1.crossVectors(this._vector1, this._vector2).isZero()
      ) {
        this.tempVector3
          .crossVectors(this._vector1, this._vector3)
          .normalize()
          .multiplyScalar(SETTINGS.boundaryCircle.radius);
        // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
        if (this.tempVector3.dot(this._locationVector) < 0) {
          this.tempVector3.multiplyScalar(-1);
        }
        this._locationVector.copy(this.tempVector3);
      } // if points 2 and 3 are antipodal then the center is th cross of points 1 and 3 that is closest to the old location
      else if (
        this.tempVector1.crossVectors(this._vector2, this._vector3).isZero()
      ) {
        this.tempVector3
          .crossVectors(this._vector1, this._vector3)
          .normalize()
          .multiplyScalar(SETTINGS.boundaryCircle.radius);
        // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
        if (this.tempVector3.dot(this._locationVector) < 0) {
          this.tempVector3.multiplyScalar(-1);
        }
        this._locationVector.copy(this.tempVector3);
      }
      // it is not the case that any pair of points are antipodal and it is not thee case that any pair of points are the same
      else {
        this.tempVector1.subVectors(this._vector1, this._vector3);
        this.tempVector2.subVectors(this._vector1, this._vector2);
        this.tempVector3
          .crossVectors(this.tempVector1, this.tempVector2)
          .normalize()
          .multiplyScalar(SETTINGS.boundaryCircle.radius);
        // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
        if (this.tempVector3.dot(this._locationVector) < 0) {
          this.tempVector3.multiplyScalar(-1);
        }
        this._locationVector.copy(this.tempVector3);
      }
    }
    // disallow a three point circle center to be further than pi/2 away from the points defining it.
    if (this._locationVector.angleTo(this._vector1) > Math.PI / 2 + 0.000001) {
      this._locationVector.multiplyScalar(-1);
    }
    this.defaultScreenVectorLocation.set(
      this._locationVector.x,
      this._locationVector.y
    );
  }

  /**
   * This method is used to copy the temporary three point circle center created with the ThreePointCircle Tool into a
   * permanent one in the scene .
   */
  clone(): this {
    const dup = new ThreePointCircleCenter();
    dup.vector1 = this._vector1;
    dup.vector2 = this._vector2;
    dup.vector3 = this._vector3;
    dup._locationVector.copy(this._locationVector);
    return dup as this;
  }

  set vector1(v: Vector3) {
    this._vector1.copy(v).normalize();
  }
  get vector1(): Vector3 {
    return this._vector1;
  }

  set vector2(v: Vector3) {
    this._vector2.copy(v).normalize();
  }
  get vector2(): Vector3 {
    return this._vector2;
  }
  set vector3(v: Vector3) {
    this._vector3.copy(v).normalize();
  }
  get vector3(): Vector3 {
    return this._vector3;
  }
}
