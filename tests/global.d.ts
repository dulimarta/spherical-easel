import { Vector3 } from "three";

declare global {
  namespace jest {
    // The T generic parameter is not used but without import PropTypes from 'prop-types'
    // The compiler will throw an error message that the interface is different
    // from the builtin definition
    interface Matchers<R, T> {
      toBeVector3CloseTo(expected: Vector3, precision: number): R;
    }
  }
}
