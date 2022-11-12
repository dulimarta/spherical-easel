<!--
  template is HTML for the layout for the UI of the vue application (i.e. the main
  window with everything in it), it allows for binding with the
  underlying Document Object Model. We can use this template for specifiying
  locations in the document with the "id" class.
-->

<template>
  <!--
    This is the main application that must contain all the vuetify components.
    There can be only one of these environments.
  -->
  <v-app app>
    <!-- This is the main app bar in the window. Notice the internationalization in the toolbar
    title where $t('key') means that the key should be looked up in the current language file named
    ##.lang.json.-->
    <v-app-bar app
      color="primary"
      dark
      dense
      clipped-left>

      <v-app-bar-nav-icon></v-app-bar-nav-icon>

      <div class="d-flex align-center">
        <router-link to="/">
          <v-img alt="Spherical Easel Logo"
            class="shrink mr-2"
            contain
            src="../docs/.vuepress/public/SphericalEaselLogo.png"
            transition="scale-transition"
            width="40" />
        </router-link>
        <v-toolbar-title>
          {{ $t("main.SphericalEaselMainTitle") }}
        </v-toolbar-title>
        <v-tooltip left>
          <template v-slot:activator="{ on }">
            <!--- TODO: Change the URL to match the hosting site
               For instance, on GitLab use href="/sphericalgeometryvue/docs"
               Watch out for double slashes "//"
            --->
            <a href="/docs/">
              <v-icon class="ml-2"
                v-on="on">mdi-help-circle</v-icon>
            </a>
            <!-- Use <a> For GitLab -->
            <!--a :href="`${baseURL}/docs`">
              <v-icon class="ml-2"
                v-on="on">mdi-help-circle</v-icon>
            </a-->
          </template>
          <span>Open Doc</span>
        </v-tooltip>
      </div>

      <v-spacer></v-spacer>

      <Dialog ref="shareConstructionDialog"
        :title="$t('constructions.shareConstructionDialog')"
        :yesText="$t('constructions.exportConstructionDialog')"
        :yes-action="() => doExportConstructionDialog()"
        :no-text="$t('constructions.cancel')"
        max-width="40%"
        content-class="shareConstructionClass">
        <p>
          {{$t('constructions.shareLinkDialog')}}</p>

        <input ref="shareLinkReference"
          v-on:focus="$event.target.select()"
          readonly
          :value="shareLink" />
        <button @click="copyShareLink">Copy</button>

      </Dialog>

      <Dialog ref="exportConstructionDialog"
        :title="$t('constructions.exportConstructionDialog')"
        :yesText="$t('constructions.exportConstructionDialog')"
        :no-text="$t('constructions.cancel')"
        :yes-action="() => doExportButton()"
        :isDisabled="disableButton"
        max-width="60%">

        <v-row align="center"
          justify="space-between">
          <v-col cols="10"
            xs="10"
            sm="10"
            md="2"
            lg="3"
            xl="3">
            <div>
              <img id="preview">
            </div>
          </v-col>
          <v-col cols="10"
            xs="10"
            sm="10"
            md="4"
            lg="6"
            xl="6">
            <v-row>
              <v-col class="pr-4">
                <p>{{$t('constructions.sliderFileDimensions')}}</p>
                <v-slider v-model="slider"
                  class="align-center"
                  :max="sliderMax"
                  :min="sliderMin"
                  hide-details>{{$t('constructions.displaySlider')}}
                  <template v-slot:append>
                    <v-text-field type="number"
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

            <v-col class="d-flex"
              cols="12"
              sm="6">
              <v-select :items="formats"
                label="Format"
                v-model="selectedFormat"
                :rules="[exportDimensionsCheck]"
                solo></v-select>
            </v-col>
          </v-col>
        </v-row>

      </Dialog>

      <!-- This will open up the global settings view setting the language, decimals
      display and other global options-->
      <template v-if="accountEnabled">
        <span>{{whoami}}</span>
        <v-img id="profilePic"
          v-if="profilePicUrl"
          class="mx-2"
          contain
          :src="profilePicUrl"
          :aspect-ratio="1/1"
          max-width="48"
          @click="doLoginOrCheck"></v-img>
        <v-icon v-else
          class="mx-2"
          @click="doLoginOrCheck">mdi-account</v-icon>
        <!-- This is where the file and export (to EPS, TIKZ, animated GIF?) operations will go -->
        <v-icon v-show="showExport"
          class="pr-3"
          @click="$refs.shareConstructionDialog.show()">
          mdi-application-export</v-icon>
        <v-icon v-if="whoami !== ''"
          :disabled="!hasObjects"
          class="mr-2"
          @click="$refs.saveConstructionDialog.show()">$shareConstruction
        </v-icon>
      </template>
      <router-link to="/settings/">
        <v-icon>$appSettings</v-icon>
      </router-link>
    </v-app-bar>

    <!--
      This is the main window of the app. All other components are display on top of this element
      The router controls this background and it can be Easel or settings or...
    -->
    <v-main>
      <router-view>
        <!-- this is the spot where the views controlled by Vue Router will be rendred v-html="$t('buttons.' + button.displayedName )"-->
      </router-view>
      <!-- <MessageBox></MessageBox>-->
    </v-main>
    <!-- <v-footer app
      :color="footerColor"
      padless>
      <v-col class="text-center">
        <span
          v-if="activeToolName ==='PanZoomInDisplayedName' || activeToolName==='PanZoomOutDisplayedName'"
          class="footer-text"
          v-html="$t('buttons.CurrentTool')+ ': ' + $t('buttons.' + activeToolName).split('<br>').join('/').trim()">
        </span>
        <span
          v-else-if="activeToolName === 'ApplyTransformationDisplayedName'"
          class="footer-text"
          v-html="$t('buttons.CurrentTool')+ ': '  + $t('buttons.' + activeToolName).split('<br>').join(' ').trim() + ' <strong>' + applyTransformationText + '</strong>'">
        </span>
        <span v-else-if="activeToolName!== ''"
          class="footer-text"
          v-html="$t('buttons.CurrentTool')+ ': '  + $t('buttons.' + activeToolName).split('<br>').join(' ').trim()">
        </span>
        <span v-else
          class="footer-text">{{ $t(`buttons.NoToolSelected`) }}</span>
      </v-col>
    </v-footer> -->
    <Dialog ref="logoutDialog"
      :title="$t('constructions.confirmLogout')"
      :yes-text="$t('constructions.proceed')"
      :yes-action="() => doLogout()"
      :no-text="$t('constructions.cancel')"
      style=""
      max-width="40%">
      <p>
        {{$t('constructions.logoutDialog')}}</p>

    </Dialog>

    <Dialog ref="saveConstructionDialog"
      :title="$t('constructions.saveConstruction')"
      :yes-text="$t('constructions.save')"
      :no-text="$t('constructions.cancel')"
      :yes-action="() => doShare()"
      max-width="40%">
      <p>
        {{$t('constructions.saveConstructionDialog')}}
      </p>

      <v-text-field type="text"
        dense
        clearable
        counter
        persistent-hint
        :label="$t('constructions.description')"
        required
        v-model="description"
        @keypress.stop></v-text-field>
      <v-switch v-model="publicConstruction"
        :disabled="uid.length === 0"
        :label="$t('constructions.makePublic')"></v-switch>
    </Dialog>
  </v-app>
</template>

<!--
  This section is for Typescript code (note lang="ts") for binding the output of the user
  actions to desired changes in the display and the rest of the app.
-->
<script lang="ts">
/* Import the custom components */
import VueComponent from "vue";
import { Vue, Component } from "vue-property-decorator";
import MessageBox from "@/components/MessageBox.vue";
// import ConstructionLoader from "@/components/ConstructionLoader.vue";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { ConstructionInFirestore } from "./types";
import EventBus from "@/eventHandlers/EventBus";
import { Error, FirebaseAuth, User } from "@firebase/auth-types";
import {
  FirebaseFirestore,
  DocumentReference,
  DocumentSnapshot
} from "@firebase/firestore-types";
import { FirebaseStorage, UploadTaskSnapshot } from "@firebase/storage-types";
import { Unsubscribe } from "@firebase/util";
import { Command } from "./commands/Command";
import { Matrix4 } from "three";
import { useAccountStore } from "@/stores/account";
import { useSEStore } from "@/stores/se";
import { detect } from "detect-browser";
import { mapState, mapActions, mapWritableState, mapGetters } from "pinia";

import FileSaver from "file-saver";
import d3ToPng from "d3-svg-to-png";
import GIF from "gif.js";
import i18n from "./i18n";
import ConstructionListVue from "./components/ConstructionList.vue";
// import { gzip } from "node-gzip";

// Register vue router in-component navigation guard functions
Component.registerHooks([
  "beforeRouteEnter",
  "beforeRouteLeave",
  "beforeRouteUpdate"
]);

@Component({
  components: { MessageBox, Dialog },
  methods: {
    ...mapActions(useAccountStore, ["resetToolset"]),
    ...mapActions(useSEStore, ["clearUnsavedFlag"])
  },
  computed: {
    ...mapState(useAccountStore, ["includedTools"]),
    ...mapState(useSEStore, [
      "activeToolName",
      "svgCanvas",
      "inverseTotalRotationMatrix",
      "hasObjects"
    ]),
    ...mapWritableState(useAccountStore, ["userRole"])
    // ...mapGetters(useSEStore, ["hasObjects"])
  }
})
export default class App extends Vue {
  //#region activeToolName
  readonly activeToolName!: string;
  //#endregion activeToolName

  readonly svgCanvas!: HTMLDivElement | null;

  readonly inverseTotalRotationMatrix!: Matrix4;

  readonly includedTools!: Array<string>;
  readonly resetToolset!: () => void;
  //readonly hasObjects!: boolean;
  readonly hasObjects!: () => boolean;
  readonly clearUnsavedFlag!: () => void;

  userRole!: string | undefined;

  readonly $appAuth!: FirebaseAuth;
  readonly $appDB!: FirebaseFirestore;
  readonly $appStorage!: FirebaseStorage;

  clientBrowser: any;
  description = "";
  publicConstruction = false;
  $refs!: {
    logoutDialog: VueComponent & DialogAction;
    saveConstructionDialog: VueComponent & DialogAction;
    shareConstructionDialog: VueComponent & DialogAction;
    exportConstructionDialog: VueComponent & DialogAction;
    shareLinkReference: VueComponent & HTMLElement;
  };
  footerColor = "accent";
  authSubscription!: Unsubscribe;
  whoami = "";
  uid = "";
  profilePicUrl: string | null = null;
  svgRoot!: SVGElement;
  showExport = false;
  selectedFormat = "";
  slider = 600;
  sliderMin = 200;
  sliderMax = 1200;
  shareLink = "--Placeholder for share link--";
  disableButton = false;
  lastText = "";
  count = 0;

  /* User account feature is initialy disabled. To unlock this feature
     The user must press Ctrl+Alt+S then Ctrl+Alt+E in that order */
  acceptedKeys = 0;
  accountEnabled = false;

  // target formats for export window
  //formats = ["SVG", "PNG", "GIF"];
  formats = ["SVG", "PNG"];

  // Text of the transformation being applied - only displayed when the tool is applyTransformation
  applyTransformationText = i18n.t(`objects.selectTransformation`);

  get baseURL(): string {
    return process.env.BASE_URL ?? "";
  }

  readonly keyHandler = (ev: KeyboardEvent): void => {
    if (ev.repeat) return; // Ignore repeated events on the same key
    if (!ev.altKey) return;
    if (!ev.ctrlKey) return;

    if (ev.code === "KeyS" && this.acceptedKeys === 0) {
      console.info("'S' is accepted");
      this.acceptedKeys = 1;
    } else if (ev.code === "KeyE" && this.acceptedKeys === 1) {
      this.acceptedKeys = 2;
      // Directly setting the accountEnable flag here does not trigger
      // a UI update even after calling $forceUpdate()
      // Firing an event seems to solve the problem
      EventBus.fire("secret-key-detected", {});
    } else {
      this.acceptedKeys = 0;
    }
  };

  created(): void {
    window.addEventListener("keydown", this.keyHandler);
    EventBus.listen("secret-key-detected", () => {
      console.log("Got the secret key");
      this.accountEnabled = true;
      this.acceptedKeys = 0;
      this.$forceUpdate();
    });
    EventBus.listen("share-construction-requested", this.doShare);
    this.clientBrowser = detect();
    this.resetToolset();
    //ACStore.resetToolset();
    EventBus.listen(
      "set-apply-transformation-footer-text",
      this.additionalFooterText
    );
  }

  mounted(): void {
    console.log("Base URL is ", process.env.BASE_URL);
    // SEStore.init();
    EventBus.listen("set-footer-color", this.setFooterColor);
    this.authSubscription = this.$appAuth.onAuthStateChanged(
      (u: User | null) => {
        if (u !== null) {
          this.showExport = true;
          this.whoami = u.email ?? "unknown email";
          this.uid = u.uid;
          this.$appDB
            .collection("users")
            .doc(this.uid)
            .get()
            .then((ds: DocumentSnapshot) => {
              if (ds.exists) {
                this.accountEnabled = true;
                console.debug("User data", ds.data());
                const { profilePictureURL, role } = ds.data() as any;
                if (profilePictureURL) {
                  this.profilePicUrl = profilePictureURL;
                }
                if (role) {
                  this.userRole = role.toLowerCase();
                }
              }
            });
        } else {
          this.whoami = "";
          this.profilePicUrl = "";
        }
      }
    );
    // Get the top-level SVG element
    this.svgRoot = this.svgCanvas?.querySelector("svg") as SVGElement;
  }

  beforeDestroy(): void {
    if (this.authSubscription) this.authSubscription();
    this.whoami = "";
    this.uid = "";
    window.removeEventListener("keydown", this.keyHandler);
    EventBus.unlisten("secret-key-detected");
    EventBus.unlisten("set-apply-transformation-footer-text");
  }
  setFooterColor(e: { color: string }): void {
    this.footerColor = e.color;
  }

  async doLogout(): Promise<void> {
    await this.$appAuth.signOut();
    this.$refs.logoutDialog.hide();
    this.userRole = undefined;
    this.uid = "";
    this.whoami = "";
  }

  additionalFooterText(e: { text: string }): void {
    //console.debug("apply transform", e.text);
    this.applyTransformationText = e.text;
  }

  doLoginOrCheck(): void {
    if (this.$appAuth.currentUser !== null) {
      this.$refs.logoutDialog.show();
    } else {
      this.$router.replace({ path: "/account" });
    }
  }

  async doExportConstructionDialog(): Promise<void> {
    this.$refs.shareConstructionDialog.hide();
    this.$refs.exportConstructionDialog.show();

    // copy sphere construction svg and get URL, then set the preview img src as that URL
    const svgElement = this.svgRoot.cloneNode(true) as SVGElement;
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

    await Vue.nextTick();

    var preview = document.getElementById("preview") as HTMLImageElement;
    preview.src = svgURL;
  }

  async doExportButton(): Promise<void> {
    this.$refs.exportConstructionDialog.hide();
    //Clone the SVG
    const svgElement = this.svgRoot.cloneNode(true) as SVGElement;
    //get the current width of canvas
    const canvasReference = document.querySelector("#canvas") as HTMLDivElement;
    const currentWidth = canvasReference.clientWidth;

    //required line of code for svg elements
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Set dimensions of exported image based on slider values
    svgElement.setAttribute("height", this.slider + "");
    svgElement.setAttribute("width", this.slider + "");

    svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svgElement.setAttribute("transform", "matrix(1 0 0 -1 0 0)");
    svgElement.setAttribute(
      "viewBox",
      "0 0 " + currentWidth + " " + currentWidth
    );
    svgElement.setAttribute("vector-effect", "non-scaling-stroke");
    // export construction to desired file format
    if (this.selectedFormat == "SVG") {
      //create blob and url, then call filesaver
      const svgBlob = new Blob([svgElement.outerHTML], {
        type: "image/svg+xml;charset=utf-8"
      });
      const svgURL = URL.createObjectURL(svgBlob);
      FileSaver.saveAs(svgURL, "construction.svg");

      console.log("SVG exported");
    } else if (this.selectedFormat == "PNG") {
      //set the ID of the clone and append it to body
      svgElement.id = "clonedSVG";
      document.body.append(svgElement);

      //to make this appear right side up remove the transform
      svgElement.removeAttribute("transform");

      //export using module
      var png = await d3ToPng("#clonedSVG", "PNGname");

      //clean up workspace and finish
      svgElement.remove();
      console.log("PNG exported");
    } else if (this.selectedFormat == "GIF") {
      // create GIF to add frames to
      var gif = new GIF({
        workers: 2,
        quality: 10,
        width: this.slider,
        height: this.slider
      });

      //Clone the SVG
      const clone = this.svgRoot.cloneNode(true) as SVGElement;
      //required line of code for svg elements
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      //set the ID of the clone and append it to body
      clone.id = "clonedSVG";
      document.body.append(clone);

      // Set dimensions of exported image based on slider values
      clone.setAttribute("height", this.slider + "px");
      clone.setAttribute("width", this.slider + "px");

      //get the current width of canvas
      const canvasReference = document.querySelector(
        "#canvas"
      ) as HTMLDivElement;
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
      var png3 = await d3ToPng("#clonedSVG", "1", {
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

  exportDimensionsCheck(txt: string | undefined): boolean {
    //checking if first action is format selection
    if (this.count > 2 && (txt == "SVG" || txt == "PNG" || txt == "GIF")) {
      txt = this.lastText;
    } else {
      this.lastText = txt + "";
    }
    this.count++;

    //Input validation
    if (
      !txt ||
      parseInt(txt) < 200 ||
      parseInt(txt) > 1200 ||
      this.selectedFormat == ""
    ) {
      this.disableButton = true;
      return false;
    } else {
      this.disableButton = false;
      return true;
    }
  }

  async doShare(): Promise<void> {
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

    const rotationMat = this.inverseTotalRotationMatrix;
    const collectionPath = this.publicConstruction
      ? "constructions"
      : `users/${this.uid}/constructions`;

    // Make a duplicate of the SVG tree
    const svgElement = this.svgRoot.cloneNode(true) as SVGElement;
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
    this.$appDB // Task #1
      .collection(collectionPath)
      .add({
        version: "1",
        dateCreated: new Date().toISOString(),
        author: this.whoami,
        description: this.description,
        rotationMatrix: JSON.stringify(rotationMat.elements),
        tools: this.includedTools,
        script: "" // Use an empty string (for type checking only)
      } as ConstructionInFirestore)
      .then((constructionDoc: DocumentReference) => {
        /* Task #2 */
        const scriptPromise: Promise<string> =
          scriptOut.length < FIELD_SIZE_LIMIT
            ? Promise.resolve(scriptOut)
            : this.$appStorage
                .ref(`scripts/${constructionDoc.id}`)
                .putString(scriptOut)
                .then((t: UploadTaskSnapshot) => t.ref.getDownloadURL());

        /* Task #3 */
        const svgPromise: Promise<string> =
          svgPreviewData.length < FIELD_SIZE_LIMIT
            ? Promise.resolve(svgPreviewData)
            : this.$appStorage
                .ref(`construction-svg/${constructionDoc.id}`)
                .putString(svgPreviewData)
                .then((t: UploadTaskSnapshot) => t.ref.getDownloadURL());

        /* Wrap the result from the three tasks as a new Promise */
        return Promise.all([constructionDoc.id, scriptPromise, svgPromise]);
      })
      .then(([docId, scriptData, svgData]) => {
        this.$appDB
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
        this.clearUnsavedFlag();
      })
      .catch((err: Error) => {
        console.error("Can't save document", err.message);
        EventBus.fire("show-alert", {
          key: "constructions.firestoreSaveError",
          // keyOptions: { docId: constructionDoc.id },
          type: "error"
        });
      });

    this.$refs.saveConstructionDialog.hide();
  }

  copyShareLink(): void {
    this.$refs.shareLinkReference.focus();
    document.execCommand("copy");
  }
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