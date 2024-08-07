// Extend the primitive Number type with additional handy utility functions
interface Number {
  toRadians(): number; // Convert a number (in degrees) to radians
  toDegrees(): number; // Convert a number (in radians) to degrees
  /**
   *  Note that while in most languages, ‘%’ is a remainder operator, in some (e.g. Python, Perl) it is a
   *  modulo operator. For positive values, the two are equivalent, but when the dividend and divisor are
   *  of different signs, they give different results. To obtain a modulo in JavaScript,
   *  in place of a % n, use ((a % n ) + n ) % n.
   *  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
   */
  modTwoPi(): number; // Compute the number modulo 2*Pi
  modPi(): number; // Compute the number modulo Pi
  zeroOut():number; // if the absolute value of the number is near zero, return zero otherwise don't do anything
}
