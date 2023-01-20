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
    <v-app-bar color="primary" :title="t('main.SphericalEaselMainTitle')">
      <div class="d-flex align-center">
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
        <!--- TODO: Change the URL to match the hosting site
               For instance, on GitLab use href="/sphericalgeometryvue/docs"
               Watch out for double slashes "//"
            --->
        <a href="/docs/">
          <v-icon class="ml-2">mdi-help-circle</v-icon>
          <v-tooltip location="start" activator="parent">Open Doc</v-tooltip>
        </a>
        <!-- Use <a> For GitLab -->
        <!--a :href="`${baseURL}/docs`">
              <v-icon class="ml-2"
                v-bind="props">mdi-help-circle</v-icon>
            </a-->
      </div>

      <v-spacer></v-spacer>

      <!-- This will open up the global settings view setting the language, decimals
      display and other global options-->
      <template v-if="accountEnabled">
        <span>{{ whoami }}</span>
        <v-img
          id="profilePic"
          v-if="profilePicUrl"
          class="mx-2"
          contain
          :src="profilePicUrl"
          :aspect-ratio="1 / 1"
          max-width="48"
          @click="doLoginOrCheck"></v-img>
        <v-icon v-else class="mx-2" @click="doLoginOrCheck">mdi-account</v-icon>
        <!-- This is where the file and export (to EPS, TIKZ, animated GIF?) operations will go -->
        <v-icon
          v-show="showExport"
          class="pr-3"
          @click="showShareConstructionDialog">
          mdi-application-export</v-icon
        >
        <v-icon
          v-if="whoami !== ''"
          :disabled="!hasObjects"
          class="mr-2"
          @click="showSaveConstructionDialog"
          >mdi-share
        </v-icon>
      </template>
      <router-link to="/settings/">
        <v-icon>mdi-cog</v-icon>
      </router-link>
    </v-app-bar>

    <!--
      This is the main window of the app. All other components are display on top of this element
      The router controls this background and it can be Easel or settings or...
    -->
    <v-main>
      <router-view />
      <!-- this is the spot where the views controlled by Vue Router will be rendered v-html="$t('buttons.' + button.displayedName )"-->

      <!-- <MessageBox></MessageBox>-->
    </v-main>
  </v-app>

  <!--Dialog
      ref="logoutDialog"
      :title="i18nText('constructions.confirmLogout')"
      :yes-text="i18nText('constructions.proceed')"
      :yes-action="() => doLogout()"
      :no-text="i18nText('constructions.cancel')"
      style=""
      max-width="40%">
      <p>
        {{ i18nText("constructions.logoutDialog") }}
      </p>
    </Dialog>

    <Dialog
      ref="saveConstructionDialog"
      :title="i18nText('constructions.saveConstruction')"
      :yes-text="i18nText('constructions.save')"
      :no-text="i18nText('constructions.cancel')"
      :yes-action="() => doShare()"
      max-width="40%">
      <p>
        {{ i18nText("constructions.saveConstructionDialog") }}
      </p>

      <v-text-field
        type="text"
        dense
        clearable
        counter
        persistent-hint
        :label="i18nText('constructions.description')"
        required
        v-model="description"
        @keypress.stop></v-text-field>
      <v-switch
        v-model="publicConstruction"
        :disabled="uid.length === 0"
        :label="i18nText('constructions.makePublic')"></v-switch>
    </Dialog>
    <Dialog
      ref="shareConstructionDialog"
      :title="i18nText('constructions.shareConstructionDialog')"
      :yesText="i18nText('constructions.exportConstructionDialog')"
      :yes-action="() => doExportConstructionDialog()"
      :no-text="i18nText('constructions.cancel')"
      max-width="40%"
      content-class="shareConstructionClass">
      <p>
        {{ i18nText("constructions.shareLinkDialog") }}
      </p>

      <input ref="shareLinkReference" readonly :value="shareLink" />
      <button @click="copyShareLink">Copy</button>
    </Dialog>

    <Dialog
      ref="exportConstructionDialog"
      :title="i18nText('constructions.exportConstructionDialog')"
      :yesText="i18nText('constructions.exportConstructionDialog')"
      :no-text="i18nText('constructions.cancel')"
      :yes-action="() => doExportButton()"
      :isDisabled="disableButton"
      max-width="60%">
      <v-row align="center" justify="space-between">
        <v-col cols="10" xs="10" sm="10" md="2" lg="3" xl="3">
          <div>
            <img id="preview" />
          </div>
        </v-col>
        <v-col cols="10" xs="10" sm="10" md="4" lg="6" xl="6">
          <v-row>
            <v-col class="pr-4">
              <p>{{ i18nText("constructions.sliderFileDimensions") }}</p>
              <v-slider
                v-model="slider"
                class="align-center"
                :max="sliderMax"
                :min="sliderMin"
                hide-details
                >{{ i18nText("constructions.displaySlider") }}
                <template v-slot:append>
                  <v-text-field
                    type="number"
                    v-model="slider"
                    class="mt-0 pt-0"
                    hide-details
                    single-line
                    style="width: 120px"
                    :rules="[exportDimensionsCheck]"
                    @keypress.stop></v-text-field>
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <v-col class="d-flex" cols="12" sm="6">
            <v-select
              :items="formats"
              label="Format"
              v-model="selectedFormat"
              :rules="[exportDimensionsCheck]"
              solo></v-select>
          </v-col>
        </v-col>
      </v-row>
    </Dialog-->
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
import MessageBox from "@/components/MessageBox.vue";
// import ConstructionLoader from "@/components/ConstructionLoader.vue";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { ConstructionInFirestore } from "./types";
import EventBus from "@/eventHandlers/EventBus";
import { Error, FirebaseAuth, User } from "@firebase/auth-types";
import { DocumentReference, DocumentSnapshot } from "@firebase/firestore-types";
import { FirebaseStorage, UploadTaskSnapshot } from "@firebase/storage-types";
import { Unsubscribe } from "@firebase/util";
import { Command } from "./commands/Command";
import { useAccountStore } from "@/stores/account";
import { useSEStore } from "@/stores/se";
import { detect } from "detect-browser";
import { storeToRefs } from "pinia";

import FileSaver from "file-saver";
import d3ToPng from "d3-svg-to-png";
import GIF from "gif.js";
import { useI18n } from "vue-i18n";
import { appAuth, appStorage, appDB } from "./firebase-config";
import { useRouter } from "vue-router";

// Register vue router in-component navigation guard functions
// Component.registerHooks([
//   "beforeRouteEnter",
//   "beforeRouteLeave",
//   "beforeRouteUpdate"
// ]);

// @Component({
//   components: { MessageBox, Dialog },
//   methods: {
const { t, locale } = useI18n({ inheritLocale: true });
const acctStore = useAccountStore();
const seStore = useSEStore();
//     ...mapActions(useAccountStore, ["resetToolset"]),
//     ...mapActions(useSEStore, ["clearUnsavedFlag"])
//   },
//   computed: {
//     ...mapState(useAccountStore, ["includedTools"]),
//     ...mapState(useSEStore, [
//       "activeToolName",
//       "svgCanvas",
//       "inverseTotalRotationMatrix",
//       "hasObjects"
//     ]),
//     ...mapWritableState(useAccountStore, ["userRole"])
//     // ...mapGetters(useSEStore, ["hasObjects"])
//   }
// })
const { includedTools, userRole } = storeToRefs(acctStore);

const {
  //#region activeToolName
  activeToolName,
  //#endregion activeToolName
  svgCanvas,
  inverseTotalRotationMatrix,
  hasObjects
} = storeToRefs(seStore);

const router = useRouter();

let clientBrowser: any;
const description = ref("");
const publicConstruction = ref(false);
// $refs!: {
const logoutDialog: Ref<DialogAction | null> = ref(null);
const saveConstructionDialog: Ref<DialogAction | null> = ref(null);
const shareConstructionDialog: Ref<DialogAction | null> = ref(null);
const exportConstructionDialog: Ref<DialogAction | null> = ref(null);
const shareLinkReference: Ref<HTMLElement | null> = ref(null);
// };
let footerColor = "accent";
let authSubscription!: Unsubscribe;
const whoami = ref("");
const uid = ref("");
const profilePicUrl: Ref<string | null> = ref(null);
let svgRoot: SVGElement;
const showExport = ref(false);
const selectedFormat = ref("");
const slider = ref(600);
const sliderMin = 200;
const sliderMax = 1200;
const shareLink = ref("--Placeholder for share link--");
const disableButton = ref(false);
// lastText = "";
// count = 0;

/* User account feature is initialy disabled. To unlock this feature
     The user must press Ctrl+Alt+S then Ctrl+Alt+E in that order */
let acceptedKeys = 0;
const accountEnabled = ref(false);

// target formats for export window
//formats = ["SVG", "PNG", "GIF"];
const formats = ["SVG", "PNG"];

// Text of the transformation being applied - only displayed when the tool is applyTransformation
// applyTransformationText = i18n.t(`objects.selectTransformation`);

const baseURL = computed((): string => {
  return import.meta.env.BASE_URL ?? "";
});

function keyHandler(ev: KeyboardEvent): void {
  if (ev.repeat) return; // Ignore repeated events on the same key
  if (!ev.altKey) return;
  if (!ev.ctrlKey) return;

  if (ev.code === "KeyS" && acceptedKeys === 0) {
    console.info("'S' is accepted");
    acceptedKeys = 1;
  } else if (ev.code === "KeyE" && acceptedKeys === 1) {
    acceptedKeys = 2;
    // Directly setting the accountEnable flag here does not trigger
    // a UI update even after calling $forceUpdate()
    // Firing an event seems to solve the problem
    EventBus.fire("secret-key-detected", {});
  } else {
    acceptedKeys = 0;
  }
}

onBeforeMount((): void => {
  window.addEventListener("keydown", keyHandler);
  EventBus.listen("secret-key-detected", () => {
    console.log("Got the secret key");
    accountEnabled.value = true;
    acceptedKeys = 0;
    // $forceUpdate();
  });
  EventBus.listen("share-construction-requested", doShare);
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
  EventBus.listen("set-footer-color", setFooterColor);
  authSubscription = appAuth.onAuthStateChanged((u: User | null) => {
    if (u !== null) {
      showExport.value = true;
      whoami.value = u.email ?? "unknown email";
      uid.value = u.uid;
      appDB
        .collection("users")
        .doc(uid.value)
        .get()
        .then((ds: DocumentSnapshot) => {
          if (ds.exists) {
            accountEnabled.value = true;
            console.debug("User data", ds.data());
            const { profilePictureURL, role } = ds.data() as any;
            if (profilePictureURL) {
              profilePicUrl.value = profilePictureURL;
            }
            if (role) {
              userRole.value = role.toLowerCase();
            }
          }
        });
    } else {
      whoami.value = "";
      profilePicUrl.value = "";
    }
  });
  // Get the top-level SVG element
  svgRoot = svgCanvas.value?.querySelector("svg") as SVGElement;
});

onBeforeUnmount((): void => {
  if (authSubscription) authSubscription();
  whoami.value = "";
  uid.value = "";
  window.removeEventListener("keydown", keyHandler);
  EventBus.unlisten("secret-key-detected");
  // EventBus.unlisten("set-apply-transformation-footer-text");
});
function setFooterColor(e: { color: string }): void {
  footerColor = e.color;
}

async function doLogout(): Promise<void> {
  await appAuth.signOut();
  logoutDialog.value?.hide();
  userRole.value = undefined;
  uid.value = "";
  whoami.value = "";
}

// additionalFooterText(e: { text: string }): void {
// console.debug("apply transform", e.text);
// applyTransformationText = e.text;
// }

function doLoginOrCheck(): void {
  if (appAuth.currentUser !== null) {
    logoutDialog.value?.show();
  } else {
    router.replace({ path: "/account" });
  }
}
function showShareConstructionDialog() {
  shareConstructionDialog.value?.show();
}

async function doExportConstructionDialog(): Promise<void> {
  shareConstructionDialog.value?.hide();
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

function showSaveConstructionDialog() {
  saveConstructionDialog.value?.show();
}

async function doShare(): Promise<void> {
  /* TODO: move the following constant to global-settings? */
  const FIELD_SIZE_LIMIT = 50 * 1024; /* in bytes */
  // A local function to convert a blob to base64 representation
  const toBase64 = (inputBlob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(inputBlob);
    });

  /* dump the command history */
  const scriptOut = Command.dumpOpcode();

  // TODO: should we decouple the zoomFactor from the rotation matrix when
  // saving a construction?. Possible issue: the construction
  // was saved by a user working on a larger screen (large zoomFactor),
  // but loaded by a user working on a smaller screen (small zoomFactor)

  const rotationMat = inverseTotalRotationMatrix;
  const collectionPath = publicConstruction
    ? "constructions"
    : `users/${uid}/constructions`;

  // Make a duplicate of the SVG tree
  const svgElement = svgRoot.cloneNode(true) as SVGElement;
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // Remove the top-level transformation matrix
  // We have to save the preview in its "natural" pose
  svgElement.style.removeProperty("transform");

  const svgBlob = new Blob([svgElement.outerHTML], {
    type: "image/svg+xml;charset=utf-8"
  });
  const svgPreviewData = await toBase64(svgBlob);
  console.log(svgPreviewData); // TODO delete

  // const svgURL = URL.createObjectURL(svgBlob);
  // FileSaver.saveAs(svgURL, "hans.svg");

  /* Create a pipeline of Firebase tasks
       Task 1: Upload construction to Firestore
       Task 2: Upload the script to Firebase Storage (for large script)
       Task 3: Upload the SVG preview to Firebase Storage (for large SVG)
    */
  appDB // Task #1
    .collection(collectionPath)
    .add({
      version: "1",
      dateCreated: new Date().toISOString(),
      author: whoami.value,
      description: description.value,
      rotationMatrix: JSON.stringify(rotationMat.value.elements),
      tools: includedTools.value,
      script: "" // Use an empty string (for type checking only)
    } as ConstructionInFirestore)
    .then((constructionDoc: DocumentReference) => {
      /* Task #2 */
      const scriptPromise: Promise<string> =
        scriptOut.length < FIELD_SIZE_LIMIT
          ? Promise.resolve(scriptOut)
          : appStorage
              .ref(`scripts/${constructionDoc.id}`)
              .putString(scriptOut)
              .then(t => t.ref.getDownloadURL());

      /* Task #3 */
      const svgPromise: Promise<string> =
        svgPreviewData.length < FIELD_SIZE_LIMIT
          ? Promise.resolve(svgPreviewData)
          : appStorage
              .ref(`construction-svg/${constructionDoc.id}`)
              .putString(svgPreviewData)
              .then(t => t.ref.getDownloadURL());

      /* Wrap the result from the three tasks as a new Promise */
      return Promise.all([constructionDoc.id, scriptPromise, svgPromise]);
    })
    .then(([docId, scriptData, svgData]) => {
      appDB
        .collection(collectionPath)
        .doc(docId)
        .update({ script: scriptData, preview: svgData });
      // Pass on the document ID to be included in the alert message
      return docId;
    })
    .then((docId: string) => {
      EventBus.fire("show-alert", {
        key: "constructions.firestoreConstructionSaved",
        keyOptions: { docId },
        type: "info"
      });
      seStore.clearUnsavedFlag();
    })
    .catch((err: Error) => {
      console.error("Can't save document", err.message);
      EventBus.fire("show-alert", {
        key: "constructions.firestoreSaveError",
        // keyOptions: { docId: constructionDoc.id },
        type: "error"
      });
    });

  saveConstructionDialog.value?.hide();
}

function copyShareLink(): void {
  shareLinkReference.value?.focus();
  document.execCommand("copy");
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

.shareConstructionClass {
  width: 300px;
  margin-top: 50px;
  margin-bottom: auto;
  margin-right: 30px;
  margin-left: auto;
}
</style>
