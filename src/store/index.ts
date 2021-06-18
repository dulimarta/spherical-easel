import Vue from "vue";
import Vuex from "vuex";
import { AppState } from "@/types";
import Easel from "./mutations";
import { getModule } from "vuex-module-decorators";
// export interface IRootState {
//   ez: IEaselState;
// }
Vue.use(Vuex);

const Ez = new Vuex.Store<AppState>({
  ...Easel
});
export default Ez;
export const StoreModule: Easel = getModule(Easel, Ez);
