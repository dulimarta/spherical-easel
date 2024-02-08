import { mount, shallowMount, VueWrapper } from "@vue/test-utils";
// import { createI18n } from "vue-i18n";
// import router from "@/router";
// import VueRouter from "vue-router";
import i18n from "../src/i18n";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { vi } from "vitest";
const vuetify = createVuetify({ components, directives });
// const i18n = createI18n({});
// export const createTester = () => {
//   const localVue = createLocalVue();
//   localVue.use(VueRouter);
//   localVue.use(Vuetify);
//   const store = createStore();
//   // const router = createRouter();
//   return { store, localVue };
// };

export const createWrapper = (
  component: any,
  { mountOptions = {}, mockOptions = {}, globalOptions = {} } = {},
  isShallow = false
): VueWrapper => {
  const configOption = {
    i18n,
    // store,
    // router,
    global: {
      plugins: [vuetify, i18n],
      mocks: {
        t: vi.fn()
      },
      ...globalOptions,
      ...mockOptions
    },
    // attachToDocument: true,
    ...mountOptions
  };
  console.debug("Shallow mount?", isShallow);
  console.debug("Config option ", configOption);
  return isShallow
    ? shallowMount(component, configOption)
    : mount(component, configOption);
};
