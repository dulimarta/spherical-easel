/** @format */

import Vue from "vue";
import Vuex from "vuex";
import mutations, { initialState } from "./mutations";
import getters from "./getters";
Vue.use(Vuex);

export default new Vuex.Store({
  state: initialState,
  mutations,
  actions: {
    /* Define async work in this block */
  },
  getters
});
