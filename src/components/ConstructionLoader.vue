<template>
  <div
    class="mr-1"
    id="cloader"
    :style="{
      display: 'flex',
      flexDirection: 'column'
    }">
    <!-- Button to Show Dialog -->
    <div
      class="mb-4"
      v-if="firebaseUid && firebaseUid.length > 0"
      :style="{ alignSelf: 'flex-end' }">
      <v-btn id="showFolder" @click="showDialog = true">
        {{ t("showFolders") }}
      </v-btn>
      <v-tooltip activator="#showFolder">
        {{ t("constructionOrganization") }}
      </v-tooltip>
    </div>

    <!-- Dialog with Treeview -->
    <ConstructionTreeDialog
      v-if="firebaseUid && firebaseUid.length > 0"
      v-model:visible="showDialog"
      v-model:loadFolder="folderToLoad" />

    <!-- Panels for Constructions -->
    <PanelsContainer :selected-folder="folderToLoad" />
  </div>
</template>

<script lang="ts" setup>
import { ref, Ref } from "vue";
import ConstructionTreeDialog from "@/components/ConstructionTreeDialog.vue";
import PanelsContainer from "@/components/PanelsContainer.vue";
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

// Store Setup
const acctStore = useAccountStore();
const { firebaseUid } = storeToRefs(acctStore);

// Dialog State
const showDialog = ref(false);
const folderToLoad: Ref<string> = ref("");
</script>
<i18n locale="en" lang="json">
{
  "constructionOrganization": "Organize Construction Folders",
  "showFolders": "Show Folders"
}
</i18n>
