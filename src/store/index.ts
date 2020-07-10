/** @format */

import Vue from "vue";
import Vuex from "vuex";
import mutations, { initialState } from "./mutations";
import getters from "./getters";
import EventBus from "@/eventHandlers/EventBus";

Vue.use(Vuex);

export default new Vuex.Store({
  state: initialState,
  mutations,
  actions: {
    /* Define async work in this block */
    //#region magnificationUpdate
    changeZoomFactor({ commit }, mag: number): void {
      commit("setZoomMagnificationFactor", mag);
      EventBus.fire("magnification-updated", { factor: mag });
    }
    //#endregion magnificationUpdate
  },
  getters
});
