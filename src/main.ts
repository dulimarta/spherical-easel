import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import { WebGLRenderer } from "three";
import VueI18n from "vue-i18n";
import i18n from "./i18n";

Vue.use(VueI18n);

Vue.config.productionTip = false;

new Vue({
  i18n,
  provide: {
    // Use dependency injection to provide a mocked renderer during testing
    renderer: new WebGLRenderer({ antialias: true })
  },
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
