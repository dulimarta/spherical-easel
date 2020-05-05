import Vue from "vue";
import Vuex from "vuex";
import { Mesh, MeshPhongMaterial } from "three";
import { AppState, SEVertex, SELine, SERing } from "@/types";
import Vertex from "@/3d-objs/Vertex";
import Line from "@/3d-objs/Line";
import Ring from "@/3d-objs/Circle";
Vue.use(Vuex);

const findVertex = (arr: SEVertex[], id: number): SEVertex | null => {
  const out = arr.filter(v => v.ref.id === id);
  return out.length > 0 ? out[0] : null;
};

export default new Vuex.Store({
  state: {
    sphere: null,
    editMode: "none",
    vertices: [],
    lines: [],
    rings: []
  } as AppState,
  mutations: {
    // init(state) {
    //   state.sphere = null;
    //   state.editMode = "none";
    //   state.vertices = [];
    //   state.lines = [];
    // },
    setSphere(state, sph: Mesh) {
      state.sphere = sph;
    },
    setEditMode(state, mode: string) {
      state.editMode = mode;
    },
    addVertex(state, vertex: Vertex) {
      state.vertices.push({
        ref: vertex,
        startOf: [],
        endOf: [],
        centerOf: [],
        circumOf: []
      });
      state.sphere?.add(vertex);
    },
    removeVertex(state, vertexId: number) {
      const pos = state.vertices.findIndex(x => x.ref.id === vertexId);
      if (pos >= 0) {
        state.sphere?.remove(state.vertices[pos].ref);
        (state.vertices[pos].ref.material as MeshPhongMaterial).emissive.set(0);
        state.vertices.splice(pos, 1);
      }
    },
    addLine(
      state,
      {
        line,
        startPoint,
        endPoint
      }: { line: Line; startPoint: Vertex; endPoint: Vertex }
    ) {
      // Find both end points in the current list of vertices
      const start = findVertex(state.vertices, startPoint.id);
      const end = findVertex(state.vertices, endPoint.id);
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

        // Locate the start vertex of this victim line
        const sVertexPos = state.vertices.findIndex(
          v => v.ref.id == victimLine.start.ref.id
        );
        if (sVertexPos >= 0) {
          const pos = state.vertices[sVertexPos].startOf.findIndex(
            (z: SELine) => z.ref.id === victimLine.ref.id
          );
          if (pos >= 0) state.vertices[sVertexPos].startOf.splice(pos, 1);
        }

        // Locate the end vertex of this victim line
        const eVertexPos = state.vertices.findIndex(
          v => v.ref.id == victimLine.end.ref.id
        );
        if (eVertexPos >= 0) {
          const pos = state.vertices[eVertexPos].endOf.findIndex(
            (z: SELine) => z.ref.id === victimLine.ref.id
          );
          if (pos >= 0) state.vertices[eVertexPos].endOf.splice(pos, 1);
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
        ring,
        centerPoint,
        circlePoint
      }: { ring: Ring; centerPoint: Mesh; circlePoint: Mesh }
    ) {
      const start = findVertex(state.vertices, centerPoint.id);
      const end = findVertex(state.vertices, circlePoint.id);
      if (start !== null && end !== null) {
        const newRing = { ref: ring, center: start, point: end };
        start.centerOf.push(newRing);
        end.circumOf.push(newRing);
        state.rings.push(newRing);
        state.sphere?.add(ring);
      }
    },
    removeRing(state, ringId: number) {
      const ringPos = state.rings.findIndex(x => x.ref.id === ringId);
      if (ringPos >= 0) {
        /* victim line is found */
        const victimRing: SERing = state.rings[ringPos];

        // Locate the start vertex of this victim line
        const sVertexPos = state.vertices.findIndex(
          v => v.ref.id == victimRing.center.ref.id
        );
        if (sVertexPos >= 0) {
          const spos = state.vertices[sVertexPos].centerOf.findIndex(
            (r: SERing) => r.ref.id === victimRing.ref.id
          );
          if (spos >= 0) state.vertices[sVertexPos].circumOf.splice(spos, 1);
        }

        // Locate the end vertex of this victim line
        const eVertexPos = state.vertices.findIndex(
          v => v.ref.id == victimRing.point.ref.id
        );
        if (eVertexPos >= 0) {
          const epos = state.vertices[eVertexPos].circumOf.findIndex(
            (r: SERing) => r.ref.id === victimRing.ref.id
          );
          if (epos >= 0) state.vertices[eVertexPos].circumOf.splice(epos, 1);
        }
        // Remove it from the sphere
        state.sphere?.remove(victimRing.ref);
        (victimRing.ref.material as MeshPhongMaterial).emissive.set(0);

        state.rings.splice(ringPos, 1); // Remove the line from the list
      }
    }
  },
  actions: {},
  modules: {}
});
