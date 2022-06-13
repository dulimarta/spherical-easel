// <reference path="@/extensions/three-ext.d.ts" />
// <reference path="@/extensions/number-ext.d.ts" />
// <reference path="@/types/two.js/index.d.ts" />
import Vue from "vue";
import App from "./App.vue";
import router from "./router";
// import store from "./store";
import vuetify from "./plugins/vuetify";
import VueI18n from "vue-i18n";
import i18n from "./i18n";
import "@/extensions/three.extensions";
import "@/extensions/number.extensions";
import {
  firebaseAuth,
  firebaseFirestore,
  firebaseStorage
} from "./firebase-backend";
import { createPinia, PiniaVuePlugin } from "pinia";
import { Command } from "@/commands/Command";
import { useSEStore } from "@/stores/se";
import MouseHandler from "./eventHandlers/MouseHandler";
import { useSDStore } from "./stores/sd";
import VueSocketIO from "vue-socket.io-extended";
import { io } from "socket.io-client";
Vue.use(VueI18n);
Vue.use(PiniaVuePlugin);
const pinia = createPinia();

// Allow all .vue components to access Firebase Auth, Firestore, and Storage
// via new instance variables this.$appAuth, this.$appDB, this.$appStorage
Vue.prototype.$appAuth = firebaseAuth;
Vue.prototype.$appDB = firebaseFirestore;
Vue.prototype.$appStorage = firebaseStorage;
Vue.config.productionTip = false;

const socket = io(
  process.env.VUE_APP_STUDIO_SERVER_URL || "http://localhost:4000"
);
Vue.use(VueSocketIO, socket);

new Vue({
  i18n,
  provide: {
    // Use dependency injection to provide a mocked renderer during testing
    // renderer
  },
  router,
  // store,
  vuetify,
  pinia,
  render: (h: any) => h(App)
}).$mount("#app");

console.log("Setting global store from main.ts");
Command.setGlobalStores(useSEStore(), useSDStore());
MouseHandler.setGlobalStore(useSEStore());
