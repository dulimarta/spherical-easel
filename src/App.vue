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
      <!-- This is where the file and export (to EPS, TIKZ, animated GIF?) operations will go -->
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
            <router-link to="/docs/">
              <v-icon class="ml-2"
                v-on="on">mdi-help-circle</v-icon>
            </router-link>
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
        <v-icon v-if="whoami !== ''"
          :disabled="!hasObjects"
          class="mr-2"
          @click="$refs.saveConstructionDialog.show()">mdi-share</v-icon>
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
      <router-view>
        <!-- this is the spot where the views controlled by Vue Router will be rendred v-html="$t('buttons.' + button.displayedName )"-->
      </router-view>
      <MessageBox></MessageBox>
    </v-main>
    <v-footer app
      :color="footerColor"
      padless>
      <v-col class="text-center">
        <span
          v-if="activeToolName==='PanZoomInDisplayedName' || activeToolName==='PanZoomOutDisplayedName'"
          class="footer-text"
          v-html="$t('buttons.CurrentTool')+ ': ' + $t('buttons.' + activeToolName).split('<br>').join('/').trim()">
        </span>
        <span v-else-if="activeToolName!== ''"
          class="footer-text"
          v-html="$t('buttons.CurrentTool')+ ': '  + $t('buttons.' + activeToolName).split('<br>').join(' ').trim()">
        </span>
        <span v-else
          class="footer-text">{{ $t(`buttons.NoToolSelected`) }}</span>
      </v-col>
    </v-footer>
    <Dialog ref="logoutDialog"
      title="Confirm Logout"
      yes-text="Proceed"
      :yes-action="() => doLogout()"
      no-text="Cancel"
      max-width="40%">
      <p>You are about to logout, any unsaved constructions will be
        discarded.</p>
      <p><em>Proceed</em> or <em>cancel?</em></p>
    </Dialog>
    <Dialog ref="saveConstructionDialog"
      title="Save Construction"
      yes-text="Save"
      no-text="Cancel"
      :yes-action="() => doShare()"
      max-width="40%">
      <p>Please provide a short description for your construction
      </p>

      <v-text-field type="text"
        dense
        clearable
        counter
        persistent-hint
        label="Description"
        required
        v-model="description"></v-text-field>
      <v-switch v-model="publicConstruction"
        :disabled="uid.length === 0"
        label="Available to public"></v-switch>
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
import { namespace } from "vuex-class";
import MessageBox from "@/components/MessageBox.vue";
// import ConstructionLoader from "@/components/ConstructionLoader.vue";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { AppState } from "./types";
import EventBus from "@/eventHandlers/EventBus";
import { Error, FirebaseAuth, User } from "@firebase/auth-types";
import {
  FirebaseFirestore,
  DocumentReference,
  DocumentSnapshot
} from "@firebase/firestore-types";
import { Unsubscribe } from "@firebase/util";
import { Command } from "./commands/Command";
import { Matrix4 } from "three";
import { SEStore } from "./store";
import { detect } from "detect-browser";

//#region vuex-module-namespace
const SE = namespace("se");
//#endregion vuex-module-namespace

// Register vue router in-component navigation guard functions
Component.registerHooks([
  "beforeRouteEnter",
  "beforeRouteLeave",
  "beforeRouteUpdate"
]);
/* This allows for the State of the app to be initialized with in vuex store */
@Component({ components: { MessageBox, Dialog } })
export default class App extends Vue {
  //#region activeToolName
  @SE.State((s: AppState) => s.activeToolName)
  readonly activeToolName!: string;
  //#endregion activeToolName

  @SE.State((s: AppState) => s.svgCanvas)
  readonly svgCanvas!: HTMLDivElement | null;

  @SE.State((s: AppState) => s.inverseTotalRotationMatrix)
  readonly inverseTotalRotationMatrix!: Matrix4;

  // @SE.State((s: AppState) => s.sePoints)
  // readonly sePoints!: SEPoint[];

  // @SE.Mutation init!: () => void;
  // @SE.Mutation clearUnsavedFlag!: () => void;

  readonly $appAuth!: FirebaseAuth;
  readonly $appDB!: FirebaseFirestore;

  clientBrowser: any;
  description = "";
  publicConstruction = false;
  $refs!: {
    logoutDialog: VueComponent & DialogAction;
    saveConstructionDialog: VueComponent & DialogAction;
  };
  footerColor = "accent";
  authSubscription!: Unsubscribe;
  whoami = "";
  uid = "";
  profilePicUrl: string | null = null;
  svgRoot!: SVGElement;

  /* User account feature is initialy disabled. To unlock this feature
     The user must press Ctrl+Alt+S then Ctrl+Alt+E in that order */
  acceptedKeys = 0;
  accountEnabled = false;

  get baseURL(): string {
    return process.env.BASE_URL ?? "";
  }

  get hasObjects(): boolean {
    // Any objects must include at least one point
    return SEStore.sePoints.length > 0;
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
  }

  mounted(): void {
    console.log("Base URL is ", process.env.BASE_URL);
    SEStore.init();
    EventBus.listen("set-footer-color", this.setFooterColor);
    this.authSubscription = this.$appAuth.onAuthStateChanged(
      (u: User | null) => {
        if (u !== null) {
          this.whoami = u.email ?? "unknown email";
          this.uid = u.uid;
          this.$appDB
            .collection("users")
            .doc(this.uid)
            .get()
            .then((ds: DocumentSnapshot) => {
              if (ds.exists) {
                const { profilePictureURL } = ds.data() as any;
                if (profilePictureURL) {
                  this.profilePicUrl = profilePictureURL;
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
  }
  setFooterColor(e: { color: string }): void {
    this.footerColor = e.color;
  }

  async doLogout(): Promise<void> {
    await this.$appAuth.signOut();
    this.$refs.logoutDialog.hide();
    this.uid = "";
    this.whoami = "";
  }

  doLoginOrCheck(): void {
    if (this.$appAuth.currentUser !== null) {
      this.$refs.logoutDialog.show();
    } else {
      this.$router.replace({ path: "/account" });
    }
  }

  async doShare(): Promise<void> {
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
    const out = Command.dumpOpcode();

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

    // const svgURL = URL.createObjectURL(svgBlob);
    // FileSaver.saveAs(svgURL, "hans.svg");
    this.$appDB
      .collection(collectionPath)
      .add({
        script: out,
        version: "1",
        dateCreated: new Date().toISOString(),
        author: this.whoami,
        description: this.description,
        rotationMatrix: JSON.stringify(rotationMat.elements),
        preview: svgPreviewData
      })
      .then((doc: DocumentReference) => {
        EventBus.fire("show-alert", {
          key: "constructions.firestoreConstructionSaved",
          keyOptions: { docId: doc.id },
          type: "info"
        });
        SEStore.clearUnsavedFlag();
      })
      .catch((err: Error) => {
        console.error("Can't save document", err);
        EventBus.fire("show-alert", {
          key: "constructions.firestoreSaveError",
          keyOptions: {},
          type: "error"
        });
      });
    this.$refs.saveConstructionDialog.hide();
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
</style>