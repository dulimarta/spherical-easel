import { Vector3 } from "three";

expect.extend({
  /**
   * Verify that two vectors are close enough within some precision
   * @param received the first vector
   * @param expected the second vector
   * @param precision the desired precision (number of decimal places)
   */
  toBeVector3CloseTo(received: Vector3, expected: Vector3, precision: number) {
    // const precision = 3;
    const pass = received.distanceTo(expected) < Math.pow(10, -precision);
    return {
      pass,
      message: () =>
        received.toFixed(precision) +
        (pass ? "matches" : "does not match") +
        expected.toFixed(precision)
    };
  },

  toBeNonZero(received: Vector3) {
    const out = received.x > 0;
    return {
      pass: out,
      message: () => "Non Zero Expectation"
    };
  }
});
