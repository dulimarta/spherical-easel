// <reference path="@/extensions/three-ext.d.ts" />
// <reference path="@/extensions/number-ext.d.ts" />
// <reference path="@/types/two.js/index.d.ts" />
import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import VueI18n from "vue-i18n";
import i18n from "./i18n";
import "@/extensions/three.extensions";
import "@/extensions/number.extensions";

Vue.use(VueI18n);

Vue.config.productionTip = false;

new Vue({
  i18n,
  provide: {
    // Use dependency injection to provide a mocked renderer during testing
    // renderer
  },
  router,
  store: store.original,
  vuetify,
  render: h => h(App)
}).$mount("#app");
