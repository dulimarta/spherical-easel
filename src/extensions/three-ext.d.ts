export {};

// The following declaration is similar to Kotlin/Swift
// extension functions. Usage example:

// const x = new Vector3(3, 4, 5);
// const out = x.toFixed(3); // string formatted output
// with 3-decimal place per field.

// out is :(3.000, 4.000, 5.000)
declare module "three/src/math/Vector3" {
  interface Vector3 {
    toFixed(precision: number): string;
  }
}
