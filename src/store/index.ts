/** @format */

import Vue from "vue";
import Vuex from "vuex";
import Two from "two.js";
import { AppState } from "@/types";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { Vector3 } from "three";
import { SESegment } from "@/models/SESegment";
import { SENodule } from "@/models/SENodule";
import { SEIntersection } from "@/models/SEIntersection";
import Point from "@/plottables/Point";
import mutations, { initialState } from "./mutations";
Vue.use(Vuex);

// const findPoint = (arr: SEPoint[], id: number): SEPoint | null => {
// const out = arr.filter(v => v.ref.id === id);
// return out.length > 0 ? out[0] : null;
// return null;
// };

// const SMALL_ENOUGH = 1e-2;
const PIXEL_CLOSE_ENOUGH = 8;
const tmpVector = new Vector3();

function intersectLineWithLine(
  lineOne: SELine,
  lineTwo: SELine
): SEIntersection[] {
  const out = [];
  tmpVector
    .crossVectors(lineOne.normalDirection, lineTwo.normalDirection)
    .normalize();
  // console.debug(
  //   `intersection(s) between ${lineOne.name} (${lineOne.normalDirection.toFixed(
  //     2
  //   )}) and ${lineTwo.name} (${lineTwo.normalDirection.toFixed(
  //     2
  //   )}) is ${tmpVector.toFixed(3)}`
  // );
  const x = new SEIntersection(new Point(), lineOne, lineTwo);
  out.push(x);
  x.positionOnSphere = tmpVector;

  const x2 = new SEIntersection(new Point(), lineOne, lineTwo);
  out.push(x2);
  x2.positionOnSphere = tmpVector.multiplyScalar(-1);
  return out;
}

function intersectLineWithSegment(l: SELine, s: SESegment): SEIntersection[] {
  const out = [];
  tmpVector.crossVectors(l.normalDirection, s.normalDirection).normalize();
  console.debug(
    `intersection(s) between ${l.name} (${l.normalDirection.toFixed(2)}) and ${
      s.name
    } (${s.normalDirection.toFixed(2)}) is ${tmpVector.toFixed(3)}`
  );

  // FIXME: this test may incorrectly return true for the antipodal point!
  if (s.isPositionInsideArc(tmpVector)) {
    const x = new SEIntersection(new Point(), l, s);
    out.push(x);
    x.positionOnSphere = tmpVector;
  }

  // Check its antipodal point
  tmpVector.multiplyScalar(-1);
  if (s.isPositionInsideArc(tmpVector)) {
    const x2 = new SEIntersection(new Point(), l, s);
    out.push(x2);
    x2.positionOnSphere = tmpVector.multiplyScalar(-1);
  }
  return out;
}
// const lMarker = new Two.Circle(0, 0, 6);
// lMarker.fill = "red";
// const rMarker = new Two.Circle(0, 0, 6);
// rMarker.fill = "green";

const ctr1 = new Vector3();
const ctr2 = new Vector3();
const start = new Vector3();
// const mid = new Vector3();
const end = new Vector3();
const commonChordDir = new Vector3();

/**
 * Find intersection points between two circles
 * @param n1 normal direction of the first circle
 * @param arc1 arc length radius of the first circle
 * @param n2 normal direction of the second circle
 * @param arc2 arc length radius of the second circle
 */
function intersectCircleWithCircle(
  n1: Vector3, // center
  arc1: number, // arc radius
  n2: Vector3,
  arc2: number
): Vector3[] {
  const centerDistance = n1.angleTo(n2); // Arc length between the two centers
  // Are they too far apart?
  if (centerDistance > arc1 + arc2) {
    // Too far apart
    return [];
  }
  // Is the smaller circle completely contained inside the bigger one?
  if (centerDistance < Math.abs(arc1 - arc2)) {
    // One is contained in the other
    return [];
  }
  // Calculate the center of the sphere on the circle plane
  ctr1.copy(n1).multiplyScalar(Math.cos(arc1));
  ctr2.copy(n2).multiplyScalar(Math.cos(arc2));

  // WHen the two circles intersect, the common intersection is the
  // "center leaf" with two arcs (one of each circle)
  // Two two intersection points make a common chord whose direction
  // is the cross product of the two circle normal
  // n1xn2 is tangent vector at the center leaf midpoint
  commonChordDir.crossVectors(n1, n2);

  // tmpVector is along the radial direction from c1 to the midpoint
  tmpVector.crossVectors(n1, commonChordDir);
  // Find the midpoint (and its antipodal) of the arc on the center leaf
  start.copy(ctr1).addScaledVector(tmpVector, Math.sin(arc1));
  end.copy(start).multiplyScalar(-1);
  const dist1 = n2.distanceTo(start);
  const dist2 = n2.distanceTo(end);

  // Pick the closest point as our starting point of binary search
  if (dist2 > dist1) start.copy(end);

  // Objective function to find zero crossing
  const objFunc = (a: Vector3) => a.angleTo(ctr2) - arc2;
  // Search for the actual intersection starting from the arc midpoint
  const x1 = binarySearch(start, n1, 0, Math.PI, objFunc);
  const x2 = binarySearch(start, n1, 0, -Math.PI, objFunc);
  return [x1, x2];
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
  while (Math.abs(startAngle - endAngle).toDegrees() > 0.01) {
    const midAngle = (startAngle + endAngle) / 2;
    m.copy(s).applyAxisAngle(rotAxis, midAngle - startAngle);
    const Fm = objFunction(m);
    // console.debug(
    //   `Potential solution between ${startAngle
    //     .toDegrees()
    //     .toFixed(1)} and ${endAngle.toDegrees().toFixed(1)}`
    // );
    // console.log(`F(s)=${Fs} F(m)=${Fm} F(e)=${Fe}`);
    if (Math.sign(Fs) !== Math.sign(Fm)) {
      // Continue searching between start and mid
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
  // x1.positionOnSphere = tmpVector;
  // out.push(x1);
  const tmp = intersectCircleWithCircle(
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
  tmpVector.crossVectors(s1.normalDirection, s2.normalDirection).normalize();
  if (s1.isPositionInsideArc(tmpVector) && s2.isPositionInsideArc(tmpVector)) {
    const x = new SEIntersection(new Point(), s1, s2);
    out.push(x);
    x.positionOnSphere = tmpVector;
  }
  tmpVector.multiplyScalar(-1); // Antipodal point
  if (s1.isPositionInsideArc(tmpVector) && s2.isPositionInsideArc(tmpVector)) {
    const x = new SEIntersection(new Point(), s1, s2);
    out.push(x);
    x.positionOnSphere = tmpVector;
  }
  return out;
}

function intersectSegmentWithCircle(
  s: SESegment,
  c: SECircle
): SEIntersection[] {
  const out: SEIntersection[] = [];
  intersectCircleWithCircle(
    s.normalDirection,
    Math.PI / 2,
    c.normalDirection,
    c.radius
  )
    .filter((p: Vector3) => s.isPositionInsideArc(p))
    .forEach((p: Vector3) => {
      const x = new SEIntersection(new Point(), s, c);
      x.positionOnSphere = p;
      out.push(x);
    });
  return out;
}
export default new Vuex.Store({
  state: initialState,
  mutations,
  actions: {
    /* Define async work in this block */
  },
  getters: {
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
    }
  }
});
