import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SELine } from "@/models/SELine";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { AppState, IntersectionReturnType } from "@/types";
import { Vector3 } from "three";
import Two from "two.js";
import { SENodule } from "@/models/SENodule";
import { SEPoint } from "@/models/SEPoint";
import Point from "@/plottables/Point";
import { VListItemAction } from "vuetify/lib";

const PIXEL_CLOSE_ENOUGH = 8;

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
const positiveIntersection = new Vector3();
/**
 * The negative intersection vector (if it exists)
 */
const negativeIntersection = new Vector3();
/**
 * A temporary vector used to help with the calculation of the intersection points
 * It is the projection of the intersection point (along the sphere) to the plane containing the centers of circles
 */
const tempVec = new Vector3();
const tempVec1 = new Vector3();
const tempVec2 = new Vector3();

/**
 * Return an ordered list of IntersectionReturnType (i.e. a vector location and exists flag) for the
 * intersection of two lines. This must be called with the lines in alphabetical order in order to the
 * return type correct.
 * @param lineOne An SELine
 * @param lineTwo An SELine
 */
function intersectLineWithLine(
  lineOne: SELine,
  lineTwo: SELine
): IntersectionReturnType[] {
  const returnItems = [];
  const item1: IntersectionReturnType = { vector: new Vector3(), exists: true };
  const item2: IntersectionReturnType = { vector: new Vector3(), exists: true };
  // Plus and minus the cross product of the normal vectors are the intersection vectors
  tempVec
    .crossVectors(lineOne.normalDirection, lineTwo.normalDirection)
    .normalize();
  item1.vector.copy(tempVec);
  item2.vector.copy(tempVec.multiplyScalar(-1));

  // If the normal vectors are on top of each other or antipodal, exists is false
  if (
    SENodule.isZero(
      tempVec.addVectors(lineOne.normalDirection, lineTwo.normalDirection)
    ) ||
    SENodule.isZero(
      tempVec.subVectors(lineOne.normalDirection, lineTwo.normalDirection)
    )
  ) {
    item1.exists = false;
    item2.exists = false;
  }
  returnItems.push(item1);
  returnItems.push(item2);
  return returnItems;
}

/**
 * Computes the intersection point(s) of a line and a segment, the line is always first
 * @param line An SELine
 * @param segment An SESegment
 */
function intersectLineWithSegment(
  line: SELine,
  segment: SESegment
): IntersectionReturnType[] {
  const returnItems = [];
  const item1: IntersectionReturnType = { vector: new Vector3(), exists: true };
  const item2: IntersectionReturnType = { vector: new Vector3(), exists: true };
  // Plus and minus the cross product of the normal vectors are the possible intersection vectors
  tempVec1
    .crossVectors(line.normalDirection, segment.normalDirection)
    .normalize();
  tempVec2.copy(tempVec).multiplyScalar(-1);
  item1.vector.copy(tempVec1);
  item2.vector.copy(tempVec2);

  // determine if the first intersection point is on the segment
  if (!segment.isHitAt(tempVec1)) {
    item1.exists = false;
  }
  // Determine if the second intersection point is on the segment
  if (!segment.isHitAt(tempVec2)) {
    item2.exists = false;
  }
  // If the normal vectors are on top of each other or antipodal, exists is false
  if (
    SENodule.isZero(
      tempVec.addVectors(line.normalDirection, segment.normalDirection)
    ) ||
    SENodule.isZero(
      tempVec.subVectors(line.normalDirection, segment.normalDirection)
    )
  ) {
    item1.exists = false;
    item2.exists = false;
  }
  returnItems.push(item1);
  returnItems.push(item2);
  return returnItems;
}

/**
 * Find intersection between a line and a circle, the line is always first
 * @param line An SELine
 * @param circle An SESegment
 */
function intersectLineWithCircle(
  line: SELine,
  circle: SECircle
  // layer: Two.Group
): IntersectionReturnType[] {
  // Use the circle circle intersection
  return intersectCircles(
    line.normalDirection,
    Math.PI / 2, // arc radius of lines
    circle.centerPoint.vectorPosition,
    circle.radius
  );
}
/**
 * Find intersection between a two segment. This must be called with the lines in alphabetical order in order to the
 * return type correct.
 * @param segment1 An SESegment
 * @param segment2 An SESegment
 */
function intersectSegmentWithSegment(
  segment1: SESegment,
  segment2: SESegment
): IntersectionReturnType[] {
  const returnItems = [];
  const item1: IntersectionReturnType = { vector: new Vector3(), exists: true };
  const item2: IntersectionReturnType = { vector: new Vector3(), exists: true };
  // Plus and minus the cross product of the normal vectors are the possible intersection vectors
  tempVec1
    .crossVectors(segment1.normalDirection, segment2.normalDirection)
    .normalize();
  tempVec2.copy(tempVec).multiplyScalar(-1);
  item1.vector.copy(tempVec1);
  item2.vector.copy(tempVec2);

  // determine if the first intersection point is on the segment
  if (!segment1.isHitAt(tempVec1) || !segment2.isHitAt(tempVec1)) {
    item1.exists = false;
  }
  // Determine if the second intersection point is on the segment
  if (!segment1.isHitAt(tempVec2) || !segment2.isHitAt(tempVec2)) {
    item2.exists = false;
  }
  // If the normal vectors are on top of each other or antipodal, exists is false
  if (
    SENodule.isZero(
      tempVec.addVectors(segment1.normalDirection, segment2.normalDirection)
    ) ||
    SENodule.isZero(
      tempVec.subVectors(segment1.normalDirection, segment2.normalDirection)
    )
  ) {
    item1.exists = false;
    item2.exists = false;
  }
  returnItems.push(item1);
  returnItems.push(item2);
  return returnItems;
}

/**
 * Find intersection between a segment and a circle, the segment is always first
 * @param segment An SESegment
 * @param circle An SECircle
 */
function intersectSegmentWithCircle(
  segment: SESegment,
  circle: SECircle
): IntersectionReturnType[] {
  // Use the circle circle intersection
  const temp = intersectCircles(
    segment.normalDirection,
    Math.PI / 2, // arc radius of lines
    circle.centerPoint.vectorPosition,
    circle.radius
  );
  temp.forEach(item => (item.exists = segment.isHitAt(item.vector)));
  return temp;
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
function intersectCircles(
  n1: Vector3, // center
  arc1: number, // arc radius
  n2: Vector3,
  arc2: number
): IntersectionReturnType[] {
  //Initialize the items and the return items
  const returnItems = [];
  const item1: IntersectionReturnType = { vector: new Vector3(), exists: true };
  const item2: IntersectionReturnType = { vector: new Vector3(), exists: true };

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

    //  Pi/2 < A < Pi
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
    item1.vector.copy(tempVec).multiplyScalar(Math.cos(a));
    item1.vector.addScaledVector(normal, Math.sin(a));
    // The negative intersection is cos(-a)*tempVec + sin(-a)*normal
    item2.vector.copy(tempVec).multiplyScalar(Math.cos(-a));
    item2.vector.addScaledVector(normal, Math.sin(-a));
    returnItems.push(item1);
    returnItems.push(item2);
    return returnItems;
  } else {
    // The circles do not intersect
    item1.exists = false;
    item2.exists = false;
    returnItems.push(item1);
    returnItems.push(item2);
    return returnItems;
  }
}

export default {
  findNearbyObjects: (state: AppState) => (
    unitIdealVector: Vector3,
    screenPosition: Two.Vector
  ): SENodule[] => {
    return state.nodules.filter(obj => obj.isHitAt(unitIdealVector));
  },
  /** Find nearby points by checking the distance in the ideal sphere
   * or screen distance (in pixels)
   */
  findNearbyPoints: (state: AppState) => (
    unitIdealVector: Vector3,
    screenPosition: Two.Vector
  ): SEPoint[] => {
    return state.points.filter(
      p =>
        p.isHitAt(unitIdealVector) &&
        p.ref.defaultScreenVectorLocation.distanceTo(screenPosition) <
          PIXEL_CLOSE_ENOUGH
    );
  },

  /** When a point is on a geodesic circle, it has to be perpendicular to
   * the normal direction of that circle */
  findNearbyLines: (state: AppState) => (
    unitIdealVector: Vector3,
    screenPosition: Two.Vector
  ): SELine[] => {
    return state.lines.filter((z: SELine) => z.isHitAt(unitIdealVector));
  },
  findNearbySegments: (state: AppState) => (
    unitIdealVector: Vector3,
    screenPosition: Two.Vector
  ): SESegment[] => {
    return state.segments.filter((z: SESegment) => z.isHitAt(unitIdealVector));
  },
  findNearbyCircles: (state: AppState) => (
    unitIdealVector: Vector3,
    screenPosition: Two.Vector
  ): SECircle[] => {
    return state.circles.filter((z: SECircle) => z.isHitAt(unitIdealVector));
  },
  // forwardTransform: (state: AppState): Matrix4 => {
  //   tmpMatrix.fromArray(state.transformMatElements);
  //   return tmpMatrix;
  // },
  // inverseTransform: (state: AppState): Matrix4 => {
  //   tmpMatrix.fromArray(state.transformMatElements);
  //   return tmpMatrix.getInverse(tmpMatrix);
  // },
  createAllIntersectionsWithLine: (state: AppState) => (
    newLine: SELine
  ): SEIntersectionPoint[] => {
    const intersectionPointList: SEIntersectionPoint[] = [];
    // Intersection this new line with all old lines
    state.lines
      .filter((line: SELine) => line.id !== newLine.id) // ignore self
      .forEach((oldLine: SELine) => {
        const intersectionInfo = intersectLineWithLine(oldLine, newLine);
        intersectionInfo.forEach((info, index) => {
          const newPt = new Point();
          const newSEIntersectionPt = new SEIntersectionPoint(
            newPt,
            oldLine,
            newLine,
            index
          );
          newSEIntersectionPt.vectorPosition = info.vector;
          newSEIntersectionPt.setExist(info.exists);
          intersectionPointList.push(newSEIntersectionPt);
        });
      });
    //Intersection this new line with all old segments
    state.segments.forEach((oldSegment: SESegment) => {
      const intersectionInfo = intersectLineWithSegment(newLine, oldSegment);
      intersectionInfo.forEach((info, index) => {
        const newPt = new Point();
        const newSEIntersectionPt = new SEIntersectionPoint(
          newPt,
          newLine,
          oldSegment,
          index
        );
        newSEIntersectionPt.vectorPosition = info.vector;
        newSEIntersectionPt.setExist(info.exists);
        intersectionPointList.push(newSEIntersectionPt);
      });
    });
    //Intersection this new line with all old circles
    state.circles.forEach((oldCircle: SECircle) => {
      const intersectionInfo = intersectLineWithCircle(newLine, oldCircle);
      intersectionInfo.forEach((info, index) => {
        const newPt = new Point();
        const newSEIntersectionPt = new SEIntersectionPoint(
          newPt,
          newLine,
          oldCircle,
          index
        );
        newSEIntersectionPt.vectorPosition = info.vector;
        newSEIntersectionPt.setExist(info.exists);
        intersectionPointList.push(newSEIntersectionPt);
      });
    });
    return intersectionPointList;
  },
  createAllIntersectionsWithSegment: (state: AppState) => (
    newSegment: SESegment
  ): SEIntersectionPoint[] => {
    const intersectionPointList: SEIntersectionPoint[] = [];
    // Intersection this new segment with all old lines
    state.lines.forEach((oldLine: SELine) => {
      const intersectionInfo = intersectLineWithSegment(oldLine, newSegment);
      intersectionInfo.forEach((info, index) => {
        const newPt = new Point();
        const newSEIntersectionPt = new SEIntersectionPoint(
          newPt,
          oldLine,
          newSegment,
          index
        );
        newSEIntersectionPt.vectorPosition = info.vector;
        newSEIntersectionPt.setExist(info.exists);
        intersectionPointList.push(newSEIntersectionPt);
      });
    });
    //Intersection this new segment with all old segments
    state.segments
      .filter((segment: SESegment) => segment.id !== newSegment.id) // ignore self
      .forEach((oldSegment: SESegment) => {
        const intersectionInfo = intersectSegmentWithSegment(
          oldSegment,
          newSegment
        );
        intersectionInfo.forEach((info, index) => {
          const newPt = new Point();
          const newSEIntersectionPt = new SEIntersectionPoint(
            newPt,
            oldSegment,
            newSegment,
            index
          );
          newSEIntersectionPt.vectorPosition = info.vector;
          newSEIntersectionPt.setExist(info.exists);
          intersectionPointList.push(newSEIntersectionPt);
        });
      });
    //Intersection this new segment with all old circles
    state.circles.forEach((oldCircle: SECircle) => {
      const intersectionInfo = intersectSegmentWithCircle(
        newSegment,
        oldCircle
      );
      intersectionInfo.forEach((info, index) => {
        const newPt = new Point();
        const newSEIntersectionPt = new SEIntersectionPoint(
          newPt,
          newSegment,
          oldCircle,
          index
        );
        newSEIntersectionPt.vectorPosition = info.vector;
        newSEIntersectionPt.setExist(info.exists);
        intersectionPointList.push(newSEIntersectionPt);
      });
    });
    return intersectionPointList;

    // return [
    //   ...state.lines.flatMap((l: SELine) =>
    //     intersectLineWithSegment(l, segment)
    //   ),
    //   ...state.segments
    //     .filter((s: SESegment) => s.id !== segment.id)
    //     .flatMap((s: SESegment) => intersectSegmentWithSegment(s, segment)),
    //   ...state.circles.flatMap((c: SECircle) =>
    //     intersectSegmentWithCircle(segment, c)
    //   )
    // ];
  },
  createAllIntersectionsWithCircle: (state: AppState) => (
    newCircle: SECircle
  ): SEIntersectionPoint[] => {
    const intersectionPointList: SEIntersectionPoint[] = [];
    // Intersection this new circle with all old lines
    state.lines.forEach((oldLine: SELine) => {
      const intersectionInfo = intersectLineWithCircle(oldLine, newCircle);
      intersectionInfo.forEach((info, index) => {
        const newPt = new Point();
        const newSEIntersectionPt = new SEIntersectionPoint(
          newPt,
          oldLine,
          newCircle,
          index
        );
        newSEIntersectionPt.vectorPosition = info.vector;
        newSEIntersectionPt.setExist(info.exists);
        intersectionPointList.push(newSEIntersectionPt);
      });
    });
    //Intersection this new circle with all old segments
    state.segments.forEach((oldSegment: SESegment) => {
      const intersectionInfo = intersectSegmentWithCircle(
        oldSegment,
        newCircle
      );
      intersectionInfo.forEach((info, index) => {
        const newPt = new Point();
        const newSEIntersectionPt = new SEIntersectionPoint(
          newPt,
          oldSegment,
          newCircle,
          index
        );
        newSEIntersectionPt.vectorPosition = info.vector;
        newSEIntersectionPt.setExist(info.exists);
        intersectionPointList.push(newSEIntersectionPt);
      });
    });
    //Intersection this new circle with all old circles
    state.circles
      .filter((circle: SECircle) => circle.id !== newCircle.id) // ignore self
      .forEach((oldCircle: SECircle) => {
        const intersectionInfo = intersectCircles(
          oldCircle.centerPoint.vectorPosition,
          oldCircle.radius,
          newCircle.centerPoint.vectorPosition,
          newCircle.radius
        );
        intersectionInfo.forEach((info, index) => {
          const newPt = new Point();
          const newSEIntersectionPt = new SEIntersectionPoint(
            newPt,
            oldCircle,
            newCircle,
            index
          );
          newSEIntersectionPt.vectorPosition = info.vector;
          newSEIntersectionPt.setExist(info.exists);
          intersectionPointList.push(newSEIntersectionPt);
        });
      });
    return intersectionPointList;

    // return [
    //   ...state.lines.flatMap((l: SELine) => intersectLineWithCircle(l, circle)),
    //   ...state.segments.flatMap((s: SESegment) =>
    //     intersectSegmentWithCircle(s, circle)
    //   ),
    //   ...state.circles
    //     .filter((c: SECircle) => c.id !== circle.id) // ignore self
    //     .flatMap((c: SECircle) => intersectCircleWithCircle(c, circle))
    // ];
  }
};
