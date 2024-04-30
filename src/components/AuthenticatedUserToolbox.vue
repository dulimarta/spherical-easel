<template>
  <div
    id="authToolbox"
    v-if="loginEnabled"
    :style="{
      alignItems: props.expandedView ? 'flex-start' : 'center'
    }">
    <!-- {{ userDisplayedName }} {{ userEmail }} -->
    <template v-if="loginEnabled">
      <v-avatar
        size="x-small"
        v-if="userProfilePictureURL !== undefined"
        contain
        max-width="48"
        :image="userProfilePictureURL"
        @click="doLoginOrLogout"></v-avatar>
      <v-btn
        v-else
        fab
        icon
        size="x-small"
        class="bg-yellow"
        @click="doLoginOrLogout">
        <v-icon>mdi-account</v-icon>
      </v-btn>
      <router-link to="/settings/" v-if="appAuth.currentUser !== null">
        <v-icon color="white" class="mx-2">mdi-cog</v-icon>
      </router-link>
      <HintButton
        v-if="appAuth.currentUser !== null"
        :disabled="!hasObjects"
        @click="() => saveConstructionDialog?.show()"
        tooltip="Save construction">
        <template #icon>mdi-content-save</template>
      </HintButton>
    </template>
    <HintButton
      tooltip="Share saved cons"
      v-if="constructionDocId /*&& isPublicConstruction(constructionDocId)*/">
      <template #icon>mdi-share-variant</template>
    </HintButton>
    <HintButton
      v-if="constructionDocId"
      @click="() => exportConstructionDialog?.show()"
      tooltip="Export Construction">
      <template #icon>mdi-file-export</template>
    </HintButton>
  </div>

  <Dialog
    ref="saveConstructionDialog"
    :title="
      isSavedAsPublicConstruction
        ? t('savePublicConstructionDialogTitle')
        : t('savePrivateConstructionDialogTitle')
    "
    :yes-text="t('saveAction')"
    :no-text="t('cancelAction')"
    :yes-action="doSave"
    max-width="40%">
    <v-text-field
      type="text"
      density="compact"
      clearable
      counter
      persistent-hint
      :label="t('construction.saveDescription')"
      required
      v-model="constructionDescription"
      @keypress.stop></v-text-field>
    <v-switch
      v-model="isSavedAsPublicConstruction"
      :disabled="appAuth.currentUser?.uid.length === 0"
      :label="t('construction.makePublic')"></v-switch>
    <v-switch
      v-if="isMyOwnConstruction"
      v-model="shouldSaveOverwrite"
      :disabled="appAuth.currentUser?.uid.length === 0"
      :label="
        t('construction.saveOverwrite', { docId: constructionDocId })
      "></v-switch>
  </Dialog>
  <Dialog
    ref="exportConstructionDialog"
    :title="t('exportConstructionDialogTitle')"
    :yes-text="t('exportAction')"
    :no-text="t('cancelAction')"
    :yes-action="doExport"
    max-width="60%">
    <v-row align="center" justify="space-between">
      <v-col cols="6" v-if="currentConstructionPreview">
        <img id="preview" :src="currentConstructionPreview" width="400" />
      </v-col>
      <v-col cols="6">
        <v-row class="green">
          <v-col cols="8" class="pr-4">
            <p>
              {{
                t("sliderFileDimensions", {
                  widthHeight: `${(
                    (svgExportHeight * canvasWidth) /
                    canvasHeight
                  ).toFixed(0)}x${svgExportHeight}`
                })
              }}
            </p>
            <v-slider
              v-model="svgExportHeight"
              class="align-center"
              :max="1500"
              :min="100"
              :step="8"
              hide-details></v-slider>
          </v-col>
          <v-col cols="4">
            <v-text-field
              type="number"
              v-model="svgExportHeight"
              class="mt-0 pt-0"
              hide-details
              single-line
              @keypress.stop></v-text-field>
          </v-col>
          <v-col class="d-flex" cols="4">
            <v-select
              :items="['SVG', 'PNG', 'JPEG', 'GIF', 'BMP']"
              :label="t('exportFormat')"
              v-model="selectedExportFormat"
              solo></v-select>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </Dialog>
</template>
<style scoped>
#authToolbox {
  display: flex;
  flex-direction: column;
}
</style>
<script setup lang="ts">
import { Ref, ref, onMounted, onBeforeUnmount } from "vue";
import HintButton from "./HintButton.vue";
import Dialog from "./Dialog.vue";
import { storeToRefs } from "pinia";
import { useAccountStore } from "@/stores/account";
import { useSEStore } from "@/stores/se";
import { onKeyDown } from "@vueuse/core";
import { getAuth, Unsubscribe, User } from "firebase/auth";
import {
  doc,
  getFirestore,
  getDoc,
  addDoc,
  collection,
  DocumentSnapshot,
  DocumentReference,
  updateDoc
} from "firebase/firestore";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { DialogAction } from "./Dialog.vue";
import { Command } from "@/commands/Command";
import { ConstructionInFirestore, SphericalConstruction } from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import {
  uploadString,
  getDownloadURL,
  ref as storageRef,
  getStorage
} from "firebase/storage";
import { useConstructionStore } from "@/stores/construction";
import FileSaver from "file-saver";
import { computed, watch } from "vue";
enum SecretKeyState {
  NONE,
  ACCEPT_S,
  COMPLETE // Accept "SE"
}
const acctStore = useAccountStore();
const seStore = useSEStore();
const constructionStore = useConstructionStore()
const {
  loginEnabled,
  userProfilePictureURL,
  userDisplayedName,
  userEmail,
  constructionDocId,
  includedTools,
  firebaseUid
} = storeToRefs(acctStore);
const {
  hasObjects,
  inverseTotalRotationMatrix,
  svgCanvas,
  canvasHeight,
  canvasWidth,
  isEarthMode
} = storeToRefs(seStore);
const { t } = useI18n();
// const {
//   currentConstructionPreview,
//   isPublicConstruction,
//   privateConstructions
// } = useConstruction();
const {privateConstructions, currentConstructionPreview } = storeToRefs(constructionStore)
const state: Ref<SecretKeyState> = ref(SecretKeyState.NONE);
const appAuth = getAuth();
const appDB = getFirestore();
const appStorage = getStorage();
const router = useRouter();
const constructionDescription = ref("");
const saveConstructionDialog: Ref<DialogAction | null> = ref(null);
const exportConstructionDialog: Ref<DialogAction | null> = ref(null);
const isSavedAsPublicConstruction = ref(false);
const shouldSaveOverwrite = ref(false);
const selectedExportFormat = ref("");
const svgExportHeight = ref(100);
let authSubscription: Unsubscribe | null = null;
let svgRoot: SVGElement;
type ComponentProps = {
  expandedView: boolean;
};
const props = defineProps<ComponentProps>();
onKeyDown(
  true, // true: accept all keys
  (event: KeyboardEvent) => {
    if (!event.ctrlKey || !event.altKey) {
      state.value = SecretKeyState.NONE;
      return false;
    }
    if (event.code === "KeyS" && state.value === SecretKeyState.NONE) {
      state.value = SecretKeyState.ACCEPT_S;
      event.preventDefault();
    } else if (
      event.code === "KeyE" &&
      state.value === SecretKeyState.ACCEPT_S
    ) {
      state.value = SecretKeyState.COMPLETE;
      loginEnabled.value = true;
      event.preventDefault();
    } else {
      state.value = SecretKeyState.NONE;
      event.preventDefault();
    }
  },
  { dedupe: true } // ignore repeated key events when keys are held down
);

const isMyOwnConstruction = computed((): boolean => {
  // Confirm if the current construction is in my private list
  if (constructionDocId.value === null) return false;
  const pos =
    privateConstructions.value?.findIndex(
      (c: SphericalConstruction) => c.id === constructionDocId.value
    ) ?? -1;
  return pos >= 0;
});

watch(
  () => constructionDocId.value,
  () => {
    // When the construction selection changes, reset the constructionDescription
    constructionDescription.value = "";
  }
);

watch(
  () => shouldSaveOverwrite.value,
  overWrite => {
    if (!overWrite || privateConstructions.value === null)
      constructionDescription.value = "";
    else {
      const pos = privateConstructions.value.findIndex(
        (c: SphericalConstruction) => c.id === constructionDocId.value
      );
      constructionDescription.value =
        pos >= 0 ? privateConstructions.value[pos].description : "";
    }
  }
);

onMounted(() => {
  // The svgCanvas was set by SphereFrame but this component may be mounted
  // before SphereCanvas, so it is possible that svgCanvas has not been
  // set yet
  svgRoot = svgCanvas.value?.querySelector("svg") as SVGElement;

  // authSubscription = appAuth.onAuthStateChanged((u: User | null) => {
    // if (u !== null) {
      // showExport.value = true;
      // acctStore.userEmail = u.email ?? t("unknownEmail");
      // acctStore.userProfilePictureURL = u.photoURL ?? undefined;
      // uid.value = u.uid;
      // console.debug("User details", u);
      // const userDoc = doc(appDB, "users", u.uid);
      // getDoc(userDoc).then((ds: DocumentSnapshot) => {
        // if (ds.exists()) {
          // accountEnabled.value = true;
          // console.debug("User data", ds.data());
          // const { profilePictureURL, role } = ds.data() as any;
          // if (profilePictureURL && userProfilePictureURL.value === undefined) {
          //   acctStore.userProfilePictureURL = profilePictureURL;
          // }
          // if (role) {
          //   acctStore.userRole = role.toLowerCase();
          // }
        // }
      // });
      // acctStore.loginEnabled = true;
    // } else {
      // acctStore.userEmail = undefined;
      // acctStore.userProfilePictureURL = undefined;
    // }
  // });
});

onBeforeUnmount(() => {
  if (authSubscription) {
    authSubscription();
    authSubscription = null;
  }
});

async function doLoginOrLogout() {
  if (appAuth.currentUser !== null) {
    await appAuth.signOut();
    // userEmail.value = undefined;
    userProfilePictureURL.value = undefined;
    userDisplayedName.value = undefined;
    firebaseUid.value = undefined
  } else {
    router.replace({ path: "/account" });
  }
}

async function doSave(): Promise<void> {
  if (svgRoot === undefined) {
    // By the time doSave() is called, svgCanvas must have been set
    // to it is safe to non-null assert svgCanvas.value
    svgRoot = svgCanvas.value!.querySelector("svg") as SVGElement;
  }

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
  const userUid = appAuth.currentUser!.uid;
  // All constructions, regardless of private/public, are saved under the each user
  // subcollection. If a construction is made available to public, another document under
  // the top-level construction will be created
  const collectionPath = `users/${userUid}/constructions`;

  // Make a duplicate of the SVG tree
  const svgElement = svgRoot.cloneNode(true) as SVGElement;
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // Remove the top-level transformation matrix
  // We have to save the preview in its "natural" pose
  svgElement.style.removeProperty("transform");

  const svgBlob = new Blob([svgElement.outerHTML], {
    type: "image/svg+xml;charset=utf-8"
  });
  const svgDataUrl = await toBase64(svgBlob);
  let previewData: string;

  if (isEarthMode.value) {
    // In earth mode, the preview has to capture both the
    // the earth ThreeJS and the unit sphere TwoJS layers
    // Our trick below is to draw both layers (in the correct order)
    // into an offline canvas and then convert to a data image
    const earthCanvas = document.getElementById("earth") as HTMLCanvasElement;
    previewData = await mergeIntoImageUrl(
      // Must be specified in the correct order, the first item
      // in the array will be drawn to the offline canvas first
      [earthCanvas.toDataURL(), svgDataUrl],
      canvasWidth.value,
      canvasHeight.value,
      "png"
    );
    // FileSaver.saveAs(previewData, "hans.png");
  } else {
    previewData = svgDataUrl;
  }

  /* Create a pipeline of Firebase tasks
       Task 1: Upload construction to Firestore
       Task 2: Upload the script to Firebase Storage (for large script)
       Task 3: Upload the SVG preview to Firebase Storage (for large SVG)
    */
  let saveTask: Promise<DocumentReference>;
  const constructionDetails: ConstructionInFirestore = {
    version: "1",
    dateCreated: new Date().toISOString(),
    author: userEmail.value!,
    description: constructionDescription.value,
    rotationMatrix: JSON.stringify(rotationMat.value.elements),
    tools: includedTools.value,
    aspectRatio: canvasWidth.value / canvasHeight.value,
    // Use an empty string (for type checking only)
    // the actual script will be determine below
    script: "",
    preview: "",
    // TODO: check this may have to be grabbed from the existing doc in #1a
    starCount: 0
  };

  // Task #1
  if (shouldSaveOverwrite.value) {
    const targetDoc = doc(
      appDB,
      collectionPath.concat("/" + constructionDocId.value)
    );
      // Task #1a: update the existing construction
      getDoc(targetDoc).then((ds) => {
        if (ds.exists()) {
          constructionDetails.starCount = ds.data().starCount;
        }
      })
    saveTask = updateDoc(targetDoc, constructionDetails as any).then(
      () => targetDoc
    );
  } else {
    // Task #1b: save as a new construction
    saveTask = addDoc(collection(appDB, collectionPath), constructionDetails);
  }

  saveTask
    .then((constructionDoc: DocumentReference) => {
      acctStore.constructionDocId = constructionDoc.id;
      /* Task #2 */
      const scriptPromise: Promise<string> =
        scriptOut.length < FIELD_SIZE_LIMIT
          ? Promise.resolve(scriptOut)
          : uploadString(
              storageRef(appStorage, `scripts/${constructionDoc.id}`),
              scriptOut
            ).then(t => getDownloadURL(t.ref));

      /* Task #3 */
      const svgPromise: Promise<string> =
        previewData.length < FIELD_SIZE_LIMIT
          ? Promise.resolve(previewData)
          : uploadString(
              storageRef(appStorage, `construction-svg/${constructionDoc.id}`),
              previewData
            ).then(t => getDownloadURL(t.ref));

      /* Wrap the result from the three tasks as a new Promise */
      return Promise.all([constructionDoc.id, scriptPromise, svgPromise]);
    })
    .then(async ([docId, scriptData, svgData]) => {
      const constructionDoc = doc(appDB, collectionPath, docId);
      // Pass on the document ID to be included in the alert message
      if (isSavedAsPublicConstruction.value) {
        const publicConstructionDoc = await addDoc(
          collection(appDB, "/constructions/"),
          {
            author: userUid,
            constructionDocId: docId // construction document under the user sub-collection
          }
        );
        await updateDoc(constructionDoc, {
          script: scriptData,
          preview: svgData,
          publicDocId: publicConstructionDoc.id
        });
      } else {
        await updateDoc(constructionDoc, {
          script: scriptData,
          preview: svgData
        });
      }
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
        key: t("construction.firestoreSaveError", { error: err }),
        keyOptions: { error: err },
        type: "error"
      });
    });

  saveConstructionDialog.value?.hide();
}

async function mergeIntoImageUrl(
  sourceURLs: Array<string>,
  // fileName: string,
  imageWidth: number,
  imageHeight: number,
  imageFormat: string
): Promise<string> {
  // Reference https://gist.github.com/tatsuyasusukida/1261585e3422da5645a1cbb9cf8813d6
  const offlineCanvas = document.createElement("canvas") as HTMLCanvasElement;
  offlineCanvas.width = imageWidth;
  offlineCanvas.height = imageHeight;
  // offlineCanvas.setAttribute("width", canvasWidth.value.toString());
  // offlineCanvas.setAttribute("height", canvasHeight.value.toString());
  const graphicsCtx = offlineCanvas.getContext("2d");
  const imageExtension = imageFormat.toLowerCase();
  const drawTasks = sourceURLs.map((dataUrl: string): Promise<string> => {
    return new Promise(resolve => {
      const offlineImage = new Image();
      offlineImage.addEventListener("load", () => {
        graphicsCtx?.drawImage(offlineImage, 0, 0, imageWidth, imageHeight);
        // FileSaver.saveAs(offlineCanvas.toDataURL(`image/png`), `hanspreview${index}.png`);
        resolve(dataUrl);
      });
      // Similar to <img :src="dataUrl" /> but programmatically
      offlineImage.src = dataUrl;
    });
  });
  await Promise.all(drawTasks);
  const imgURL = offlineCanvas.toDataURL(`image/${imageExtension}`);

  return imgURL;
}

function doExport() {
  if (svgRoot === undefined) {
    // By the time doSave() is called svgCanvas must have been set
    // to it is safe to non-null assert svgCanvas.value
    svgRoot = svgCanvas.value!.querySelector("svg") as SVGElement;
  }
  const svgElement = svgRoot.cloneNode(true) as SVGElement;
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const svgBlob = new Blob([svgElement.outerHTML], {
    type: "image/svg+xml;charset=utf-8"
  });
  const svgURL = URL.createObjectURL(svgBlob);
  if (selectedExportFormat.value === "SVG") {
    // await nextTick()
    FileSaver.saveAs(svgURL, "construction.svg");
  } else {
    mergeIntoImageUrl(
      [svgURL],
      canvasWidth.value,
      canvasHeight.value,
      selectedExportFormat.value
    ).then((imageUrl: string) => {
      FileSaver.saveAs(imageUrl, "construction." + selectedExportFormat.value);
    });
  }
}
</script>
<i18n locale="en">
{
  "savePrivateConstructionDialogTitle": "Save Private Construction",
  "savePublicConstructionDialogTitle": "Save Public Construction",
  "exportConstructionDialogTitle": "Export Construction",
  "exportAction": "Export",
  "saveAction": "Save",
  "cancelAction": "Cancel",
  "unknownEmail": "Unknown email",
  "construction": {
    "saveDescription": "Description",
    "saveOverwrite": "Overwrite the existing construction {docId}",
    "makePublic": "Make construction publicly available",
    "firestoreSaveError": "Construction was not saved: {error}"
  },
  "sliderFileDimensions": "Exported file size {widthHeight}",
  "exportFormat": "Image Format"
}
</i18n>
