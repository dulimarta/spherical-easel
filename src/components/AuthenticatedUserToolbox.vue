<template>
  <div
    id="authToolbox"
    class="my-1"
    :style="{
      alignItems: 'flex-start',
      rowGap: '8px'
    }">
    <span id="diplayed-name"
      v-if="userProfile"
      @click="isAbbreviatedName = !isAbbreviatedName"
      :style="{
        writingMode: 'sideways-lr',
        textOrientation: 'mixed'
      }">
      {{ userDisplayedName }}
    <v-tooltip activator="parent" text="Click to toggle short/long name"></v-tooltip>
    </span>
    <v-btn
      icon
      size="x-small"
      class="bg-green-lighten-1"
      @click="doLoginOrLogout">
      <v-avatar
        size="small"
        v-if="userProfile?.profilePictureURL"
        contain
        max-width="40"
        :image="userProfile!.profilePictureURL"></v-avatar>

      <v-icon size="x-large" v-else>mdi-account</v-icon>
      <v-tooltip
        activator="parent"
        :text="
          firebaseUid
            ? `Logout ${userEmail} ${firebaseUid.substring(0, 8)}`
            : 'Login'
        "></v-tooltip>
    </v-btn>
    <router-link to="/settings/" v-if="firebaseUid">
      <v-btn icon size="x-small" color="green-lighten-1">
        <v-icon size="large" color="white">mdi-cog</v-icon>
      </v-btn>
    </router-link>
    <HintButton
      color="green-lighten-2"
      v-if="firebaseUid && hasObjects"
      @click="showSaveConstructionDialog()"
      tooltip="Save construction">
      <template #icon>mdi-content-save</template>
    </HintButton>
    <!-- <HintButton
      color="green-lighten-2"
      :tooltip="`Share this construction ${constructionStore
        .publishedDocId(constructionDocId)
        ?.substring(0, 8)}`"
      v-if="
        constructionDocId && constructionStore.publishedDocId(constructionDocId)
      ">
      <template #icon>mdi-share-variant</template>
    </HintButton> -->
    <HintButton
      color="green-lighten-2"
      v-if="constructionDocId"
      @click="() => exportConstructionDialog?.show()"
      :tooltip="t('exportConstructionDialogTitle')">
      <template #icon>mdi-export</template>
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
    <!-- Wrapper div to prevent scrolling in the main dialog -->
    <div style="overflow: visible; max-height: none">
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

      <!-- Folder Selection Section -->
      <div class="my-2">
        <v-divider class="mb-2"></v-divider>
        <h3 class="text-subtitle-1 mb-2">
          {{t('folder.title')}}
        </h3>

        <!-- Folder path input -->
        <v-text-field
          v-model="folderPath"
          label=""
          density="compact"
          :hint="t('folder.pathLabel')"
          persistent-hint
          clearable
          @keypress.stop></v-text-field>

        <!-- Existing Folders Treeview -->
        <p class="text-caption mt-2 mb-1">{{ t('folder.selectExisting') }}</p>
        <div class="folder-tree-container">
          <v-treeview
            :items="treeItems"
            select-strategy="single-independent"
            selectable
            dense
            item-value="id"
            open-all
            class="mt-1 folder-tree"
            @update:selected="handleNodeSelection">
            <!-- TODO add icon to TreeviewNode type -->
            <template v-slot:prepend="{}">
              <v-icon>{{ /*item.icon ||*/ "mdi-folder" }}</v-icon>
            </template>
          </v-treeview>
        </div>
      </div>
    </div>
  </Dialog>
  <Dialog
    ref="exportConstructionDialog"
    :title="t('exportConstructionDialogTitle')"
    :yes-text="t('exportAction')"
    :no-text="t('cancelAction')"
    :yes-action="doExport"
    max-width="60%">
    <v-row align="center" justify="space-between">
      <v-col v-if="currentConstructionPreview" cols="6" width="400px">
        <v-img
          id="preview"
          class="center"
          display="flex"
          justify-content="center"
          align-items="center"
          :src="currentConstructionPreview"
          :width="(imageExportHeight * 400) / 1500"
          :height="(imageExportHeight * 400) / 1500" />
      </v-col>
      <v-col cols="6">
        <v-row class="green">
          <v-col cols="12" class="pr-4">
            <p>
              {{
                t("sliderFileDimensions", {
                  widthHeight: `${imageExportHeight}x${imageExportHeight}`
                })
              }}
            </p>
            <v-slider
              v-model="imageExportHeight"
              class="align-center"
              :max="1500"
              :min="50"
              :step="10"
              hide-details>
              <template v-slot:append>
                <v-text-field
                  type="number"
                  :rules="[exportHeightRule]"
                  v-model="imageExportHeight"
                  class="mt-0 pt-0"
                  style="width: 100px"
                  outlined
                  @change="checkExportHeight()"
                  @keypress.stop></v-text-field>
              </template>
            </v-slider>
          </v-col>
          <v-row>
            <v-col class="d-flex" cols="12">
              <v-select
                style="width: 400px"
                :items="exportFileTypeItems"
                :label="t('exportFormat')"
                v-model="selectedExportFormat"
                solo></v-select>
            </v-col>
          </v-row>
          <v-col class="d-flex" cols="8">
            <v-checkbox
              v-model="svgNonScaling"
              value="stroke"
              :label="t('nonScalingStroke')"
              hide-details></v-checkbox>
          </v-col>
          <v-col class="d-flex" cols="8">
            <v-checkbox
              v-model="svgNonScaling"
              value="point"
              :label="t('nonScalingPointRadius')"
              hide-details></v-checkbox>
          </v-col>
          <v-col class="d-flex" cols="8">
            <v-checkbox
              v-model="svgNonScaling"
              value="text"
              :label="t('nonScalingText')"
              hide-details></v-checkbox>
          </v-col>

          <v-col
            v-if="
              selectedExportFormat == 'Animated SVG' && axisId != undefined
            ">
            <p>
              {{ t("animatedSVGOptions") }}
            </p>
            <p>
              {{ t("animatedSVGBestViewed") }}
            </p>
            <v-divider></v-divider>
            <v-col class="d-flex" cols="12">
              <v-select
                v-model="axisId"
                :items="possibleAxisItems"
                item-title="text"
                item-value="value"
                density="compact"
                :label="t('svgAnimationAxis')"></v-select>
            </v-col>
            <v-col class="d-flex" cols="12">
              <p>
                {{ t("rotationAngle", { angle: rotationAngleString }) }}
              </p>
            </v-col>
            <v-row>
              <v-col cols="12" class="d-flex">
                <v-slider
                  v-model="svgAnimationAngle"
                  class="align-center"
                  :max="360"
                  :min="5"
                  :step="5"
                  hide-details>
                  <template v-slot:append>
                    <v-text-field
                      type="number"
                      v-model="svgAnimationAngle"
                      :rules="[animationRotationAngleRule]"
                      style="width: 100px"
                      class="mt-0 pt-0"
                      @change="checkAnimationRotationAngle()"
                      @keypress.stop></v-text-field>
                  </template>
                </v-slider>
              </v-col>
            </v-row>
            <v-col cols="12" class="d-flex">
              <v-text-field
                type="number"
                v-model="svgAnimationDuration"
                :rules="[animationDurationRule]"
                style="width: 100px"
                class="mt-0 pt-0"
                @change="checkAnimationDuration()"
                :label="t('animationDuration')"
                @keypress.stop></v-text-field>
              <v-text-field
                type="number"
                v-model="svgAnimationFrames"
                :rules="[animationNumberOfFramesRule]"
                style="width: 100px"
                class="mt-0 pt-0"
                @change="checkAnimationNumberOfFrames()"
                :label="t('animationFrames')"
                @keypress.stop></v-text-field>
              <v-text-field
                type="number"
                v-model="svgAnimationRepeat"
                :rules="[animationRepeatRule]"
                style="width: 100px"
                @change="checkAnimationRepeatRule()"
                class="mt-0 pt-0"
                :label="t('animationRepeat')"
                @keypress.stop></v-text-field>
            </v-col>
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
.folder-tree-container {
  max-height: 200px;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  background-color: white;
}

:deep(.v-treeview-node__root) {
  min-width: max-content;
}

:deep(.v-treeview-node__label) {
  white-space: nowrap;
  overflow: visible;
}

:deep(.v-treeview-node__content) {
  width: auto;
  min-width: max-content;
  overflow: visible;
}

:deep(.v-treeview) {
  overflow: visible;
  min-width: max-content;
}
</style>
<script setup lang="ts">
import { Ref, ref, onUpdated } from "vue";
import HintButton from "./HintButton.vue";
import Dialog from "./Dialog.vue";
import { storeToRefs } from "pinia";
import { useAccountStore } from "@/stores/account";
import { useSEStore } from "@/stores/se";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { DialogAction } from "./Dialog.vue";
import {
  ConstructionPath,
  ConstructionPathError,
  SphericalConstruction,
  TreeviewNode
} from "@/types/ConstructionTypes";
import EventBus from "@/eventHandlers/EventBus";
import { useConstructionStore } from "@/stores/construction";
import FileSaver from "file-saver";
import { computed, watch } from "vue";
import { mergeIntoImageUrl } from "@/utils/helpingfunctions";
import { Command } from "@/commands/Command";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { VTreeview } from "vuetify/labs/VTreeview";
import { SEPoint } from "@/models/SEPoint";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SELine } from "@/models/SELine";

type ComponentProps = {
  expandedView: boolean;
};
defineProps<ComponentProps>();
const acctStore = useAccountStore();
const seStore = useSEStore();
const constructionStore = useConstructionStore();
const {
  // loginEnabled,
  userEmail,
  userProfile,
  constructionDocId,
  firebaseUid
} = storeToRefs(acctStore);
const {
  hasObjects,
  canvasHeight,
  canvasWidth,
  sePoints,
  seLines,
  seCircles,
  seSegments,
  selectedSENodules
} = storeToRefs(seStore);
const { t } = useI18n({ useScope: "local" });

const { privateConstructions } = storeToRefs(constructionStore);
const router = useRouter();
const constructionDescription = ref("");
const saveConstructionDialog: Ref<DialogAction | null> = ref(null);
const exportConstructionDialog: Ref<DialogAction | null> = ref(null);
const isSavedAsPublicConstruction = ref(false);
const shouldSaveOverwrite = ref(false);

type possibleExportFileTypes =
  | "SVG"
  | "Animated SVG"
  | "PNG"
  | "JPEG"
  | "GIF"
  | "BMP";
const exportFileTypeItems: Ref<possibleExportFileTypes[]> = ref([
  "SVG",
  "Animated SVG",
  "PNG",
  "JPEG",
  "GIF",
  "BMP"
]);
const selectedExportFormat: Ref<possibleExportFileTypes> = ref("SVG");
const imageExportHeight = ref(Math.min(canvasHeight.value, canvasWidth.value));

type nonScalingOptions = "stroke" | "point" | "text";
const nonScalingArray: nonScalingOptions[] = [];
const svgNonScaling = ref(nonScalingArray);

const possibleAxisItems: Ref<Array<{ text: string; value: number }>> = ref([]);
const axisId: Ref<number | undefined> = ref(undefined);
const possibleAxis: Map<number, Vector3> = new Map<number, Vector3>(); // map from node id to vector

const rotationAngleString = ref("360");
const svgAnimationAngle = ref(360);

const svgAnimationDuration = ref(4);
const svgAnimationFrames = ref(30);
const svgAnimationRepeat = ref(0); // 0 is indefinite

const currentConstructionPreview = ref(""); // preview string
// let authSubscription: Unsubscribe | null = null;
/* User account feature is initially disabled. To unlock this feature
     The user must press Ctrl+Alt+S then Ctrl+Alt+E in that order */

const folderPath = ref("");
const isAbbreviatedName = ref(false);
const userDisplayedName = computed(() => {
  if (userProfile.value) {
    return !isAbbreviatedName.value
      ? userProfile.value.displayName
      : userProfile.value.displayName
          .split(" ") // Split individual words
          .map(s => s.substring(0, 1)) // take only the first letter
          .join("") // don't use default separator (,)
          .toUpperCase();
  } else return "N/A";
});
/**
 * take the "any" input from the v-treeview component's update:selected property
 * and convert it into a filepath to use with the picker.
 *
 * @param input input from the v-treeview component
 */
const handleNodeSelection = (input: unknown) => {
  const selected: Array<string> = input as Array<string>;
  if (selected && selected.length > 0) {
    const selectedParsed: ConstructionPath = new ConstructionPath(selected[0]);
    folderPath.value = selectedParsed.toString();
    // console.log(
    //   "parsed path: " +
    //     selectedParsed.toString() +
    //     "\n" +
    //     "got root: " +
    //     selectedParsed.getRoot()
    // );
  }
};

async function doSave(): Promise<void> {
  const path: ConstructionPath = new ConstructionPath(folderPath.value);
  if (path.isValid()) {
    constructionStore
      .saveConstruction(
        constructionDocId.value,
        constructionDescription.value,
        isSavedAsPublicConstruction.value,
        path.toString() // Add this parameter to pass the folder name
      )
      .then((docId: string) => {
        // Force a refresh of the treeview data
        setTimeout(() => {
          // This creates a shallow copy of the array, triggering reactivity
          privateConstructions.value = [...privateConstructions.value];
        }, 500);
        EventBus.fire("show-alert", {
          key: "firestoreConstructionSaved",
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
  } else {
    let errKey: string = "";
    switch (path.getError()) {
      case ConstructionPathError.TOOLONG:
        errKey = t("construction.pathError.tooLong");
        break;
      case ConstructionPathError.EMPTYPATHS:
        errKey = t("construction.pathError.emptyFolders");
    }
    EventBus.fire("show-alert", {
      key: errKey,
      type: "error"
    });
  }
}

const treeItems: Ref<Array<TreeviewNode> | undefined> = ref(undefined);

const showSaveConstructionDialog = () => {
  treeItems.value = constructionStore.constructionTree.getOwnedFolders();
  saveConstructionDialog.value?.show();
};

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

watch(
  [
    () => svgAnimationAngle.value,
    () => svgAnimationDuration.value,
    () => svgAnimationFrames.value,
    () => svgAnimationRepeat.value,
    () => axisId.value,
    () => svgNonScaling.value,
    () => selectedExportFormat.value
  ],
  () => {
    rotationAngleString.value = svgAnimationAngle.value + "\u{00B0}";
    updateExportPreview(selectedExportFormat.value == "JPEG");
  },
  { deep: true }
);

// onBeforeMount(() => {
//   for (let angle = 0; angle <= 360; angle += 22.5) {
//     rotationAngleSelectorThumbStrings.push(
//       angle.toFixed(1).replace(/\.0$/, "") + "\u{00B0}"
//     );
//   }
//   console.log(rotationAngleSelectorThumbStrings);
// });

onUpdated(() => {
  // clear the old values
  possibleAxis.clear();
  possibleAxisItems.value = [];

  sePoints.value.forEach(point => {
    if (
      point.exists &&
      !(
        (point instanceof SEAntipodalPoint ||
          point instanceof SEIntersectionPoint) &&
        !point.isUserCreated
      )
    ) {
      if (point.label) {
        possibleAxisItems.value.push({
          text: t("point") + point.label.ref.shortUserName,
          value: point.id
        });
        possibleAxis.set(point.id, point.locationVector);
      }
    }
  });
  seLines.value.forEach(line => {
    if (line.exists && line.label) {
      possibleAxisItems.value.push({
        text: t("line") + line.label.ref.shortUserName,
        value: line.id
      });
      possibleAxis.set(line.id, line.normalVector);
    }
  });
  seSegments.value.forEach(segment => {
    if (segment.exists && segment.label) {
      possibleAxisItems.value.push({
        text: t("segment") + segment.label.ref.shortUserName,
        value: segment.id
      });
      possibleAxis.set(segment.id, segment.normalVector);
    }
  });
  seCircles.value.forEach(circle => {
    if (circle.exists && circle.label) {
      possibleAxisItems.value.push({
        text: t("circle") + circle.label.ref.shortUserName,
        value: circle.id
      });
      possibleAxis.set(circle.id, circle.centerSEPoint.locationVector);
    }
  });

  if (possibleAxisItems.value.length > 0) {
    exportFileTypeItems.value = [
      "SVG",
      "Animated SVG",
      "PNG",
      "JPEG",
      "GIF",
      "BMP"
    ];
    // Set the initial axis of the animated SVG with the first object selected
    if (selectedSENodules.value.length > 0) {
      if (
        selectedSENodules.value[0] instanceof SEPoint ||
        selectedSENodules.value[0] instanceof SESegment ||
        selectedSENodules.value[0] instanceof SELine ||
        selectedSENodules.value[0] instanceof SECircle
      ) {
        axisId.value = selectedSENodules.value[0].id;
      } else {
        axisId.value = possibleAxisItems.value[0].value;
      }
    }
  } else {
    axisId.value = undefined;
    exportFileTypeItems.value = ["SVG", "PNG", "JPEG", "GIF", "BMP"];
  }
  updateExportPreview(selectedExportFormat.value == "JPEG");
  //selectedExportFormat.value = "SVG"; // save the last value instead of overwriting
  imageExportHeight.value = Math.min(canvasHeight.value, canvasWidth.value);
});

async function doLoginOrLogout() {
  if (firebaseUid.value) {
    await acctStore.signOff();
    firebaseUid.value = undefined;
  } else {
    router.push({ path: "/account" });
  }
}

function showExportDialog() {
  // // Set the initial axis of the animated SVG with the first object selected
  // if (selectedSENodules.value.length > 0) {
  //   if (
  //     selectedSENodules.value[0] instanceof SEPoint ||
  //     selectedSENodules.value[0] instanceof SESegment ||
  //     selectedSENodules.value[0] instanceof SELine ||
  //     selectedSENodules.value[0] instanceof SECircle
  //   ) {
  //     axisId.value = selectedSENodules.value[0].id;
  //   }
  // }
  // Show the dialog
  exportConstructionDialog.value?.show();
}

function updateExportPreview(forJpegExport?: boolean): void {
  let svgBlock = "";
  const nonScalingOptions = {
    stroke: svgNonScaling.value.includes("stroke"),
    text: svgNonScaling.value.includes("text"),
    pointRadius: svgNonScaling.value.includes("point"),
    scaleFactor:
      (imageExportHeight.value - 32) / (2 * SETTINGS.boundaryCircle.radius)
  };
  const axis =
    axisId.value == undefined ? undefined : possibleAxis.get(axisId.value);
  if (selectedExportFormat.value === "Animated SVG" && axis != undefined) {
    const animateOptions = {
      axis: axis,
      degrees: svgAnimationAngle.value.toRadians(),
      duration: svgAnimationDuration.value, // in seconds
      frames: svgAnimationFrames.value,
      repeat: svgAnimationRepeat.value
    };
    svgBlock = Command.dumpSVG(
      imageExportHeight.value,
      nonScalingOptions,
      animateOptions
    );
  } else {
    svgBlock = Command.dumpSVG(
      imageExportHeight.value,
      nonScalingOptions,
      undefined, //animate options
      undefined, // svg for icon
      forJpegExport // svg for jpeg export (changes the background to white instead of transparent)
    );
  }

  let svgBlob = new Blob([svgBlock], { type: "image/svg+xml;charset=utf-8" });
  // var svgBlob = new Blob([svgBlock], {
  //   type: "text/plain;charset=utf-8"
  // });
  currentConstructionPreview.value = URL.createObjectURL(svgBlob);
}
function exportHeightRule(value: number | undefined): boolean | string {
  if (value != undefined && value != null) {
    if (value < 50 || 1500 < value || value != Math.trunc(value)) {
      return t("exportHeightErrorMessage");
    }
  }
  return true;
}
function checkExportHeight(): void {
  if (imageExportHeight.value < 50) {
    imageExportHeight.value = 50;
  } else if (1500 < imageExportHeight.value) {
    imageExportHeight.value = 1500;
  } else {
    imageExportHeight.value = Math.trunc(imageExportHeight.value);
  }
}
function animationRotationAngleRule(
  value: number | undefined
): boolean | string {
  if (value != undefined && value != null) {
    if (value < 5 || 360 < value) {
      return t("rotationAngleErrorMessage");
    }
  }
  return true;
}
function checkAnimationRotationAngle(): void {
  if (
    svgAnimationAngle.value == undefined ||
    svgAnimationAngle.value == null ||
    svgAnimationAngle.value < 5
  ) {
    svgAnimationAngle.value = 5;
  } else if (360 < svgAnimationAngle.value) {
    svgAnimationAngle.value = 360;
  }
}
function animationDurationRule(value: number | undefined): boolean | string {
  if (value != undefined && value != null) {
    if (value < 0.5 || 10 < value) {
      return t("animatedDurationErrorMessage");
    }
  }
  return true;
}
function checkAnimationDuration(): void {
  if (
    svgAnimationDuration.value == undefined ||
    svgAnimationDuration.value == null ||
    svgAnimationDuration.value < 0.5
  ) {
    svgAnimationDuration.value = 0.5;
  } else if (1000 < svgAnimationDuration.value) {
    svgAnimationDuration.value = 1000;
  }
}
function animationNumberOfFramesRule(
  value: number | undefined
): boolean | string {
  if (
    value == undefined ||
    value == null ||
    value < 2 ||
    200 < value ||
    value != Math.trunc(value)
  ) {
    return t("animatedFramesErrorMessage");
  }
  return true;
}
function checkAnimationNumberOfFrames(): void {
  if (
    svgAnimationFrames.value == undefined ||
    svgAnimationFrames.value == null ||
    svgAnimationFrames.value < 2
  ) {
    svgAnimationFrames.value = 2;
  } else if (200 < svgAnimationFrames.value) {
    svgAnimationFrames.value = 200;
  } else {
    svgAnimationFrames.value = Math.trunc(svgAnimationFrames.value);
  }
}
function animationRepeatRule(value: number | undefined): boolean | string {
  if (
    value == undefined ||
    value == null ||
    value < 0 ||
    200 < value ||
    value != Math.trunc(value)
  ) {
    return t("animatedNumberOfFramesErrorMessage");
  }
  return true;
}
function checkAnimationRepeatRule(): void {
  if (
    svgAnimationRepeat.value == undefined ||
    svgAnimationRepeat.value == null ||
    svgAnimationRepeat.value < 0
  ) {
    svgAnimationRepeat.value = 0;
  } else if (200 < svgAnimationRepeat.value) {
    svgAnimationRepeat.value = 200;
  } else {
    svgAnimationRepeat.value = Math.trunc(svgAnimationRepeat.value);
  }
}
function doExport() {
  /* dump the command history into SVG using the nonScaling options and the animated SVG option */
  updateExportPreview(selectedExportFormat.value == "JPEG");
  const pos = privateConstructions.value.findIndex(
    (c: SphericalConstruction) => c.id === constructionDocId.value
  );
  const constructionName =
    pos >= 0 ? privateConstructions.value[pos].description : "";
  console.log("construction name?", constructionName);

  if (
    selectedExportFormat.value === "SVG" ||
    selectedExportFormat.value === "Animated SVG"
  ) {
    FileSaver.saveAs(
      currentConstructionPreview.value,
      constructionName + ".svg"
    );
  } else {
    mergeIntoImageUrl(
      [currentConstructionPreview.value],
      imageExportHeight.value,
      imageExportHeight.value,
      selectedExportFormat.value
    ).then((imageUrl: string) => {
      FileSaver.saveAs(
        imageUrl,
        constructionName + "." + selectedExportFormat.value.toLowerCase()
      );
    });
  }
}
// function previewOrDefault(dataUrl: string | undefined): string {
//   return dataUrl ? dataUrl : "/logo.png";
// }
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
    "firestoreSaveError": "Construction was not saved: {error}",
    "pathError": {
      "tooLong": "path exceeds the max character limit ({limit})",
      "emptyFolders": "path contains empty folder names (usually caused by multiple slashes in a name)"
    }
  },
  "sliderFileDimensions": "Exported file size {widthHeight} in pixels",
  "exportFormat": "Image Format",
  "nonScalingStroke": "Do not scale SVG stroke",
  "nonScalingPointRadius": "Do not scale points",
  "nonScalingText": "Do not scale text",

  "svgAnimationAxis": "Select an object to rotate around or along",
  "svgAnimationDuration": "Duration",
  "svgAnimationFrames": "Number of frames",
  "svgAnimationRepeat": "Repeat time",
  "exportHeightErrorMessage": "Enter an integer between 50 and 1500",
  "rotationAngle": "Rotation Angle {angle}",
  "rotationAngleErrorMessage": "Enter an angle between 5 and 360",
  "animationDuration": "Duration (Seconds)",
  "animatedDurationErrorMessage": "Enter a duration between 0.1 and 1000 seconds.",
  "animationFrames": "Number of Frames",
  "animatedFramesErrorMessage": "Enter an integer number of frames between 1 and 200 ",
  "animationRepeat": "Repeat (0 is indefinite)",
  "animatedNumberOfFramesErrorMessage": "Enter a number of times to repeat between 1 and 200 or 0 for Indefinite",
  "animatedSVGOptions": "Animated SVG Options",
  "animatedSVGBestViewed": "The exported files are best viewed in the Chrome browser.",
  "line": "Line: ",
  "segment": "Segment: ",
  "point": "Point: ",
  "circle": "Circle: ",
  "folder": {
    "title": "Select or Enter Folder Path in Owned Constructions",
    "pathLabel": "Folder Path (e.g., favs/math/geometry)",
    "selectExisting": "Or select an existing folder:"
  }
}
</i18n>
<i18n locale="id" lang="json">
{
  "savePrivateConstructionDialogTitle": "Simpan Konstruksi Privat",
  "savePublicConstructionDialogTitle": "Simpan Konstruksi Publik",
  "exportConstructionDialogTitle": "Ekspor Konstruksi",
  "exportAction": "Export",
  "saveAction": "Simpan",
  "cancelAction": "Batal",
  "unknownEmail": "Unknown email",
  "construction": {
    "saveDescription": "Deskripsi",
    "saveOverwrite": "Simpan and timpa konstruksi yang sudah ada {docId}",
    "makePublic": "Simpan untuk publik",
    "firestoreSaveError": "Koonstruksi tidak tersimpan: {error}",
    "pathError": {
      "tooLong": "Name file melebihi panjang maksimum ({limit})",
      "emptyFolders": "Name direktori tidak sahih"
    }
  },
  "sliderFileDimensions": "Ukuran file untik ekspor {widthHeight} pixel",
  "exportFormat": "Format Gambar",
  "nonScalingStroke": "Jangan gunakan skala garis SVG",
  "nonScalingPointRadius": "Jangan gunakan skala garis",
  "nonScalingText": "Jangan gunakan skala teks",

  "svgAnimationAxis": "Pilih sumbu putar",
  "svgAnimationDuration": "Durasi",
  "svgAnimationFrames": "Banyaknya bingkai animasi",
  "svgAnimationRepeat": "Ulang berapa kali",
  "exportHeightErrorMessage": "Masukan bilangan bulat 50-1500",
  "rotationAngle": "Sudut putara {angle}",
  "rotationAngleErrorMessage": "Masukan sudut 5-350 derajat",
  "animationDuration": "Durasi animasi (detik)",
  "animatedDurationErrorMessage": "Masukan durasi 0.1 - 1000 detik.",
  "animationFrames": "Banyaknya bingkai animasi",
  "animatedFramesErrorMessage": "Masukan bilangan bulat 1-200",
  "animationRepeat": "Ulang berapa kali (0 ulang nirhenti)",
  "animatedNumberOfFramesErrorMessage": "Masukan jumlah ulangan (1-200) atau (0 untuk nirhenti)",
  "animatedSVGOptions": "Opsi Animasi SVG",
  "animatedSVGBestViewed": "Gunakan Chrome untuk melihat file yang diekspor.",
  "line": "Garis: ",
  "segment": "Segmen: ",
  "point": "Titik: ",
  "circle": "Lingkaran: "
}
</i18n>
