/** @format */

import Vue from "vue";
import Vuex from "vuex";
import mutations, { initialState } from "./mutations";
import getters from "./getters";
import EventBus from "@/eventHandlers/EventBus";
// import StylesModule from "./ui-styles";
// import AuthModule from "./auth";
import { createDirectStore } from "direct-vuex";
Vue.use(Vuex);

const {
  store,
  rootActionContext,
  moduleActionContext,
  rootGetterContext,
  moduleGetterContext
} = createDirectStore({
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
  getters,
  modules: {
    // auth: AuthModule
    // ui: StylesModule
  }
});
export default store;
export {
  rootActionContext,
  moduleActionContext,
  rootGetterContext,
  moduleGetterContext
};

export type AppStore = typeof store;

declare module "vuex" {
  interface Store<S> {
    direct: AppStore;
  }
}
