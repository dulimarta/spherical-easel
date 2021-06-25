import Vue from "vue";
import Vuex from "vuex";
// import { AppState } from "@/types";
import MyStore from "./se-module";
import { getModule } from "vuex-module-decorators";
Vue.use(Vuex);

const _store = new Vuex.Store({
  modules: {
    /* IMPORTANT: the module name "se" below must match exactly 
      the "name" property declared in @Module annotation in ./se-module.tx */
    se: MyStore
  }
});
export default _store;
export const SEStore = getModule(MyStore, _store);

export const createStore = () =>
  new Vuex.Store({
    modules: {
      /* IMPORTANT: the module name "se" below must match exactly 
      the "name" property declared in @Module annotation in ./se-module.tx */
      se: MyStore
    }
  });
