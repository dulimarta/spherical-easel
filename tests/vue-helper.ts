import { mount, shallowMount, VueWrapper } from "@vue/test-utils";
// import router from "@/router";
// import VueRouter from "vue-router";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components"
import * as directives from "vuetify/directives"

const vuetify = createVuetify({ components, directives })

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
  { mountOptions = {}, mockOptions = {} } = {},
  isShallow = false
):VueWrapper => {

  const configOption = {
    // store,
    // router,
    // mocks: {
    //   $t: (msg: string) => msg,
    //   $vuetify: {
    //     theme: {} as any
    //   },
    //   ...mockOptions
    // },
    global: {
      plugins: [vuetify],
    },
    // attachToDocument: true,
    ...mountOptions
  };
  return isShallow
    ? shallowMount(component, configOption)
    : mount(component, configOption);
};
