import { createLocalVue, mount, shallowMount, VueClass } from "@vue/test-utils";
import { createStore } from "@/store";
import router from "@/router";
import Vuex from "vuex";
import VueRouter from "vue-router";
import Vuetify from "vuetify";
import Vue from "vue";

Vue.use(Vuetify);

export const createTester = () => {
  const localVue = createLocalVue();
  localVue.use(VueRouter);
  localVue.use(Vuex);
  localVue.use(Vuetify);
  const store = createStore();
  // const router = createRouter();
  return { store, localVue };
};

export const createWrapper = (
  component: VueClass<Vue>,
  options = {},
  isShallow = false
) => {
  const { localVue, store } = createTester();
  const vt = new Vuetify({
    icons: {
      iconfont: "mdiSvg"
    },
    lang: {
      t: (msg: string) => msg
    }
  });
  const configOption = {
    store,
    router,
    localVue,
    mocks: {
      $t: (msg: string) => msg
    },

    extensions: { plugins: [Vuetify] },
    ...options
  };
  return isShallow
    ? shallowMount(component, configOption)
    : mount(component, configOption);
};
