import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SELine } from "@/models/SELine";
import { SEEllipse } from "@/models/SEEllipse";
import { IntersectionReturnType } from "@/types";
import { Vector3, Matrix4 } from "three";
import { SENodule } from "@/models/SENodule";
import SETTINGS from "@/global-settings";
import { SEParametric } from "@/models/SEParametric";
import { SEStore } from "@/store";
import { SETangentLineThruPoint } from "@/models/SETangentLineThruPoint";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";

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
 * intersection of two lines. This must be called with the lines in alphabetical order in order to the
 * return type correct.
 * @param lineOne An SELine
 * @param lineTwo An SELine
 */
export function intersectLineWithLine(
  lineOne: SELine,
  lineTwo: SELine
): IntersectionReturnType[] {
  const returnItems = [];
  // console.debug("Create 2 new Vector3()");
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

  // If the normal vectors are on top of each other or antipodal, exists is false
  if (
    tempVec
      .crossVectors(lineOne.normalVector, lineTwo.normalVector)
      .isZero(SETTINGS.nearlyAntipodalIdeal)
  ) {
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
  segment: SESegment
): IntersectionReturnType[] {
  const returnItems = [];
  // console.debug("Create 2 new Vector3()");
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
  // If the normal vectors are on top of each other or antipodal, exists is false
  if (
    tempVec
      .crossVectors(line.normalVector, segment.normalVector)
      .isZero(SETTINGS.nearlyAntipodalIdeal)
  ) {
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
  // layer: Two.Group
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
  return intersectCircles(
    line.normalVector,
    Math.PI / 2, // arc radius of lines
    circle.centerSEPoint.locationVector,
    circle.circleRadius
  );
}

/**
 * Find intersection between a line and an ellipse, the line is always first
 * @param line An SELine
 * @param ellipse An SEEllipse
 */
export function intersectLineWithEllipse(
  line: SELine,
  ellipse: SEEllipse
  // layer: Two.Group
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
      tmpVector.applyMatrix4(tmpMatrix.getInverse(ellipse.ref.ellipseFrame));

      if (tmpVector.dot(ellipse.ref.E(1.2312)) < 0) {
        // 1.2312 is a totally random number, it should not matter!
        tmpVector.multiplyScalar(-1);
      }
      // First form the objective function, this is the function whose minimum we want to find.
      const d: (t: number) => number = function(t: number): number {
        return ellipse.ref.E(t).dot(tmpVector);
      };

      // The derivative of d(t) is zero at a minimum or max, so we want to find the zeros of d'(t)

      const dp: (t: number) => number = function(t: number): number {
        return ellipse.ref.Ep(t).dot(tmpVector);
      };

      // use (P''(t) /dot unitVec) as the second derivative

      const dpp = function(t: number): number {
        return ellipse.ref.Epp(t).dot(tmpVector);
      };

      const zeros = SENodule.findZerosParametrically(
        dp,
        ellipse.ref.tMin,
        ellipse.ref.tMax,
        [],
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
    tmpMatrix.getInverse(ellipse.ref.ellipseFrame)
  );
  // The function to find the zeros of is the dot(normal to line, vector on ellipse)
  // because this indicates which side of the plane the point on the ellipse is
  const d: (t: number) => number = function(t: number): number {
    return ellipse.ref.E(t).dot(transformedToStandard);
  };
  // use (P''(t) /dot unitVec) as the second derivative if necessary
  const dp = function(t: number): number {
    return ellipse.ref.Ep(t).dot(transformedToStandard);
  };

  const zeros = SENodule.findZerosParametrically(
    d,
    ellipse.ref.tMin,
    ellipse.ref.tMax,
    [],
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
  // console.log("Line Ellipse Inter", zeros);
  zeros.forEach((z, ind) => {
    // console.log("ind", ind);
    if (ind > 1) {
      console.debug(
        "Ellipse and Line Intersection resulted in more than 2 points.",
        zeros
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
  parametric: SEParametric
  // layer: Two.Group
): IntersectionReturnType[] {
  const returnItems: IntersectionReturnType[] = [];
  const avoidTValues: number[] = [];
  // find the tracing tMin and tMax
  const [tracingTMin, tracingTMax] = parametric.tMinMaxExpressionValues();

  if (
    line instanceof SETangentLineThruPoint &&
    line.seParentOneDimensional.name === parametric.name
  ) {
    // console.log("1 intersection index ", line.index);
    if (
      !(line.seParentPoint instanceof SEPointOnOneOrTwoDimensional) ||
      !(line.seParentPoint.parentOneDimensional.name === parametric.name)
      // there can be multiple tangent through the point and only one (with index 0) is locally tangent at the SEPointOnOneOrTwoDimensional
    ) {
      // console.log("2 intersection index", line.index);
      // in this case the point on the line of tangency is not on the one dimensional non-straight, so the intersection between this line and this circle is a single point
      // find the point on the parametric that is closest to the line, that is the point of tangency
      // The cosine of the angle between the normal (to the plane) and a point E(t) is E(t).dot(n) <-- this is the function we want to find the minimum of
      // We know that E(t) is totally on one side of the plane, so to make this problem a minimum pick a point on Ellipse and check the dot product
      const tmpVector = new Vector3();
      tmpVector.copy(line.normalVector);

      // Transform the normal into the standard coordinates of the parametric.
      tmpVector.applyMatrix4(
        tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
      );
      // First form the objective function, this is the function whose minimum we want to find.
      const d: (t: number) => number = function(t: number): number {
        return parametric.ref.P(t).dot(tmpVector);
      };

      // The derivative of d(t) is zero at a minimum or max, so we want to find the zeros of d'(t)
      const dp: (t: number) => number = function(t: number): number {
        return parametric.ref.PPrime(t).dot(tmpVector);
      };

      // use (P''(t) /dot unitVec) as the second derivative
      const dpp = function(t: number): number {
        return parametric.ref.PPPrime(t).dot(tmpVector);
      };

      const zeros = SENodule.findZerosParametrically(
        dp,
        parametric.tNumbers.min,
        parametric.tNumbers.max,
        [],
        dpp
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

      minTVal.forEach(min => {
        const returnVec = new Vector3();
        returnVec.copy(
          parametric.ref
            .P(min)
            .applyMatrix4(
              tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
            )
        );
        avoidTValues.push(min);
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
  transformedToStandard.applyMatrix4(SEStore.inverseTotalRotationMatrix);
  // The function to find the zeros of is the dot(normal to line, vector on parametric)
  // because this indicates which side of the plane the point on the parametric is
  const d: (t: number) => number = function(t: number): number {
    return parametric.ref.P(t).dot(transformedToStandard);
  };
  // use (P''(t) /dot unitVec) as the second derivative if necessary
  const dp = function(t: number): number {
    return parametric.ref.PPrime(t).dot(transformedToStandard);
  };

  const zeros = SENodule.findZerosParametrically(
    d,
    parametric.tNumbers.min,
    parametric.tNumbers.max,
    avoidTValues,
    dp
  );

  // const maxNumberOfIntersections = 2 * parametric.ref.numberOfParts;

  tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix);
  return zeros.map(
    (tValue: number): IntersectionReturnType => {
      const vector = new Vector3();
      vector.copy(parametric.ref.P(tValue)).applyMatrix4(tmpMatrix);
      return {
        vector,
        exists: tracingTMin <= tValue && tValue <= tracingTMax
      };
    }
  );
}

/**
 * Find intersection between a two segment. This must be called with the lines in alphabetical order in order to the
 * return type correct.
 * @param segment1 An SESegment
 * @param segment2 An SESegment
 */
export function intersectSegmentWithSegment(
  segment1: SESegment,
  segment2: SESegment
): IntersectionReturnType[] {
  const returnItems = [];
  // console.debug("Create 2 new Vector3()");
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
  // If the normal vectors are on top of each other or antipodal, exists is false
  if (
    tempVec
      .crossVectors(segment1.normalVector, segment2.normalVector)
      .isZero(SETTINGS.nearlyAntipodalIdeal)
  ) {
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
  // layer: Two.Group
): IntersectionReturnType[] {
  // Transform the segment into the standard coordinates of the ellipse.
  const transformedToStandard = new Vector3();
  transformedToStandard.copy(segment.normalVector);
  transformedToStandard.applyMatrix4(
    tmpMatrix.getInverse(ellipse.ref.ellipseFrame)
  );
  // The function to find the zeros of is the dot(normal to line, vector on ellipse)
  // because this indicates which side of the plane the point on the ellipse is
  const d: (t: number) => number = function(t: number): number {
    return ellipse.ref.E(t).dot(transformedToStandard);
  };
  // use (P''(t) /dot unitVec) as the second derivative if necessary
  const dp = function(t: number): number {
    return ellipse.ref.Ep(t).dot(transformedToStandard);
  };

  const zeros = SENodule.findZerosParametrically(
    d,
    ellipse.ref.tMin,
    ellipse.ref.tMax,
    [],
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

  zeros.forEach((z, ind) => {
    returnItems[ind].vector.copy(
      ellipse.ref.E(z).applyMatrix4(ellipse.ref.ellipseFrame)
    );
  });
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
  parametric: SEParametric
  // layer: Two.Group
): IntersectionReturnType[] {
  // Transform the line into the standard coordinates of the parametric.
  const transformedToStandard = new Vector3();
  transformedToStandard.copy(segment.normalVector);
  transformedToStandard.applyMatrix4(SEStore.inverseTotalRotationMatrix);

  // The function to find the zeros of is the dot(normal to line, vector on parametric)
  // because this indicates which side of the plane the point on the parametric is
  const d: (t: number) => number = function(t: number): number {
    return parametric.ref.P(t).dot(transformedToStandard);
  };
  // use (P''(t) /dot unitVec) as the second derivative if necessary
  const dp = function(t: number): number {
    return parametric.ref.PPrime(t).dot(transformedToStandard);
  };
  // find the tracing tMin and tMax
  const [tracingTMin, tracingTMax] = parametric.tMinMaxExpressionValues();

  const zeros = SENodule.findZerosParametrically(
    d,
    parametric.tNumbers.min,
    parametric.tNumbers.max,
    parametric.c1DiscontinuityParameterValues,
    dp
  );

  const maxNumberOfIntersections = 2 * parametric.ref.numberOfParts;

  const returnItems: IntersectionReturnType[] = [];
  for (let i = 0; i < maxNumberOfIntersections; i++) {
    const intersection: IntersectionReturnType = {
      vector: new Vector3(),
      exists: false
    };
    returnItems.push(intersection);
  }

  // console.log("Number of Para/seg Intersections:", zeros.length);
  if (returnItems.length >= zeros.length)
    zeros.forEach((z, ind) => {
      returnItems[ind].vector.copy(
        parametric.ref
          .P(z)
          .applyMatrix4(
            tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
          )
      );
      if (tracingTMin <= z && z <= tracingTMax) {
        // it must be on both the segment and the visible part of the parametric
        returnItems[ind].exists = segment.onSegment(returnItems[ind].vector);
      } else {
        returnItems[ind].exists = false;
      }
    });
  return returnItems;
}

/**
 * Find intersection points between two circles.
 * The order *matter* intersectCircleWithCircle(C1,r1,C2,r2) is not intersectCircleWithCircle(C2,r2,C1,r1)
 * Always call this with the circles in alphabetical order
 * The array is a list of the intersections positive then negative.
 * @param n1 center vector of the first circle
 * @param arc1 arc length radius of the first circle
 * @param n2 center vector of the second circle
 * @param arc2 arc length radius of the second circle
 */
export function intersectCircles(
  n1: Vector3, // center
  arc1: number, // arc radius
  n2: Vector3,
  arc2: number
): IntersectionReturnType[] {
  //Initialize the items and the return items
  const returnItems = [];
  // console.debug("Create 2 new Vector3()");
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
  // layer: Two.Group
): IntersectionReturnType[] {
  // Transform the circle into the standard coordinates of the ellipse.
  const transformedToStandard = new Vector3();
  transformedToStandard.copy(circle.centerSEPoint.locationVector);
  transformedToStandard.applyMatrix4(
    tmpMatrix.getInverse(ellipse.ref.ellipseFrame)
  );
  const radius = circle.circleRadius;
  // The function to find the zeros of is the distance from the transformed center to the
  // point on the ellipse minus the radius of the circle
  const d: (t: number) => number = function(t: number): number {
    return (
      Math.acos(
        Math.max(-1, Math.min(ellipse.ref.E(t).dot(transformedToStandard), 1))
      ) - radius
    );
  };
  // d'(t) = -1/ sqrt(1- (E(t) /dot vec)^2) * (E'(t) /dot vec)
  const dp = function(t: number): number {
    return (
      (-1 * ellipse.ref.Ep(t).dot(transformedToStandard)) /
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

  const zeros = SENodule.findZerosParametrically(
    d,
    ellipse.ref.tMin,
    ellipse.ref.tMax,
    [],
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
  parametric: SEParametric
  // layer: Two.Group
): IntersectionReturnType[] {
  // Transform the line into the standard coordinates of the parametric.
  const transformedToStandard = new Vector3();
  transformedToStandard.copy(circle.centerSEPoint.locationVector);
  transformedToStandard.applyMatrix4(SEStore.inverseTotalRotationMatrix);

  const radius = circle.circleRadius;
  // The function to find the zeros of is the distance from the transformed center to the
  // point on the parametric minus the radius of the circle
  const d: (t: number) => number = function(t: number): number {
    return (
      Math.acos(
        Math.max(
          -1,
          Math.min(parametric.ref.P(t).dot(transformedToStandard), 1)
        )
      ) - radius
    );
  };
  // d'(t) = -1/ sqrt(1- (E(t) /dot vec)^2) * (E'(t) /dot vec)
  const dp = function(t: number): number {
    return (
      (-1 * parametric.ref.PPrime(t).dot(transformedToStandard)) /
      Math.sqrt(
        1 -
          Math.max(
            -1,
            Math.min(parametric.ref.P(t).dot(transformedToStandard), 1)
          ) *
            Math.max(
              -1,
              Math.min(parametric.ref.P(t).dot(transformedToStandard), 1)
            )
      )
    );
  };

  // find the tracing tMin and tMax
  const [tracingTMin, tracingTMax] = parametric.tMinMaxExpressionValues();

  const zeros = SENodule.findZerosParametrically(
    d,
    parametric.tNumbers.min,
    parametric.tNumbers.max,
    parametric.c1DiscontinuityParameterValues,
    dp
  );

  const maxNumberOfIntersections = 2 * parametric.ref.numberOfParts;

  const returnItems: IntersectionReturnType[] = [];
  for (let i = 0; i < maxNumberOfIntersections; i++) {
    const intersection: IntersectionReturnType = {
      vector: new Vector3(),
      exists: false
    };
    returnItems.push(intersection);
  }

  // console.log("Number of Para/circ Intersections:", zeros.length);
  zeros.forEach((z, ind) => {
    returnItems[ind].vector.copy(
      parametric.ref
        .P(z)
        .applyMatrix4(tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix))
    );
    if (tracingTMin <= z && z <= tracingTMax) {
      // it must be on both the circle (which by being a zero of d, it is!) and the visible part of the parametric
      returnItems[ind].exists = true;
    } else {
      returnItems[ind].exists = false;
    }
  });
  return returnItems;
}

/**
 * Find intersection between an ellipse and an ellipse,
 * Always call this with the ellipses in alphabetical order
 * @param ellipse1 An SEEllipse
 * @param ellipse2 An SEEllipse
 */
export function intersectEllipseWithEllipse(
  ellipse1: SEEllipse,
  ellipse2: SEEllipse
): IntersectionReturnType[] {
  // Transform ellipse1 into the standard coordinates of the ellipse2.
  const transformedToStandardFocus1 = new Vector3();
  const transformedToStandardFocus2 = new Vector3();
  transformedToStandardFocus1.copy(ellipse1.focus1SEPoint.locationVector);
  transformedToStandardFocus2.copy(ellipse1.focus2SEPoint.locationVector);
  transformedToStandardFocus1.applyMatrix4(
    tmpMatrix.getInverse(ellipse2.ref.ellipseFrame)
  );
  transformedToStandardFocus2.applyMatrix4(
    tmpMatrix.getInverse(ellipse2.ref.ellipseFrame)
  );
  const angleSum = ellipse1.ellipseAngleSum;
  // The function to find the zeros of is the sum of the distance from a
  // point on ellipse2 to the transformed foci of ellipse1 minus the angleSum of ellipse1
  const d: (t: number) => number = function(t: number): number {
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
  const dp = function(t: number): number {
    return (
      (-1 * ellipse2.ref.Ep(t).dot(transformedToStandardFocus1)) /
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
      (-1 * ellipse2.ref.Ep(t).dot(transformedToStandardFocus2)) /
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

  const zeros = SENodule.findZerosParametrically(
    d,
    ellipse2.ref.tMin,
    ellipse2.ref.tMax,
    [],
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
  parametric: SEParametric
): IntersectionReturnType[] {
  // Transform ellipse into the standard coordinates of the ellipse.
  const transformedToStandardFocus1 = new Vector3();
  const transformedToStandardFocus2 = new Vector3();
  transformedToStandardFocus1.copy(ellipse.focus1SEPoint.locationVector);
  transformedToStandardFocus2.copy(ellipse.focus2SEPoint.locationVector);
  transformedToStandardFocus1.applyMatrix4(SEStore.inverseTotalRotationMatrix);
  transformedToStandardFocus2.applyMatrix4(SEStore.inverseTotalRotationMatrix);
  const angleSum = ellipse.ellipseAngleSum;
  // The function to find the zeros of is the sum of the distance from a
  // point on ellipse to the transformed foci of ellipse minus the angleSum of ellipse
  const d: (t: number) => number = function(t: number): number {
    return (
      Math.acos(
        Math.max(
          -1,
          Math.min(parametric.ref.P(t).dot(transformedToStandardFocus1), 1)
        )
      ) +
      Math.acos(
        Math.max(
          -1,
          Math.min(parametric.ref.P(t).dot(transformedToStandardFocus2), 1)
        )
      ) -
      angleSum
    );
  };
  // d'(t) = -1/ sqrt(1- (E(t) /dot tTSF1)^2) * (E'(t) /dot tTSF1) - 1/ sqrt(1- (E(t) /dot tTSF2)^2) * (E'(t) /dot tTSF2)
  const dp = function(t: number): number {
    return (
      (-1 * parametric.ref.PPrime(t).dot(transformedToStandardFocus1)) /
        Math.sqrt(
          1 -
            Math.max(
              -1,
              Math.min(parametric.ref.P(t).dot(transformedToStandardFocus1), 1)
            ) *
              Math.max(
                -1,
                Math.min(
                  parametric.ref.P(t).dot(transformedToStandardFocus1),
                  1
                )
              )
        ) +
      (-1 * parametric.ref.PPrime(t).dot(transformedToStandardFocus2)) /
        Math.sqrt(
          1 -
            Math.max(
              -1,
              Math.min(parametric.ref.P(t).dot(transformedToStandardFocus2), 1)
            ) *
              Math.max(
                -1,
                Math.min(
                  parametric.ref.P(t).dot(transformedToStandardFocus2),
                  1
                )
              )
        )
    );
  };

  // find the tracing tMin and tMax
  const [tracingTMin, tracingTMax] = parametric.tMinMaxExpressionValues();

  const zeros = SENodule.findZerosParametrically(
    d,
    parametric.tNumbers.min,
    parametric.tNumbers.max,
    parametric.c1DiscontinuityParameterValues,
    dp
  );

  const maxNumberOfIntersections = 2 * parametric.ref.numberOfParts;

  const returnItems: IntersectionReturnType[] = [];
  for (let i = 0; i < maxNumberOfIntersections; i++) {
    const intersection: IntersectionReturnType = {
      vector: new Vector3(),
      exists: false
    };
    returnItems.push(intersection);
  }

  // console.log("Number of Para/ellsp Intersections:", zeros.length);
  zeros.forEach((z, ind) => {
    returnItems[ind].vector.copy(
      parametric.ref
        .P(z)
        .applyMatrix4(tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix))
    );
    if (tracingTMin <= z && z <= tracingTMax) {
      // it must be on both the ellipse (which by being a zero of d, it is!) and the visible part of the parametric
      returnItems[ind].exists = true;
    } else {
      returnItems[ind].exists = false;
    }
  });
  return returnItems;
}

export function intersectParametricWithParametric(
  parametric1: SEParametric,
  parametric2: SEParametric
): IntersectionReturnType[] {
  // TODO: complete this function
  const maxNumberOfIntersections = 0;
  //  parametric1.ref.numberOfParts + parametric2.ref.numberOfParts;

  const returnItems: IntersectionReturnType[] = [];
  for (let i = 0; i < maxNumberOfIntersections; i++) {
    const intersection: IntersectionReturnType = {
      vector: new Vector3(),
      exists: false
    };
    returnItems.push(intersection);
  }
  return returnItems;
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
 * If they have the same type put them in alphabetical order.
 * The creation of the intersection objects automatically follows this convention in assigning parents.
 */

export function intersectTwoObjects(
  one: SENodule,
  two: SENodule
): IntersectionReturnType[] {
  if (one instanceof SELine) {
    if (two instanceof SELine) return intersectLineWithLine(one, two);
    else if (two instanceof SESegment)
      return intersectLineWithSegment(one, two);
    else if (two instanceof SECircle) return intersectLineWithCircle(one, two);
    else if (two instanceof SEEllipse)
      return intersectLineWithEllipse(one, two);
    else if (two instanceof SEParametric)
      return intersectLineWithParametric(one, two);
  } else if (one instanceof SESegment) {
    if (two instanceof SESegment) return intersectSegmentWithSegment(one, two);
    else if (two instanceof SECircle)
      return intersectSegmentWithCircle(one, two);
    else if (two instanceof SEEllipse)
      return intersectSegmentWithEllipse(one, two);
    else if (two instanceof SEParametric)
      return intersectSegmentWithParametric(one, two);
  } else if (one instanceof SECircle) {
    if (two instanceof SECircle)
      return intersectCircles(
        one.centerSEPoint.locationVector,
        one.circleRadius,
        two.centerSEPoint.locationVector,
        two.circleRadius
      );
    else if (two instanceof SEEllipse)
      return intersectCircleWithEllipse(one, two);
    else if (two instanceof SEParametric)
      return intersectCircleWithParametric(one, two);
  } else if (one instanceof SEEllipse) {
    if (two instanceof SEEllipse) return intersectEllipseWithEllipse(one, two);
    else if (two instanceof SEParametric)
      return intersectEllipseWithParametric(one, two);
  } else if (one instanceof SEParametric) {
    if (two instanceof SEParametric)
      intersectParametricWithParametric(one, two);
  }
  throw "Attempted to intersect non-one dimensional objects " +
    `${one.name}` +
    " and " +
    `${two.name}`;
}
