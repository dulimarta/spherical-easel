<template>
  <div class="pt-2 mr-2" id="cloader">
    <!-- Button to Show Dialog -->
    <div class="mb-4" v-if="firebaseUid && firebaseUid.length > 0">
      <v-btn
        color="#40A082"
        class="mt-4"
        @click="showDialog = true"
        block
        max-width="300px">
        Construction Organization
      </v-btn>
    </div>

    <!-- Dialog with Treeview -->
    <ConstructionTreeDialog
      v-if="firebaseUid && firebaseUid.length > 0"
      v-model:visible="showDialog"
      v-model:loadFolder="folderToLoad"
      @move="" />

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

// Store Setup
const acctStore = useAccountStore();
const { firebaseUid } = storeToRefs(acctStore);

// Dialog State
const showDialog = ref(false);
const folderToLoad: Ref<string> = ref("");
</script>
