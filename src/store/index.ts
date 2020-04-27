import Vue from "vue";
import Vuex from "vuex";
import { Mesh, Vector3 } from "three";
Vue.use(Vuex);

export interface AppState {
  sphere: Mesh | null;
}

export default new Vuex.Store({
  state: {
    sphere: null
  } as AppState,
  mutations: {
    setSphere(state, sph: Mesh) {
      state.sphere = sph;
    },
    addVertex(state, vertex: Mesh) {
      state.sphere?.add(vertex);
    }
  },
  actions: {},
  modules: {}
});
