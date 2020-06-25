/** @format */

import Vue from "vue";
import Vuex from "vuex";
import Two from "two.js";
import { AppState } from "@/types";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { Vector3, Matrix4 } from "three";
import { SESegment } from "@/models/SESegment";
import { PositionVisitor } from "@/visitors/PositionVisitor";
import { SENodule } from "@/models/SENodule";
import { SEIntersection } from "@/models/SEIntersection";
import Point from "@/plottables/Point";
import { LAYER } from "@/global-settings";

Vue.use(Vuex);

// const findPoint = (arr: SEPoint[], id: number): SEPoint | null => {
// const out = arr.filter(v => v.ref.id === id);
// return out.length > 0 ? out[0] : null;
// return null;
// };

// const SMALL_ENOUGH = 1e-2;
const PIXEL_CLOSE_ENOUGH = 8;
const ANGLE_SMALL_ENOUGH = 1; // within 1 degree?
const tmpMatrix = new Matrix4();
const initialState: AppState = {
  sphereRadius: 0,
  editMode: "rotate",
  // slice(): create a copy of the array
  transformMatElements: tmpMatrix.elements.slice(),
  // nodes: [], // Possible future addition (array of SENodule)
  nodules: [],
  layers: [],
  points: [],
  lines: [],
  segments: [],
  circles: [],
  intersections: []
};

const positionVisitor = new PositionVisitor();

function determineIntersectionsWithLine(state: AppState, line: SELine): void {
  const tmp = new Vector3();
  state.lines
    .filter(z => z.id !== line.id)
    .forEach((z: SELine) => {
      tmp.crossVectors(line.normalDirection, z.normalDirection).normalize();
      console.debug(
        `intersection(s) between ${line.name} (${line.normalDirection.toFixed(
          2
        )}) and ${z.name} (${z.normalDirection.toFixed(2)}) is ${tmp.toFixed(
          3
        )}`
      );
      const v = new Point();
      const x = new SEIntersection(v, line, z);
      x.positionOnSphere = tmp;
      state.intersections.push(x);
      state.nodules.push(x);
      v.addToLayers(state.layers);

      const v2 = new Point();
      const x2 = new SEIntersection(v2, line, z);
      x2.positionOnSphere = tmp.multiplyScalar(-1);
      state.intersections.push(x2);
      state.nodules.push(x2);
      v2.addToLayers(state.layers);
    });
}
export default new Vuex.Store({
  state: initialState,
  mutations: {
    init(state: AppState): void {
      state = { ...initialState };
    },
    setLayers(state: AppState, layers: Two.Group[]): void {
      state.layers = layers;
    },
    setSphereRadius(state: AppState, radius: number): void {
      state.sphereRadius = radius;
    },
    setEditMode(state: AppState, mode: string): void {
      state.editMode = mode;
    },
    addPoint(state: AppState, point: SEPoint): void {
      state.points.push(point);
      state.nodules.push(point);
      point.ref.addToLayers(state.layers);
    },
    removePoint(state: AppState, pointId: number): void {
      const pos = state.points.findIndex(x => x.id === pointId);
      const pos2 = state.nodules.findIndex(x => x.id === pointId);
      if (pos >= 0) {
        state.points[pos].ref.removeFromLayers();
        state.points[pos].removeSelfSafely();
        state.points.splice(pos, 1);
        state.nodules.splice(pos2, 1);
      }
    },
    addLine(
      state: AppState,
      {
        line,
        startPoint,
        endPoint
      }: { line: SELine; startPoint: SEPoint; endPoint: SEPoint }
    ): void {
      state.lines.push(line);
      state.nodules.push(line);
      line.ref.addToLayers(state.layers);

      // Add this line as a child of the two points
      startPoint.registerChild(line);
      endPoint.registerChild(line);
      determineIntersectionsWithLine(state, line);
    },
    removeLine(state: AppState, lineId: number): void {
      const pos = state.lines.findIndex(x => x.id === lineId);
      const pos2 = state.nodules.findIndex(x => x.id === lineId);
      if (pos >= 0) {
        /* victim line is found */
        const victimLine = state.lines[pos];
        victimLine.ref.removeFromLayers();
        victimLine.removeSelfSafely();
        state.lines.splice(pos, 1); // Remove the line from the list
        state.nodules.splice(pos2, 1);
      }
    },
    addSegment(
      state: AppState,
      {
        segment,
        startPoint,
        endPoint
      }: { segment: SESegment; startPoint: SEPoint; endPoint: SEPoint }
    ): void {
      state.segments.push(segment);
      state.nodules.push(segment);
      startPoint.registerChild(segment);
      endPoint.registerChild(segment);
      segment.ref.addToLayers(state.layers);
    },
    removeSegment(state: AppState, segId: number): void {
      const pos = state.segments.findIndex(x => x.id === segId);
      const pos2 = state.nodules.findIndex(x => x.id === segId);
      if (pos >= 0) {
        const victim = state.segments[pos];
        victim.ref.removeFromLayers();
        victim.removeSelfSafely();
        state.segments.splice(pos, 1);
        state.nodules.splice(pos2, 1);
      }
    },
    addCircle(
      state: AppState,
      {
        circle,
        centerPoint,
        circlePoint
      }: { circle: SECircle; centerPoint: SEPoint; circlePoint: SEPoint }
    ): void {
      state.circles.push(circle);
      state.nodules.push(circle);
      circle.ref.addToLayers(state.layers);
      centerPoint.registerChild(circle);
      circlePoint.registerChild(circle);
    },
    removeCircle(state: AppState, circleId: number): void {
      const circlePos = state.circles.findIndex(x => x.id === circleId);
      const pos2 = state.nodules.findIndex(x => x.id === circleId);
      if (circlePos >= 0) {
        /* victim line is found */
        const victimCircle: SECircle = state.circles[circlePos];
        victimCircle.ref.removeFromLayers();
        victimCircle.removeSelfSafely();
        state.circles.splice(circlePos, 1); // Remove the line from the list
        state.nodules.splice(pos2, 1);
      }
    },
    rotateSphere(state: AppState, rotationMat: Matrix4) {
      positionVisitor.setTransform(rotationMat);
      state.points.forEach((p: SEPoint) => {
        p.accept(positionVisitor);
      });
      state.lines.forEach((l: SELine) => {
        l.accept(positionVisitor);
      });
      state.circles.forEach((l: SECircle) => {
        l.accept(positionVisitor);
      });
      state.segments.forEach((s: SESegment) => {
        s.accept(positionVisitor);
      });
    }
  },
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
    forwardTransform: (state: AppState): Matrix4 => {
      tmpMatrix.fromArray(state.transformMatElements);
      return tmpMatrix;
    },
    inverseTransform: (state: AppState): Matrix4 => {
      tmpMatrix.fromArray(state.transformMatElements);
      return tmpMatrix.getInverse(tmpMatrix);
    }
  }
});
