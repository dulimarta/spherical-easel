<template>
  <div>
    <!-- <div class="text-h6" v-if="firebaseUid.length > 0">
    </div> -->
    <!--- WARNING: the "id" attribs below are needed for testing -->
    <v-expansion-panels>
      <v-expansion-panel v-if="privateConstructions !== null">
        <v-expansion-panel-title>
          {{ t(`privateConstructions`) }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            :allow-sharing="true"
            :items="privateConstructions" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ t(`publicConstructions`) }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            :items="publicConstructions"
            :allow-sharing="false" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

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
  </div>
</template>

<style scoped>
#shareTextArea {
  font-family: "Courier New", Courier, monospace;
}
</style>

<script lang="ts" setup>
import { Ref, ref } from "vue";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import ConstructionList from "@/components/ConstructionList.vue";
// import { useAccountStore } from "@/stores/account";
// import { useSEStore } from "@/stores/se";
import { useI18n } from "vue-i18n";
import { useConstruction } from "@/composables/constructions";
// type PublicConstructionReferencee = {
//   author: string;
//   constructionDocId: string;
// };
// const acctStore = useAccountStore();
// const seStore = useSEStore();
const { t } = useI18n();
// const { hasUnsavedNodules } = storeToRefs(seStore);
// const appAuth = getAuth();
// const appDB = getFirestore();
// const appStorage = getStorage();
const { publicConstructions, privateConstructions } = useConstruction();
// let snapshotListener: Array<() => void> = [];
// const privateConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const shareURL = ref("");

const constructionShareDialog: Ref<DialogAction | null> = ref(null);
const docURL: Ref<HTMLSpanElement | null> = ref(null);

function doShareConstruction(event: { docId: string }): void {
  shareURL.value = `${location.host}/construction/${event.docId}`;
  constructionShareDialog.value?.show();
}

function doCopyURL(): void {
  (docURL.value as HTMLTextAreaElement).select();
  document.execCommand("copy");
  constructionShareDialog.value?.hide();
}
</script>
<i18n locale="en">
{
  "constructionDeleted": "Construction {docId} was successfully removed",
  "privateConstructions": "Private Constructions",
  "publicConstructions": "Public Constructions",
  "failedToDelete": "Unable to delete construction {docId}"
}
</i18n>
