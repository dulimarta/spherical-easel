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
import { Command } from "@/commands-spherical/Command";
import { useSEStore } from "@/stores/se";
import MouseHandler from "./eventHandlers/MouseHandler";
import Nodule from "./plottables/Nodule";
import { useHyperbolicStore } from "./stores/hyperbolic";
import { createGtag } from "vue-gtag";
import { SENodule } from "@/models/SENodule";
import { PoseTracker } from "./eventHandlers-hyperbolic/PoseTracker";
import { HENodule } from "./models-hyperbolic/HENodule";
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
app.use(vuetify);
app.use(router);
app.use(i18n);
if (import.meta.env.MODE === "production") {
  const gaTag = createGtag({
    tagId: "G-1XK98KQMYZ"
  });

  app.use(gaTag);
}
app.use(pinia);
app.mount("#app");
router.afterEach((to, from) => {
  document.title = to.path.endsWith("hyperbolic")
    ? "Hyperbolic Easel"
    : "Spherical Easel";
});

const seStore = useSEStore();
const heStore = useHyperbolicStore();
Command.setGlobalStore(seStore, heStore);
MouseHandler.setGlobalStore(seStore);
SENodule.setGlobalStore(seStore);
PoseTracker.hyperStore = heStore;
HENodule.hyperStore = heStore;
// Nodule.setGlobalStore(seStore);
