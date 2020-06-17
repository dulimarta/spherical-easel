Number.prototype.toDegrees = function(): number {
  return (Number(this) / Math.PI) * 180;
};
Number.prototype.toRadians = function(): number {
  return (Number(this) * Math.PI) / 180;
};

Array.prototype.rotate = function(count: number) {
  const len = this.length >>> 0;
  let _count = count >> 0;
  _count = ((_count % len) + len) % len;

  // use splice.call() instead of this.splice() to make function generic
  Array.prototype.push.apply(
    this,
    Array.prototype.splice.call(this, 0, _count)
  );
  return this;
};
