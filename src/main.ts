// <reference path="@/extensions/three-ext.d.ts" />
// <reference path="@/extensions/number-ext.d.ts" />
// <reference path="@/types/two.js/index.d.ts" />
import {createApp} from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import i18n from "./i18n";
import "@/extensions/three.extensions";
import "@/extensions/number.extensions";
import { createPinia, PiniaVuePlugin } from "pinia";

// import { Command } from "@/commands/Command";
// import { useSEStore } from "@/stores/se";
// import {appDB, appAuth, appStorage} from "@/firebase-config"
// import MouseHandler from "./eventHandlers/MouseHandler";

const pinia = createPinia();


const app = createApp(App)
app.use(vuetify)
app.use(router)
app.use(pinia)
app.use(i18n)
app.mount("#app")
// new Vue({
//   i18n,
//   provide: {
//     // Use dependency injection to provide a mocked renderer during testing
//     // renderer
//   },
//   router,
//   vuetify,
//   pinia,
//   render: (h: any) => h(App)
// }).$mount("#app");

console.log("Setting global store from main.ts");
// Command.setGlobalStore(useSEStore());
// MouseHandler.setGlobalStore(useSEStore());
