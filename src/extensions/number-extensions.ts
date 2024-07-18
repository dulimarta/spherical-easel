Number.prototype.toDegrees = function (): number {
  return (Number(this) / Math.PI) * 180;
};
Number.prototype.toRadians = function (): number {
  return (Number(this) * Math.PI) / 180;
};

/**
 *  Note that while in most languages, ‘%’ is a remainder operator, in some (e.g. Python, Perl) it is a
 *  modulo operator. For positive values, the two are equivalent, but when the dividend and divisor are
 *  of different signs, they give different results. To obtain a modulo in JavaScript,
 *  in place of a % n, use ((a % n ) + n ) % n.
 *  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
 */
Number.prototype.modTwoPi = function (): number {
  return ((Number(this) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
};
Number.prototype.modPi = function (): number {
  return ((Number(this) % Math.PI) + Math.PI) % Math.PI;
};
