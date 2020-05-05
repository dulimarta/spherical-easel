import Vue from "vue";
import Vuex from "vuex";
import { Mesh } from "three";
import { AppState, SEVertex } from "@/types";
import Line from "@/3d-objs/Line";
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
    lines: []
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
    addVertex(state, vertex: Mesh) {
      state.vertices.push({ ref: vertex, incidentLines: [] });
      state.sphere?.add(vertex);
    },
    removeVertex(state, vertexId: number) {
      const pos = state.vertices.findIndex(x => x.ref.id === vertexId);
      if (pos >= 0) {
        state.sphere?.remove(state.vertices[pos].ref);
        state.vertices.splice(pos, 1);
      }
    },
    addLine(
      state,
      {
        line,
        startPoint,
        endPoint
      }: { line: Line; startPoint: Mesh; endPoint: Mesh }
    ) {
      // Find both end points in the current list of vertices
      const start = findVertex(state.vertices, startPoint.id);
      const end = findVertex(state.vertices, endPoint.id);
      if (start !== null && end !== null) {
        const newLine = { ref: line, start, end, isSegment: line.isSegment };
        start.incidentLines.push(newLine);
        end.incidentLines.push(newLine);
        state.lines.push(newLine);
        state.sphere?.add(line);
      }
    },
    removeLine(state, lineId: number) {
      const pos = state.lines.findIndex(x => x.ref.id === lineId);
      if (pos >= 0) {
        state.sphere?.remove(state.lines[pos].ref);
        state.lines.splice(pos, 1);
      }
    }
  },
  actions: {},
  modules: {}
});
