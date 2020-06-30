import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SELine } from "@/models/SELine";
import { SEIntersection } from "@/models/SEIntersection";
import { AppState } from "@/types";
import { Vector3 } from "three";
import Two from "two.js";
import { SENodule } from "@/models/SENodule";
import { SEPoint } from "@/models/SEPoint";
import Point from "@/plottables/Point";

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

function intersectLineWithLine(
  lineOne: SELine,
  lineTwo: SELine
): SEIntersection[] {
  const out = [];
  tempVec
    .crossVectors(lineOne.normalDirection, lineTwo.normalDirection)
    .normalize();
  // console.debug(
  //   `intersection(s) between ${lineOne.name} (${lineOne.normalDirection.toFixed(
  //     2
  //   )}) and ${lineTwo.name} (${lineTwo.normalDirection.toFixed(
  //     2
  //   )}) is ${tempVec.toFixed(3)}`
  // );
  const x = new SEIntersection(new Point(), lineOne, lineTwo);
  out.push(x);
  x.positionOnSphere = tempVec;

  const x2 = new SEIntersection(new Point(), lineOne, lineTwo);
  out.push(x2);
  x2.positionOnSphere = tempVec.multiplyScalar(-1);
  return out;
}

function intersectLineWithSegment(l: SELine, s: SESegment): SEIntersection[] {
  const out = [];
  tempVec.crossVectors(l.normalDirection, s.normalDirection).normalize();
  // console.debug(
  //   `intersection(s) between ${l.name} (${l.normalDirection.toFixed(2)}) and ${
  //     s.name
  //   } (${s.normalDirection.toFixed(2)}) is ${tempVec.toFixed(3)}`
  // );

  const dist1 = tempVec.distanceTo(s.midVector);
  const dist2 = tempVec.multiplyScalar(-1).distanceTo(s.midVector);
  const x = new SEIntersection(new Point(), l, s);
  out.push(x);
  // Choose the closest between the point and its antipodal
  if (dist2 < dist1) {
    x.positionOnSphere = tempVec;
  } else {
    x.positionOnSphere = tempVec.multiplyScalar(-1);
  }

  return out;
}

/**
 * Use the binary search algorithm to find the zero crossing of the
 * given objective function within a range of angles
 *
 * @param fromPoint start point on the circle
 * @param rotAxis normal vector of the circle
 * @param startAngle start of the range
 * @param endAngle end of the range
 * @param objFunction objective function to use to check for zeros
 */
function binarySearch(
  fromPoint: Vector3,
  rotAxis: Vector3,
  startAngle: number,
  endAngle: number,
  objFunction: (arg: Vector3) => number
): Vector3 {
  const s = new Vector3();
  const e = new Vector3();
  const m = new Vector3();
  s.copy(fromPoint);
  let Fs = objFunction(s);
  e.copy(fromPoint).applyAxisAngle(rotAxis, endAngle);
  let Fe = objFunction(e);
  while (Math.abs(startAngle - endAngle).toDegrees() > 0.01) {
    const midAngle = (startAngle + endAngle) / 2;
    m.copy(s).applyAxisAngle(rotAxis, midAngle - startAngle);
    const Fm = objFunction(m);
    // console.debug(
    //   `Potential solution between ${startAngle
    //     .toDegrees()
    //     .toFixed(1)} and ${endAngle.toDegrees().toFixed(1)}`
    // );
    console.debug(`F(s)=${Fs} F(m)=${Fm} F(e)=${Fe}`);

    // FIXME: what if there is no zero crossing?
    if (Math.sign(Fs) !== Math.sign(Fm)) {
      // Continue searching between start and mid
      Fe = Fm;
      e.copy(m);
      endAngle = midAngle;
    } else {
      // Continue searching between mid and end
      Fs = Fm;
      s.copy(m);
      startAngle = midAngle;
    }
  }
  return m;
}

/**
 * Find intersection points between two circles.
 * The order *matter* intersectCircleWithCircle(C1,r1,C2,r2) is not intersectCircleWithCircle(C2,r2,C1,r1)
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
): Vector3[] {
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
    positiveIntersection.copy(tempVec).multiplyScalar(Math.cos(a));
    positiveIntersection.addScaledVector(normal, Math.sin(a));
    // The negative intersection is cos(-a)*tempVec + sin(-a)*normal
    negativeIntersection.copy(tempVec).multiplyScalar(Math.cos(-a));
    negativeIntersection.addScaledVector(normal, Math.sin(-a));
    return [positiveIntersection, negativeIntersection];
  } else {
    // The circles do not intersect
    return [];
  }
}

/**
 * Find intersection between a line and a circle
 * @param n is a geodesic circle of radius ONE
 * @param c is a surface circle of radius r
 */
function intersectLineWithCircle(
  n: SELine,
  c: SECircle
  // layer: Two.Group
): SEIntersection[] {
  const out: SEIntersection[] = [];

  // const x1 = new SEIntersection(new Point(), n, c);
  // x1.positionOnSphere = tempVec;
  // out.push(x1);
  const tmp = intersectCircles(
    n.normalDirection,
    Math.PI / 2, // arc radius of geodesic circles
    c.normalDirection,
    c.radius
  );

  tmp.forEach((v: Vector3) => {
    const x = new SEIntersection(new Point(), n, c);
    x.positionOnSphere = v;
    out.push(x);
  });
  return out;
}

function intersectSegmentWithSegment(
  s1: SESegment,
  s2: SESegment
): SEIntersection[] {
  const out: SEIntersection[] = [];
  tempVec.crossVectors(s1.normalDirection, s2.normalDirection).normalize();
  if (s1.isPositionInsideArc(tempVec) && s2.isPositionInsideArc(tempVec)) {
    const x = new SEIntersection(new Point(), s1, s2);
    out.push(x);
    x.positionOnSphere = tempVec;
  }
  tempVec.multiplyScalar(-1); // Antipodal point
  if (s1.isPositionInsideArc(tempVec) && s2.isPositionInsideArc(tempVec)) {
    const x = new SEIntersection(new Point(), s1, s2);
    out.push(x);
    x.positionOnSphere = tempVec;
  }
  return out;
}

function intersectSegmentWithCircle(
  s: SESegment,
  c: SECircle
): SEIntersection[] {
  const out: SEIntersection[] = [];
  intersectCircles(s.normalDirection, Math.PI / 2, c.normalDirection, c.radius)
    .filter((p: Vector3) => s.isPositionInsideArc(p))
    .forEach((p: Vector3) => {
      const x = new SEIntersection(new Point(), s, c);
      x.positionOnSphere = p;
      out.push(x);
    });
  return out;
}
function intersectCircleWithCircle(
  c1: SECircle,
  c2: SECircle
): SEIntersection[] {
  return (c1.radius < c2.radius
    ? intersectCircles(
        c1.normalDirection,
        c1.radius,
        c2.normalDirection,
        c2.radius
      )
    : intersectCircles(
        c2.normalDirection,
        c2.radius,
        c1.normalDirection,
        c1.radius
      )
  ).map((p: Vector3) => {
    const x = new SEIntersection(new Point(), c1, c2);
    x.setShowing(true);
    x.positionOnSphere = p;
    return x;
  });
}

export default {
  findNearbyObjects: (state: AppState) => (
    idealPosition: Vector3,
    screenPosition: Two.Vector
  ): SENodule[] => {
    return state.nodules.filter(obj => obj.isHitAt(idealPosition));
  },
  /** Find nearby points by checking the distance in the ideal sphere
   * or screen distance (in pixels)
   */
  findNearbyPoints: (state: AppState) => (
    idealPosition: Vector3,
    screenPosition: Two.Vector
  ): SEPoint[] => {
    return state.points.filter(
      p =>
        p.isHitAt(idealPosition) &&
        p.ref.translation.distanceTo(screenPosition) < PIXEL_CLOSE_ENOUGH
    );
  },

  /** When a point is on a geodesic circle, it has to be perpendicular to
   * the normal direction of that circle */
  findNearbyLines: (state: AppState) => (
    idealPosition: Vector3,
    screenPosition: Two.Vector
  ): SELine[] => {
    return state.lines.filter((z: SELine) => z.isHitAt(idealPosition));
  },
  findNearbySegments: (state: AppState) => (
    idealPosition: Vector3,
    screenPosition: Two.Vector
  ): SESegment[] => {
    return state.segments.filter((z: SESegment) => z.isHitAt(idealPosition));
  },
  findNearbyCircles: (state: AppState) => (
    idealPosition: Vector3,
    screenPosition: Two.Vector
  ): SECircle[] => {
    return state.circles.filter((z: SECircle) => z.isHitAt(idealPosition));
  },
  // forwardTransform: (state: AppState): Matrix4 => {
  //   tmpMatrix.fromArray(state.transformMatElements);
  //   return tmpMatrix;
  // },
  // inverseTransform: (state: AppState): Matrix4 => {
  //   tmpMatrix.fromArray(state.transformMatElements);
  //   return tmpMatrix.getInverse(tmpMatrix);
  // },
  determineIntersectionsWithLine: (state: AppState) => (
    line: SELine
  ): SEIntersection[] => {
    return [
      // intersection with other lines
      ...state.lines
        .filter((n: SELine) => n.id !== line.id) // ignore self
        .flatMap((n: SELine) => intersectLineWithLine(line, n)),
      // intersection with all segments
      ...state.segments.flatMap((s: SESegment) =>
        intersectLineWithSegment(line, s)
      ),
      // intersection with all circles
      ...state.circles.flatMap((c: SECircle) =>
        intersectLineWithCircle(line, c)
      )
    ];
  },
  determineIntersectionsWithSegment: (state: AppState) => (
    segment: SESegment
  ): SEIntersection[] => {
    return [
      ...state.lines.flatMap((l: SELine) =>
        intersectLineWithSegment(l, segment)
      ),
      ...state.segments
        .filter((s: SESegment) => s.id !== segment.id)
        .flatMap((s: SESegment) => intersectSegmentWithSegment(s, segment)),
      ...state.circles.flatMap((c: SECircle) =>
        intersectSegmentWithCircle(segment, c)
      )
    ];
  },
  determineIntersectionsWithCircle: (state: AppState) => (
    circle: SECircle
  ): SEIntersection[] => {
    return [
      ...state.lines.flatMap((l: SELine) => intersectLineWithCircle(l, circle)),
      ...state.segments.flatMap((s: SESegment) =>
        intersectSegmentWithCircle(s, circle)
      ),
      ...state.circles
        .filter((c: SECircle) => c.id !== circle.id) // ignore self
        .flatMap((c: SECircle) => intersectCircleWithCircle(c, circle))
    ];
  }
};
