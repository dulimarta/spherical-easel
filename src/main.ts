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
import { SENodule } from "./models/internal";
import Nodule from "./plottables/Nodule";
const firebaseApp = initializeApp(firebaseConfig);
const pinia = createPinia();


const app = createApp(App);
const qp = location.search.split(/[?&]/).filter(s => s.length > 0)
const fPos = qp.findIndex(z => z.startsWith("features"))
// To access the beta features use http://localhost:8080/?&features=beta
if (fPos >= 0) {
  const [key, value] = qp[fPos].split("=")
  app.provide(key, value)
} else {
  app.provide("features", null)
}
app.use(vuetify);
app.use(router);
app.use(i18n);
// When .use(pinia) is NOT the last call, Pinia did not show up in VueJS DevTools
// https://stackoverflow.com/questions/77456631/why-cant-i-see-pinia-in-vue-devtools
app.use(pinia);
app.mount("#app");

const seStore = useSEStore();
Command.setGlobalStore(seStore);
MouseHandler.setGlobalStore(seStore);
SENodule.setGlobalStore(seStore);
// Nodule.setGlobalStore(seStore);
