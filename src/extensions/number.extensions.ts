Number.prototype.toDegrees = function(): number {
  return (Number(this) / Math.PI) * 180;
};
Number.prototype.toRadians = function(): number {
  return (Number(this) * Math.PI) / 180;
};
