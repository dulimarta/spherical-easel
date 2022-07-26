<template>
  <div>
    <div class="text-h6"
      v-if="firebaseUid.length > 0">
      {{$t(`constructions.privateConstructions`)}}</div>
    <!--- WARNING: the "id" attribs below are needed for testing -->
    <ConstructionList id="privateList"
      :items="privateConstructions"
      v-on:load-requested="shouldLoadConstruction"
      v-on:delete-requested="shouldDeleteConstruction" />
    <div class="text-h6">{{$t(`constructions.publicConstructions`)}}</div>
    <ConstructionList id="publicList"
      :items="publicConstructions"
      :allow-sharing="true"
      v-on:load-requested="shouldLoadConstruction"
      v-on:share-requested="doShareConstruction"
      v-on:delete-requested="shouldDeleteConstruction" />

    <Dialog ref="constructionShareDialog"
      id="_test_constructionShareDialog"
      class="dialog"
      title="Share Construction"
      :yes-text="`Copy URL`"
      :yes-action="doCopyURL"
      max-width="50%">
      <p>Share this URL</p>
      <textarea :cols="shareURL.length"
        id="shareTextArea"
        rows="1"
        readonly
        ref="docURL"
        v-html="shareURL" />

    </Dialog>
    <Dialog ref="constructionLoadDialog"
      class="dialog"
      title="Confirmation Required"
      yes-text="Proceed"
      :yesAction="doLoadConstruction"
      no-text="Cancel"
      max-width="50%">
      {{ $t(`constructions.unsavedObjectsMsg`)}}
    </Dialog>
    <Dialog ref="constructionDeleteDialog"
      title="Delete Construction"
      max-width="50%"
      yes-text="Remove"
      :yes-action="() => doDeleteConstruction()"
      no-text="Keep">
      <p>You are about to remove constuction {{selectedDocId}}</p>.
      <p>Do you want to keep or remove it?</p>
    </Dialog>
  </div>
</template>

<style scoped>
#shareTextArea {
  font-family: "Courier New", Courier, monospace;
}
</style>

<script lang="ts">
import VueComponent from "vue";
import { Component, Vue } from "vue-property-decorator";
import {
  FirebaseFirestore,
  QuerySnapshot,
  QueryDocumentSnapshot
} from "@firebase/firestore-types";
import { FirebaseStorage } from "@firebase/storage-types";
import { run } from "@/commands/CommandInterpreter";
import {
  ConstructionScript,
  SphericalConstruction,
  ConstructionInFirestore,
  ActionMode
} from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import { SENodule } from "@/models/SENodule";
import { FirebaseAuth } from "@firebase/auth-types";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import ConstructionList from "@/components/ConstructionList.vue";
import { Matrix4 } from "three";
import { useAccountStore } from "@/stores/account";
import axios, { AxiosResponse } from "axios";
import { mapActions, mapState } from "pinia";
import { useSEStore } from "@/stores/se";

@Component({
  components: { Dialog, ConstructionList },
  computed: {
    ...mapState(useAccountStore, ["includedTools"]),
    ...mapState(useSEStore, ["hasUnsavedNodules"])
  },
  methods: {
    ...mapActions(useAccountStore, ["resetToolset", "includeToolName"]),
    ...mapActions(useSEStore, [
      "removeAllFromLayers",
      "init",
      "rotateSphere",
      "clearUnsavedFlag",
      "updateDisplay",
      "setActionMode"
    ])
  }
})
export default class ConstructionLoader extends Vue {
  readonly $appDB!: FirebaseFirestore;
  readonly $appAuth!: FirebaseAuth;
  readonly $appStorage!: FirebaseStorage;

  readonly hasUnsavedNodules!: boolean;
  readonly includedTools!: Array<ActionMode>;
  readonly includeToolName!: (t: string) => void;
  readonly resetToolset!: (b: boolean) => void;
  readonly removeAllFromLayers!: () => void;
  readonly init!: () => void;
  readonly rotateSphere!: (_: Matrix4) => void;
  readonly clearUnsavedFlag!: () => void;
  readonly updateDisplay!: () => void;
  readonly setActionMode!: (_: { id: ActionMode; name: string }) => void;

  snapshotUnsubscribe: (() => void) | null = null;
  publicConstructions: Array<SphericalConstruction> = [];
  privateConstructions: Array<SphericalConstruction> = [];
  shareURL = "";
  selectedDocId = "";

  $refs!: {
    constructionShareDialog: VueComponent & DialogAction;
    constructionLoadDialog: VueComponent & DialogAction;
    constructionDeleteDialog: VueComponent & DialogAction;
    docURL: HTMLSpanElement;
  };

  get firebaseUid(): string {
    return this.$appAuth.currentUser?.uid ?? "";
  }

  mounted(): void {
    if (this.firebaseUid) {
      this.snapshotUnsubscribe = this.$appDB
        .collection("users")
        .doc(this.firebaseUid)
        .collection("constructions")
        .onSnapshot((qs: QuerySnapshot) => {
          this.populateData(qs, this.privateConstructions);
        });
    }
    this.$appDB.collection("constructions").onSnapshot((qs: QuerySnapshot) => {
      this.populateData(qs, this.publicConstructions);
    });
  }

  beforeDestroy(): void {
    // Unregister the update function
    if (this.snapshotUnsubscribe) this.snapshotUnsubscribe();
  }

  populateData(
    qs: QuerySnapshot,
    targetArr: Array<SphericalConstruction>
  ): void {
    targetArr.splice(0);
    qs.forEach(async (qd: QueryDocumentSnapshot) => {
      const doc = qd.data() as ConstructionInFirestore;
      let parsedScript: ConstructionScript | undefined = undefined;

      // Ignore constructions with empty script
      if (doc.script.trim().length === 0) return;
      const trimmedScript = doc.script.trim();
      if (trimmedScript.startsWith("https:")) {
        // Fetch the script from Firebase Storage
        const scriptText = await this.$appStorage
          .refFromURL(doc.script)
          .getDownloadURL()
          .then((url: string) => axios.get(url))
          .then((r: AxiosResponse) => r.data);

        parsedScript = scriptText as ConstructionScript;
      } else {
        // Parse the script directly from the Firestore document
        parsedScript = JSON.parse(trimmedScript) as ConstructionScript;
      }

      if (parsedScript && parsedScript.length > 0) {
        // we care only for non-empty script
        let svgData: string | undefined;
        if (doc.preview?.startsWith("https:")) {
          svgData = await this.$appStorage
            .refFromURL(doc.preview)
            .getDownloadURL()
            .then((url: string) => axios.get(url))
            .then((r: AxiosResponse) => r.data);
        } else svgData = doc.preview;
        const objectCount = parsedScript
          // A simple command contributes 1 object
          // A CommandGroup contributes N objects (as many elements in its subcommands)
          .map((z: string | Array<string>) =>
            typeof z === "string" ? 1 : z.length
          )
          .reduce((prev: number, curr: number) => prev + curr);
        let sphereRotationMatrix = new Matrix4();
        if (doc.rotationMatrix) {
          const matrixData = JSON.parse(doc.rotationMatrix);
          sphereRotationMatrix.fromArray(matrixData);
        }
        targetArr.push({
          id: qd.id,
          script: doc.script,
          parsedScript,
          objectCount,
          author: doc.author,
          dateCreated: doc.dateCreated,
          description: doc.description,
          sphereRotationMatrix,
          previewData: svgData ?? "",
          tools: doc.tools ?? undefined
        });
      }
    });
    // Sort by creation date
    targetArr.sort((a: SphericalConstruction, b: SphericalConstruction) =>
      a.dateCreated.localeCompare(b.dateCreated)
    );
  }

  shouldLoadConstruction(event: { docId: string }): void {
    this.selectedDocId = event.docId;
    if (this.hasUnsavedNodules) this.$refs.constructionLoadDialog.show();
    else {
      this.doLoadConstruction();
    }
  }

  doLoadConstruction(/*event: { docId: string }*/): void {
    this.$refs.constructionLoadDialog.hide();
    let script: ConstructionScript | null = null;
    let rotationMatrix: Matrix4;
    // Search in public list
    let pos = this.publicConstructions.findIndex(
      (c: SphericalConstruction) => c.id === this.selectedDocId
    );
    let toolSet: ActionMode[] | undefined = undefined;
    if (pos >= 0) {
      script = this.publicConstructions[pos].parsedScript;
      rotationMatrix = this.publicConstructions[pos].sphereRotationMatrix;
      if (this.publicConstructions[pos].tools)
        toolSet = this.publicConstructions[pos].tools;
    } else {
      // Search in private list
      pos = this.privateConstructions.findIndex(
        (c: SphericalConstruction) => c.id === this.selectedDocId
      );
      script = this.privateConstructions[pos].parsedScript;
      rotationMatrix = this.privateConstructions[pos].sphereRotationMatrix;
      if (this.privateConstructions[pos].tools)
        toolSet = this.privateConstructions[pos].tools;
    }
    if (toolSet === undefined) {
      console.debug("Include all tools");
      this.resetToolset(true);
      /* include all tools */
    } else {
      console.debug("Exclude all tools");
      this.resetToolset(false /* exclude all */);
      toolSet.forEach((toolAction: ActionMode) => {
        this.includeToolName(toolAction);
      });
    }

    this.removeAllFromLayers();
    this.init();
    SENodule.resetAllCounters();
    // Nodule.resetIdPlottableDescriptionMap(); // Needed?
    EventBus.fire("show-alert", {
      key: "constructions.firestoreConstructionLoaded",
      keyOptions: { docId: this.selectedDocId },
      type: "info"
    });
    // It looks like we have to apply the rotation matrix
    // before running the script
    this.rotateSphere(rotationMatrix);
    run(script);
    this.clearUnsavedFlag();
    EventBus.fire("construction-loaded", {});
    // update all
    this.updateDisplay();

    // set the mode to move because chances are high that the user wants this mode after loading.
    this.setActionMode({
      id: "move",
      name: "MoveDisplayedName"
    });
  }

  doShareConstruction(event: { docId: string }): void {
    this.shareURL = `${location.host}/construction/${event.docId}`;
    this.$refs.constructionShareDialog.show();
  }

  doCopyURL(): void {
    (this.$refs.docURL as HTMLTextAreaElement).select();
    document.execCommand("copy");
    this.$refs.constructionShareDialog.hide();
  }

  shouldDeleteConstruction(event: { docId: string }): void {
    this.selectedDocId = event.docId;
    this.$refs.constructionDeleteDialog.show();
  }

  doDeleteConstruction(): void {
    this.$refs.constructionDeleteDialog.hide();
    const task1 = this.$appDB
      .collection("constructions")
      .doc(this.selectedDocId)
      .delete();
    const task2 = this.$appDB
      .collection(`users/${this.firebaseUid}/constructions`)
      .doc(this.selectedDocId)
      .delete();
    Promise.any([task1, task2])
      .then(() => {
        EventBus.fire("show-alert", {
          key: "constructions.firestoreConstructionDeleted",
          keyOptions: { docId: this.selectedDocId },
          type: "info"
        });
      })
      .catch((err: any) => {
        console.debug("Unable to delete", this.selectedDocId, err);
      });
  }
}
</script>
