import { SURFACE_TYPES } from "@/global-settings-hyperbolic";
import {
  zLowerClip,
  zLowerIdealStripClipMinus,
  zLowerIdealStripClipPlus,
  zUpperClip,
  zUpperIdealStripClipMinus,
  zUpperIdealStripClipPlus
} from "@/plottables-hyperbolic/MeshFactory";
import {
  HEIntersectionReturnType,
  HEOneDimensional,
  IntersectionReturnType,
  IntersectionReturnTypeH2
} from "@/types";
import { Matrix4, Vector3, Vector4 } from "three";
import { rank_of_type } from "./helpingfunctions";
import { HELine } from "@/models-hyperbolic/HELine";

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

export function h2Distance(point1: Vector4, point2: Vector4): number {
  if (point1.z * point2.z < 0) {
    return Number.POSITIVE_INFINITY;
    throw new Error(
      "Points are on different sheets so there is no distance between them"
    );
  }
  if (point1.w < 0.5 || point2.w < 0.5) {
    return Number.POSITIVE_INFINITY;
    throw new Error(
      "Points must both be non-ideal so there is no distance between them"
    );
  }
  return Math.acosh(
    -point1.x * point2.x - point1.y * point2.y + point1.z * point2.z
  );
}
/**
 * If q is positive the vector corresponds to
 * a point on the hyperboloid (divide vector by sqrt(q(v))),
 * zero to an ideal point,
 * negative to an ultra point (divide vector by sqrt(-q(v)))
 * @param vector
 * @returns
 */
export function q(vector: Vector3 | Vector4): number {
  return -vector.x * vector.x - vector.y * vector.y + vector.z * vector.z;
}
export function vec3ToVec4(vec3: Vector3, w: number): Vector4 {
  return new Vector4(vec3.x, vec3.y, vec3.z, w);
}
export function vec4ToVec3(vec4: Vector4): Vector3 {
  return new Vector3(vec4.x, vec4.y, vec4.z);
}

export function intersectTwoObjects(
  one: HEOneDimensional,
  two: HEOneDimensional
  // inverseTotalRotationMatrix: Matrix4
): IntersectionReturnTypeH2[] {
  const rank1 = rank_of_type(one);
  const rank2 = rank_of_type(two);
  if (rank2 < rank1 || (rank1 == rank2 && two.name < one.name)) {
    console.error(
      `Intersect two objects ${one.name} and ${two.name}: They are NOT in rank and/or lexicographic order! One: ${one.name} and  Two: ${two.name}`
    );
  }

  if (one instanceof HELine) {
    if (two instanceof HELine) {
      return one.name < two.name
        ? intersectLineWithLine(one, two)
        : intersectLineWithLine(two, one);
    }
    //   else if (two instanceof SESegment)
    //     return intersectLineWithSegment(one, two);
    //   else if (two instanceof SECircle) return intersectLineWithCircle(one, two);
    //   else if (two instanceof SEEllipse)
    //     return intersectLineWithEllipse(one, two);
    //   else if (two instanceof SEParametric)
    //     return intersectLineWithParametric(one, two, inverseTotalRotationMatrix);
  }
  //else if (one instanceof SESegment) {
  //   if (two instanceof SESegment)
  //     return one.name < two.name
  //       ? intersectSegmentWithSegment(one, two)
  //       : intersectSegmentWithSegment(two, one);
  //   else if (two instanceof SECircle)
  //     return intersectSegmentWithCircle(one, two);
  //   else if (two instanceof SEEllipse)
  //     return intersectSegmentWithEllipse(one, two);
  //   else if (two instanceof SEParametric)
  //     return intersectSegmentWithParametric(
  //       one,
  //       two,
  //       inverseTotalRotationMatrix
  //     );
  // } else if (one instanceof SECircle) {
  //   if (two instanceof SECircle)
  //     return one.name < two.name
  //       ? intersectCircles(
  //           one.centerSEPoint.locationVector,
  //           one.circleRadius,
  //           two.centerSEPoint.locationVector,
  //           two.circleRadius
  //         )
  //       : intersectCircles(
  //           two.centerSEPoint.locationVector,
  //           two.circleRadius,
  //           one.centerSEPoint.locationVector,
  //           one.circleRadius
  //         );
  //   else if (two instanceof SEEllipse)
  //     return intersectCircleWithEllipse(one, two);
  //   else if (two instanceof SEParametric)
  //     return intersectCircleWithParametric(
  //       one,
  //       two,
  //       inverseTotalRotationMatrix
  //     );
  // } else if (one instanceof SEEllipse) {
  //   if (two instanceof SEEllipse)
  //     return one.name < two.name
  //       ? intersectEllipseWithEllipse(one, two)
  //       : intersectEllipseWithEllipse(two, one);
  //   else if (two instanceof SEParametric)
  //     return intersectEllipseWithParametric(
  //       one,
  //       two,
  //       inverseTotalRotationMatrix
  //     );
  // } else if (one instanceof SEParametric) {
  //   if (two instanceof SEParametric) {
  //     const xcross = intersectParametricWithParametric(one, two);
  //     xcross.forEach((z, ind) => {
  //       console.debug(`Intersection #${ind} at ${z.vector.toFixed(4)}`);
  //     });
  //     return xcross;
  //   }
  // }
  throw (
    "Attempted to intersect non-one dimensional objects " +
    `${one.name}` +
    " and " +
    `${two.name}`
  );
}
/**
 * Return an ordered list of IntersectionReturnType (i.e. a vector location and exists flag) for the
 * intersection of two lines. This must be called with the lines in lexicographic order in order to the
 * return type correct.
 * @param lineOne An HELine
 * @param lineTwo An HELine
 */
export function intersectLineWithLine(
  lineOne: HELine,
  lineTwo: HELine,
  firstTimeIntersection = false
): IntersectionReturnTypeH2[] {
  const returnItems: IntersectionReturnTypeH2[] = [];

  if (lineOne.upper != lineTwo.upper) {
    return returnItems; // lines on different sheets never intersect
  }

  // In hyperbolic geometry lines intersect at most once
  const intersection: IntersectionReturnTypeH2 = {
    vector: new Vector4(),
    exists: true
  };

  const crossProductOfNormals = new Vector3();
  // Plus and minus the cross product of the normal vectors are the intersection vectors
  crossProductOfNormals.crossVectors(
    lineOne.unitNormalVector,
    lineTwo.unitNormalVector
  );
  const heNormSquare = q(crossProductOfNormals);
  const normedLocation = new Vector3();
  let wCoordinate: number;
  switch (true) {
    //Ideal
    case Math.abs(heNormSquare) < 0.0001: {
      normedLocation.copy(crossProductOfNormals);
      wCoordinate = 0;
      break;
    }
    //Hyperbolic
    case heNormSquare > 0: {
      normedLocation
        .copy(crossProductOfNormals)
        .multiplyScalar(1 / Math.sqrt(heNormSquare));
      wCoordinate = 1;
      break;
    }
    //Ultra
    case heNormSquare < 0: {
      normedLocation
        .copy(crossProductOfNormals)
        .multiplyScalar(1 / Math.sqrt(-heNormSquare));
      wCoordinate = -1;
      break;
    }
    default: {
      wCoordinate = 1;
    }
  }
  // make sure that the intersection is on the same sheet as the lines
  if (normedLocation.z * (lineOne.upper ? 1 : -1) < 0) {
    normedLocation.multiplyScalar(-1);
  }

  intersection.vector.copy(vec3ToVec4(normedLocation, wCoordinate));

  // If the normal vectors are on top of each other or antipodal, exists is false or if this is the first time the lines are being intersected,
  // we conclude the lines will *never* intersect (they are constrained to be on the same line forever -  like if the defining points of the second line are points on the first line

  if (crossProductOfNormals.isZero()) {
    if (firstTimeIntersection) {
      return returnItems;
    }
    intersection.exists = false;
  }
  // Now check the existence based on the mode of the lines
  // if the mode of both lines is 7, then intersections (ideal, ultra,hyperbolic) always exist
  // Let's try if the point is hyperbolic then then it exists in the usual sense, if not then it always exists
  const closestToLine1 = lineOne.closestVector(intersection.vector);
  const closestToLine2 = lineTwo.closestVector(intersection.vector);
  if (intersection.vector.w > 0 && closestToLine1 && closestToLine2) {
    const distToLine1 = closestToLine1.distanceTo(intersection.vector);

    const distToLine2 = closestToLine1.distanceTo(intersection.vector);
    intersection.exists = distToLine1 < 0.000001 && distToLine2 < 0.00001;
  } else {
    intersection.exists = false;
  }

  returnItems.push(intersection);
  return returnItems;
}
