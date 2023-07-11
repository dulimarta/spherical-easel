<!--
  template is HTML for the layout for the UI of the vue application (i.e. the main
  window with everything in it), it allows for binding with the
  underlying Document Object Model. We can use this template for specifying
  locations in the document with the "id" class.
-->

<template>
  <!--
    This is the main application that must contain all the vuetify components.
    There can be only one of these environments.
  -->
  <v-app>
    <!-- This is the main app bar in the window. Notice the internationalization in the toolbar
    title where $t('key') means that the key should be looked up in the current language file named
    ##.lang.json.-->
    <v-app-bar color="primary" density="compact">
      <template #prepend>
        <router-link to="/">
          <v-img
            alt="Spherical Easel Logo"
            class="shrink mr-2"
            contain
            src="@/assets/SphericalEaselLogo.gif"
            transition="scale-transition"
            aspect-ratio="1"
            :width="40" />
        </router-link>
        <a href="/docs/">
          <v-icon class="ml-2" color="white">mdi-help-circle</v-icon>
          <v-tooltip location="bottom" activator="parent">Open Documentation</v-tooltip>
        </a>
      </template>
      <v-app-bar-title>{{ t("main.SphericalEaselMainTitle") }}</v-app-bar-title>
      <!--- TODO: Change the URL to match the hosting site
               For instance, on GitLab use href="/sphericalgeometryvue/docs"
               Watch out for double slashes "//"
            --->
      <!-- Use <a> For GitLab -->
      <!--a :href="`${baseURL}/docs`">
              <v-icon class="ml-2"
                v-bind="props">mdi-help-circle</v-icon>
            </a-->

      <v-spacer></v-spacer>

      <!-- This will open up the global settings view setting the language, decimals
      display and other global options-->
      <AuthenticatedUserToolbox />
      <template v-if="false">
        <!-- This is where the file and export (to EPS, TIKZ, animated GIF?) operations will go -->
        <!--v-btn icon variant="text" size="medium">
          <v-tooltip location="bottom" activator="parent">
            Logout
          </v-tooltip>
          <v-icon
            @click="showShareConstructionDialog">
            mdi-location-exit
          </v-icon>
        </!--v-btn>
        <v-btn icon variant="text" size="medium">
          <v-tooltip location="bottom" activator="parent">
            Share Construction
          </v-tooltip>
          <v-icon
            v-show="showExport"
            @click="showShareConstructionDialog">
            mdi-share
          </v-icon>
        </--v-btn>
        <v-btn-- icon variant="text">
          <v-tooltip location="bottom" activator="parent">
            Save Construction
          </v-tooltip>
          <v-icon
            v-if="whoami !== ''"
            :disabled="!hasObjects"
            @click="showSaveConstructionDialog">
            mdi-content-save
          </v-icon>
        </v-btn-->
      </template>
      <LanguageSelector/>
      <router-link to="/settings/">
        <v-icon color="white" class="mx-2">mdi-cog</v-icon>
      </router-link>
    </v-app-bar>

    <!--
      This is the main window of the app. All other components are display on top of this element
      The router controls this background and it can be Easel or settings or...
    -->
    <v-main>
      <!-- <MessageHub></MessageHub> -->
      <router-view />
      <!-- this is the spot where the views controlled by Vue Router will be rendered -->

    </v-main>
  </v-app>

  <Dialog
      ref="logoutDialog"
      :title="t('constructions.confirmLogout')"
      :yes-text="t('constructions.proceed')"
      :yes-action="() => doLogout()"
      :no-text="t('constructions.cancel')"
      style=""
      max-width="40%">
      <p>
        {{ t("constructions.logoutDialog") }}
      </p>
    </Dialog>



</template>

<!--
  This section is for Typescript code (note lang="ts") for binding the output of the user
  actions to desired changes in the display and the rest of the app.
-->
<script lang="ts" setup>
/* Import the custom components */
import {
  Ref,
  ref,
  computed,
  onBeforeMount,
  onMounted,
  onBeforeUnmount,
  nextTick
} from "vue";
import Dialog, { DialogAction } from "@/components/Dialog.vue"
import LanguageSelector from "./components/LanguageSelector.vue";
import AuthenticatedUserToolbox from "./components/AuthenticatedUserToolbox.vue";
import EventBus from "@/eventHandlers/EventBus";
import { getAuth, Unsubscribe } from "firebase/auth";
import {
  getFirestore
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef
} from "firebase/storage";
import { useAccountStore } from "@/stores/account";
import { useSEStore } from "@/stores/se";
import { detect } from "detect-browser";
import { storeToRefs } from "pinia";

import FileSaver from "file-saver";
import d3ToPng from "d3-svg-to-png";
import GIF from "gif.js";
import { useI18n } from "vue-i18n";
const appAuth = getAuth();
// const appDB = getFirestore();
// const appStorage = getStorage();
import { useRouter } from "vue-router";

// Register vue router in-component navigation guard functions
// Component.registerHooks([
//   "beforeRouteEnter",
//   "beforeRouteLeave",
//   "beforeRouteUpdate"
// ]);

const { t } = useI18n();
const acctStore = useAccountStore();
const seStore = useSEStore();
const { includedTools, userRole } = storeToRefs(acctStore);

const { svgCanvas, inverseTotalRotationMatrix, hasObjects } =
  storeToRefs(seStore);

const router = useRouter();

let clientBrowser: any;
const logoutDialog: Ref<DialogAction | null> = ref(null);
// const shareConstructionDialog: Ref<DialogAction | null> = ref(null);
const exportConstructionDialog: Ref<DialogAction | null> = ref(null);
const whoami = ref("");
const uid = ref("");
let svgRoot: SVGElement;
const selectedFormat = ref("");
const slider = ref(600);

/* User account feature is initialy disabled. To unlock this feature
     The user must press Ctrl+Alt+S then Ctrl+Alt+E in that order */
// let acceptedKeys = 0;
// const accountEnabled = ref(false);

// target formats for export window
//formats = ["SVG", "PNG", "GIF"];
const formats = ["SVG", "PNG"];

// Text of the transformation being applied - only displayed when the tool is applyTransformation
// applyTransformationText = i18n.t(`objects.selectTransformation`);

const baseURL = computed((): string => {
  return import.meta.env.BASE_URL ?? "";
});

onBeforeMount((): void => {
  clientBrowser = detect();
  acctStore.resetToolset();
  //ACStore.resetToolset();
  // EventBus.listen(
  // "set-apply-transformation-footer-text",
  // additionalFooterText
  // );
});

onMounted((): void => {
  console.log("Base URL is ", import.meta.env.BASE_URL);
  // SEStore.init();
  // Get the top-level SVG element
  svgRoot = svgCanvas.value?.querySelector("svg") as SVGElement;
});

async function doLogout(): Promise<void> {
  await appAuth.signOut();
  logoutDialog.value?.hide();
  userRole.value = undefined;
  uid.value = "";
  whoami.value = "";
  acctStore.parseAndSetFavoriteTools("")
}

async function doExportConstructionDialog(): Promise<void> {
  // shareConstructionDialog.value?.hide();
  exportConstructionDialog.value?.show();

  // copy sphere construction svg and get URL, then set the preview img src as that URL
  const svgElement = svgRoot.cloneNode(true) as SVGElement;
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svgElement.style.removeProperty("transform");
  const canvasReference = document.querySelector("#canvas") as HTMLDivElement;
  const currentWidth = canvasReference.clientWidth;
  svgElement.setAttribute(
    "viewBox",
    "0 0 " + currentWidth + " " + currentWidth
  );
  svgElement.setAttribute("height", "400px");
  svgElement.setAttribute("width", "400px");
  const svgBlob = new Blob([svgElement.outerHTML], {
    type: "image/svg+xml;charset=utf-8"
  });
  const svgURL = URL.createObjectURL(svgBlob);

  await nextTick();

  var preview = document.getElementById("preview") as HTMLImageElement;
  preview.src = svgURL;
}

async function doExportButton(): Promise<void> {
  exportConstructionDialog.value?.hide();
  //Clone the SVG
  const svgElement = svgRoot.cloneNode(true) as SVGElement;
  //get the current width of canvas
  const canvasReference = document.querySelector("#canvas") as HTMLDivElement;
  const currentWidth = canvasReference.clientWidth;

  //required line of code for svg elements
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // Set dimensions of exported image based on slider values
  svgElement.setAttribute("height", slider + "");
  svgElement.setAttribute("width", slider + "");

  svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svgElement.setAttribute("transform", "matrix(1 0 0 -1 0 0)");
  svgElement.setAttribute(
    "viewBox",
    "0 0 " + currentWidth + " " + currentWidth
  );
  svgElement.setAttribute("vector-effect", "non-scaling-stroke");
  // export construction to desired file format
  if (selectedFormat.value == "SVG") {
    //create blob and url, then call filesaver
    const svgBlob = new Blob([svgElement.outerHTML], {
      type: "image/svg+xml;charset=utf-8"
    });
    const svgURL = URL.createObjectURL(svgBlob);
    FileSaver.saveAs(svgURL, "construction.svg");

    console.log("SVG exported");
  } else if (selectedFormat.value == "PNG") {
    //set the ID of the clone and append it to body
    svgElement.id = "clonedSVG";
    document.body.append(svgElement);

    //to make this appear right side up remove the transform
    svgElement.removeAttribute("transform");

    //clean up workspace and finish
    svgElement.remove();
    console.log("PNG exported");
  } else if (selectedFormat.value == "GIF") {
    // create GIF to add frames to
    var gif = new GIF({
      workers: 2,
      quality: 10,
      width: slider,
      height: slider
    });

    //Clone the SVG
    const clone = svgRoot.cloneNode(true) as SVGElement;
    //required line of code for svg elements
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    //set the ID of the clone and append it to body
    clone.id = "clonedSVG";
    document.body.append(clone);

    // Set dimensions of exported image based on slider values
    clone.setAttribute("height", slider + "px");
    clone.setAttribute("width", slider + "px");

    //get the current width of canvas
    const canvasReference = document.querySelector("#canvas") as HTMLDivElement;
    const currentWidth = canvasReference.clientWidth;

    //set the view of the image to be around the circle
    //linear equation determined by comparing "console.log(currentWidth);" with successfull hard codes
    clone.setAttribute(
      "viewBox",
      0.476 * currentWidth -
        348.57 +
        " " +
        (0.476 * currentWidth - 348.57) +
        " 733 733"
    );

    //since d3ToPng exports the png as it appears in browser, we must remove the transform
    clone.style.removeProperty("transform");

    //export PNG to the gif stream
    d3ToPng("#clonedSVG", "1", {
      download: false,
      format: "png"
    }).then(fileData => {
      var img = new HTMLImageElement();
      img.src = fileData; // fileData is base64
      gif.addFrame(img);
    });

    // make some change
    // clone.setAttribute("viewBox", "50 50 733 733");

    // await Vue.nextTick();

    // process final GIF
    gif.on("finished", function (blob: any) {
      //window.open(URL.createObjectURL(blob));
      const gifURL = URL.createObjectURL(blob);
      FileSaver.saveAs(gifURL, "mygif.gif");
      clone.remove();
    });

    gif.render();

    console.log("GIF exported");
    // //set the ID of the clone and append it to body
    // svgElement.id = "clonedSVG";
    // document.body.append(svgElement);

    // //export PNG to the gif stream
    // var png3 = await d3ToPng("#clonedSVG", "1", {
    //   download: false,
    //   format: "png"
    // }).then(fileData => {
    //   var img = new HTMLImageElement();
    //   img.src = fileData; // fileData is base64
    //   gif.addFrame(img);
    // });

    // // process final GIF
    // gif.on("finished", function (blob: any) {
    //   //window.open(URL.createObjectURL(blob));
    //   const gifURL = URL.createObjectURL(blob);
    //   FileSaver.saveAs(gifURL, "mygif.gif");
    //   svgElement.remove();
    // });

    // gif.render();

    // console.log("GIF exported");
  }
}

function exportDimensionsCheck(txt: string | undefined): boolean {
  // TODO: clean up the following logic
  //checking if first action is format selection
  // if (count > 2 && (txt == "SVG" || txt == "PNG" || txt == "GIF")) {
  //   txt = lastText;
  // } else {
  //   lastText = txt + "";
  // }
  // count++;

  // //Input validation
  // if (
  //   !txt ||
  //   parseInt(txt) < 200 ||
  //   parseInt(txt) > 1200 ||
  //   selectedFormat == ""
  // ) {
  //   disableButton = true;
  //   return false;
  // } else {
  //   disableButton = false;
  //   return true;
  // }
  return true;
}

</script>

<style lang="scss">
.footer-text {
  padding-top: 9px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 15px;
}
.footer-color {
  color: "accent";
}

#profilePic {
  border-radius: 50%;
}

.pulse-enter-active {
  animation-name: pulse;
  animation-duration: 0.5s;
}
.pulse-leave-active {
  animation-name: pulse;
  animation-duration: 0.5s;
  animation-direction: reverse;
}

@keyframes pulse {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(2);
  }
  100% {
    transform: scale(1);
  }
}

// .shareConstructionClass {
//   width: 300px;
//   margin-top: 50px;
//   margin-bottom: auto;
//   margin-right: 30px;
//   margin-left: auto;
// }
</style>
