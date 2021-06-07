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
            <a href="/docs">
              <v-icon class="ml-2"
                v-on="on">mdi-help-circle</v-icon>
            </a>
          </template>
          <span>Open Doc</span>
        </v-tooltip>
      </div>

      <v-spacer></v-spacer>

      <!-- This will open up the global settings view setting the language, decimals 
      display and other global options-->
      <span>{{whoami}} {{uid.substring(0,8)}}</span>

      <v-icon class="mx-2"
        @click="doLoginOrCheck">mdi-account</v-icon>
      <v-icon v-if="whoami !== ''"
        :disabled="!hasObjects"
        class="mr-2"
        @click="$refs.saveConstructionDialog.show()">mdi-share</v-icon>
      <router-link to="/settings">
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
import { State } from "vuex-class";
import MessageBox from "@/components/MessageBox.vue";
import ConstructionLoader from "@/components/ConstructionLoader.vue";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { AppState } from "./types";
import EventBus from "@/eventHandlers/EventBus";
import { Error, FirebaseAuth, User } from "@firebase/auth-types";
import {
  FirebaseFirestore,
  DocumentReference
} from "@firebase/firestore-types";
import { Command } from "./commands/Command";
/* This allows for the State of the app to be initialized with in vuex store */
@Component({ components: { MessageBox, Dialog, ConstructionLoader } })
export default class App extends Vue {
  @State((s: AppState) => s.activeToolName)
  activeToolName!: string;

  readonly $appAuth!: FirebaseAuth;
  readonly $appDB!: FirebaseFirestore;
  description = "";
  publicConstruction = false;
  $refs!: {
    logoutDialog: VueComponent & DialogAction;
    saveConstructionDialog: VueComponent & DialogAction;
  };
  footerColor = "accent";
  authSubscription: any;
  whoami = "";
  uid = "";
  svgRoot!: SVGElement;

  get hasObjects(): boolean {
    // Any objects must include at least one pointd
    return this.$store.direct.getters.allSEPoints().length > 0;
  }

  // get firebaseUid(): string | undefined {d
  //   return this.$appAuth.currentUser?.udddid;
  // }
  mounted(): void {
    this.$store.direct.commit.init();
    EventBus.listen("set-footer-color", this.setFooterColor);
    this.authSubscription = this.$appAuth.onAuthStateChanged(
      (u: User | null) => {
        if (u !== null) {
          this.whoami = u.email ?? "unknown email";
          this.uid = u.uid;
        } else this.whoami = "";
      }
    );
    // Get the top-level SVG element
    this.svgRoot = this.$store.direct.state.svgCanvas?.querySelector(
      "svg"
    ) as SVGElement;
  }

  beforeDestroy(): void {
    if (this.authSubscription) this.authSubscription();
    this.whoami = "";
    this.uid = "";
  }
  setFooterColor(e: unknown): void {
    this.footerColor = (e as any).color;
  }

  doLogout(): void {
    this.$appAuth.signOut();
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

    const rotationMat = this.$store.direct.state.inverseTotalRotationMatrix;
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
        dateCreated: new Date().toISOString(),
        author: this.whoami,
        description: this.description,
        rotationMatrix: JSON.stringify(rotationMat.elements),
        preview: svgPreviewData
      })
      .then((doc: DocumentReference) => {
        // console.log("Inserted", doc.id);
        EventBus.fire("show-alert", {
          key: "objectTree.firestoreConstructionSaved",
          keyOptions: { docId: doc.id },
          type: "info"
        });
        this.$store.direct.commit.clearUnsavedFlag();
      })
      .catch((err: Error) => {
        console.log("Can't save document", err);
        EventBus.fire("show-alert", {
          key: "objectTree.firestoreSaveError",
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
</style>