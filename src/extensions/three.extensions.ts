import { Vector2, Vector3 } from "three";
import SETTINGS from "@/global-settings";

Vector2.prototype.toFixed = function(precision: number): string {
  return (
    "(" + this.x.toFixed(precision) + "," + this.y.toFixed(precision) + ")"
  );
};
Vector3.prototype.toFixed = function(precision: number): string {
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

Vector3.prototype.from = function(str: string | undefined): void {
  if (str !== undefined) {
    const arr = str
      .replaceAll(/[()]/g, "")
      .split(",")
      .map(Number);
    this.setX(arr[0]);
    this.setY(arr[1]);
    this.setZ(arr[2]);
  } else {
    this.setX(0);
    this.setY(0);
    this.setZ(1);
  }
};

Vector3.prototype.isZero = function(tolerance?: number): boolean {
  const useTolerance = tolerance || SETTINGS.tolerance;
  return (
    Math.abs(this.x) <= useTolerance &&
    Math.abs(this.y) <= useTolerance &&
    Math.abs(this.z) <= useTolerance
  );
};
