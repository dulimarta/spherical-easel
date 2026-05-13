import { Vector2, Vector3, Matrix4, Vector4 } from "three";
import SETTINGS from "@/global-settings-spherical";

Vector2.prototype.toFixed = function (precision: number): string {
  return (
    "(" + this.x.toFixed(precision) + "," + this.y.toFixed(precision) + ")"
  );
};

Vector2.prototype.from = function (str: string | undefined): void {
  if (str !== undefined) {
    const arr = str.replaceAll(/[()]/g, "").split(",").map(Number);
    this.setX(arr[0]);
    this.setY(arr[1]);
  } else {
    this.setX(0);
    this.setY(0);
  }
};
Vector2.prototype.isZero = function (tolerance?: number): boolean {
  const useTolerance = tolerance || SETTINGS.tolerance;
  return (
    //this.x*this.x + this.y*this.y + this.y*this.y  < useTolerance*useTolerance
    Math.abs(this.x) <= useTolerance && Math.abs(this.y) <= useTolerance
  );
};

Vector3.prototype.toFixed = function (precision: number): string {
  return (
    "(" +
    this.x.toFixed(precision) +
    "," +
    this.y.toFixed(precision) +
    "," +
    this.z.toFixed(precision) +
    ")"
  );
};

Vector3.prototype.from = function (str: string | undefined): void {
  if (str !== undefined) {
    const arr = str.replaceAll(/[()]/g, "").split(",").map(Number);
    this.setX(arr[0]);
    this.setY(arr[1]);
    this.setZ(arr[2]);
  } else {
    this.setX(0);
    this.setY(0);
    this.setZ(1);
  }
};
Vector3.prototype.isZero = function (tolerance?: number): boolean {
  const useTolerance = tolerance || SETTINGS.tolerance;
  return (
    //this.x*this.x + this.y*this.y + this.y*this.y  < useTolerance*useTolerance
    Math.abs(this.x) <= useTolerance &&
    Math.abs(this.y) <= useTolerance &&
    Math.abs(this.z) <= useTolerance
  );
};
Vector3.prototype.distanceTo = function (vector: Vector3 | Vector4): number {
  return Math.sqrt(
    (this.x - vector.x) * (this.x - vector.x) +
      (this.y - vector.y) * (this.y - vector.y) +
      (this.z - vector.z) * (this.z - vector.z)
  );
};
Vector4.prototype.toFixed = function (precision: number): string {
  return (
    "(" +
    this.x.toFixed(precision) +
    "," +
    this.y.toFixed(precision) +
    "," +
    this.z.toFixed(precision) +
    "," +
    this.w.toFixed(precision) +
    ")"
  );
};
Vector4.prototype.from = function (str: string | undefined): void {
  if (str !== undefined) {
    const arr = str.replaceAll(/[()]/g, "").split(",").map(Number);
    this.setX(arr[0]);
    this.setY(arr[1]);
    this.setZ(arr[2]);
    this.setW(arr[3]);
  } else {
    this.setX(0);
    this.setY(0);
    this.setZ(0);
    this.setW(0);
  }
};
Vector4.prototype.isZero = function (tolerance?: number): boolean {
  const useTolerance = tolerance || SETTINGS.tolerance;
  return (
    //this.x*this.x + this.y*this.y + this.y*this.y  < useTolerance*useTolerance
    Math.abs(this.x) <= useTolerance &&
    Math.abs(this.y) <= useTolerance &&
    Math.abs(this.z) <= useTolerance &&
    Math.abs(this.w) <= useTolerance
  );
};
Vector4.prototype.distanceTo = function (vector: Vector3 | Vector4): number {
  return Math.sqrt(
    (this.x - vector.x) * (this.x - vector.x) +
      (this.y - vector.y) * (this.y - vector.y) +
      (this.z - vector.z) * (this.z - vector.z)
  );
};

Matrix4.prototype.toFixed = function (precision: number): string {
  return "[" + this.elements.map(x => x.toFixed(precision)).join() + "]";
};
