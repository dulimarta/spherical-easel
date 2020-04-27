import Vue from "vue";
import Vuex from "vuex";
import { Mesh } from "three";
Vue.use(Vuex);

export interface AppState {
  sphere: Mesh | null;
  editMode: string;
}

export default new Vuex.Store({
  state: {
    sphere: null,
    editMode: "none"
  } as AppState,
  mutations: {
    setSphere(state, sph: Mesh) {
      state.sphere = sph;
    },
    setEditMode(state, mode: string) {
      state.editMode = mode;
    },
    addVertex(state, vertex: Mesh) {
      state.sphere?.add(vertex);
    }
  },
  actions: {},
  modules: {}
});
