export {};

// The following declaration is similar to Kotlin/Swift
// extension functions. Usage example:

// const x = new Vector3(3, 4, 5);
// const out = x.toFixed(3); // string formatted output
// with 3-decimal place per field.

// out is :(3.000, 4.000, 5.000)
declare module "three/src/math/Vector2" {
  interface Vector2 {
    /** Pretty format vector into decimal numbers of the requested precision
     * @param precision the number of decimal places for each coordinate
     */
    toFixed(precision: number): string;
  }
}
declare module "three/src/math/Vector3" {
  interface Vector3 {
    /** Pretty format vector into decimal numbers of the requested precision
     * @param precision the number of decimal places for each coordinate
     */
    toFixed(precision: number): string;

    /**
     * Create a 3D vector from a string in the following format (___,____,___)
     *
     * @param arr
     */
    from(arr: string | undefined): void;

    /** Check if the vector is pretty close to zero within some tolerance
     * @param tolerance
     */
    isZero(tolerance?: number): boolean;
  }
}
