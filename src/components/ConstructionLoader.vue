<template>
  <div>
    <!-- <div class="text-h6" v-if="firebaseUid.length > 0">
      {{ $t(`constructions.privateConstructions`) }}
    </div> -->
    <!--- WARNING: the "id" attribs below are needed for testing -->
    <v-expansion-panels style="gap:10px">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <h3 class="body-1 font-weight-bold button-group-heading">
          {{ t(`constructions.privateConstructions`) }}
          </h3>
        </v-expansion-panel-title>
        <v-expansion-panel-text v-if="firebaseUid && firebaseUid.length > 0">
          <ConstructionList
            id="privateList"
            :items="privateConstructions"
            v-on:load-requested="shouldLoadConstruction"
            v-on:delete-requested="shouldDeleteConstruction"/>
        </v-expansion-panel-text>
        <v-expansion-panel-text v-else>
         Nothing here
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          <h3 class="body-1 font-weight-bold button-group-heading">
          {{ t(`constructions.publicConstructions`) }}
          </h3>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            id="publicList"
            :items="publicConstructions"
            :allow-sharing="true"
            v-on:load-requested="shouldLoadConstruction"
            v-on:share-requested="doShareConstruction"
            v-on:delete-requested="shouldDeleteConstruction" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- <div class="text-h6">{{ $t(`constructions.publicConstructions`) }}</div> -->

    <Dialog
      ref="constructionShareDialog"
      id="_test_constructionShareDialog"
      class="dialog"
      title="Share Construction"
      yes-text="Copy URL"
      :yes-action="doCopyURL"
      no-text="OK"
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
import {
  computed,
  Ref,
  ref,
  onMounted
} from "vue";
import {
  QuerySnapshot,
  QueryDocumentSnapshot,
  getFirestore,
  collection,
  doc,
  deleteDoc,
  getDoc,
  CollectionReference,
  getDocs,
onSnapshot
} from "firebase/firestore";
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
import { storeToRefs } from "pinia";
import { getAuth } from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
deleteObject
} from "firebase/storage";
import { useI18n } from "vue-i18n";
type PublicConstructionReferencee = {
  author: string;
  constructionDocId: string;
};
const acctStore = useAccountStore();
const seStore = useSEStore();
const { t } = useI18n();
const { hasUnsavedNodules } = storeToRefs(seStore);
const appAuth = getAuth();
const appDB = getFirestore();
const appStorage = getStorage();
// let snapshotListener: Array<() => void> = [];
const publicConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const privateConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const shareURL = ref("");
const selectedDocId = ref("");

const constructionShareDialog: Ref<DialogAction | null> = ref(null);
const constructionLoadDialog: Ref<DialogAction | null> = ref(null);
const constructionDeleteDialog: Ref<DialogAction | null> = ref(null);
const docURL: Ref<HTMLSpanElement | null> = ref(null);

const firebaseUid = computed((): string => {
  return appAuth.currentUser?.uid ?? "";
});

onMounted((): void => {
  if (firebaseUid.value.length > 0) {
    const privateColl = collection(
      appDB,
      "users",
      firebaseUid.value,
      "constructions"
    )
    onSnapshot(privateColl, () => {
      privateConstructions.value.splice(0)
      populateData(privateColl, privateConstructions.value);
    })
  }
  const publicColl = collection(appDB, "constructions");
  populateData(publicColl, publicConstructions.value);
});


async function parseDocument(
  id: string,
  remoteDoc: ConstructionInFirestore
): Promise<SphericalConstruction | null> {
  let parsedScript: ConstructionScript | undefined = undefined;
  const trimmedScript = remoteDoc.script.trim();
  if (trimmedScript.length === 0) return null;
  if (trimmedScript.startsWith("https")) {
    // Fetch the actual script from Firebase Storagee
    const scriptText = await getDownloadURL(
      storageRef(appStorage, trimmedScript)
    )
      .then((url: string) => axios.get(url))
      .then((r: AxiosResponse) => r.data);

    parsedScript = scriptText as ConstructionScript;
  } else {
    // Parse the script directly from the Firestore document
    parsedScript = JSON.parse(trimmedScript) as ConstructionScript;
  }
  const sphereRotationMatrix = new Matrix4();
  if (parsedScript && parsedScript.length > 0) {
    // we care only for non-empty script
    let svgData: string | undefined;
    if (remoteDoc.preview?.startsWith("https:")) {
      svgData = await getDownloadURL(storageRef(appStorage, remoteDoc.preview))
        .then((url: string) => axios.get(url))
        .then((r: AxiosResponse) => r.data);
      console.debug(
        "SVG preview from Firebase Storage ",
        svgData?.substring(0, 70)
      );
    } else {
      svgData = remoteDoc.preview;
      console.debug("SVG preview from Firestore ", svgData?.substring(0, 70));
    }
    const objectCount = parsedScript
      // A simple command contributes 1 object
      // A CommandGroup contributes N objects (as many elements in its subcommands)
      .map((z: string | Array<string>) =>
        typeof z === "string" ? 1 : z.length
      )
      .reduce((prev: number, curr: number) => prev + curr);

    if (remoteDoc.rotationMatrix) {
      const matrixData = JSON.parse(remoteDoc.rotationMatrix);
      sphereRotationMatrix.fromArray(matrixData);
    }
    return {
      version: remoteDoc.version,
      id,
      script: trimmedScript,
      parsedScript,
      objectCount,
      author: remoteDoc.author,
      dateCreated: remoteDoc.dateCreated,
      description: remoteDoc.description,
      sphereRotationMatrix,
      preview: svgData ?? "",
      tools: remoteDoc.tools ?? undefined
    };
  }
  return null;
}

function populateData(
  constructionCollection: CollectionReference,
  targetArr: Array<SphericalConstruction>
): void {
  console.debug(`Here in populateData in Construction Loader .vue`);
  targetArr.splice(0);

  getDocs(constructionCollection)
    .then((qs: QuerySnapshot) => {
      qs.forEach(async (qd: QueryDocumentSnapshot) => {
        const remoteData = qd.data();
        let out: SphericalConstruction | null = null;
        if (remoteData["constructionDocId"]) {
          // In a neew format defined by Capstone group Fall 2022
          // public constructions are simply a reference to
          // constructions owned by a particular user
          const constructionRef = remoteData as PublicConstructionReferencee;
          const ownedDocRef = doc(
            appDB,
            "users",
            constructionRef.author,
            "constructions",
            constructionRef.constructionDocId
          );
          const ownedDoc = await getDoc(ownedDocRef);
          out = await parseDocument(
            constructionRef.constructionDocId,
            ownedDoc.data() as ConstructionInFirestore
          );
        } else {
          out = await parseDocument(
            qd.id,
            remoteData as ConstructionInFirestore
          );
        }
        if (out) targetArr.push(out);
        else console.error("Failed to parse", qd.id);
      });
    })
    .finally(() => {
      // Sort by creation date
      targetArr.sort((a: SphericalConstruction, b: SphericalConstruction) =>
        a.dateCreated.localeCompare(b.dateCreated)
      );
    });
}

function shouldLoadConstruction(docId: string): void {
  selectedDocId.value = docId;
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
  seStore.setActionMode("move");
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

function shouldDeleteConstruction(docId: string): void {
  selectedDocId.value = docId;
  constructionDeleteDialog.value?.show();
}

async function doDeleteConstruction(): Promise<void> {
  /* Constructions are saved under the user account. However, when
     a construction is made public, its document ID is also listed
     under the "public" construction collection.
     So we have to delete the public listing.
     Also, scripts and the preview image must also be deleted.
   */
  const pos = privateConstructions.value.findIndex((c: SphericalConstruction) => c.id === selectedDocId.value)
  constructionDeleteDialog.value?.hide();
  if (pos < 0) return;
  const victimDetails = privateConstructions.value[pos]
  if (victimDetails.script.startsWith("https://")) {
    await deleteObject(storageRef(appStorage, `/scripts/${selectedDocId.value}`))
  }
  if (victimDetails.preview) {
    await deleteObject(storageRef(appStorage, `/scripts/${selectedDocId.value}`))
  }
  const doc1 = doc(appDB, "constructions", selectedDocId.value);
  const task1 = deleteDoc(doc1);
  const doc2 = doc(
    appDB,
    "users",
    firebaseUid.value,
    "constructions",
    selectedDocId.value
  );
  const task2 = deleteDoc(doc2);
  Promise.any([task1, task2])
    .then(() => {
      EventBus.fire("show-alert", {
        key: t('constructionDeleted', {docId: selectedDocId.value}),
        type: "info"
      });
    })
    .catch((err: any) => {
      console.debug("Unable to delete", selectedDocId.value, err);
    });
}
</script>
<i18n locale="en">
{
  "constructionDeleted": "Construction {docId} was successfully removed"
}
</i18n>
