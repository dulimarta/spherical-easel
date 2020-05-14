import Vue from "vue";
import Vuex from "vuex";
import { Mesh, MeshPhongMaterial } from "three";
import { AppState, SEPoint, SELine, SECircle } from "@/types";
import Point from "@/3d-objs/Point";
import Line from "@/3d-objs/Line";
import Circle from "@/3d-objs/Circle";
Vue.use(Vuex);

const findVertex = (arr: SEPoint[], id: number): SEPoint | null => {
  const out = arr.filter(v => v.ref.id === id);
  return out.length > 0 ? out[0] : null;
};

export default new Vuex.Store({
  state: {
    sphere: null,
    editMode: "rotate",
    points: [],
    lines: [],
    circles: []
  } as AppState,
  mutations: {
    // init(state) {
    //   state.sphere = null;
    //   state.editMode = "rotate";
    //   state.vertices = [];
    //   state.lines = [];
    // },
    setSphere(state, sph: Mesh) {
      state.sphere = sph;
    },
    setEditMode(state, mode: string) {
      state.editMode = mode;
    },
    addVertex(state, point: Point) {
      state.points.push({
        ref: point,
        startOf: [],
        endOf: [],
        centerOf: [],
        circumOf: []
      });
      state.sphere?.add(point);
    },
    removeVertex(state, pointId: number) {
      const pos = state.points.findIndex(x => x.ref.id === pointId);
      if (pos >= 0) {
        state.sphere?.remove(state.points[pos].ref);
        (state.points[pos].ref.material as MeshPhongMaterial).emissive.set(0);
        state.points.splice(pos, 1);
      }
    },
    addLine(
      state,
      {
        line,
        startPoint,
        endPoint
      }: { line: Line; startPoint: Point; endPoint: Point }
    ) {
      // Find both end points in the current list of points
      const start = findVertex(state.points, startPoint.id);
      const end = findVertex(state.points, endPoint.id);
      if (start !== null && end !== null) {
        const newLine = { ref: line, start, end, isSegment: line.isSegment };
        start.startOf.push(newLine);
        end.endOf.push(newLine);
        state.lines.push(newLine);
        state.sphere?.add(line);
      }
    },
    removeLine(state, lineId: number) {
      const pos = state.lines.findIndex(x => x.ref.id === lineId);
      if (pos >= 0) {
        /* victim line is found */
        const victimLine: SELine = state.lines[pos];

        // Locate the start point of this victim line
        const sVertexPos = state.points.findIndex(
          v => v.ref.id == victimLine.start.ref.id
        );
        if (sVertexPos >= 0) {
          const pos = state.points[sVertexPos].startOf.findIndex(
            (z: SELine) => z.ref.id === victimLine.ref.id
          );
          if (pos >= 0) state.points[sVertexPos].startOf.splice(pos, 1);
        }

        // Locate the end point of this victim line
        const eVertexPos = state.points.findIndex(
          v => v.ref.id == victimLine.end.ref.id
        );
        if (eVertexPos >= 0) {
          const pos = state.points[eVertexPos].endOf.findIndex(
            (z: SELine) => z.ref.id === victimLine.ref.id
          );
          if (pos >= 0) state.points[eVertexPos].endOf.splice(pos, 1);
        }
        // Remove it from the sphere
        state.sphere?.remove(victimLine.ref);
        (victimLine.ref.material as MeshPhongMaterial).emissive.set(0);

        state.lines.splice(pos, 1); // Remove the line from the list
      }
    },
    addRing(
      state,
      {
        circle,
        centerPoint,
        circlePoint
      }: { circle: Circle; centerPoint: Mesh; circlePoint: Mesh }
    ) {
      const start = findVertex(state.points, centerPoint.id);
      const end = findVertex(state.points, circlePoint.id);
      if (start !== null && end !== null) {
        const newCircle = { ref: circle, center: start, point: end };
        start.centerOf.push(newCircle);
        end.circumOf.push(newCircle);
        state.circles.push(newCircle);
        state.sphere?.add(circle);
      }
    },
    removeRing(state, circleId: number) {
      const circlePos = state.circles.findIndex(x => x.ref.id === circleId);
      if (circlePos >= 0) {
        /* victim line is found */
        const victimRing: SECircle = state.circles[circlePos];

        // Locate the start point of this victim line
        const sVertexPos = state.points.findIndex(
          v => v.ref.id == victimRing.center.ref.id
        );
        if (sVertexPos >= 0) {
          const spos = state.points[sVertexPos].centerOf.findIndex(
            (r: SECircle) => r.ref.id === victimRing.ref.id
          );
          if (spos >= 0) state.points[sVertexPos].circumOf.splice(spos, 1);
        }

        // Locate the end point of this victim line
        const eVertexPos = state.points.findIndex(
          v => v.ref.id == victimRing.point.ref.id
        );
        if (eVertexPos >= 0) {
          const epos = state.points[eVertexPos].circumOf.findIndex(
            (r: SECircle) => r.ref.id === victimRing.ref.id
          );
          if (epos >= 0) state.points[eVertexPos].circumOf.splice(epos, 1);
        }
        // Remove it from the sphere
        state.sphere?.remove(victimRing.ref);
        (victimRing.ref.material as MeshPhongMaterial).emissive.set(0);

        state.circles.splice(circlePos, 1); // Remove the line from the list
      }
    }
  },
  actions: {},
  modules: {}
});
