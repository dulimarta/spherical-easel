// <reference path="@/extensions/three-ext.d.ts" />
// <reference path="@/extensions/number-ext.d.ts" />
// <reference path="@/types/two.js/index.d.ts" />
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import i18n from "./i18n";
import "@/extensions/three.extensions";
import "@/extensions/number.extensions";
import "@/extensions/se-nodule.extensions"
import { createPinia } from "pinia";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebase-config";
import { Command } from "@/commands/Command";
import { useSEStore } from "@/stores/se";
import MouseHandler from "./eventHandlers/MouseHandler";
import { SENodule } from "./models/internal";
import Nodule from "./plottables/Nodule";
const pinia = createPinia();
const firebaseApp = initializeApp(firebaseConfig);

const app = createApp(App);
app.use(vuetify);
app.use(router);
app.use(pinia);
app.use(i18n);
app.mount("#app");

const seStore = useSEStore();
Command.setGlobalStore(seStore);
MouseHandler.setGlobalStore(seStore);
SENodule.setGlobalStore(seStore);
Nodule.setGlobalStore(seStore);
