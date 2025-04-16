<template>
  <v-dialog v-model="visible" max-width="800px">
    <v-card color="#E8F5F1" theme="light" style="overflow: hidden">
      <v-card-title class="text-mint-dark">
        {{
          selectedTab === 0 ? "Load Construction Folders" : "Move Constructions"
        }}
      </v-card-title>

      <!-- v-tabs for navigation -->
      <v-tabs
        v-model="selectedTab"
        background-color="transparent"
        color="#40A082">
        <v-tab>LOAD</v-tab>
        <v-tab>MOVE</v-tab>
      </v-tabs>

      <v-window v-model="selectedTab">
        <!-- Load View -->
        <v-window-item :value="0">
          <v-card-text style="padding: 24px !important; max-width: 100%">
            <div class="tree-container">
              <v-treeview
                v-model:activated="loadFolderInternal"
                :items="loadFolders"
                hoverable
                activatable
                item-title="title"
                item-value="id"
                color="#40A082"
                return-object
                active-strategy="single-independent" />
            </div>
          </v-card-text>
        </v-window-item>

        <!-- Move View -->
        <v-window-item :value="1">
          <v-card-text style="padding: 16px !important">
            <v-row>
              <v-col cols="5">
                <div class="text-subtitle-1 mb-2 text-center font-weight-bold">
                  {{ t("selectConstructionsLabel") }}
                </div>
              </v-col>
              <v-col cols="2"></v-col>
              <v-col cols="5">
                <div class="text-subtitle-1 mb-2 text-center font-weight-bold">
                  {{ t("destinationFolderLabel") }}
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="5">
                <div class="tree-container">
                  <v-treeview
                    v-model:selected="checkedConstructions"
                    :items="treeItems"
                    hoverable
                    selectable
                    item-value="id"
                    item-title="title"
                    color="#40A082"
                    return-object></v-treeview>
                </div>
              </v-col>

              <v-col cols="2" class="d-flex align-center justify-center">
                <v-btn
                  color="#40A082"
                  @click="confirmMove"
                  class="square-button"
                  min-width="40px"
                  width="40px"
                  height="40px">
                  <v-icon>mdi-arrow-right</v-icon>
                </v-btn>
              </v-col>

              <v-col cols="5">
                <div class="tree-container">
                  <v-treeview
                    v-model:activated="targetFolder"
                    :items="
                      moveFolders?.filter(
                        root => root.id === allowedMoveFoldersRoot
                      )
                    "
                    item-props
                    hoverable
                    activatable
                    item-value="id"
                    item-title="title"
                    color="#40A082"
                    active-strategy="single-independent"
                    return-object />
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-window-item>
      </v-window>

      <!-- Buttons at bottom -->
      <v-card-actions style="padding: 16px 24px !important">
        <v-spacer></v-spacer>
        <v-btn
          v-if="selectedTab === 0"
          color="#40A082"
          class="mr-2"
          @click="confirmLoad">
          LOAD SELECTED
        </v-btn>
        <v-btn color="#40A082" variant="outlined" @click="visible = false">
          CLOSE
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { defineEmits, ref, Ref, onMounted, watch } from "vue";
import { VTreeview } from "vuetify/labs/VTreeview";
import { useConstructionStore } from "@/stores/construction"; // Adjust the import path as needed
import { ConstructionPath, TreeviewNode } from "@/types/ConstructionTypes";
import { watchDebounced } from "@vueuse/core";
import { useI18n } from "vue-i18n";

// Get the translation function
const { t } = useI18n();

/** v-model that controls visibility of the overall component */
const visible = defineModel("visible");

/** v-model that passes the selected folder to load in and out of this component */
const loadFolder = defineModel("loadFolder");

/** stores the index of the currently selected v-tab */
const selectedTab = ref(0);

/** reference to the construction store's properties and functions */
const constructionStore = useConstructionStore();

//
// move functionality
//

/**
 * folders to display in the move view; this is different than the load view
 * so that disabled folders are only disabled in the move view.
 */
const moveFolders: Ref<TreeviewNode[] | undefined> = ref(undefined);

/** the root folder string to match against when determining which root folder to show between public/owned/starred */
const allowedMoveFoldersRoot: Ref<String> = ref("");

/** the full construction tree excluding the public branch but including all constructions. */
const treeItems: Ref<TreeviewNode[] | undefined> = ref(undefined);

/** which constructions (currently max 1) are selected in the move dialog's left side */
const checkedConstructions = ref([]);

/** which folder is selected in the move dialog's right side */
const targetFolder = ref([]);

// Confirm move action
function confirmMove() {
  if (checkedConstructions.value.length > 0 && targetFolder.value.length > 0) {
    constructionStore.moveConstructions(
      new ConstructionPath(targetFolder.value[0]),
      checkedConstructions.value[0]
    );
  }
}

// watch the checked constructions value to keep the allowedMoveFoldersRoot up to date
watch(
  () => checkedConstructions.value,
  _ => {
    if (checkedConstructions.value.length > 0) {
      const checked = checkedConstructions.value[0];
      // determine whether the checked construction is owned or starred
      if (
        constructionStore.privateConstructions.some(item => item.id === checked)
      ) {
        // construction is owned
        allowedMoveFoldersRoot.value = "Owned Constructions";
      } else if (
        constructionStore.starredConstructions.some(item => item.id === checked)
      ) {
        // construction is starred
        allowedMoveFoldersRoot.value = "Starred Constructions";
      }
    } else {
      allowedMoveFoldersRoot.value = "";
    }
  }
);

//
// load functionality
//

/** folders to display in the load view */
const loadFolders: Ref<TreeviewNode[] | undefined> = ref(undefined);

/**
 * the selected folder in the load dialog; seperate from the loadFolder v-model
 * so that changes aren't propogated until the confirm button is clicked
 */
const loadFolderInternal = ref([]);

const confirmLoad = () => {
  // sync the two values
  if (loadFolderInternal.value.length > 0) {
    loadFolder.value = loadFolderInternal.value[0];
  } else {
    loadFolder.value = "";
  }
  visible.value = false;
};

//
// functionality that affects both load and move
//

const updateTreeviews = () => {
  /* recalculate and filter out public branches from all trees */
  loadFolders.value = constructionStore.constructionTree
    .getFolders()
    .filter(folder => folder.title !== "Public Constructions");
  treeItems.value = constructionStore.constructionTree
    .getRoot()
    .filter(folder => folder.title !== "Public Constructions");
  /* copy the value of loadFolders to moveFolders */
  moveFolders.value = loadFolders.value;
};

// update the treeviews when the full treeview changes
watchDebounced(
  () => constructionStore.constructionTree.updateCounter,
  _ => {
    updateTreeviews();
  },
  { debounce: 500, maxWait: 1000 }
);

// set the treeviews on mount
onMounted(updateTreeviews);
</script>

<style scoped>
:deep(.v-card-text) {
  padding: 24px !important;
  overflow: visible !important;
  max-height: none !important;
}

:deep(.v-card-actions) {
  padding: 16px 24px !important;
}

:deep(.v-text-field) {
  margin-bottom: 16px !important;
}

.selected-btn {
  font-weight: bold;
  border-width: 2px;
}

.mode-btn {
  min-width: 100px;
  font-weight: 500;
}

.active-mode-btn {
  font-weight: bold;
  background-color: #40a082 !important;
  color: white !important;
  border: none;
}

.tree-container {
  min-height: 350px;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  background-color: white;
  white-space: nowrap;
  width: 100%;
}

:deep(.v-treeview-node__root) {
  min-width: max-content;
}

:deep(.v-treeview-node__label) {
  white-space: nowrap;
  display: inline-block;
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

<i18n locale="en" lang="json">
{
  "selectConstructionsLabel": "SELECT CONSTRUCTIONS",
  "destinationFolderLabel": "DESTINATION FOLDER"
}
</i18n>
