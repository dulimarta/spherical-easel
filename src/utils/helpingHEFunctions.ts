import {
  zLowerClip,
  zLowerPAIClipMinus,
  zLowerPAIClipPlus,
  zUpperClip,
  zUpperPAIClipMinus,
  zUpperPAIClipPlus
} from "@/plottables-hyperbolic/MeshFactory";
import { Vector3, Vector4 } from "three";

export type partialIntersectionType = {
  distance: number;
  point: Vector3;
  normal: Vector3;
};

export function intersectWithHyperboloid(
  origin: Vector3,
  direction: Vector3,
  near: number,
  far: number,
  upper: boolean
): partialIntersectionType[] {
  const intersects: partialIntersectionType[] = [];
  // Check the intersection of the ray with the hyperboloid
  const ox = origin.x;
  const oy = origin.y;
  const oz = origin.z;
  const dx = direction.x;
  const dy = direction.y;
  const dz = direction.z;

  // Expand substitutions for intersection of Ray P(t) = origin + t*direction  with hyperboloid
  // (oz + t*dz)^2 - (ox + t*dx)^2 - (oy + t*dy)^2  -1 = 0

  // A term (t^2)
  const A = dz * dz - dx * dx - dy * dy;

  // B term (t)
  const B = 2 * (oz * dz - ox * dx - oy * dy);

  // C term (constant)
  const C = oz * oz - ox * ox - oy * oy - 1;

  // Solve the Quadratic
  const discriminant = B * B - 4 * A * C;

  if (discriminant < 0) return []; // No real intersection

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-B - sqrtDisc) / (2 * A);
  const t2 = (-B + sqrtDisc) / (2 * A);

  // Check both solutions (entry and exit points)
  [t1, t2].forEach(t => {
    if (t < near || t > far) return;
    const rayCasterIntersectionPoint = new Vector3();
    // Calculate intersection point in world space
    rayCasterIntersectionPoint
      .copy(direction) // unit vector so distance to intersection is t
      .multiplyScalar(t)
      .add(origin);

    // Check that the ray intersects the hyperboloid where it is drawn
    if (upper) {
      if (
        rayCasterIntersectionPoint.z > zUpperClip.value ||
        rayCasterIntersectionPoint.z < 0
      ) {
        return;
      }
    } else {
      if (
        rayCasterIntersectionPoint.z < zLowerClip.value ||
        rayCasterIntersectionPoint.z > 0
      ) {
        return;
      }
    }
    intersects.push({
      distance: t,
      point: rayCasterIntersectionPoint.clone(),
      normal: rayCasterIntersectionPoint
        .clone()
        .multiply(new Vector3(-1, -1, 1)) // always the inward pointing normal
        .normalize()
    });
  });
  return intersects;
}

export function intersectWithPointAtInfinityStrip(
  origin: Vector3,
  direction: Vector3,
  near: number,
  far: number,
  upper: boolean
): partialIntersectionType[] {
  const intersects: partialIntersectionType[] = [];
  // Check the intersection of the ray with the transformed points at infinity
  const ox = origin.x;
  const oy = origin.y;
  const oz = origin.z;
  const dx = direction.x;
  const dy = direction.y;
  const dz = direction.z;

  // Expand substitutions for intersection of Ray P(t) = origin + t*direction with Cone
  // (ox + t*dx)^2 + (oy + t*dy)^2 = (oz + t*dz)^2

  // A term (t^2)
  const A = dx * dx + dy * dy - dz * dz;

  // B term (t)
  const B = 2 * (ox * dx + oy * dy - oz * dz);

  // C term (constant)
  const C = ox * ox + oy * oy - oz * oz;

  // Solve the Quadratic
  const discriminant = B * B - 4 * A * C;

  if (discriminant < 0) return []; // No intersection

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-B - sqrtDisc) / (2 * A);
  const t2 = (-B + sqrtDisc) / (2 * A);

  // Check both solutions (entry and exit points)
  [t1, t2].forEach(t => {
    if (t < near || t > far) return;
    const rayCasterIntersectionPoint = new Vector3();
    // Calculate intersection point in world space
    rayCasterIntersectionPoint
      .copy(direction) // unit vector so distance to intersection is t
      .multiplyScalar(t)
      .add(origin);

    // Check that the ray intersects the cone in the correct strip
    const upperZValue = upper ? zUpperPAIClipPlus : zLowerPAIClipPlus;
    const lowerZValue = upper ? zUpperPAIClipMinus : zLowerPAIClipMinus;
    if (
      rayCasterIntersectionPoint.z < lowerZValue.value ||
      rayCasterIntersectionPoint.z > upperZValue.value
    ) {
      return;
    }

    intersects.push({
      distance: t,
      point: rayCasterIntersectionPoint.clone(),
      normal: rayCasterIntersectionPoint
        .clone()
        .multiply(new Vector3(-1, -1, 1)) //inward pointing normal
        .normalize()
    });
  });
  return intersects;
}

// The hyperbolic distance between two points on the same sheet of the hyperboloid, null if on different sheets
export function h2Distance(
  point1: Vector3 | Vector4,
  point2: Vector3 | Vector4
): number {
  if (point1.z * point2.z < 0) {
    throw new Error(
      "Points are on different sheets so there is no distance between them"
    );
  }
  return Math.acosh(
    -point1.x * point2.x - point1.y * point2.y + point1.z * point2.z
  );
}
