<template>
  <div
    id="authToolbox"
    class="my-1"
    v-if="loginEnabled"
    :style="{
      alignItems: 'flex-start',
      rowGap: '8px'
    }">
    <!-- {{ userDisplayedName }} {{ userEmail }} -->
    <v-btn
      icon
      size="x-small"
      class="bg-green-lighten-1"
      @click="doLoginOrLogout">
      <v-avatar
        size="small"
        v-if="firebaseUid"
        contain
        max-width="40"
        :image="userProfilePictureURL"
        @click="doLoginOrLogout"></v-avatar>

      <v-icon size="x-large" v-else>mdi-account</v-icon>
      <v-tooltip
        activator="parent"
        :text="firebaseUid ? 'Logout' : 'Login'"></v-tooltip>
    </v-btn>
    <router-link to="/settings/" v-if="firebaseUid">
      <v-btn icon size="x-small" color="green-lighten-1">
        <v-icon size="large" color="white">mdi-cog</v-icon>
      </v-btn>
    </router-link>
    <HintButton
      color="green-lighten-2"
      v-if="firebaseUid && hasObjects"
      @click="() => saveConstructionDialog?.show()"
      tooltip="Save construction">
      <template #icon>mdi-content-save</template>
    </HintButton>
    <HintButton
      color="green-lighten-2"
      tooltip="Share saved cons"
      v-if="constructionDocId /*&& isPublicConstruction(constructionDocId)*/">
      <template #icon>mdi-share-variant</template>
    </HintButton>
    <HintButton
      color="green-lighten-2"
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
      :disabled="!firebaseUid"
      :label="t('construction.makePublic')"></v-switch>
    <v-switch
      v-if="isMyOwnConstruction"
      v-model="shouldSaveOverwrite"
      :disabled="!firebaseUid"
      :label="
        t('construction.saveOverwrite', { docId: constructionDocId })
      "></v-switch>
  </Dialog>
  <Dialog
    ref="exportConstructionDialog"
    :title="t('exportConstructionDialogTitle')"
    :yes-text="t('exportAction')"
    :no-text="t('cancelAction')"
    :yes-action="doExport1"
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
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { DialogAction } from "./Dialog.vue";
import { SphericalConstruction } from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import { useConstructionStore } from "@/stores/construction";
import FileSaver from "file-saver";
import { computed, watch } from "vue";
import { mergeIntoImageUrl } from "@/utils/helpingfunctions";
import { Command } from "@/commands/Command";
enum SecretKeyState {
  NONE,
  ACCEPT_S,
  COMPLETE // Accept "SE"
}
const acctStore = useAccountStore();
const seStore = useSEStore();
const constructionStore = useConstructionStore();
const {
  loginEnabled,
  userProfilePictureURL,
  userDisplayedName,
  constructionDocId,
  firebaseUid
} = storeToRefs(acctStore);
const { hasObjects, svgCanvas, canvasHeight, canvasWidth } =
  storeToRefs(seStore);
const { t } = useI18n();

const { privateConstructions, currentConstructionPreview } =
  storeToRefs(constructionStore);
const state: Ref<SecretKeyState> = ref(SecretKeyState.NONE);
const router = useRouter();
const constructionDescription = ref("");
const saveConstructionDialog: Ref<DialogAction | null> = ref(null);
const exportConstructionDialog: Ref<DialogAction | null> = ref(null);
const isSavedAsPublicConstruction = ref(false);
const shouldSaveOverwrite = ref(false);
const selectedExportFormat = ref("");
const svgExportHeight = ref(100);
// let authSubscription: Unsubscribe | null = null;
let svgRoot: SVGElement;
type ComponentProps = {
  expandedView: boolean;
};
const props = defineProps<ComponentProps>();
/* User account feature is initially disabled. To unlock this feature
     The user must press Ctrl+Alt+S then Ctrl+Alt+E in that order */
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

// onBeforeUnmount(() => {
//   if (authSubscription) {
//     authSubscription();
//     authSubscription = null;
//   }
// });

async function doLoginOrLogout() {
  if (firebaseUid.value) {
    await acctStore.signOff();
    // userEmail.value = undefined;
    userProfilePictureURL.value = undefined;
    userDisplayedName.value = undefined;
    firebaseUid.value = undefined;
  } else {
    router.replace({ path: "/account" });
  }
}

async function doSave(): Promise<void> {
  constructionStore
    .saveConstruction(
      constructionDocId.value,
      constructionDescription.value,
      isSavedAsPublicConstruction.value
    )
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
    })
    .finally(() => {
      saveConstructionDialog.value?.hide();
    });
}

function doExport1() {
  // if (svgRoot === undefined) {
  //   // By the time doSave() is called svgCanvas must have been set
  //   // to it is safe to non-null assert svgCanvas.value
  //   svgRoot = svgCanvas.value!.querySelector("svg") as SVGElement;
  // }
  // const svgElement = svgRoot.cloneNode(true) as SVGElement;
  // svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // const svgBlob = new Blob([svgElement.outerHTML], {
  //   type: "image/svg+xml;charset=utf-8"
  // });
  /* dump the command history into SVG */
  const svgBlock = Command.dumpSVG(svgExportHeight.value);
  console.log(svgBlock)
  const svgBlob = new Blob([svgBlock], {
    type: "image/svg+xml;charset=utf-8"
  });
  const svgURL = URL.createObjectURL(svgBlob);
  if (selectedExportFormat.value === "SVG") {
    // await nextTick()
    FileSaver.saveAs(svgURL, "construction.svg");
  }
  // else {
  //   mergeIntoImageUrl(
  //     [svgURL],
  //     canvasWidth.value,
  //     canvasHeight.value,
  //     selectedExportFormat.value
  //   ).then((imageUrl: string) => {
  //     FileSaver.saveAs(imageUrl, "construction." + selectedExportFormat.value);
  //   });
  // }
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
<i18n locale="en" lang="json">
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
