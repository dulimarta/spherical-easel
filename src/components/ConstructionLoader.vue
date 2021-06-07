<template>
  <div>
    <div class="text-h6"
      v-if="firebaseUid.length > 0">Private Constructions</div>
    <ConstructionList :items="privateConstructions"
      v-on:load-requested="shouldLoadConstruction" />
    <div class="text-h6">Public Constructions</div>
    <ConstructionList :items="publicConstructions"
      :allow-sharing="true"
      v-on:load-requested="shouldLoadConstruction"
      v-on:share-requested="doShareConstruction"
      v-on:delete-requested="doDeleteConstruction" />

    <Dialog ref="constructionShareDialog"
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
      title="Confirmation Required"
      yes-text="Proceed"
      :yesAction="doLoadConstruction"
      no-text="Cancel"
      max-width="50%">
      You have unsaved objects. Loading a new construction will remove
      all the current ones. Do you want to proceed or cancel?
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
import { run } from "@/commands/CommandInterpreter";
import {
  ConstructionScript,
  SphericalConstruction,
  ConstructionInFirestore
} from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import { SENodule } from "@/models/SENodule";
import Nodule from "@/plottables/Nodule";
import { FirebaseAuth } from "@firebase/auth-types";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import ConstructionList from "@/components/ConstructionList.vue";
import { Matrix4 } from "three";

@Component({ components: { Dialog, ConstructionList } })
export default class ConstructionLoader extends Vue {
  readonly $appDB!: FirebaseFirestore;
  readonly $appAuth!: FirebaseAuth;
  publicConstructions: Array<SphericalConstruction> = [];
  privateConstructions: Array<SphericalConstruction> = [];
  shareURL = "";
  selectedDocId = "";

  $refs!: {
    constructionShareDialog: VueComponent & DialogAction;
    constructionLoadDialog: VueComponent & DialogAction;
    docURL: HTMLSpanElement;
  };

  get firebaseUid(): string {
    return this.$appAuth.currentUser?.uid ?? "";
  }

  mounted(): void {
    if (this.firebaseUid) {
      this.$appDB
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

  populateData(
    qs: QuerySnapshot,
    targetArr: Array<SphericalConstruction>
  ): void {
    targetArr.splice(0);
    qs.forEach((qd: QueryDocumentSnapshot) => {
      const doc = qd.data() as ConstructionInFirestore;
      const parsedScript = JSON.parse(doc.script) as ConstructionScript;

      if (parsedScript.length > 0) {
        // we care only for non-empty script
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
          previewData: doc.preview ?? ""
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
    if (this.$store.direct.state.hasUnsavedNodules)
      this.$refs.constructionLoadDialog.show();
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
    if (pos >= 0) {
      script = this.publicConstructions[pos].parsedScript;
      rotationMatrix = this.publicConstructions[pos].sphereRotationMatrix;
    } else {
      // Search in private list
      pos = this.privateConstructions.findIndex(
        (c: SphericalConstruction) => c.id === this.selectedDocId
      );
      script = this.privateConstructions[pos].parsedScript;
      rotationMatrix = this.privateConstructions[pos].sphereRotationMatrix;
    }

    this.$store.direct.commit.removeAllFromLayers();
    this.$store.direct.commit.init();
    SENodule.resetAllCounters();
    Nodule.resetAllCounters();
    EventBus.fire("show-alert", {
      key: "objectTree.firestoreConstructionLoaded",
      keyOptions: { docId: this.selectedDocId },
      type: "info"
    });
    // It looks like we have to apply the rotation matrix
    // before running the script
    this.$store.direct.commit.rotateSphere(rotationMatrix);
    run(script);
    this.$store.direct.commit.clearUnsavedFlag();
    EventBus.fire("construction-loaded", {});
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

  doDeleteConstruction(event: { docId: string }): void {
    console.log("About to delete", event.docId);
    this.$appDB
      .collection("constructions")
      .doc(event.docId)
      .delete()
      .then(() => {
        EventBus.fire("show-alert", {
          key: "objectTree.firestoreConstructionDeleted",
          keyOptions: { docId: event.docId },
          type: "info"
        });
      });
  }
}
</script>
