import { Vector3 } from "three";

Vector3.prototype.toFixed = function(precision: number): string {
  return (
    "(" +
    this.x.toFixed(precision) +
    "," +
    this.y.toFixed(precision) +
    "," +
    this.x.toFixed(precision) +
    ")"
  );
};
