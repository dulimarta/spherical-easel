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
import { createPinia } from "pinia";

import { Command } from "@/commands/Command";
import { useSEStore } from "@/stores/se";
// import {appDB, appAuth, appStorage} from "@/firebase-config"
import MouseHandler from "./eventHandlers/MouseHandler";
import { appDB } from "./firebase-config";

const pinia = createPinia();


const app = createApp(App)
// app.config.globalProperties.$appDB = appDB
app.use(vuetify)
app.use(router)
app.use(pinia)
app.use(i18n)
app.mount("#app")

console.log("Setting global store from main.ts");
const seStore = useSEStore()
Command.setGlobalStore(seStore);
MouseHandler.setGlobalStore(seStore);
