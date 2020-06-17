// Extend the primitive Number type with additional handy utility functions
interface Number {
  toRadians(): number; // Convert a number (in degrees) to radians
  toDegrees(): number; // Convert a number (in radians) to degrees
}

interface Array<T> {
  // Rotate n elements of an array
  rotate(n: number): Array<T>;

  // Remove the current elements
  clear(): void;
}
