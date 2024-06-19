import { mount, shallowMount, VueWrapper } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
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

global.ResizeObserver = require("resize-observer-polyfill");

export function createWrapper(
  component: any,
  { componentProps = {} } = {},
  isShallow = false
) {
  const testPinia = createTestingPinia({stubActions: false})
  const configOption = {
    //   i18n,
    //   // store,
    //   // router,
    global: {
      plugins: [vuetify, i18n, testPinia]
      //     mocks: {
      //       t: vi.fn()
      //     },
      //     ...globalOptions,
      //     ...mockOptions
    },
    //   // attachToDocument: true,
    props: {
      ...componentProps
    }
  };
  // console.debug("Shallow mount?", isShallow);
  // console.debug("Config option ", configOption);
  const z = isShallow
    ? shallowMount(component, configOption)
    : mount(component, configOption);
  // console.debug("Result of mounting", z);
  return { wrapper: z, testPinia };
}
