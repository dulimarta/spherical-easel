<template>
  {{ loginEnabled }}
  <template v-if="loginEnabled">
    {{ userDisplayedName }} {{ userEmail }}
    <v-avatar
      v-if="userProfilePictureURL !== undefined"
      contain
      max-width="48"
      :image="userProfilePictureURL"
      @click="doLoginOrLogout"></v-avatar>
    <v-btn
      v-else
      icon
      size="x-small"
      class="bg-yellow"
      @click="doLoginOrLogout">
      <v-icon>mdi-account</v-icon>
    </v-btn>
    <template v-if="appAuth.currentUser !== null">
      <HintButton v-if="constructionDocId" tooltip="Share saved cons">
        <template #icon>mdi-share</template>
      </HintButton>
      <HintButton
        :disabled="!hasObjects"
        @click="() => saveConstructionDialog?.show()"
        tooltip="Save construction">
        <template #icon>mdi-content-save</template>
      </HintButton>
      <HintButton v-if="constructionDocId" tooltip="Export Construction">
        <template #icon>mdi-file-export</template>
      </HintButton>
    </template>
  </template>
  <Dialog
    ref="saveConstructionDialog"
    :title="t('saveConstructionDialogTitle')"
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
      :label="t('construction.description')"
      required
      v-model="constructionDescription"
      @keypress.stop></v-text-field>
    <v-switch
      v-model="isPublicConstruction"
      :disabled="appAuth.currentUser?.uid.length === 0"
      :label="t('construction.makePublic')"></v-switch>
  </Dialog>
</template>
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
import { ConstructionInFirestore } from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import {
  uploadString,
  getDownloadURL,
  ref as storageRef,
  getStorage
} from "firebase/storage";
enum SecretKeyState {
  NONE,
  ACCEPT_S,
  COMPLETE
}
const acctStore = useAccountStore();
const seStore = useSEStore();
const {
  loginEnabled,
  userProfilePictureURL,
  userDisplayedName,
  userEmail,
  constructionDocId,
  includedTools
} = storeToRefs(acctStore);
const { hasObjects, inverseTotalRotationMatrix, svgCanvas } =
  storeToRefs(seStore);
const { t } = useI18n();
const state: Ref<SecretKeyState> = ref(SecretKeyState.NONE);
const appAuth = getAuth();
const appDB = getFirestore();
const appStorage = getStorage();
const router = useRouter();
const constructionDescription = ref("");
const saveConstructionDialog: Ref<DialogAction | null> = ref(null);
const isPublicConstruction = ref(false);
let authSubscription: Unsubscribe | null = null;
let svgRoot: SVGElement;
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
  { dedupe: true }
);

onMounted(() => {
  // The svgCanvas was set by SphereFrame but this component may be mounted
  // before SphereCanvas, so it is possible that svgCanvas has not been
  // set yet
  svgRoot = svgCanvas.value?.querySelector("svg") as SVGElement;

  authSubscription = appAuth.onAuthStateChanged((u: User | null) => {
    if (u !== null) {
      // showExport.value = true;
      acctStore.userEmail = u.email ?? t("unknownEmail");
      acctStore.userProfilePictureURL = u.photoURL ?? undefined;
      // uid.value = u.uid;
      console.debug("User details", u);
      const userDoc = doc(appDB, "users", u.uid);
      getDoc(userDoc).then((ds: DocumentSnapshot) => {
        if (ds.exists()) {
          // accountEnabled.value = true;
          console.debug("User data", ds.data());
          const { profilePictureURL, role } = ds.data() as any;
          if (profilePictureURL && userProfilePictureURL.value === undefined) {
            acctStore.userProfilePictureURL = profilePictureURL;
          }
          if (role) {
            acctStore.userRole = role.toLowerCase();
          }
        }
      });
    } else {
      acctStore.userEmail = undefined;
      acctStore.userProfilePictureURL = undefined;
    }
  });
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
    acctStore.userEmail = undefined;
    acctStore.userProfilePictureURL = undefined;
    acctStore.userDisplayedName = undefined;
  } else {
    router.replace({ path: "/account" });
  }
}

async function doSave(): Promise<void> {
  if (svgRoot === undefined) {
    // By the time doSave() is called svgCanvas must have been set
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
  const svgPreviewData = await toBase64(svgBlob);
  console.log(svgPreviewData); // TODO delete

  // const svgURL = URL.createObjectURL(svgBlob);
  // FileSaver.saveAs(svgURL, "hans.svg");

  /* Create a pipeline of Firebase tasks
       Task 1: Upload construction to Firestore
       Task 2: Upload the script to Firebase Storage (for large script)
       Task 3: Upload the SVG preview to Firebase Storage (for large SVG)
    */
  addDoc(
    // Task #1
    collection(appDB, collectionPath),
    {
      version: "1",
      dateCreated: new Date().toISOString(),
      author: userEmail.value,
      description: constructionDescription.value,
      rotationMatrix: JSON.stringify(rotationMat.value.elements),
      tools: includedTools.value,
      script: "" // Use an empty string (for type checking only)
    } as ConstructionInFirestore
  )
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
        svgPreviewData.length < FIELD_SIZE_LIMIT
          ? Promise.resolve(svgPreviewData)
          : uploadString(
              storageRef(appStorage, `construction-svg/${constructionDoc.id}`),
              svgPreviewData
            ).then(t => getDownloadURL(t.ref));

      /* Wrap the result from the three tasks as a new Promise */
      return Promise.all([constructionDoc.id, scriptPromise, svgPromise]);
    })
    .then(async ([docId, scriptData, svgData]) => {
      const constructionDoc = doc(appDB, collectionPath, docId);
      // Pass on the document ID to be included in the alert message
      if (isPublicConstruction.value) {
        const publicConstructionDoc = await addDoc(
          collection(appDB, "/constructions/"),
          {
            author: userUid,
            constructionId: docId // construction document under the user sub-collection
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
</script>
<i18n locale="en">
{
  "saveConstructionDialogTitle": "Save Construction",
  "saveAction": "Save",
  "cancelAction": "Cancel",
  "unknownEmail": "Unknown email",
  "construction": {
    "description": "Description",
    "makePublic": "Make Construction Publicly Available",
    "firestoreSaveError": "Construction was not saved: {error}"
  }
}
</i18n>
