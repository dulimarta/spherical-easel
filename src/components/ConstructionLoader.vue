<template>
  <div>
    <div class="text-h6" v-if="firebaseUid.length > 0">
      {{ $t(`constructions.privateConstructions`) }}
    </div>
    <!--- WARNING: the "id" attribs below are needed for testing -->
    <ConstructionList
      id="privateList"
      :items="privateConstructions"
      v-on:load-requested="shouldLoadConstruction"
      v-on:delete-requested="shouldDeleteConstruction" />
    <div class="text-h6">{{ $t(`constructions.publicConstructions`) }}</div>
    <ConstructionList
      id="publicList"
      :items="publicConstructions"
      :allow-sharing="true"
      v-on:load-requested="shouldLoadConstruction"
      v-on:share-requested="doShareConstruction"
      v-on:delete-requested="shouldDeleteConstruction" />

    <Dialog
      ref="constructionShareDialog"
      id="_test_constructionShareDialog"
      class="dialog"
      title="Share Construction"
      :yes-text="`Copy URL`"
      :yes-action="doCopyURL"
      max-width="50%">
      <p>Share this URL</p>
      <textarea
        :cols="shareURL.length"
        id="shareTextArea"
        rows="1"
        readonly
        ref="docURL"
        v-html="shareURL" />
    </Dialog>
    <Dialog
      ref="constructionLoadDialog"
      class="dialog"
      title="Confirmation Required"
      yes-text="Proceed"
      :yesAction="doLoadConstruction"
      no-text="Cancel"
      max-width="50%">
      {{ $t(`constructions.unsavedObjectsMsg`) }}
    </Dialog>
    <Dialog
      ref="constructionDeleteDialog"
      title="Delete Construction"
      max-width="50%"
      yes-text="Remove"
      :yes-action="() => doDeleteConstruction()"
      no-text="Keep">
      <p>You are about to remove constuction {{ selectedDocId }}</p>
      .
      <p>Do you want to keep or remove it?</p>
    </Dialog>
  </div>
</template>

<style scoped>
#shareTextArea {
  font-family: "Courier New", Courier, monospace;
}
</style>

<script lang="ts" setup>
import VueComponent, {
  computed,
  Ref,
  ref,
  onMounted,
  onBeforeUnmount
} from "vue";
import {
  QuerySnapshot,
  QueryDocumentSnapshot
} from "@firebase/firestore-types";
import { run } from "@/commands/CommandInterpreter";
import {
  ConstructionScript,
  SphericalConstruction,
  ConstructionInFirestore,
  ActionMode
} from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import { SENodule } from "@/models/SENodule";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import ConstructionList from "@/components/ConstructionList.vue";
import { Matrix4 } from "three";
import { useAccountStore } from "@/stores/account";
import axios, { AxiosResponse } from "axios";
import { useSEStore } from "@/stores/se";
import { appAuth, appDB, appStorage } from "@/firebase-config";
import { storeToRefs } from "pinia";

const acctStore = useAccountStore();
const seStore = useSEStore();
const { hasUnsavedNodules } = storeToRefs(seStore);

let snapshotUnsubscribe: (() => void) | null = null;
const publicConstructions: Ref<Array<SphericalConstruction>> = ref([])
const privateConstructions: Ref<Array<SphericalConstruction>> = ref([])
const shareURL = ref("");
const selectedDocId = ref("");

// $refs!: {
const constructionShareDialog: Ref<DialogAction | null> = ref(null);
const constructionLoadDialog: Ref<DialogAction | null> = ref(null);
const constructionDeleteDialog: Ref<DialogAction | null> = ref(null);
const docURL: Ref<HTMLSpanElement | null> = ref(null);
// };

const firebaseUid = computed((): string => {
  return appAuth.currentUser?.uid ?? "";
});

onMounted((): void => {
  if (firebaseUid) {
    snapshotUnsubscribe = appDB
      .collection("users")
      .doc(firebaseUid.value)
      .collection("constructions")
      .onSnapshot((qs: QuerySnapshot) => {
        populateData(qs, privateConstructions.value);
      });
  }
  appDB.collection("constructions").onSnapshot((qs: QuerySnapshot) => {
    populateData(qs, publicConstructions.value);
  });
});

onBeforeUnmount((): void => {
  // Unregister the update function
  if (snapshotUnsubscribe) snapshotUnsubscribe();
});

function populateData(
  qs: QuerySnapshot,
  targetArr: Array<SphericalConstruction>
): void {
  console.debug(`Here in populateData in Construction Loader .vue`);
  targetArr.splice(0);
  qs.forEach(async (qd: QueryDocumentSnapshot) => {
    const doc = qd.data() as ConstructionInFirestore;
    let parsedScript: ConstructionScript | undefined = undefined;

    // Ignore constructions with empty script
    if (doc.script.trim().length === 0) return;
    const trimmedScript = doc.script.trim();
    if (trimmedScript.startsWith("https:")) {
      // Fetch the script from Firebase Storage
      const scriptText = await appStorage
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
        svgData = await appStorage
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

function shouldLoadConstruction(event: { docId: string }): void {
  selectedDocId.value = event.docId;
  if (hasUnsavedNodules) constructionLoadDialog.value?.show();
  else {
    doLoadConstruction();
  }
}

function doLoadConstruction(/*event: { docId: string }*/): void {
  constructionLoadDialog.value?.hide();
  let script: ConstructionScript | null = null;
  let rotationMatrix: Matrix4;
  // Search in public list
  let pos = publicConstructions.value.findIndex(
    (c: SphericalConstruction) => c.id === selectedDocId.value
  );
  let toolSet: ActionMode[] | undefined = undefined;
  if (pos >= 0) {
    script = publicConstructions.value[pos].parsedScript;
    rotationMatrix = publicConstructions.value[pos].sphereRotationMatrix;
    if (publicConstructions.value[pos].tools)
      toolSet = publicConstructions.value[pos].tools;
  } else {
    // Search in private list
    pos = privateConstructions.value.findIndex(
      (c: SphericalConstruction) => c.id === selectedDocId.value
    );
    script = privateConstructions.value[pos].parsedScript;
    rotationMatrix = privateConstructions.value[pos].sphereRotationMatrix;
    if (privateConstructions.value[pos].tools)
      toolSet = privateConstructions.value[pos].tools;
  }
  if (toolSet === undefined) {
    console.debug("Include all tools");
    acctStore.resetToolset(true); /* include all tools */
  } else {
    console.debug("Exclude all tools");
    acctStore.resetToolset(false); /* exclude all */
    toolSet.forEach((toolAction: ActionMode) => {
      acctStore.includeToolName(toolAction);
    });
  }

  seStore.removeAllFromLayers();
  seStore.init();
  SENodule.resetAllCounters();
  // Nodule.resetIdPlottableDescriptionMap(); // Needed?
  EventBus.fire("show-alert", {
    key: "constructions.firestoreConstructionLoaded",
    keyOptions: { docId: selectedDocId.value },
    type: "info"
  });
  // It looks like we have to apply the rotation matrix
  // before running the script
  // setRotationMatrix(rotationMatrix);
  run(script);
  // rotateSphere(rotationMatrix.invert());
  seStore.clearUnsavedFlag();
  EventBus.fire("construction-loaded", {});
  // update all
  seStore.updateDisplay();

  // set the mode to move because chances are high that the user wants this mode after loading.
  seStore.setActionMode({
    id: "move",
    name: "MoveDisplayedName"
  });
}

function doShareConstruction(event: { docId: string }): void {
  shareURL.value = `${location.host}/construction/${event.docId}`;
  constructionShareDialog.value?.show();
}

function doCopyURL(): void {
  (docURL.value as HTMLTextAreaElement).select();
  document.execCommand("copy");
  constructionShareDialog.value?.hide();
}

function shouldDeleteConstruction(event: { docId: string }): void {
  selectedDocId.value = event.docId;
  constructionDeleteDialog.value?.show();
}

function doDeleteConstruction(): void {
  constructionDeleteDialog.value?.hide();
  const task1 = appDB
    .collection("constructions")
    .doc(selectedDocId.value)
    .delete();
  const task2 = appDB
    .collection(`users/${firebaseUid}/constructions`)
    .doc(selectedDocId.value)
    .delete();
  Promise.any([task1, task2])
    .then(() => {
      EventBus.fire("show-alert", {
        key: "constructions.firestoreConstructionDeleted",
        keyOptions: { docId: selectedDocId.value },
        type: "info"
      });
    })
    .catch((err: any) => {
      console.debug("Unable to delete", selectedDocId.value, err);
    });
}
</script>
