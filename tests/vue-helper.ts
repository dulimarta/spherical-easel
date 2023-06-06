import { mount, shallowMount, VueClass } from "@vue/test-utils";
import router from "@/router";
import VueRouter, { useRouter } from "vue-router";
import Vuetify from "vuetify";
import Vue from "vue";
import { createVuetify } from "vuetify";
import { createTestingPinia } from "@pinia/testing";
import { createI18n } from "vue-i18n";
import { customIcons } from "@/plugins/iconAliases";
import { createPinia } from "pinia";

const i18n = createI18n({
  legacy: false
});
const vuetify = createVuetify({
  icons: {
    iconfont: "mdiSvg",
    aliases: customIcons,

    sets: {}
  }
  // lang: {
  //   locales: { en: localeEn },
  //   current: "en"
  //   // t: (msg: string) => msg
  // }
});

// export const createTester = () => {
//   const localVue = createLocalVue();
//   localVue.use(VueRouter);
//   localVue.use(Vuetify);
//   // const router = createRouter();
//   return { store, localVue };
// };

export const createWrapper = (
  component: VueClass<Vue>,
  store={},
  { mountOptions = {}, mockOptions = {} } = {},
  isShallow = false
) => {
  // const { localVue, store } = createTester();
  // const vt = new Vuetify({
  //   icons: {
  //     iconfont: "mdiSvg"
  //   }
  //   // lang: {
  //   //   locales: { en: localeEn },
  //   //   current: "en"
  //   //   // t: (msg: string) => msg
  //   // }
  // });
  // read more https://test-utils.vuejs.org/migration/#no-more-createlocalvue
  const configOption = {
    global: {
      plugins: [store, vuetify, router, i18n],
      mocks: {
        $t: (msg: string) => msg,
        $vuetify: {
          theme: {} as any
        },
        ...mockOptions
      }
    },
    // store,
    // vuetify: vt,
    // router,

    // extensions: { plugins: [Vuetify, createPi] },
    // attachToDocument: true,
    ...mountOptions
  };
  return isShallow
    ? shallowMount(component, configOption)
    : mount(component, configOption);
};
