<template>
  <div class="pt-2 mr-2" id="cloader">
    <!-- Search Bar -->
    <SearchBar v-model="searchKey" :search-result="searchResult" />

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
      v-model="showDialog"
      :tree-items="treeItems"
      :checked-constructions="checkedConstructions"
      @select="handleNodeSelection"
      @move="moveConstruction" />

    <!-- Panels for Constructions -->
    <PanelsContainer
      model="openPanels"
      :filtered-private-constructions="filteredPrivateConstructions"
      :filtered-starred-constructions="filteredStarredConstructions"
      :filtered-public-constructions="filteredPublicConstructions"
      :open-panels="openPanels"
      :open-multiple="openMultiple"
      :search-result="searchResult" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import SearchBar from "@/components/SearchBar.vue";
import ConstructionTreeDialog from "@/components/ConstructionTreeDialog.vue";
import PanelsContainer from "@/components/PanelsContainer.vue";
import FolderActions from "@/components/FolderActions.vue";
import { useSearch } from "@/composables/useSearch";
import { useFolderActions } from "@/composables/useFolderActions";
import { useTreeHandler } from "@/composables/useTreeHandler";
import { useAccountStore } from "@/stores/account";
import { useConstructionStore } from "@/stores/construction";
import { storeToRefs } from "pinia";
import { computed } from "vue";
const openMultiple = ref(false); // Ensure this is declared

const moveConstructionHandler = () => {
  moveConstruction(checkedConstructions.value, parentFolder.value);
};

// Store Setup
const acctStore = useAccountStore();
const constructionStore = useConstructionStore();
const { firebaseUid } = storeToRefs(acctStore);
const { publicConstructions, privateConstructions, starredConstructions } =
  storeToRefs(constructionStore);

// Search Setup
const searchKey = ref("");
const searchResult = ref("");
const {
  filteredPrivateConstructions,
  filteredPublicConstructions,
  filteredStarredConstructions,
  resetFilters
} = useSearch(searchKey.value);

// Tree Items for File Structure
const treeItems = computed(() => {
  return constructionStore.constructionTree.getRoot();
});

// watcher to debug updates to treeItems
watch(
  () => treeItems.value,
  newValue => {
    console.log("Tree Items Updated:", newValue);
  },
  { deep: true }
);

// Tree Handler Setup
const { selectedItems, openPanels, handleNodeSelection } = useTreeHandler(
  treeItems.value
);

// Folder Actions Setup
const { checkedConstructions, moveConstruction } = useFolderActions();
const newFolderName = ref(""); // Define newFolderName in parent
const parentFolder = ref(""); // Define parentFolder in parent

// Dialog State
const showDialog = ref(false);

// Load initial data on mount
onMounted(() => {
  filteredPrivateConstructions.value.push(...privateConstructions.value);
  filteredPublicConstructions.value.push(...publicConstructions.value);
  filteredStarredConstructions.value.push(...starredConstructions.value);
});
</script>
