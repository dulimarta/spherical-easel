import { mount, config } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
// import { createI18n } from "vue-i18n";
// import router from "@/router";
// import VueRouter from "vue-router";
import i18n from "../src/i18n";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { vi } from "vitest";
import { customIcons } from "../src/plugins/iconAliases";
import "../src/extensions/array-extensions"
import "../src/extensions/number-extensions"
const vuetify = createVuetify({
  components,
  directives
  /* WARNING: using customIcons below caused a VITEST runtime error */
  // icons: { aliases: customIcons }
});
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

config.global.stubs = {
  transition: false // suppress transition effect during testing
};
export function createWrapper(
  component: any,
  { componentProps = {}, stubOptions = {} /*, componentData = {}*/ } = {},
  isShallow = false
) {
  // stubActions: Allow store actions to be mocked
  const testPinia = createTestingPinia({
    stubActions: false,
    createSpy: vi.fn
  });
  const configOption = {
    //   i18n,
    //   // store,
    //   // router,
    global: {
      plugins: [vuetify, i18n, testPinia],
      stubs: {
        ...stubOptions
      }

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
    // data() {
    //   return componentData
    // }
  };
  const z = mount(component, { ...configOption, shallow: isShallow });
  // console.debug("Result of mounting", z);
  return { wrapper: z, testPinia };
}
