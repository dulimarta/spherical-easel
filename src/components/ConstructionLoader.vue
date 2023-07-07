<template>
  <div>
    <!-- <div class="text-h6" v-if="firebaseUid.length > 0">
      {{ $t(`constructions.privateConstructions`) }}
    </div> -->
    <!--- WARNING: the "id" attribs below are needed for testing -->
    <v-expansion-panels>
      <v-expansion-panel v-if="privateConstructions !== null">
        <v-expansion-panel-title>
          {{ t(`constructions.privateConstructions`) }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            id="privateList"
            :allow-sharing="true"
            :items="privateConstructions"
            v-on:share-requested="doShareConstruction"
            v-on:delete-requested="shouldDeleteConstruction" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ t(`constructions.publicConstructions`) }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            id="publicList"
            :items="publicConstructions"
            :allow-sharing="false"
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
import { computed, Ref, ref } from "vue";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import { run } from "@/commands/CommandInterpreter";
import { ConstructionScript, SphericalConstruction, ActionMode } from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import { SENodule } from "@/models/SENodule";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import ConstructionList from "@/components/ConstructionList.vue";
import { Matrix4 } from "three";
import { useAccountStore } from "@/stores/account";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { getAuth } from "firebase/auth";
import { getStorage, ref as storageRef, deleteObject } from "firebase/storage";
import { useI18n } from "vue-i18n";
import { useConstruction } from "@/composables/constructions";
// type PublicConstructionReferencee = {
//   author: string;
//   constructionDocId: string;
// };
const acctStore = useAccountStore();
const seStore = useSEStore();
const { t } = useI18n();
const { hasUnsavedNodules } = storeToRefs(seStore);
const appAuth = getAuth();
const appDB = getFirestore();
const appStorage = getStorage();
const { publicConstructions, privateConstructions } = useConstruction();
// let snapshotListener: Array<() => void> = [];
// const privateConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const shareURL = ref("");
const selectedDocId = ref("");

const constructionShareDialog: Ref<DialogAction | null> = ref(null);
const constructionDeleteDialog: Ref<DialogAction | null> = ref(null);
const docURL: Ref<HTMLSpanElement | null> = ref(null);

const firebaseUid = computed((): string => {
  return appAuth.currentUser?.uid ?? "";
});

function shouldLoadConstruction(docId: string): void {
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
  if (privateConstructions.value !== null) {
    const pos = privateConstructions.value.findIndex(
      (c: SphericalConstruction) => c.id === selectedDocId.value
    );
    constructionDeleteDialog.value?.hide();
    if (pos < 0) return;
    const victimDetails = privateConstructions.value[pos];
    if (victimDetails.script.startsWith("https://")) {
      await deleteObject(
        storageRef(appStorage, `/scripts/${selectedDocId.value}`)
      );
    }
    if (victimDetails.preview) {
      await deleteObject(
        storageRef(appStorage, `/scripts/${selectedDocId.value}`)
      );
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
          key: t("constructionDeleted", { docId: selectedDocId.value }),
          type: "info"
        });
      })
      .catch((err: any) => {
        console.debug("Unable to delete", selectedDocId.value, err);
      });
  } else {
    EventBus.fire("show-alert", {
      key: t("failedToDelete", { docId: selectedDocId.value }),
      type: "info"
    });
  }
}
</script>
<i18n locale="en">
{
  "constructionDeleted": "Construction {docId} was successfully removed",
  "failedToDelete": "Unable to delete construction {docId}"
}
</i18n>
