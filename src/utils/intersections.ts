import { SECircle } from "@/models-spherical/SECircle";
import { SESegment } from "@/models-spherical/SESegment";
import { SELine } from "@/models-spherical/SELine";
import { SEEllipse } from "@/models-spherical/SEEllipse";
import {
  IntersectionReturnType,
  ParametricIntersectionType,
  SEOneDimensional
} from "@/types";
import { Vector3, Matrix4, Vector2 } from "three";
import { SENodule } from "@/models-spherical/SENodule";
import SETTINGS from "@/global-settings";
import { SEParametric } from "@/models-spherical/SEParametric";
import { SETangentLineThruPoint } from "@/models-spherical/SETangentLineThruPoint";
import { SEPointOnOneOrTwoDimensional } from "@/models-spherical/SEPointOnOneOrTwoDimensional";
import { MinHeap } from "@datastructures-js/heap";
import { rank_of_type } from "./helpingfunctions";

// const PIXEL_CLOSE_ENOUGH = 8;

/**
 * The vectors to the centers of the circles
 */
const center1 = new Vector3();
const center2 = new Vector3();
/**
 * The vector perpendicular to both center vectors
 */
const normal = new Vector3();
/**
 * The vector so that normal, center1| center2, toVector form an orthonormal frame
 */
const toVector = new Vector3();
/**
 * The positive intersection vector (if it exists)
 */
// const positiveIntersection = new Vector3();
/**
 * The negative intersection vector (if it exists)
 */
// const negativeIntersection = new Vector3();
/**
 * A temporary vector used to help with the calculation of the intersection points
 * It is the projection of the intersection point (along the sphere) to the plane containing the centers of circles
 */
const tempVec = new Vector3();
const tempVec1 = new Vector3();
const tempVec2 = new Vector3();
const tempVec3 = new Vector3();
const tmpMatrix = new Matrix4();

/**
 * Returns true if vec is on vectorList, false otherwise
 * This is used to tell if an SEIntersectionPoint is going to be created on top of an existing SEPointOnOneDimensional,
 * If this returns true, then the SEIntersectionPoint is not created.
 * @param vec The search vector
 * @param vectorList The list of vectors
 */
function vectorOnList(vec: Vector3, vectorList: Vector3[]) {
  return vectorList.some(v => tempVec.subVectors(vec, v).isZero());
}

/**
 * Return an ordered list of IntersectionReturnType (i.e. a vector location and exists flag) for the
 * intersection of two lines. This must be called with the lines in lexicographic order in order to the
 * return type correct.
 * @param lineOne An SELine
 * @param lineTwo An SELine
 */
export function intersectLineWithLine(
  lineOne: SELine,
  lineTwo: SELine,
  firstTimeIntersection = false
): IntersectionReturnType[] {
  const returnItems: IntersectionReturnType[] = [];

  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };

  // Plus and minus the cross product of the normal vectors are the intersection vectors
  tempVec.crossVectors(lineOne.normalVector, lineTwo.normalVector).normalize();
  intersection1.vector.copy(tempVec);
  intersection2.vector.copy(tempVec.multiplyScalar(-1));

  // If the normal vectors are on top of each other or antipodal, exists is false or if this is the first time the lines are being intersected,
  // we conclude the lines will *never* intersect (they are constrained to be on the same line forever -  like if the defining points of the second line are points on the first line
  // But notice that the two points on the first line are moved to (nearly) antipodal positions, the second line can have a different normal vector than the first, but the intersection
  // points are the two antipodal points that define the first line so do not need to be returned as they already exist. IS THIS THE ONLY WAY THAT TWO LINES CAN START IDENTICAL AND THEN BE MOVED APART?)
  if (
    tempVec
      .crossVectors(lineOne.normalVector, lineTwo.normalVector)
      .isZero(SETTINGS.nearlyAntipodalIdeal)
  ) {
    if (firstTimeIntersection) {
      return returnItems;
    }
    intersection1.exists = false;
    intersection2.exists = false;
  }
  returnItems.push(intersection1);
  returnItems.push(intersection2);
  return returnItems;
}

/**
 * Computes the intersection point(s) of a line and a segment, the line is always first
 * @param line An SELine
 * @param segment An SESegment
 */
export function intersectLineWithSegment(
  line: SELine,
  segment: SESegment,
  firstTimeIntersection = false
): IntersectionReturnType[] {
  const returnItems: IntersectionReturnType[] = [];

  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  // Plus and minus the cross product of the normal vectors are the possible intersection vectors
  tempVec1.crossVectors(line.normalVector, segment.normalVector).normalize();
  tempVec2.copy(tempVec1).multiplyScalar(-1);
  intersection1.vector.copy(tempVec1);
  intersection2.vector.copy(tempVec2);

  // determine if the first intersection point is on the segment
  if (!segment.onSegment(tempVec1)) {
    intersection1.exists = false;
  }
  // Determine if the second intersection point is on the segment
  if (!segment.onSegment(tempVec2)) {
    intersection2.exists = false;
  }
  // If the normal vectors are on top of each other or antipodal, exists is false or if this is the first time the line/segment are being intersected,
  // we conclude the line/segment will *never* intersect (they are constrained to be on the same line forever -  like if the defining points of the segment are points on the first line
  // But notice that the two points on the segment are moved to (nearly) antipodal positions, the segment can have a different normal vector than the line, but the intersection
  // points are the two antipodal points that are the endpoints of the segment so do not need to be returned as they already exist. IS THIS THE ONLY WAY THAT LINES/SEGMENT CAN START IDENTICAL AND THEN BE MOVED APART?)

  if (
    tempVec
      .crossVectors(line.normalVector, segment.normalVector)
      .isZero(SETTINGS.nearlyAntipodalIdeal)
  ) {
    if (firstTimeIntersection) {
      return returnItems;
    }
    console.debug(`line ${line.name} and segment ${segment.name} over lap`);
    intersection1.exists = false;
    intersection2.exists = false;
  }

  returnItems.push(intersection1);
  returnItems.push(intersection2);
  return returnItems;
}

/**
 * Find intersection between a line and a circle, the line is always first
 * @param line An SELine
 * @param circle An SESegment
 */
export function intersectLineWithCircle(
  line: SELine,
  circle: SECircle
  // layer: Group
): IntersectionReturnType[] {
  if (
    line instanceof SETangentLineThruPoint &&
    line.seParentOneDimensional.name === circle.name
  ) {
    if (
      line.seParentPoint instanceof SEPointOnOneOrTwoDimensional &&
      line.seParentPoint.parentOneDimensional.name === circle.name
    ) {
      return []; // in this case the point on the line of tangency is on the one dimensional non-straight object, that is, the point of tangency is the intersection, which already exists so doesn't need to be returned here
    } else {
      // in this case the point on the line of tangency is not on the one dimensional non-straight, so the intersection between this line and this circle is a single point
      const tmpVector = new Vector3();
      tmpVector.crossVectors(
        line.normalVector,
        circle.centerSEPoint.locationVector
      ); // this is a vector on the line, Pi/2 from the intersection point
      tmpVector.cross(line.normalVector); // This is either the intersection point or the antipode of the intersection
      // make sure this points in the correct direction
      if (
        (tmpVector.dot(circle.centerSEPoint.locationVector) > 0 &&
          circle.circleRadius <= Math.PI / 2) ||
        (tmpVector.dot(circle.centerSEPoint.locationVector) < 0 &&
          circle.circleRadius > Math.PI / 2)
      ) {
        return [{ vector: tmpVector, exists: true }];
      } else if (
        (tmpVector.dot(circle.centerSEPoint.locationVector) < 0 &&
          circle.circleRadius <= Math.PI / 2) ||
        (tmpVector.dot(circle.centerSEPoint.locationVector) > 0 &&
          circle.circleRadius > Math.PI / 2)
      ) {
        return [{ vector: tmpVector.multiplyScalar(-1), exists: true }];
      }
    }
  }
  // Use the circle circle intersection
  const temp = intersectCircles(
    line.normalVector,
    Math.PI / 2, // arc radius of lines
    circle.centerSEPoint.locationVector,
    circle.circleRadius
  );
  return temp;
}

/**
 * Find intersection between a line and an ellipse, the line is always first
 * @param line An SELine
 * @param ellipse An SEEllipse
 */
export function intersectLineWithEllipse(
  line: SELine,
  ellipse: SEEllipse
  // layer: Group
): IntersectionReturnType[] {
  if (
    line instanceof SETangentLineThruPoint &&
    line.seParentOneDimensional.name === ellipse.name
  ) {
    if (
      line.seParentPoint instanceof SEPointOnOneOrTwoDimensional &&
      line.seParentPoint.parentOneDimensional.name === ellipse.name
    ) {
      return []; // in this case the point on the line of tangency is on the one dimensional non-straight object, that is, the point of tangency is the intersection, which already exists so doesn't need to be returned here
    } else {
      // in this case the point on the line of tangency is not on the one dimensional non-straight, so the intersection between this line and this circle is a single point
      // find the point on the ellipse that is closest to the line, that is the point of tangency
      // The cosine of the angle between the normal (to the plane) and a point E(t) is E(t).dot(n) <-- this is the function we want to find the minimum of
      const tmpVector = new Vector3();
      tmpVector.copy(line.normalVector);

      // Transform the normal into the standard coordinates of the ellipse.
      tmpVector.applyMatrix4(tmpMatrix.copy(ellipse.ref.ellipseFrame).invert());

      if (tmpVector.dot(ellipse.ref.E(1.2312)) < 0) {
        // 1.2312 is a totally random number, it should not matter!
        tmpVector.multiplyScalar(-1);
      }
      // First form the objective function, this is the function whose minimum we want to find.
      const d: (t: number) => number = function (t: number): number {
        return ellipse.ref.E(t).dot(tmpVector);
      };

      // The derivative of d(t) is zero at a minimum or max, so we want to find the zeros of d'(t)

      const dp: (t: number) => number = function (t: number): number {
        return ellipse.Ep(t).dot(tmpVector);
      };

      // use (P''(t) /dot unitVec) as the second derivative

      const dpp = function (t: number): number {
        return ellipse.Epp(t).dot(tmpVector);
      };

      // FIXME
      //form collection of t values that trace the ellipse and create a fairly small grid to search for the zeros
      const tValues: number[] = [];
      for (let i = 0; i <= 100; i++) {
        tValues.push((i * 2 * Math.PI) / 100);
      }
      const zeros = SENodule.findZerosParametrically(
        dp,
        tValues,
        // ellipse.ref.tMin,
        // ellipse.ref.tMax,
        dpp
      );

      // The zeros of dp are either minimums or maximums (or neither, but this is very unlikely so we assume it doesn't happen)
      let minTVal: number = zeros[0]; // The t value that minimizes d
      zeros.forEach(tVal => {
        if (d(tVal) < d(minTVal)) {
          minTVal = tVal;
        }
      });
      tmpVector.copy(
        ellipse.ref.E(minTVal).applyMatrix4(ellipse.ref.ellipseFrame)
      );
      return [
        {
          vector: tmpVector,
          exists: true
        }
      ];
    }
  }
  // Transform the line into the standard coordinates of the ellipse.
  const transformedToStandard = new Vector3();
  transformedToStandard.copy(line.normalVector);
  transformedToStandard.applyMatrix4(
    tmpMatrix.copy(ellipse.ref.ellipseFrame).invert()
  );
  // The function to find the zeros of is the dot(normal to line, vector on ellipse)
  // because this indicates which side of the plane the point on the ellipse is
  const d: (t: number) => number = function (t: number): number {
    return ellipse.ref.E(t).dot(transformedToStandard);
  };
  // use (P''(t) /dot unitVec) as the second derivative if necessary
  const dp = function (t: number): number {
    return ellipse.Ep(t).dot(transformedToStandard);
  };
  //form collection of t values that trace the ellipse and create a fairly small grid to search for the zeros
  const tValues: number[] = [];
  for (let i = 0; i <= 100; i++) {
    tValues.push((i * 2 * Math.PI) / 100);
  }
  const zeros = SENodule.findZerosParametrically(
    d,
    tValues,
    // FIXME
    // ellipse.ref.tMin,
    // ellipse.ref.tMax,
    dp
  );
  const returnItems: IntersectionReturnType[] = [];
  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  returnItems.push(intersection1);
  returnItems.push(intersection2);

  // remove duplicate zeros and those that correspond to the same point on the ellipse
  const uniqueZeros: number[] = [];
  zeros.forEach(z => {
    if (
      uniqueZeros.every(uniZ => {
        tempVec.copy(ellipse.ref.E(uniZ));
        tempVec1.copy(ellipse.ref.E(z));
        return (
          Math.abs(z - uniZ) > SETTINGS.tolerance &&
          !tempVec2.subVectors(tempVec, tempVec1).isZero()
        );
      })
    ) {
      uniqueZeros.push(z);
    }
  });

  uniqueZeros.forEach((z, ind) => {
    if (ind > 1) {
      console.debug(
        "Ellipse and Line Intersection still resulted in more than 2 points!",
        zeros,
        uniqueZeros
      );
    } else {
      returnItems[ind].vector.copy(
        ellipse.ref.E(z).applyMatrix4(ellipse.ref.ellipseFrame)
      );

      returnItems[ind].exists = true;
    }
  });

  return returnItems;
}

/**
 * Find intersection between a line and a parametric, the line is always first
 * @param line An SELine
 * @param parametric An SEParametric
 */
export function intersectLineWithParametric(
  line: SELine,
  parametric: SEParametric,
  inverseTotalRotationMatrix: Matrix4
  // layer: Group
): IntersectionReturnType[] {
  const returnItems: IntersectionReturnType[] = [];
  // const avoidTValues: number[] = [];
  // find the tracing tMin and tMax
  const [tracingTMin, tracingTMax] = parametric.tMinMaxExpressionValues();

  if (
    line instanceof SETangentLineThruPoint &&
    line.seParentOneDimensional.name === parametric.name
  ) {
    if (
      !(line.seParentPoint instanceof SEPointOnOneOrTwoDimensional) ||
      !(line.seParentPoint.parentOneDimensional.name === parametric.name)
      // there can be multiple tangent through the point and only one (with index 0) is locally tangent at the SEPointOnOneOrTwoDimensional
    ) {
      // in this case the point on the line of tangency is not on the one dimensional non-straight, so the intersection between this line and this circle is a single point
      // find the point on the parametric that is closest to the line, that is the point of tangency
      // The cosine of the angle between the normal (to the plane) and a point E(t) is E(t).dot(n) <-- this is the function we want to find the minimum of
      // We know that E(t) is totally on one side of the plane, so to make this problem a minimum pick a point on Ellipse and check the dot product
      const tmpVector = new Vector3();
      tmpVector.copy(line.normalVector);

      // Transform the normal into the standard coordinates of the parametric.
      tmpVector.applyMatrix4(
        tmpMatrix.copy(inverseTotalRotationMatrix).invert()
      );
      // First form the objective function, this is the function whose minimum we want to find.
      const d: (t: number) => number = function (t: number): number {
        return parametric.P(t).dot(tmpVector);
      };

      // The derivative of d(t) is zero at a minimum or max, so we want to find the zeros of d'(t)
      const dp: (t: number) => number = function (t: number): number {
        return parametric.PPrime(t).dot(tmpVector);
      };

      // use (P''(t) /dot unitVec) as the second derivative
      const dpp = function (t: number): number {
        return parametric.PPrime(t).dot(tmpVector);
      };

      const zeros = parametric.tRanges.flatMap(tValues =>
        SENodule.findZerosParametrically(dp, tValues, dpp)
      );

      // The zeros of dp are either minimums or maximums (or neither, but this is very unlikely so we assume it doesn't happen)
      // there are potentially lots of extremes, but we are interested in any point where the parametric is *locally* on one side of the
      // the plane of the line and so the value of d is near zero

      const minTVal: number[] = []; // The t values that make d nearly zero
      zeros.forEach(tVal => {
        if (
          Math.abs(d(tVal)) < SETTINGS.tolerance &&
          // d(tVal) < d(minTVal) &&
          tracingTMin <= tVal &&
          tVal <= tracingTMax
        ) {
          minTVal.push(tVal);
        }
      });
      tmpMatrix.copy(inverseTotalRotationMatrix).invert();
      minTVal.forEach(min => {
        const returnVec = new Vector3();
        returnVec.copy(parametric.P(min).applyMatrix4(tmpMatrix));
        // avoidTValues.push(min);
        returnItems.push({
          vector: returnVec,
          exists: true
        });
      });
    }
  }
  // now compute the other intersections that are not near the point of tangency

  // Transform the line into the standard coordinates of the parametric.
  const transformedToStandard = new Vector3();
  transformedToStandard.copy(line.normalVector);
  transformedToStandard.applyMatrix4(inverseTotalRotationMatrix);
  // The function to find the zeros of is the dot(normal to line, vector on parametric)
  // because this indicates which side of the plane the point on the parametric is
  const d: (t: number) => number = function (t: number): number {
    return parametric.P(t).dot(transformedToStandard);
  };
  // use (P''(t) /dot unitVec) as the second derivative if necessary
  const dp = function (t: number): number {
    return parametric.PPrime(t).dot(transformedToStandard);
  };

  const zeros = parametric.tRanges.flatMap(tValues =>
    SENodule.findZerosParametrically(d, tValues, /*avoidTValues,*/ dp)
  );

  // const maxNumberOfIntersections = 2 * parametric.ref.numberOfParts;

  tmpMatrix.copy(inverseTotalRotationMatrix).invert();
  return zeros.map((tValue: number): IntersectionReturnType => {
    const vector = new Vector3();
    vector.copy(parametric.P(tValue)).applyMatrix4(tmpMatrix);
    return {
      vector,
      exists: tracingTMin <= tValue && tValue <= tracingTMax
    };
  });
}

/**
 * Find intersection between a two segment. This must be called with the lines in lexicographic order in order to the
 * return type correct.
 * @param segment1 An SESegment
 * @param segment2 An SESegment
 */
export function intersectSegmentWithSegment(
  segment1: SESegment,
  segment2: SESegment,
  firstTimeIntersection = false
): IntersectionReturnType[] {
  const returnItems: IntersectionReturnType[] = [];

  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  // Plus and minus the cross product of the normal vectors are the possible intersection vectors
  tempVec1
    .crossVectors(segment1.normalVector, segment2.normalVector)
    .normalize();
  tempVec2.copy(tempVec1).multiplyScalar(-1);
  intersection1.vector.copy(tempVec1);
  intersection2.vector.copy(tempVec2);

  // determine if the first intersection point is on the segment
  if (!segment1.onSegment(tempVec1) || !segment2.onSegment(tempVec1)) {
    intersection1.exists = false;
  }
  // Determine if the second intersection point is on the segment
  if (!segment1.onSegment(tempVec2) || !segment2.onSegment(tempVec2)) {
    intersection2.exists = false;
  }
  // If the normal vectors are on top of each other or antipodal, exists is false or if this is the first time the lines are being intersected,
  // we conclude the segments will *never* intersect (they are constrained to be on the same line forever -  like if the defining points of the second segment are points on the first segment
  // But notice that the two enddpoints on the two segments are moved to (nearly) antipodal positions, the second segment can have a different normal vector than the first, but the intersection
  // points are the two antipodal points that define endpoints of the segment so do not need to be returned as they already exist. IS THIS THE ONLY WAY THAT TWO segmentS CAN START IDENTICAL AND THEN BE MOVED APART?)

  if (
    tempVec
      .crossVectors(segment1.normalVector, segment2.normalVector)
      .isZero(SETTINGS.nearlyAntipodalIdeal)
  ) {
    if (firstTimeIntersection) {
      return returnItems;
    }
    intersection1.exists = false;
    intersection2.exists = false;
  }
  returnItems.push(intersection1);
  returnItems.push(intersection2);
  return returnItems;
}

/**
 * Find intersection between a segment and a circle, the segment is always first
 * @param segment An SESegment
 * @param circle An SECircle
 */
export function intersectSegmentWithCircle(
  segment: SESegment,
  circle: SECircle
): IntersectionReturnType[] {
  // Use the circle circle intersection
  const temp = intersectCircles(
    segment.normalVector,
    Math.PI / 2, // arc radius of lines
    circle.centerSEPoint.locationVector,
    circle.circleRadius
  );

  // If the segment and the circle don't intersect, the return vector is the zero vector and this shouldn't be passed to the onSegment because that method expects a unit vector
  temp.forEach(item => {
    if (item.vector.isZero()) {
      item.exists = false;
    } else {
      item.exists = segment.onSegment(item.vector);
    }
  });

  return temp;
}

/**
 * Find intersection between a segment and an ellipse, the segment is always first
 * @param segment An SESegment
 * @param ellipse An SEEllipse
 */
export function intersectSegmentWithEllipse(
  segment: SESegment,
  ellipse: SEEllipse
  // layer: Group
): IntersectionReturnType[] {
  // Transform the segment into the standard coordinates of the ellipse.
  const transformedToStandard = new Vector3();
  transformedToStandard.copy(segment.normalVector);
  transformedToStandard.applyMatrix4(
    tmpMatrix.copy(ellipse.ref.ellipseFrame).invert()
  );
  // The function to find the zeros of is the dot(normal to line, vector on ellipse)
  // because this indicates which side of the plane the point on the ellipse is
  const d: (t: number) => number = function (t: number): number {
    return ellipse.ref.E(t).dot(transformedToStandard);
  };
  // use (P''(t) /dot unitVec) as the second derivative if necessary
  const dp = function (t: number): number {
    return ellipse.Ep(t).dot(transformedToStandard);
  };
  //form collection of t values that trace the ellipse and create a fairly small grid to search for the zeros
  const tValues: number[] = [];
  for (let i = 0; i <= 100; i++) {
    tValues.push((i * 2 * Math.PI) / 100);
  }
  const zeros = SENodule.findZerosParametrically(d, tValues, dp);

  const returnItems: IntersectionReturnType[] = [];
  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  returnItems.push(intersection1);
  returnItems.push(intersection2);

  // remove duplicate zeros and those that correspond to the same point on the ellipse
  const uniqueZeros: number[] = [];
  zeros.forEach(z => {
    if (
      uniqueZeros.every(uniZ => {
        tempVec.copy(ellipse.ref.E(uniZ));
        tempVec1.copy(ellipse.ref.E(z));
        return (
          Math.abs(z - uniZ) > SETTINGS.tolerance &&
          !tempVec2.subVectors(tempVec, tempVec1).isZero()
        );
      })
    ) {
      uniqueZeros.push(z);
    }
  });

  uniqueZeros.forEach((z, ind) => {
    if (ind > 1) {
      console.debug(
        "Ellipse and Segment Intersection still resulted in more than 2 points!",
        zeros,
        uniqueZeros
      );
    } else {
      returnItems[ind].vector.copy(
        ellipse.ref.E(z).applyMatrix4(ellipse.ref.ellipseFrame)
      );
    }
  });

  // zeros.forEach((z, ind) => {
  //   // console.debug("return items", returnItems[ind].vector.toFixed(2));
  //   // console.debug(
  //   //   "ellipse.E(z)",
  //   //   z,
  //   //   ellipse.E(z).applyMatrix4(ellipse.ref.ellipseFrame).toFixed(2)
  //   // );
  //   returnItems[ind].vector.copy(
  //     ellipse.E(z).applyMatrix4(ellipse.ref.ellipseFrame)
  //   );
  // });
  // console.debug(returnItems[0].vector.toFixed(2));
  // console.debug(returnItems[1].vector.toFixed(2));
  // If the segment and the ellipse don't intersect, the return vector is the zero vector and this shouldn't be passed to the onSegment because that method expects a unit vector
  returnItems.forEach(item => {
    if (item.vector.isZero()) {
      item.exists = false;
    } else {
      item.exists = segment.onSegment(item.vector);
    }
  });

  return returnItems;
}

/**
 * Find intersection between a segment and an parametric, the segment is always first
 * @param segment An SESegment
 * @param parametric An SEParametric
 */
export function intersectSegmentWithParametric(
  segment: SESegment,
  parametric: SEParametric,
  inverseTotalRotationMatrix: Matrix4
): IntersectionReturnType[] {
  // The function to find the zeros of is the dot(normal to line, vector on parametric)
  // because this indicates which side of the plane the point on the parametric is
  const d: (t: number) => number = function (t: number): number {
    return parametric.P(t).dot(segment.normalVector);
  };
  // use (P''(t) /dot unitVec) as the second derivative if necessary
  const dp = function (t: number): number {
    return parametric.PPrime(t).dot(segment.normalVector);
  };
  // find the tracing tMin and tMax
  const [tracingTMin, tracingTMax] = parametric.tMinMaxExpressionValues();

  const zeros = parametric.tRanges
    // .map(tRange => [
    //   Math.max(tRange[0], tracingTMin), // the lower bound of the interval must be the max of these numbers
    //   Math.min(tRange[1], tracingTMax) // the upper bound of the interval must be the min of these numbers
    // ])
    .flatMap(tValues =>
      SENodule.findZerosParametrically(
        d,
        tValues,
        // parametric.c1DiscontinuityParameterValues,
        dp
      )
    );

  console.log("Number of Para/seg Intersections:", zeros.length);
  const returnItems: IntersectionReturnType[] = zeros.map(z => {
    const intersectionPoint = new Vector3();
    intersectionPoint.copy(parametric.P(z));

    // it must be on both the segment and the visible part of the parametric
    return {
      vector: intersectionPoint,
      exists: segment.onSegment(intersectionPoint)
    };
  });

  return returnItems;
}

/**
 * Find intersection points between two circles.
 * The order *matters* intersectCircleWithCircle(C1,r1,C2,r2) is not intersectCircleWithCircle(C2,r2,C1,r1)
 * Always call this with the circles in lexicographic order
 * The array is a list of the intersections positive then negative.
 * @param n1 center vector of the first circle
 * @param arc1 arc length radius of the first circle
 * @param n2 center vector of the second circle
 * @param arc2 arc length radius of the second circle
 */
export function intersectCircleWithCircle(
  circ1: SECircle,
  circ2: SECircle,
  firstTimeIntersection = false
) {
  return intersectCircles(
    circ1.centerSEPoint.locationVector,
    circ1.circleRadius,
    circ2.centerSEPoint.locationVector,
    circ2.circleRadius,
    firstTimeIntersection
  );
}

export function intersectCircles(
  n1: Vector3, // center
  arc1: number, // arc radius
  n2: Vector3,
  arc2: number,
  firstTimeIntersection = false
): IntersectionReturnType[] {
  //Initialize the items and the return items
  const returnItems: IntersectionReturnType[] = [];

  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };

  //Convert to the case where all arc lengths are less than Pi/2
  let radius1 = arc1;
  center1.copy(n1).normalize();
  if (arc1 > Math.PI / 2) {
    radius1 = Math.PI - radius1;
    center1.multiplyScalar(-1);
  }
  let radius2 = arc2;
  center2.copy(n2).normalize();
  if (arc2 > Math.PI / 2) {
    radius2 = Math.PI - radius2;
    center2.multiplyScalar(-1);
  }

  // distance between the two centers
  const centerDistance = center1.angleTo(center2); // distance between the two centers
  if (
    firstTimeIntersection &&
    (Math.abs(centerDistance) < SETTINGS.tolerance ||
      Math.PI - SETTINGS.tolerance < Math.abs(centerDistance))
  ) {
    // the centers are either the same or antipodal so the circles will never intersect.
    return returnItems;
  }
  // The circles intersect if and only if the three lengths have the property that each is less than the sum of the other two (by the converse to the spherical triangle inequality)
  if (
    centerDistance < radius1 + radius2 &&
    radius1 < centerDistance + radius2 &&
    radius2 < centerDistance + radius1
  ) {
    // The circles intersect
    // Form the normal that points on the positive side of the intersections
    normal.crossVectors(center1, center2).normalize();
    // semi-perimeter = sum of the length of the triangle/2
    const s = (radius1 + radius2 + centerDistance) / 2;
    // Compute the angle opposite the radius1 side. See M'Clelland & Preston. A treatise on
    // spherical trigonometry with applications to spherical geometry and numerous
    // examples - Part 1. 1907 page 114 Article 60 Case 1
    //
    //   . = positive intersection point
    //   \ \
    //    \   \
    //     \     \
    //      \       \radius2
    //       \radius1  \
    //        \_________A__\
    //          <- cenDist->

    const A =
      2 *
      Math.atan(
        Math.sqrt(
          (Math.sin(s - centerDistance) * Math.sin(s - radius2)) /
            (Math.sin(s) * Math.sin(s - radius1))
        )
      );
    // There are two cases:
    // 0 < A < Pi/2
    //  .  (positive intersection point)
    //  |\ \
    //  | \   \
    //  |  \     \
    // a|   \       \radius2
    //  |    \radius1  \
    //  |_____\_________A__\
    //   <-------  b ------>
    //          <- cenDist->

    //  Pi/2 < A < Pi (which is marked by A = arctan(...) < 0 so A is really arctan(...) + Pi  )
    //
    //  .  (negative intersection point)
    //  |\ \
    //  | \   \
    //  |  \     \
    // a|   \       \radius1
    //  |    \radius2  \
    //  |___A'_\A_________\
    //   <- b -><- cenDist->

    let a: number;
    let b: number;
    if (A > 0) {
      // Analyze the right triangle with hypotenuse radius2 and adjacent angle A'=A > 0
      // By page 85 Eq (3)
      a = Math.asin(Math.sin(radius2) * Math.sin(A));
      // By page 85 Eq (2)
      b = Math.atan(Math.tan(radius2) * Math.cos(A));

      // Create the toVector so that center2, normal, and toVector are an orthonormal frame
      toVector.crossVectors(center2, normal).normalize();
    } else {
      // Analyze the right triangle with hypotenuse radius2 and adjacent angle A'= Pi-A > 0
      // By page 85 Eq (3)
      a = Math.asin(Math.sin(radius2) * Math.sin(Math.PI - A));
      // By page 85 Eq (2)
      b = Math.atan(Math.tan(radius2) * Math.cos(Math.PI - A));
      // Create the toVector so that center2, normal, and toVector are an orthonormal frame
      toVector.crossVectors(normal, center2).normalize();
    }
    // tempVec= cos(b)*center2 + sin(b)*toVector is the projection of the intersections to the plane containing the centers of the circles
    tempVec.copy(center2).multiplyScalar(Math.cos(b));
    tempVec.addScaledVector(toVector, Math.sin(b));

    // The positive intersection is cos(a)*tempVec + sin(a)*normal
    intersection1.vector.copy(tempVec).multiplyScalar(Math.cos(a));
    intersection1.vector.addScaledVector(normal, Math.sin(a));
    // The negative intersection is cos(-a)*tempVec + sin(-a)*normal
    intersection2.vector.copy(tempVec).multiplyScalar(Math.cos(-a));
    intersection2.vector.addScaledVector(normal, Math.sin(-a));
    returnItems.push(intersection1);
    returnItems.push(intersection2);
    return returnItems;
  } else {
    // The circles do not intersect
    intersection1.exists = false;
    intersection2.exists = false;
    returnItems.push(intersection1);
    returnItems.push(intersection2);
    return returnItems;
  }
}

/**
 * Find intersection between a circle and an ellipse, the circle is always first
 * @param circle An SECircle
 * @param ellipse An SEEllipse
 */
export function intersectCircleWithEllipse(
  circle: SECircle,
  ellipse: SEEllipse
  // layer: Group
): IntersectionReturnType[] {
  // Transform the circle into the standard coordinates of the ellipse.
  const transformedToStandard = new Vector3();
  transformedToStandard.copy(circle.centerSEPoint.locationVector);
  transformedToStandard.applyMatrix4(
    tmpMatrix.copy(ellipse.ref.ellipseFrame).invert()
  );

  const radius = circle.circleRadius;
  // The function to find the zeros of is the distance from the transformed center to the
  // point on the ellipse minus the radius of the circle
  const d: (t: number) => number = function (t: number): number {
    return (
      Math.acos(
        Math.max(-1, Math.min(ellipse.ref.E(t).dot(transformedToStandard), 1))
      ) - radius
    );
  };
  // d'(t) = -1/ sqrt(1- (E(t) /dot vec)^2) * (E'(t) /dot vec)
  const dp = function (t: number): number {
    return (
      (-1 * ellipse.Ep(t).dot(transformedToStandard)) /
      Math.sqrt(
        1 -
          Math.max(
            -1,
            Math.min(ellipse.ref.E(t).dot(transformedToStandard), 1)
          ) *
            Math.max(
              -1,
              Math.min(ellipse.ref.E(t).dot(transformedToStandard), 1)
            )
      )
    );
  };
  //form collection of t values that trace the ellipse and create a fairly small grid to search for the zeros
  const tValues: number[] = [];
  for (let i = 0; i <= 100; i++) {
    tValues.push((i * 2 * Math.PI) / 100);
  }

  const zeros = SENodule.findZerosParametrically(
    d,
    // FIXME
    tValues,
    // ellipse.ref.tMin,
    // ellipse.ref.tMax,
    dp
  );
  const returnItems: IntersectionReturnType[] = [];
  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  const intersection3: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  const intersection4: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  returnItems.push(intersection1);
  returnItems.push(intersection2);
  returnItems.push(intersection3);
  returnItems.push(intersection4);

  zeros.forEach((z, ind) => {
    returnItems[ind].vector.copy(
      ellipse.ref.E(z).applyMatrix4(ellipse.ref.ellipseFrame)
    );
    returnItems[ind].exists = true;
  });
  return returnItems;
}

/**
 * Find intersection between a circle and an parametric, the circle is always first
 * @param circle An SECircle
 * @param parametric An SEParametric
 */
export function intersectCircleWithParametric(
  circle: SECircle,
  parametric: SEParametric,
  inverseTotalRotationMatrix: Matrix4
  // layer: Group
): IntersectionReturnType[] {
  // Transform the line into the standard coordinates of the parametric.
  const circleCenter = circle.centerSEPoint.locationVector;
  // transformedToStandard.applyMatrix4(inverseTotalRotationMatrix);

  const radius = circle.circleRadius;
  // The function to find the zeros of is the distance from the transformed center to the
  // point on the parametric minus the radius of the circle
  const d = (t: number): number => {
    return (
      Math.acos(Math.max(-1, Math.min(parametric.P(t).dot(circleCenter), 1))) -
      radius
    );
  };
  // d'(t) = -1/ sqrt(1- (E(t) /dot vec)^2) * (E'(t) /dot vec)
  const dp = (t: number): number => {
    return (
      (-1 * parametric.PPrime(t).dot(circleCenter)) /
      Math.sqrt(
        1 -
          Math.max(-1, Math.min(parametric.P(t).dot(circleCenter), 1)) *
            Math.max(-1, Math.min(parametric.P(t).dot(circleCenter), 1))
      )
    );
  };

  // find the tracing tMin and tMax
  const [tracingTMin, tracingTMax] = parametric.tMinMaxExpressionValues();

  const zeros = parametric.tRanges.flatMap(tValues =>
    SENodule.findZerosParametrically(
      d,
      tValues,
      // parametric.c1DiscontinuityParameterValues,
      dp
    )
  );

  return zeros
    .filter(t => tracingTMin <= t && t <= tracingTMax)
    .map(t => ({
      vector: parametric.P(t).clone(),
      exists: true
    }));
}

/**
 * Find intersection between an ellipse and an ellipse,
 * Always call this with the ellipses in lexicographic order
 * @param ellipse1 An SEEllipse
 * @param ellipse2 An SEEllipse
 */
export function intersectEllipseWithEllipse(
  ellipse1: SEEllipse,
  ellipse2: SEEllipse,
  firstTimeIntersection = false
): IntersectionReturnType[] {
  const returnItems: IntersectionReturnType[] = [];
  // Is this the first time these ellipses have been intersected and are they confocal? (Or antipodal-lly confocal). If so, they will never intersect
  if (
    firstTimeIntersection &&
    //E1 focus 1 is the same as E2 focus 1
    //E1 focus 2 is the same as E2 focus 2
    ((tempVec1
      .subVectors(
        ellipse1.focus1SEPoint.locationVector,
        ellipse2.focus1SEPoint.locationVector
      )
      .isZero() &&
      tempVec2
        .subVectors(
          ellipse1.focus2SEPoint.locationVector,
          ellipse2.focus2SEPoint.locationVector
        )
        .isZero()) ||
      //-(E1 focus 1) is the same as E2 focus 2
      //-(E1 focus 2) is the same as E2 focus 1
      (tempVec1
        .subVectors(
          tempVec
            .copy(ellipse1.focus1SEPoint.locationVector)
            .multiplyScalar(-1),
          ellipse2.focus2SEPoint.locationVector
        )
        .isZero() &&
        tempVec2
          .subVectors(
            tempVec3
              .copy(ellipse1.focus2SEPoint.locationVector)
              .multiplyScalar(-1),
            ellipse2.focus1SEPoint.locationVector
          )
          .isZero()) ||
      //E1 focus 1 is the same as E2 focus 2
      //E1 focus 2 is the same as E2 focus 1
      (tempVec1
        .subVectors(
          ellipse1.focus1SEPoint.locationVector,
          ellipse2.focus2SEPoint.locationVector
        )
        .isZero() &&
        tempVec2
          .subVectors(
            ellipse1.focus2SEPoint.locationVector,
            ellipse2.focus1SEPoint.locationVector
          )
          .isZero()) ||
      //-(E1 focus 1) is the same as E2 focus 1
      //-(E1 focus 2) is the same as E2 focus 2
      (tempVec1
        .subVectors(
          tempVec
            .copy(ellipse1.focus1SEPoint.locationVector)
            .multiplyScalar(-1),
          ellipse2.focus1SEPoint.locationVector
        )
        .isZero() &&
        tempVec2
          .subVectors(
            tempVec3
              .copy(ellipse1.focus2SEPoint.locationVector)
              .multiplyScalar(-1),
            ellipse2.focus2SEPoint.locationVector
          )
          .isZero()))
  ) {
    return returnItems;
  }

  // Transform ellipse1 into the standard coordinates of the ellipse2.
  const transformedToStandardFocus1 = new Vector3();
  const transformedToStandardFocus2 = new Vector3();
  transformedToStandardFocus1.copy(ellipse1.focus1SEPoint.locationVector);
  transformedToStandardFocus2.copy(ellipse1.focus2SEPoint.locationVector);
  tmpMatrix.copy(ellipse2.ref.ellipseFrame).invert();
  transformedToStandardFocus1.applyMatrix4(tmpMatrix);
  transformedToStandardFocus2.applyMatrix4(tmpMatrix);
  const angleSum = ellipse1.ellipseAngleSum;
  // The function to find the zeros of is the sum of the distance from a
  // point on ellipse2 to the transformed foci of ellipse1 minus the angleSum of ellipse1
  const d: (t: number) => number = function (t: number): number {
    return (
      Math.acos(
        Math.max(
          -1,
          Math.min(ellipse2.ref.E(t).dot(transformedToStandardFocus1), 1)
        )
      ) +
      Math.acos(
        Math.max(
          -1,
          Math.min(ellipse2.ref.E(t).dot(transformedToStandardFocus2), 1)
        )
      ) -
      angleSum
    );
  };
  // d'(t) = -1/ sqrt(1- (E(t) /dot tTSF1)^2) * (E'(t) /dot tTSF1) - 1/ sqrt(1- (E(t) /dot tTSF2)^2) * (E'(t) /dot tTSF2)
  const dp = function (t: number): number {
    return (
      (-1 * ellipse2.Ep(t).dot(transformedToStandardFocus1)) /
        Math.sqrt(
          1 -
            Math.max(
              -1,
              Math.min(ellipse2.ref.E(t).dot(transformedToStandardFocus1), 1)
            ) *
              Math.max(
                -1,
                Math.min(ellipse2.ref.E(t).dot(transformedToStandardFocus1), 1)
              )
        ) +
      (-1 * ellipse2.Ep(t).dot(transformedToStandardFocus2)) /
        Math.sqrt(
          1 -
            Math.max(
              -1,
              Math.min(ellipse2.ref.E(t).dot(transformedToStandardFocus2), 1)
            ) *
              Math.max(
                -1,
                Math.min(ellipse2.ref.E(t).dot(transformedToStandardFocus2), 1)
              )
        )
    );
  };

  //form collection of t values that trace the ellipse and create a fairly small grid to search for the zeros
  const tValues: number[] = [];
  for (let i = 0; i <= 100; i++) {
    tValues.push((i * 2 * Math.PI) / 100);
  }
  const zeros = SENodule.findZerosParametrically(
    d,
    tValues,
    // ellipse2.ref.tMin,
    // ellipse2.ref.tMax,
    dp
  );

  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  const intersection3: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  const intersection4: IntersectionReturnType = {
    vector: new Vector3(),
    exists: false
  };
  returnItems.push(intersection1);
  returnItems.push(intersection2);
  returnItems.push(intersection3);
  returnItems.push(intersection4);

  zeros.forEach((z, ind) => {
    returnItems[ind].vector.copy(
      ellipse2.ref.E(z).applyMatrix4(ellipse2.ref.ellipseFrame)
    );
    returnItems[ind].exists = true;
  });
  return returnItems;
}

/**
 * Find intersection between an ellipse and a parametric,
 * @param ellipse An SEEllipse
 * @param parametric An SEParametric
 */
export function intersectEllipseWithParametric(
  ellipse: SEEllipse,
  parametric: SEParametric,
  inverseTotalRotationMatrix: Matrix4
): IntersectionReturnType[] {
  // Transform ellipse into the standard coordinates of the ellipse.
  const focus1 = ellipse.focus1SEPoint.locationVector;
  const focus2 = ellipse.focus2SEPoint.locationVector;
  const angleSum = ellipse.ellipseAngleSum;
  // The function to find the zeros of is the sum of the distance from a
  // point on ellipse to the transformed foci of ellipse minus the angleSum of ellipse
  const d: (t: number) => number = function (t: number): number {
    return (
      Math.acos(Math.max(-1, Math.min(parametric.P(t).dot(focus1), 1))) +
      Math.acos(Math.max(-1, Math.min(parametric.P(t).dot(focus2), 1))) -
      angleSum
    );
  };
  // d'(t) = -1/ sqrt(1- (E(t) /dot tTSF1)^2) * (E'(t) /dot tTSF1) - 1/ sqrt(1- (E(t) /dot tTSF2)^2) * (E'(t) /dot tTSF2)
  const dp = function (t: number): number {
    return (
      (-1 * parametric.PPrime(t).dot(focus1)) /
        Math.sqrt(
          1 -
            Math.max(-1, Math.min(parametric.P(t).dot(focus1), 1)) *
              Math.max(-1, Math.min(parametric.P(t).dot(focus1), 1))
        ) +
      (-1 * parametric.PPrime(t).dot(focus2)) /
        Math.sqrt(
          1 -
            Math.max(-1, Math.min(parametric.P(t).dot(focus2), 1)) *
              Math.max(-1, Math.min(parametric.P(t).dot(focus2), 1))
        )
    );
  };

  // find the tracing tMin and tMax
  const [tracingTMin, tracingTMax] = parametric.tMinMaxExpressionValues();

  const zeros = parametric.tRanges.flatMap(tValues =>
    SENodule.findZerosParametrically(d, tValues, dp)
  );

  return zeros
    .filter(z => tracingTMin <= z && z <= tracingTMax)
    .map(z => ({
      vector: parametric.P(z).clone(),
      exists: true
    }));
}

type ST_pair = {
  s: number;
  t: number;
  pointDistance: number;
};

function find_zero(
  sCurve: SEParametric,
  tCurve: SEParametric,
  s_guess: number,
  t_guess: number,
  initial_distance: number
): ST_pair | undefined {
  const st = new Vector2();
  const st_next = new Vector2();
  const f_st = new Vector3();
  st.set(s_guess, t_guess);
  // let dist: number = Number.MAX_VALUE;
  let delta_st: number;
  let iter = 0;
  // Newton's iteration See latex-notes/parametric-intersection.tex for more details
  do {
    // calculate P'(s) and Q'(t)
    const PPrime = sCurve.PPrime(st.x);
    const QPrime = tCurve.PPrime(st.y);
    // console.debug(
    //   "P(s) at",
    //   sCurve.P(st.x).toFixed(6),
    //   "Q(t) at",
    //   tCurve.P(st.y).toFixed(6)
    // );
    // console.debug("P'(s) at", PPrime.toFixed(6), "Q'(t) at", QPrime.toFixed(6));
    // calculate f(s,t)
    f_st.subVectors(sCurve.P(st.x), tCurve.P(st.y));
    // Calculate the transpose(Jacobian) * Jacobian
    const jacobian_determinant = PPrime.y * QPrime.x - PPrime.x * QPrime.y;
    const update_s =
      (-QPrime.y * f_st.x + QPrime.x * f_st.y) / jacobian_determinant;
    const update_t =
      (-PPrime.y * f_st.x + PPrime.x * f_st.y) / jacobian_determinant;
    // dist = distanceOf(st.x, st.y);
    st_next.set(st.x - update_s, st.y - update_t);
    // console.debug("Next (s,t) at ", st_next.toFixed(6));
    delta_st = st_next.distanceTo(st);
    st.copy(st_next);
    iter++;
  } while (delta_st > 1e-5 && iter < 50);
  if (iter < 50) {
    // Verify that the z-coordinate of both points agree
    const z_on_S = sCurve.P(st.x).z;
    const z_on_T = tCurve.P(st.y).z;
    console.debug(
      `Nearby (${s_guess}, ${t_guess}) converges to intersection at (S,T) = (${st.x}, ${st.y})`,
      "Z-check",
      z_on_S,
      z_on_T
    );
    if (z_on_S * z_on_T > 0)
      // Same side of the sphere?
      return {
        s: st.x,
        t: st.y,
        pointDistance: f_st.length()
      };
    else return undefined;
    // sIntersects.push(st.x);
    // returnItems.push({
    //   /*s: st.x, t: st.y, */ exists: true,
    //   vector: sCurve.P(st.x).clone()
    // });
  } else {
    console.debug(`Nearby (${s_guess}, ${t_guess}) does not converge`);
    return undefined;
  }
}

function minimize_distance(
  sCurve: SEParametric,
  tCurve: SEParametric,
  s_guess: number,
  t_guess: number,
  initial_distance: number
): ST_pair | undefined {
  const DESCENT_RATE = 0.0001;
  const p_minus_q = new Vector3();
  let s_curr: number = s_guess;
  let t_curr: number = t_guess;
  let s_next: number;
  let t_next: number;
  let iter = 0;
  let st_distance: number;
  let lowest_distance = Number.MAX_VALUE;
  let lowest_s = s_guess;
  let lowest_t = t_guess;
  // Newton's iteration See latex-notes/parametric-intersection.tex for more details
  console.debug(
    "Initial guess (s,t) at ",
    s_guess.toFixed(6),
    t_guess.toFixed(6)
  );
  do {
    // calculate P'(s) and Q'(t)
    const PPrime = sCurve.PPrime(s_curr);
    const PPrimePrime = sCurve.PPPrime(s_curr);
    const QPrime = tCurve.PPrime(t_curr);
    const QPrimePrime = tCurve.PPPrime(t_curr);
    p_minus_q.subVectors(sCurve.P(s_curr), tCurve.P(t_curr));
    // calculate gradient
    const grad_s = -2 * PPrime.dot(tCurve.P(t_curr));
    const grad_t = -2 * sCurve.P(s_curr).dot(QPrime);
    // calculate Hessian
    const hess_ss = -2 * PPrimePrime.dot(tCurve.P(t_curr));
    const hess_tt = -2 * sCurve.P(s_curr).dot(QPrimePrime);
    const hess_st = -2 * PPrime.dot(QPrime);
    const hess_determinant = hess_ss * hess_tt - hess_st * hess_st;
    const update_s = (hess_tt * grad_s - hess_st * grad_t) / hess_determinant;
    const update_t = (hess_ss * grad_t - hess_st * grad_s) / hess_determinant;
    s_next = s_curr - update_s * DESCENT_RATE;
    t_next = t_curr - update_t * DESCENT_RATE;
    st_distance = sCurve.P(s_next).distanceTo(tCurve.P(t_next));
    if (st_distance < lowest_distance) {
      lowest_distance = st_distance;
      lowest_s = s_next;
      lowest_t = t_next;
    }
    console.debug(
      "Next (s,t) at iteration",
      iter,
      s_next.toFixed(6),
      t_next.toFixed(6),
      "current distance to minimize",
      st_distance.toFixed(6)
    );
    s_curr = s_next;
    t_curr = t_next;

    iter++;
  } while (st_distance > 1e-4 && iter < 50);
  if (iter < 50) {
    console.debug(
      `Nearby (${s_guess}, ${t_guess}) converges to intersection at (S,T) = (${s_curr}, ${t_curr})`
    );
    return { s: s_curr, t: t_curr, pointDistance: st_distance };
    // sIntersects.push(s_curr);
    // returnItems.push({
    //   /*s: st.x, t: st.y, */ exists: true,
    //   vector: sCurve.P(st.x).clone()
    // });
  } else {
    console.debug(
      `Nearby (${s_guess}, ${t_guess}) does NOT converge. The best (s,t) estimate (${lowest_s.toFixed(
        6
      )}, ${lowest_t.toFixed(6)}) and lowest distance ${lowest_distance.toFixed(
        6
      )}`
    );
    if (lowest_distance < initial_distance) {
      return {
        s: lowest_s,
        t: lowest_t,
        pointDistance: lowest_distance
      };
    }
  }
  return undefined;
}

export function intersectParametricWithParametric(
  parametric1: SEParametric,
  parametric2: SEParametric
): IntersectionReturnType[] {
  // Given two parametric curves P(s) and Q(t). Finding intersection points of both curves is akin to
  // looking for s,t such that D(s,t) = P(s) - Q(t) = 0. Which can be solved by looking for
  // the zeroes of the following function of two variables D(s,t) = P(s) - Q(t)

  //  parametric1.ref.numberOfParts + parametric2.ref.numberOfParts;

  let sCurve: SEParametric;
  let tCurve: SEParametric;
  if (parametric1.tRanges.length > parametric2.tRanges.length) {
    sCurve = parametric2;
    tCurve = parametric1;
  } else {
    sCurve = parametric1;
    tCurve = parametric2;
  }
  const s_gap = sCurve.largestSampleGap / 2;
  const t_gap = tCurve.largestSampleGap / 2;
  const distance_threhold = Math.min(
    Math.sqrt(s_gap * s_gap + t_gap * t_gap),
    1e-2 // Keep the threshold not to exceed 0.001
  );
  /*
  foreach (s in parametric1) {
    Find T-values of Q(t) such that of Q(t) - P(s) = 0, t is variable, s is constant
    // Return the result as a tuple (s, t1), (s, t2), ...
  }
  */
  type STHeapItem = {
    sPart: number;
    tPart: number;
    sIndex: number;
    tIndex: number;
    distance: number;
  };
  const distanceHeap: MinHeap<STHeapItem> = new MinHeap(
    (z: STHeapItem) => z.distance
  );

  // Generate nearby (s,t) pairs
  sCurve.tRanges.forEach((sValues: number[], sPart: number) => {
    sValues.forEach((sVal: number, sIndex: number) => {
      const sPoint = sCurve.P(sVal);
      const fn = (tVal: number): number => {
        const tPoint = tCurve.P(tVal);
        const distance = tPoint.distanceTo(sPoint);
        return distance;
      };
      tCurve.tRanges.forEach((tValues: number[], tPart: number) => {
        tValues.forEach((tVal: number, tIndex: number) => {
          const checkDistance = fn(tVal);
          if (checkDistance < distance_threhold)
            // Make it generous
            distanceHeap.push({
              sPart,
              sIndex,
              tPart,
              tIndex,
              distance: fn(tVal)
            });
        });
      });
    });
  });
  console.debug(
    `${parametric1.name}/${parametric2.name} possible intersection`,
    distanceHeap.size()
  );

  // Compute the distance of two points given their T-values on respective curves
  const distanceOf = (s: number, t: number): number => {
    return sCurve.P(s).distanceToSquared(tCurve.P(t));
  };

  const sIntersects: Array<number> = [];
  while (distanceHeap.size() > 0) {
    const { sPart, sIndex, tPart, tIndex, distance } = distanceHeap.pop()!;
    const sVal = sCurve.tRanges[sPart][sIndex];
    const tVal = tCurve.tRanges[tPart][tIndex];
    console.debug(
      `Possible intersection at S-value ${sVal} and T-value ${tVal} with distance ${distance}`
    );
    const out = find_zero(sCurve, tCurve, sVal, tVal, distance);
    // const out = minimize_distance(sCurve, tCurve, sVal, tVal, distance);
    if (typeof out !== "undefined") sIntersects.push(out.s);
  }
  sIntersects.sort((s1, s2) => s1 - s2);
  let lastS = Number.POSITIVE_INFINITY;

  // Filter out possible duplicates
  const cleanedUp = sIntersects
    .filter(s => {
      if (Math.abs(s - lastS) > 1e-5) {
        lastS = s;
        return true;
      } else return false;
    })
    .map(s => ({ exists: true, vector: sCurve.P(s).clone() }));
  console.debug("Computed intersection", cleanedUp.length);
  return cleanedUp;
}
/**
 * Create the intersection of two one-dimensional objects
 * Make sure the SENodules are in the correct order: SELines, SESegments, SECircles, SEEllipse, SEParametric.
 * That the (one,two) pair is one of:
 *  (SELine,SELine), (SELine,SESegment), (SELine,SECircle), (SELine,SEEllipse), (SELine,SEParametric),
 *                (SESegment, SESegment), (SESegment, SECircle), (SESegment, SEEllipse), (SESegment, SEParametric),
 *                                         (SECircle, SECircle) ,(SECircle, SEEllipse),(SECircle, SEParametric),
 *                                                                (SEEllipse, SEEllipse),(SEEllipse, SEParametric),
 *                                                                                        (SEEllipse, SEParametric),
 * If they have the same type put them in lexicographic order.
 * The creation of the intersection objects automatically follows this convention in assigning parents.
 */

export function intersectTwoObjects(
  one: SEOneDimensional,
  two: SEOneDimensional,
  inverseTotalRotationMatrix: Matrix4
): IntersectionReturnType[] {
  const rank1 = rank_of_type(one);
  const rank2 = rank_of_type(two);
  if (rank2 < rank1 || (rank1 == rank2 && two.name < one.name)) {
    console.error(
      `Intersect two objects ${one.name} and ${two.name}: They are NOT in rank and/or lexicographic order! One: ${one.name} and  Two: ${two.name}`
    );
  }

  if (one instanceof SELine) {
    if (two instanceof SELine)
      return one.name < two.name
        ? intersectLineWithLine(one, two)
        : intersectLineWithLine(two, one);
    else if (two instanceof SESegment)
      return intersectLineWithSegment(one, two);
    else if (two instanceof SECircle) return intersectLineWithCircle(one, two);
    else if (two instanceof SEEllipse)
      return intersectLineWithEllipse(one, two);
    else if (two instanceof SEParametric)
      return intersectLineWithParametric(one, two, inverseTotalRotationMatrix);
  } else if (one instanceof SESegment) {
    if (two instanceof SESegment)
      return one.name < two.name
        ? intersectSegmentWithSegment(one, two)
        : intersectSegmentWithSegment(two, one);
    else if (two instanceof SECircle)
      return intersectSegmentWithCircle(one, two);
    else if (two instanceof SEEllipse)
      return intersectSegmentWithEllipse(one, two);
    else if (two instanceof SEParametric)
      return intersectSegmentWithParametric(
        one,
        two,
        inverseTotalRotationMatrix
      );
  } else if (one instanceof SECircle) {
    if (two instanceof SECircle)
      return one.name < two.name
        ? intersectCircles(
            one.centerSEPoint.locationVector,
            one.circleRadius,
            two.centerSEPoint.locationVector,
            two.circleRadius
          )
        : intersectCircles(
            two.centerSEPoint.locationVector,
            two.circleRadius,
            one.centerSEPoint.locationVector,
            one.circleRadius
          );
    else if (two instanceof SEEllipse)
      return intersectCircleWithEllipse(one, two);
    else if (two instanceof SEParametric)
      return intersectCircleWithParametric(
        one,
        two,
        inverseTotalRotationMatrix
      );
  } else if (one instanceof SEEllipse) {
    if (two instanceof SEEllipse)
      return one.name < two.name
        ? intersectEllipseWithEllipse(one, two)
        : intersectEllipseWithEllipse(two, one);
    else if (two instanceof SEParametric)
      return intersectEllipseWithParametric(
        one,
        two,
        inverseTotalRotationMatrix
      );
  } else if (one instanceof SEParametric) {
    if (two instanceof SEParametric) {
      const xcross = intersectParametricWithParametric(one, two);
      xcross.forEach((z, ind) => {
        console.debug(`Intersection #${ind} at ${z.vector.toFixed(4)}`);
      });
      return xcross;
    }
  }
  throw (
    "Attempted to intersect non-one dimensional objects " +
    `${one.name}` +
    " and " +
    `${two.name}`
  );
}
