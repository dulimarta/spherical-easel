/** @format */

import Vue from "vue";
import Vuex from "vuex";
import Two from "two.js";
import { AppState } from "@/types";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { Vector3, Matrix4 } from "three";

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
const initialState = {
  sphereRadius: 0,
  editMode: "rotate",
  // slice(): create a copy of the array
  transformMatElements: tmpMatrix.elements.slice(),
  // nodes: [], // Possible future addition (array of SENodule)
  layers: [],
  points: [],
  lines: [],
  circles: []
};
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
      point.ref.addToLayers(state.layers);
    },
    removePoint(state: AppState, pointId: number): void {
      const pos = state.points.findIndex(x => x.id === pointId);
      if (pos >= 0) {
        state.points[pos].ref.removeFromLayers();
        state.points.splice(pos, 1);
      }
    },
    addLine(
      state: AppState,
      {
        line
      }: /*startPoint,
        endPoint*/
      { line: SELine /*; startPoint: Point; endPoint: Point */ }
    ): void {
      state.lines.push(line);
      line.ref.addToLayers(state.layers);
    },
    removeLine(state: AppState, lineId: number): void {
      const pos = state.lines.findIndex(x => x.id === lineId);
      if (pos >= 0) {
        /* victim line is found */
        const victimLine = state.lines[pos];
        victimLine.ref.removeFromLayers();
        state.lines.splice(pos, 1); // Remove the line from the list
      }
    },
    addCircle(
      state: AppState,
      circle /*,
        centerPoint,
        circlePoint*/
      //}: { circle: SECircle /*; centerPoint: Point; circlePoint: Point*/ }
    ): void {
      // const start = findPoint(state.points, centerPoint.id);
      // const end = findPoint(state.points, circlePoint.id);
      // if (start !== null && end !== null) {
      // const newCircle = { ref: circle, center: start, point: end };
      // start.centerOf.push(newCircle);
      // end.circumOf.push(newCircle);
      state.circles.push(circle);
      circle.ref.addToLayers(state.layers);
      // state.sphere?.add(circle);
      // }
    },
    removeCircle(state: AppState, circleId: number): void {
      // FIXME
      const circlePos = state.circles.findIndex(x => x.id === circleId);
      if (circlePos >= 0) {
        /* victim line is found */
        const victimCircle: SECircle = state.circles[circlePos];
        victimCircle.ref.removeFromLayers();
        state.circles.splice(circlePos, 1); // Remove the line from the list
      }
    },
    setTransformation(state: AppState, m: Matrix4): void {
      debugger; //eslint-disable-line
      m.toArray(state.transformMatElements);
    }
  },
  actions: {
    /* Define async work in this block */
  },
  getters: {
    /* The following is just a starter code.  More work needed */

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
