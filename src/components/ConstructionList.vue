<!--
  Constructions are always saved under the authenticated user i.e. under the path
  /users/UUUUUUU/constructions/DDDDDDD

  When a construction is made available to public, a new document will be created
  /constructions/XXXXXXX

-->
<template>
  <div>
    <!-- the class "nodata" is used for testing. Do not remove it -->
    <span v-if="items.length === 0" class="_test_nodata">No data</span>
    <v-list lines="three" @mouseleave="onListLeave">
      <template v-for="(r, pos) in items" :key="r.id">
        <!-- <template>  -->
        <v-hover v-slot:default="{ isHovering, props }">
          <v-list-item
            @mouseover.capture="onItemHover(r)"
            class="_test_constructionItem custom-list-item"
            v-bind="props">
            <template #prepend>
              <div class="item-image">
                <img
                  :src="previewOrDefault(r.preview)"
                  class="mr-1"
                  alt="preview"
                  width="64" />
              </div>
            </template>
            <!--- show a Load button as an overlay when the mouse hovers -->
            <v-overlay
              :key="`${r.id}-overlay`"
              contained
              :model-value="isHovering!"
              class="_test_constructionOverlay align-center justify-center"
              scrim="#00007F">
              <!-- the class "constructionItem" is used for testing. Do not remove it -->
              <div class="constructionItem">
                <v-tooltip text="Load" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      id="_test_loadfab"
                      class="mx-1"
                      size="x-small"
                      color="secondary"
                      icon="mdi-file-document-edit"
                      @click="handleLoadConstruction(r.id)"></v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Share" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      v-if="r.publicDocId && allowSharing"
                      id="_test_sharefab"
                      class="mx-1"
                      size="x-small"
                      color="secondary"
                      icon="mdi-share"
                      @click="handleShareConstruction(r.publicDocId)"></v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Star" location="top">
                  <template #activator="props">
                    <!-- show star button only for public constructs and not mine -->
                    <v-btn
                      v-bind="props"
                      v-if="
                        firebaseUid &&
                        r.author !== userEmail &&
                        !inMyStarredList(r.publicDocId)
                      "
                      id="_test_starConstruct"
                      class="mx-1"
                      size="x-small"
                      color="yellow"
                      icon="mdi-star"
                      @click="handleUpdateStarred(r.publicDocId)"></v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Delete" location="top">
                  <template #activator="{ props }">
                    <!-- show delete button only for its owner -->
                    <v-btn
                      v-bind="props"
                      v-if="r.author === userEmail"
                      id="_test_deletefab"
                      class="mx-1"
                      size="x-small"
                      icon="mdi-trash-can"
                      color="red"
                      @click="handleDeleteConstruction(r.id)"></v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Make private" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      v-if="r.publicDocId && r.author === userEmail"
                      id="_test_make_private"
                      class="mx-1"
                      size="x-small"
                      icon="mdi-lock"
                      color="yellow"
                      @click="handleMakePrivate(r.id)"></v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Make public" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      v-if="!r.publicDocId && r.author === userEmail"
                      id="_test_make_public"
                      class="mx-1"
                      size="x-small"
                      icon="mdi-lock-off"
                      color="yellow"
                      @click="handleMakePublic(r.id)"></v-btn>
                    <!-- converted to r.id instead r.publicDocId -->
                    <!-- show unstar button only for starred construction list items-->
                  </template>
                </v-tooltip>
                <v-tooltip text="Unstar" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      v-if="inMyStarredList(r.publicDocId)"
                      id="_test_unstarfab"
                      class="mx-1"
                      size="x-small"
                      icon="mdi-star-off"
                      color="blue"
                      @click="handleUpdateUnstarred(r.publicDocId)"></v-btn>
                  </template>
                </v-tooltip>
              </div>
            </v-overlay>
            <v-list-item-title class="text-truncate">
              {{ r.description || "N/A" }}
            </v-list-item-title>
            <v-list-item-subtitle>
              <code>{{ r.id.substring(0, 5) }}</code>
              {{ r.objectCount }} objects,
              <span class="text-truncate">{{ r.author }}</span>
              <!-- currently not seeing the CSS applied-->
              <div class="star-rating-line">
                <div class="date-and-star">
                  {{ r.dateCreated.substring(0, 10) }}
                </div>
                <div class="star-and-count">
                  <v-icon size="x-small" color="orange-darken-4">mdi-star</v-icon>
                  <!-- Always filled star -->
                  {{ r.starCount }}
                </div>
              </div>
            </v-list-item-subtitle>
            <v-divider />
          </v-list-item>
        </v-hover>
        <!-- </template> -->
      </template>
    </v-list>
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
import { type ActionMode, type ConstructionScript, SphericalConstruction } from "@/types";
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
const { starredConstructions } = storeToRefs(constructionStore);
const selectedDocId = ref("");
const sharedDocId = ref("");
const showDeleteWarning = ref(false);
const showPrivateWarning = ref(false);
const showPublicWarning = ref(false);
const { constructionDocId, userEmail, firebaseUid } = storeToRefs(acctStore);
const { hasUnsavedNodules } = storeToRefs(seStore);
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
  return (
    starredConstructions.value.findIndex(z => z.publicDocId === docId) >= 0
  );
}
// TODO: the onXXXX functions below are not bug-free yet
// There is a potential race-condition when the mouse moves too fast
// or when the mouse moves while a new construction is being loaded
function onItemHover(s: SphericalConstruction): void {
  if (lastDocId === s.id) {
    console.debug(`Existing hover on ${s.id}`);
    return; // Prevent double hovers?
  }
  console.debug(`Last hover docID ${lastDocId} hovered on ${s.id}`);
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
    doLoadConstruction();
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
    // update all
    seStore.updateDisplay();

    // set the mode to move because chances are high that the user wants this mode after loading.
    seStore.setActionMode("move");
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
.constructionItem {
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
