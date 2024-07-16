import { vi, Assertion, AsymmetricMatchersContaining } from "vitest"

interface CustomMatchers<R = unknown> {
  toBeVector3CloseTo: () => R

}
declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> { }
  interface AsymmetricMatchersContaining extends CustomMatchers { }
}
