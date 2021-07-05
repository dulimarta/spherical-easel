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
  { mountOptions = {}, mockOptions = {} } = {},
  isShallow = false
) => {
  const { localVue, store } = createTester();
  const vt = new Vuetify({
    icons: {
      iconfont: "mdiSvg"
    }
    // lang: {
    //   locales: { en: localeEn },
    //   current: "en"
    //   // t: (msg: string) => msg
    // }
  });
  const configOption = {
    store,
    vuetify: vt,
    router,
    localVue,
    mocks: {
      $t: (msg: string) => msg,
      $vuetify: {
        theme: {} as any
      },
      ...mockOptions
    },
    extensions: { plugins: [Vuetify] },
    // attachToDocument: true,
    ...mountOptions
  };
  return isShallow
    ? shallowMount(component, configOption)
    : mount(component, configOption);
};
