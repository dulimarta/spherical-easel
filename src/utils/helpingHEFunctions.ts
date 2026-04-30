import { SURFACE_TYPES } from "@/global-settings-hyperbolic";
import {
  zLowerClip,
  zLowerIdealStripClipMinus,
  zLowerIdealStripClipPlus,
  zUpperClip,
  zUpperIdealStripClipMinus,
  zUpperIdealStripClipPlus
} from "@/plottables-hyperbolic/MeshFactory";
import { Vector3, Vector4 } from "three";

export type partialIntersectionType = {
  distance: number;
  point: Vector3;
  normal: Vector3;
};

export function intersectWithSurface(
  origin: Vector3,
  direction: Vector3,
  near: number,
  far: number,
  upper: boolean,
  surface: SURFACE_TYPES
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
  // (oz + t*dz)^2 - (ox + t*dx)^2 - (oy + t*dy)^2 + -1(hyperboloid)/+0(idealStrip)/+1(ultraStrip) = 0

  // A term (t^2)
  const A = dz * dz - dx * dx - dy * dy;

  // B term (t)
  const B = 2 * (oz * dz - ox * dx - oy * dy);

  let sign = 0;
  let upperBound = 1;
  let lowerBound = 0;
  switch (surface) {
    case SURFACE_TYPES.hyperboloid: {
      sign = -1;
      upperBound = upper ? zUpperClip.value : 0;
      lowerBound = upper ? 0 : zLowerClip.value;
      break;
    }
    case SURFACE_TYPES.idealStrip: {
      sign = 0;
      upperBound = upper
        ? zUpperIdealStripClipPlus.value
        : zLowerIdealStripClipPlus.value;
      lowerBound = upper
        ? zUpperIdealStripClipMinus.value
        : zLowerIdealStripClipMinus.value;
      break;
    }
    case SURFACE_TYPES.ultraStrip: {
      sign = 1;
      upperBound = upper ? zUpperClip.value : 0;
      lowerBound = upper ? 0 : zLowerClip.value;
      break;
    }
  }
  // C term (constant)
  const C = oz * oz - ox * ox - oy * oy + sign;

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

    // Check that the ray intersects the surface where it is drawn
    if (
      !(
        lowerBound < rayCasterIntersectionPoint.z &&
        rayCasterIntersectionPoint.z < upperBound
      )
    ) {
      return;
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
export function vec3ToVec4(vec3: Vector3, w: number): Vector4 {
  return new Vector4(vec3.x, vec3.y, vec3.z, w);
}
export function vec4ToVec3(vec4: Vector4): Vector3 {
  return new Vector3(vec4.x, vec4.y, vec4.z);
}
