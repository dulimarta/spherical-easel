// <reference path="@/extensions/three-ext.d.ts" />
import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
// import { WebGLRenderer } from "three";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer"
import VueI18n from "vue-i18n";
import i18n from "./i18n";
import "@/extensions/three.extensions";

Vue.use(VueI18n);

Vue.config.productionTip = false;
const renderer = new SVGRenderer();
renderer.setQuality("high");

new Vue({
  i18n,
  provide: {
    // Use dependency injection to provide a mocked renderer during testing
    renderer
  },
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
