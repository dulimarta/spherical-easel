<!--
  Constructions are always saved under the authenticated user i.e. under the path
  /users/UUUUUUU/constructions/DDDDDDD

  When a construction is made available to public, a new document will be created
  /constructions/XXXXXXX

-->
<template>
  <div @mouseleave="onListLeave">
    <!-- the class "nodata" is used for testing. Do not remove it -->
    <span v-if="items.length === 0" class="_test_nodata">No data</span>
    <template v-for="(r, pos) in items" :key="`${r.id}-${pos}`">
      <v-hover
        v-slot:default="{ isHovering, props }"
        :close-delay="50"
        :open-delay="100">
        <v-sheet
          @mouseover="onItemHover(r)"
          data-testid="constructionItem"
          class="constructionDetails mb-1 pa-1"
          v-bind="props"
          elevation="4">
          <v-img
            style="flex-grow: 0"
            :src="previewOrDefault(r.preview)"
            :width="64"
            :height="64"
            :aspect-ratio="1"
            cover />
          <span
            :style="{ flexGrow: 1, display: 'flex', flexDirection: 'column' }"
            class="ml-1">
            <div
              class="font-weight-bold d-inline-block text-truncate"
              style="max-width: 11em">
              {{ r.description }}
            </div>
            <div>{{ r.id.substring(0, 6) }} ({{ r.objectCount }} objects)</div>
            <div class="text-caption">{{ r.author }}</div>
            <div
              class="text-caption"
              :style="{
                alignSelf: 'flex-end'
              }">
              {{ r.dateCreated.substring(0, 10) }}
              <v-icon size="x-small">mdi-star</v-icon>
              {{ r.starCount }}
            </div>
          </span>
          <div
            data-testid="buttonOverlay"
            class="constructionDetailsOverlay"
            v-if="isHovering">
            <v-btn
              data-testid="load_btn"
              id="load_btn"
              class="ml-1"
              size="x-small"
              icon="mdi-folder-open"
              color="black"
              @click="handleLoadConstruction(r.id)"></v-btn>

            <v-btn
              data-testid="share_btn"
              v-if="r.publicDocId && allowSharing"
              id="are_btn"
              class="ml-1"
              size="x-small"
              color="black"
              icon="mdi-share"
              @click="handleShareConstruction(r.publicDocId)"></v-btn>
            <v-btn
              data-testid="make_private_btn"
              v-if="r.publicDocId && r.author === userEmail"
              id="make_private_btn"
              class="ml-1"
              size="x-small"
              icon="mdi-lock"
              color="black"
              @click="handleMakePrivate(r.id)"></v-btn>
            <v-btn
              data-testid="make_public_btn"
              v-if="!r.publicDocId && r.author === userEmail"
              id="make_public_btn"
              class="ml-1"
              size="x-small"
              icon="mdi-lock-off"
              color="black"
              @click="handleMakePublic(r.id)"></v-btn>
            <!-- show delete button only for its owner -->
            <v-btn
              data-testid="delete_btn"
              v-if="r.author === userEmail"
              id="delete_btn"
              class="ml-1"
              size="x-small"
              icon="mdi-trash-can"
              color="red"
              @click="handleDeleteConstruction(r.id)"></v-btn>
            <!-- show star button only for public constructs and not mine -->
            <v-btn
              data-testid="star_btn"
              v-if="
                firebaseUid &&
                r.author !== userEmail &&
                !inMyStarredList(r.publicDocId)
              "
              id="star_btn"
              class="ml-1"
              size="x-small"
              color="black"
              icon="mdi-star"
              @click="handleUpdateStarred(r.publicDocId)"></v-btn>
            <v-btn
              data-testid="unstar_btn"
              v-if="inMyStarredList(r.publicDocId)"
              id="unstar_btn"
              class="ml-1"
              size="x-small"
              icon="mdi-star-off"
              color="black"
              @click="handleUpdateUnstarred(r.publicDocId)"></v-btn>
            <v-tooltip text="Load" activator="#load_btn" location="top" />
            <v-tooltip text="Share" activator="#share_btn" location="top" />
            <v-tooltip text="Delete" activator="#delete_btn" location="top" />
            <v-tooltip text="Star" location="top" activator="#star_btn" />
            <v-tooltip text="Unstar" location="top" activator="#unstar_btn" />
            <v-tooltip
              text="Make Private"
              location="top"
              activator="#make_private_btn" />
            <v-tooltip
              text="Make public"
              location="top"
              activator="#make_public_btn" />
          </div>
        </v-sheet>
        <v-divider />
      </v-hover>
    </template>
  </div>
  <Dialog
    ref="constructionLoadDialog"
    class="dialog"
    :title="t('confirmationRequired')"
    yes-text="Proceed"
    :yesAction="doLoadConstruction"
    no-text="Cancel"
    max-width="50%">
    {{ t("unsavedObjects") }}
  </Dialog>
  <Dialog
    ref="constructionShareDialog"
    :title="t('confirmationRequired')"
    yes-text="Copy URL"
    :yesAction="doShareConstruction"
    no-text="Cancel"
    max-width="50%">
    {{ t("copyURL", { docId: sharedDocId }) }}
  </Dialog>

  <v-snackbar
    v-model="showDeleteWarning"
    location="top"
    :timeout="ACTION_DELAY">
    {{ t("deleteWarning") }}
    <template #actions>
      <v-btn @click="cancelDelete" color="warning">{{ t("undo") }}</v-btn>
    </template>
  </v-snackbar>

  <v-snackbar
    v-model="showPrivateWarning"
    location="top"
    :timeout="ACTION_DELAY">
    {{ t("privateWarning") }}
    <template #actions>
      <v-btn @click="cancelMakePrivate" color="warning">{{ t("undo") }}</v-btn>
    </template>
  </v-snackbar>
  <v-snackbar
    v-model="showPublicWarning"
    location="top"
    :timeout="ACTION_DELAY">
    {{ t("publicWarning") }}
    <template #actions>
      <v-btn @click="cancelMakePublic" color="warning">{{ t("undo") }}</v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts" setup>
import {
  type ActionMode,
  type ConstructionScript,
  SphericalConstruction
} from "@/types";
import Dialog, { DialogAction } from "./Dialog.vue";
import { useSEStore } from "@/stores/se";
import { useAccountStore } from "@/stores/account";
import { Ref, ref } from "vue";
import { storeToRefs } from "pinia";
import EventBus from "@/eventHandlers/EventBus";
import { run } from "@/commands/CommandInterpreter";
import { SENodule } from "@/models/internal";
import { Matrix4 } from "three";
import { useI18n } from "vue-i18n";
import { useConstructionStore } from "@/stores/construction";
import { useClipboard, usePermission } from "@vueuse/core";
const props = defineProps<{
  items: Array<SphericalConstruction>;
  allowSharing: boolean;
}>();
const constructionLoadDialog: Ref<DialogAction | null> = ref(null);
const constructionShareDialog: Ref<DialogAction | null> = ref(null);
const seStore = useSEStore();
const acctStore = useAccountStore();
const constructionStore = useConstructionStore();
const selectedDocId = ref("");
const sharedDocId = ref("");
const showDeleteWarning = ref(false);
const showPrivateWarning = ref(false);
const showPublicWarning = ref(false);
const { constructionDocId, userEmail, firebaseUid, starredConstructionIDs } =
  storeToRefs(acctStore);
const { hasUnsavedNodules, seNodules } = storeToRefs(seStore);
const { t } = useI18n({ useScope: "local" });

const clipboardAPI = useClipboard();
// const readPermission = usePermission("clipboard-read");
// const writePermission = usePermission("clipboard-write");
//setup for starred construction list
let lastDocId: string | null = null;
let actionTimer: any;
const ACTION_DELAY = 3000;

function previewOrDefault(dataUrl: string | undefined): string {
  return dataUrl ? dataUrl : "/logo.png";
}

function inMyStarredList(docId: string | undefined): boolean {
  // console.debug(`Starred? ${docId}`, starredConstructions.value.map(s => `ID ${s.id} PUB ${s.publicDocId}`).join(" ") )
  if (!docId) return false;
  return starredConstructionIDs.value.some(
    z => constructionStore.parseStarredID(z).id === docId
  );
}
// TODO: the onXXXX functions below are not bug-free yet
// There is a potential race-condition when the mouse moves too fast
// or when the mouse moves while a new construction is being loaded
function onItemHover(s: SphericalConstruction): void {
  if (lastDocId === s.id) {
    // console.debug(`Existing hover on ${s.id}`);
    return; // Prevent double hovers?
  }
  // console.debug(`Last hover docID ${lastDocId} hovered on ${s.id}`);
  lastDocId = s.id;
  EventBus.fire("preview-construction", s);
}

function onListLeave(/*_ev: MouseEvent*/): void {
  EventBus.fire("preview-construction", null);
  lastDocId = "";
}

function handleLoadConstruction(docId: string): void {
  selectedDocId.value = docId;
  if (hasUnsavedNodules.value) constructionLoadDialog.value?.show();
  else {
    constructionDocId.value = docId;
    EventBus.fire("preview-construction", null);
    // Delay the actual loading so the preview has a chance to settle down
    setTimeout(() => {
      doLoadConstruction();
    }, 100);
  }
}
function doLoadConstruction(/*event: { docId: string }*/): void {
  constructionLoadDialog.value!.hide();
  let script: ConstructionScript | null = null;
  let rotationMatrix: Matrix4;
  // Search in public list
  let pos = props.items.findIndex(
    (c: SphericalConstruction) => c.id === selectedDocId.value
  );
  let toolSet: ActionMode[] | undefined = undefined;
  if (pos >= 0) {
    script = props.items[pos].parsedScript;
    rotationMatrix = props.items[pos].sphereRotationMatrix;
    if (props.items[pos].tools) toolSet = props.items[pos].tools;
  } else rotationMatrix = new Matrix4();
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

  if (script !== null) {
    seStore.removeAllFromLayers();
    seStore.init();
    SENodule.resetAllCounters();
    // Nodule.resetIdPlottableDescriptionMap(); // Needed?
    EventBus.fire("show-alert", {
      key: t("constructionLoaded", { docId: selectedDocId.value }),
      type: "info"
    });
    // It looks like we have to apply the rotation matrix
    // before running the script
    seStore.setRotationMatrix(rotationMatrix);
    run(script);
    //seStore.rotateSphere(rotationMatrix!.invert());
    seStore.clearUnsavedFlag();
    EventBus.fire("construction-loaded", {});
    seStore.setActionMode("move");
    console.debug("# of objects", seNodules.value.length);
    // After fixing the locationVector.copy() bug in the
    // parse() functions, the following call to updateDisplay
    // becomes unnecessary
    // seNodules.value.forEach(obj => {
    // obj.ref?.stylize(DisplayStyle.ApplyCurrentVariables)
    // })
  }
}

function handleDeleteConstruction(docId: string): void {
  if (firebaseUid.value) {
    showDeleteWarning.value = true;
    actionTimer = setTimeout(async () => {
      const deleted = await constructionStore.deleteConstruction(
        firebaseUid.value!!,
        docId
      );
      if (deleted)
        EventBus.fire("show-alert", {
          key: t("constructionDeleted", { docId }),
          type: "success"
        });
      else
        EventBus.fire("show-alert", {
          key: t("constructionDeleteFailed", { docId }),
          type: "error"
        });
    }, ACTION_DELAY);
  } else {
    EventBus.fire("show-alert", {
      key: t("deleteAttemptNoUid"),
      type: "error"
    });
  }
}

function handleMakePrivate(docId: string): void {
  showPrivateWarning.value = true;
  actionTimer = setTimeout(async () => {
    const success = await constructionStore.makePrivate(docId);
    if (success)
      EventBus.fire("show-alert", {
        key: t("constructionPrivated", { docId }),
        type: "success"
      });
    else
      EventBus.fire("show-alert", {
        key: t("constructionPrivateFailed", { docId }),
        type: "error"
      });
  }, ACTION_DELAY);
}

function handleMakePublic(docId: string) {
  showPublicWarning.value = true;
  actionTimer = setTimeout(async () => {
    const success = await constructionStore.makePublic(docId);
    if (success)
      EventBus.fire("show-alert", {
        key: t("constructionPrivated", { docId }),
        type: "success"
      });
    else
      EventBus.fire("show-alert", {
        key: t("constructionPrivateFailed", { docId }),
        type: "error"
      });
  }, ACTION_DELAY);
}

function cancelDelete() {
  showDeleteWarning.value = false;
  clearTimeout(actionTimer);
}

function cancelMakePrivate() {
  showPrivateWarning.value = false;
  clearTimeout(actionTimer);
}

function cancelMakePublic() {
  showPublicWarning.value = false;
  clearTimeout(actionTimer);
}

function handleShareConstruction(docId: string | undefined) {
  if (!docId) return;
  sharedDocId.value = docId;
  constructionShareDialog.value?.show();
}

async function handleUpdateStarred(
  publicDocId: string | undefined
): Promise<void> {
  if (publicDocId) {
    await constructionStore.starConstruction(publicDocId);
    EventBus.fire("show-alert", {
      key: t("updateStarSuccessful"),
      type: "success"
    });
  } else {
    EventBus.fire("show-alert", {
      key: t("updateStarFailed"),
      type: "error"
    });
  }
}

async function handleUpdateUnstarred(docId: string | undefined): Promise<void> {
  if (docId) {
    constructionStore.unstarConstruction(docId);
    EventBus.fire("show-alert", {
      key: t("updateStarSuccessful"),
      type: "success"
    });
  } else {
    EventBus.fire("show-alert", {
      key: t("updateStarFailed"),
      type: "error"
    });
  }
}

function doShareConstruction() {
  clipboardAPI.copy(`https://easelgeo.app/construction/${sharedDocId.value}`);
}
</script>

<style scoped>
.constructionDetails {
  position: relative;
  display: flex;
  flex-direction: row;
}
.constructionDetailsOverlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 2px;
  background-color: #0f750f6a;
}
.constructionButtons {
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  /* width: 100%; */
  /* background-color: red; */
}
.custom-list-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.list-item-content {
  display: flex;
  width: 100%;
}

.item-image {
  margin-right: 0.5rem;
}

.item-details {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
}

.star-rating-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.date-and-star {
  display: flex;
  align-items: center;
}

.star-and-count {
  display: flex;
  align-items: center;
  color: #4b3c11;
}

.star {
  margin-right: 0.25rem;
  color: #ffc107;
}

.star.filled {
  color: #ffc107;
}
</style>
<i18n locale="en" lang="json">
{
  "deleteWarning": "Your construction {docId} is about to be deleted",
  "deleteAttemptNoUid": "Attempt to delete a construction when owner in unknown",
  "constructionDeleted": "Construction {docId} is successfully removed",
  "constructionDeleteFailed": "Unable to delete construction {docId}",
  "privateWarning": "Your construction {docId} is about to be made private",
  "publicWarning": "Your construction {docId} is about to be made public",
  "privateAttemptNoUid": "Attempt to private a construction when owner in unknown",
  "constructionPrivated": "Construction {docId} is now private",
  "constructionPrivateFailed": "Unable to make construction {docId} private",
  "updateStarNoUid": "Attempt to unstar a construction when owner in unknown",
  "updateStarSuccessful": "Star list has been updated",
  "updateStarFailed": "Unable to update star list",
  "constructionLoaded": "Construction {docId} is successfully loaded to canvas",
  "confirmationRequired": "Confirmation Required",
  "copyURL": "Copy URL https://easelgeo.app/construction/{docId} to clipboard?",
  "unsavedObjects": "Loading a new construction will delete the unsaved work",
  "undo": "Undo"
}
</i18n>
