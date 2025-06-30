import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import i18n from "./i18n";
import "@/extensions/three-extensions";
import "@/extensions/number-extensions";
import "@/extensions/se-nodule-extensions";
import { createPinia } from "pinia";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebase-config";
import { Command } from "@/commands/Command";
import { useSEStore } from "@/stores/se";
import MouseHandler from "./eventHandlers/MouseHandler";
import Nodule from "./plottables/Nodule";
import { createGtag } from "vue-gtag";
import { SENodule } from "@/models/SENodule";
const firebaseApp = initializeApp(firebaseConfig);
const pinia = createPinia();

const app = createApp(App);
const qp = location.search.split(/[?&]/).filter(s => s.length > 0);
const fPos = qp.findIndex(z => z.startsWith("features"));
// To access the beta features use http://localhost:8080/?&features=beta
if (fPos >= 0) {
  const [key, value] = qp[fPos].split("=");
  app.provide(key, value);
} else {
  app.provide("features", null);
}
const gaTag = createGtag({
  tagId: "G-1XK98KQMYZ"
});
app.use(vuetify);
app.use(router);
app.use(i18n);
app.use(gaTag);
app.use(pinia);
app.mount("#app");

const seStore = useSEStore();
Command.setGlobalStore(seStore);
MouseHandler.setGlobalStore(seStore);
SENodule.setGlobalStore(seStore);
// Nodule.setGlobalStore(seStore);
