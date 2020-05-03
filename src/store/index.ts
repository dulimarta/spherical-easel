import Vue from "vue";
import Vuex from "vuex";
import { Mesh } from "three";
import { AppState, SEVertex } from "@/types";

Vue.use(Vuex);

const findVertex = (arr: SEVertex[], id: number): SEVertex | null => {
  const out = arr.filter(v => v.ref.id === id);
  return out.length > 0 ? out[0] : null;
};

export default new Vuex.Store({
  state: {
    sphere: null,
    editMode: "line",
    vertices: [],
    lines: []
  } as AppState,
  mutations: {
    setSphere(state, sph: Mesh) {
      state.sphere = sph;
    },
    setEditMode(state, mode: string) {
      state.editMode = mode;
    },
    addVertex(state, vertex: Mesh) {
      state.vertices.push({ ref: vertex, incidentLines: [] });
    },
    addLine(
      state,
      {
        line,
        startPoint,
        endPoint
      }: { line: Mesh; startPoint: Mesh; endPoint: Mesh }
    ) {
      // Find both end points in the current list of vertices
      const start = findVertex(state.vertices, startPoint.id);
      const end = findVertex(state.vertices, endPoint.id);
      if (start !== null && end !== null) {
        const newLine = { ref: line, start, end, isSegment: false };
        start.incidentLines.push(newLine);
        end.incidentLines.push(newLine);
        state.lines.push(newLine);
      }
    }
  },
  actions: {},
  modules: {}
});
