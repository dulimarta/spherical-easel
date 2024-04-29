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
      <template v-for="(r, pos) in items" :key="r.id" >
        <!-- <template>  -->
        <v-hover v-slot:default="{ isHovering, props }">
          <v-list-item @mouseover.capture="onItemHover(r)"
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
              :model-value="isHovering"
              class="_test_constructionOverlay align-center justify-center"
              scrim="#00007F">
              <!-- the class "constructionItem" is used for testing. Do not remove it -->
              <div class="constructionItem">
                <v-btn
                  id="_test_loadfab"
                  class="mx-1"
                  size="x-small"
                  color="secondary"
                  icon="mdi-file-document-edit"
                  @click="handleLoadConstruction(r.id)"></v-btn>
                <v-btn
                  v-if="r.publicDocId"
                  id="_test_sharefab"
                  class="mx-1"
                  size="x-small"
                  color="secondary"
                  icon="mdi-share"
                  @click="handleShareConstruction(r.publicDocId)"></v-btn>
                <!-- show star button only for public constructs -->
                <v-btn
                  v-if="
                    r.publicDocId &&
                    r.author !== userEmail &&
                    starredIDs.length > 0 &&
                    !starredIDs.includes(r.id)
                  "
                  id="_test_starConstruct"
                  class="mx-1"
                  size="x-small"
                  color="yellow"
                  icon="mdi-star"
                  @click="handleUpdateStarred(r.publicDocId)"></v-btn>
                <!-- show delete button only for its owner -->
                <v-btn
                  v-if="r.author === userEmail"
                  id="_test_deletefab"
                  class="mx-1"
                  size="small"
                  icon="$deleteConstruction"
                  color="red"
                  @click="handleDeleteConstruction(r.id)"></v-btn>
                <v-btn
                  v-if="r.publicDocId && r.author === userEmail"
                  id="_test_deletefab"
                  class="mx-1"
                  size="small"
                  icon="$privateConstruction"
                  color="red"
                  @click="handleMakePrivate(r.publicDocId)"></v-btn>
                <!-- converted to r.id instead r.publicDocId -->
                <!-- show unstar button only for starred construction list items-->
                <v-btn
                  v-if="starredIDs.includes(r.id)"
                  id="_test_unstarfab"
                  class="mx-1"
                  size="small"
                  icon="$unstarConstruction"
                  color="blue"
                  @click="handleUpdateUnstarred(r.id)"></v-btn>
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
                  <span class="star filled">&#9733;</span>
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
    :timeout="DELETE_DELAY">
    {{ t("deleteWarning") }}
    <template #actions>
      <v-btn @click="cancelDelete" color="warning">{{ t("undo") }}</v-btn>
    </template>
  </v-snackbar>

  <v-snackbar
    v-model="showPrivateWarning"
    location="top"
    :timeout="DELETE_DELAY">
    {{ t("privateWarning") }}
    <template #actions>
      <v-btn @click="cancelDelete" color="warning">{{ t("undo") }}</v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts" setup>
import { ActionMode, ConstructionScript, SphericalConstruction } from "@/types";
import Dialog, { DialogAction } from "./Dialog.vue";
import { useSEStore } from "@/stores/se";
import { useAccountStore } from "@/stores/account";
import { getAuth } from "firebase/auth";
import { computed, Ref, ref } from "vue";
import { storeToRefs } from "pinia";
import EventBus from "@/eventHandlers/EventBus";
import { run } from "@/commands/CommandInterpreter";
import { SENodule } from "@/models/internal";
import { Matrix4 } from "three";
import { useI18n } from "vue-i18n";
import { useConstruction } from "@/composables/constructions";
import { useClipboard, usePermission } from "@vueuse/core";
import { useUserAccountStore } from "@/stores/userAccountStore";
const { userProfile } = storeToRefs(useUserAccountStore());
import { idText } from "typescript";
import { arrayRemove } from "firebase/firestore";
const props = defineProps<{
  items: Array<SphericalConstruction>;
  allowSharing: boolean;
}>();
const constructionLoadDialog: Ref<DialogAction | null> = ref(null);
const constructionShareDialog: Ref<DialogAction | null> = ref(null);
const seStore = useSEStore();
const acctStore = useAccountStore();
const appAuth = getAuth();
const selectedDocId = ref("");
const sharedDocId = ref("");
const starredDocId = ref("");
const showDeleteWarning = ref(false);
const showPrivateWarning = ref(false);
const { constructionDocId } = storeToRefs(acctStore);
const { hasUnsavedNodules } = storeToRefs(seStore);
const { t } = useI18n({ useScope: "local" });
// const { deleteConstruction } = useConstruction();
// const { makePrivate } =  useConstruction();
// const { starConstruction } = useConstruction();
// const { unstarConstruction } = useConstruction();
const {
  deleteConstruction,
  makePrivate,
  starConstruction,
  unstarConstruction
} = useConstruction();
const clipboardAPI = useClipboard();
const readPermission = usePermission("clipboard-read");
const writePermission = usePermission("clipboard-write");
//setup for starred construction list
const starredIDs = userProfile.value?.userStarredConstructions || [];
let lastDocId: string | null = null;
let deleteTimer: any;
const DELETE_DELAY = 3000;

const userEmail = computed((): string => {
  return appAuth.currentUser?.email ?? "";
});

function previewOrDefault(dataUrl: string | undefined): string {
  return dataUrl ? dataUrl : "/logo.png";
}

// TODO: the onXXXX functions below are not bug-free yet
// There is a potential race-condition when the mouse moves too fast
// or when the mouse moves while a new construction is being loaded
async function onItemHover(s: SphericalConstruction): Promise<void> {
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

async function doDeleteConstruction(docId: string) {
  const uid = appAuth.currentUser?.uid;
  if (uid) {
    const deleted = await deleteConstruction(uid, docId);
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
  } else {
    EventBus.fire("show-alert", {
      key: t("deleteAttemptNoUid"),
      type: "error"
    });
  }
}

async function doMakePrivate(publicDocId: string) {
  const privated = await makePrivate(publicDocId);
  if (privated)
    EventBus.fire("show-alert", {
      key: t("constructionPrivated", { publicDocId }),
      type: "success"
    });
  else
    EventBus.fire("show-alert", {
      key: t("constructionPrivateFailed", { publicDocId }),
      type: "error"
    });
}

function handleDeleteConstruction(docId: string): void {
  showDeleteWarning.value = true;
  deleteTimer = setTimeout(() => {
    doDeleteConstruction(docId);
  }, 3500);
}

function handleMakePrivate(publicDocId: string | undefined): void {
  if (!publicDocId) return;
  showPrivateWarning.value = true;
  deleteTimer = setTimeout(() => {
    doMakePrivate(publicDocId);
  }, 3500);
}

function cancelDelete() {
  showDeleteWarning.value = false;
  clearTimeout(deleteTimer);
}

function cancelPrivate() {
  showPrivateWarning.value = false;
  clearTimeout(deleteTimer);
}

function handleShareConstruction(docId: string | undefined) {
  if (!docId) return;
  sharedDocId.value = docId;
  constructionShareDialog.value?.show();
}

//implement for unstarring construction
async function handleUpdateStarred(docId: string | undefined): Promise<void> {
  if (!docId) return;
  const updated = await starConstruction(docId);
  if (updated) {
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

async function handleUpdateUnstarred(docId: string): Promise<void> {
  const updated = await unstarConstruction(docId);
  if (updated) {
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
<i18n locale="en">
{
  "deleteWarning": "You construction {docId} is about to be deleted",
  "deleteAttemptNoUid": "Attempt to delete a construction when owner in unknown",
  "constructionDeleted": "Construction {docId} is succesfully removed",
  "constructionDeleteFailed": "Unable to delete construction {docId}",
  "privateWarning": "Your construction {publicDocId} is about to be made private",
  "privateAttemptNoUid": "Attempt to private a construction when owner in unknown",
  "constructionPrivated": "Construction {publicDocId} is now private",
  "constructionPrivateFailed": "Unable to make construction {publicDocId} private",
  "updateStarNoUid": "Attempt to unstar a construction when owner in unknown",
  "updateStarSuccessful": "Starlist has been updated",
  "updateStarFailed": "Unable to update starlist",
  "constructionLoaded": "Construction {docId} is succesfully loaded to canvas",
  "confirmationRequired": "Confirmation Required",
  "copyURL": "Copy URL https://easelgeo.app/construction/{docId} to clipboard?",
  "unsavedObjects": "Loading a new construction will delete the unsaved work",
  "undo": "Undo"
}
</i18n>
