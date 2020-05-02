import Vue from "vue";
import Vuex from "vuex";
import { Mesh } from "three";
Vue.use(Vuex);

export interface AppState {
  sphere: Mesh | null;
  editMode: string;
  vertices: VertexInfo[];
}
export interface VertexInfo {
  id: number;
  name: string;
}
export default new Vuex.Store({
  state: {
    sphere: null,
    editMode: "line",
    vertices: []
  } as AppState,
  mutations: {
    setSphere(state, sph: Mesh) {
      state.sphere = sph;
    },
    setEditMode(state, mode: string) {
      state.editMode = mode;
    },
    addVertex(state, vertex: Mesh) {
      state.vertices.push({ id: vertex.id, name: vertex.name });
    }
  },
  actions: {},
  modules: {}
});
