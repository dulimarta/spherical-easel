<template>
  <div class="pt-2 mr-2" id="cloader">
    <!--- WARNING: the "id" attribs below are needed for testing -->
    <v-text-field
      data-testid="searchInput"
      style="max-height: 3em"
      persistent-hint
      type="text"
      v-model="searchKey"
      variant="outlined"
      density="compact"
      :label="t('searchLabel')"
      :hint="searchResult" />

    <!-- NEW: Button to open dialog-->
    <div class="mb-4" v-if="firebaseUid && firebaseUid.length > 0">
      <v-btn
        color="#40A082"
        class="mt-4"
        @click="showDialog = true"
        block
        max-width="300px">
        Show User File Tree
      </v-btn>
    </div>

    <!--NEW: Dialog component with Treeview -->
    <v-dialog
      v-if="firebaseUid && firebaseUid.length > 0"
      v-model="showDialog"
      max-width="500px">
      <v-card color="#E8F5F1" theme="light">
        <v-card-title class="text-mint-dark">
          User File System Tree
        </v-card-title>

        <!-- NEW: Folder action buttons -->
        <v-card-text class="pb-0">
          <v-row>
            <v-col cols="12">
              <v-btn-group variant="outlined" class="w-100">
                <v-btn
                  color="#40A082"
                  prepend-icon="mdi-folder-plus"
                  size="small">
                  Create
                </v-btn>
                <v-btn
                  color="#40A082"
                  prepend-icon="mdi-folder-remove"
                  size="small">
                  Remove
                </v-btn>
                <v-btn
                  color="#40A082"
                  prepend-icon="mdi-folder-move"
                  size="small">
                  Move
                </v-btn>
                <v-btn
                  color="#40A082"
                  prepend-icon="mdi-content-copy"
                  size="small">
                  Copy
                </v-btn>
              </v-btn-group>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-text>
          <v-treeview
            v-model="selectedItems"
            :items="treeItems"
            hoverable
            activatable
            item-title="title"
            class="mt-4"
            color="#40A082"
            @update:active="handleNodeSelection"
            return-object>
            <template v-slot:prepend="{ item }"></template>
          </v-treeview>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="#40A082" @click="showDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-expansion-panels
      eager
      v-model="openPanels"
      :multiple="openMultiple"
      :style="{
        gap: '10px',
        paddingRight: '8px',
        paddingLeft: '8px',
        marginTop: searchResult.length > 0 ? '24px' : '0px'
      }">
      <!-- we use the 'value' attribute to control collapsing/expanding multiple panels
    after a search result is found -->
      <v-expansion-panel
        data-testid="privatePanel"
        value="private"
        v-if="firebaseUid && firebaseUid.length > 0">
        <v-expansion-panel-title>
          {{ t(`privateConstructions`) }} ({{
            filteredPrivateConstructions.length
          }})
        </v-expansion-panel-title>
        <v-expansion-panel-text data-testid="privateList">
          <ConstructionList
            :allow-sharing="true"
            :items="filteredPrivateConstructions" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel
        data-testid="starredPanel"
        value="starred"
        v-if="
          filteredStarredConstructions.length > 0 &&
          firebaseUid &&
          firebaseUid.length > 0
        ">
        <v-expansion-panel-title>
          {{ t(`starredConstructions`) }} ({{
            filteredStarredConstructions.length
          }})
        </v-expansion-panel-title>
        <v-expansion-panel-text data-testid="starredList">
          Starred {{ starredConstructionIDs }}
          <ConstructionList
            :allow-sharing="false"
            :items="filteredStarredConstructions" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="public" data-testid="publicPanel">
        <v-expansion-panel-title>
          {{ t(`publicConstructions`) }} ({{
            filteredPublicConstructions.length
          }})
        </v-expansion-panel-title>
        <v-expansion-panel-text data-testid="publicList">
          <ConstructionList
            :items="filteredPublicConstructions"
            :allow-sharing="false" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style scoped>
#cloader {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  justify-content: flex-start;
}
</style>

<script lang="ts" setup>
import ConstructionList from "@/components/ConstructionList.vue";
import { useI18n } from "vue-i18n";
import { useConstructionStore } from "@/stores/construction";
import { useIdle } from "@vueuse/core";
import { watch, computed, ref, Ref } from "vue";
import { SphericalConstruction } from "@/types";
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
import { VTreeview } from "vuetify/labs/VTreeview";

// Add to your setup function
const { t } = useI18n();
const filteredPrivateConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const filteredPublicConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const filteredStarredConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const acctStore = useAccountStore();
const constructionStore = useConstructionStore();
const { publicConstructions, privateConstructions, starredConstructions } =
  storeToRefs(constructionStore);
const { firebaseUid, starredConstructionIDs } = storeToRefs(acctStore);
const searchResult = ref("");
const searchKey = ref("");

let lastSearchKey: string | null = null;
const openPanels: Ref<Array<string> | string> = ref("");
const openMultiple = ref(false);
const { idle, reset } = useIdle(1000); // wait for 1 second idle
const selectedItems = ref<string[]>([]);
const showDialog = ref(false);

// Add this computed property to your setup function
const treeItems = computed(() => {
  return constructionStore.constructionTree.getRootAsArr();
});

// watcher to debug updates to treeItems
watch(
  () => treeItems.value,
  newValue => {
    console.log("Tree Items Updated:", newValue);
  },
  { deep: true }
);

const handleNodeSelection = (value: string[]) => {
  // Define an array to store selected items
  const selectedItemsArray: string[] = [];

  // Check and add matching items
  if (value.includes("private")) {
    selectedItemsArray.push("private");
  }
  if (value.includes("starred")) {
    selectedItemsArray.push("starred");
  }
  if (value.includes("public")) {
    selectedItemsArray.push("public");
  }

  // Update openPanels with the selected items
  openPanels.value = selectedItemsArray;

  // Ensure selectedItems is also updated as an array
  selectedItems.value = [...selectedItemsArray]; // Correctly updates the array
};

onMounted(() => {
  filteredPublicConstructions.value.push(...publicConstructions.value);
  filteredPrivateConstructions.value.push(...privateConstructions.value);
  filteredStarredConstructions.value.push(...starredConstructions.value);
});

watch(idle, (isIdle: boolean) => {
  if (!isIdle) {
    // searchResult.value = "";
    return;
  }
  if (lastSearchKey === searchKey.value) {
    reset();
    return;
  }
  if (searchKey.value.length == 0) {
    searchResult.value = "";
    // If no search key, reset all the arr to full contents
    filteredPublicConstructions.value.splice(0);
    filteredPrivateConstructions.value.splice(0);
    filteredStarredConstructions.value.splice(0);
    filteredPublicConstructions.value.push(...publicConstructions.value);
    filteredPrivateConstructions.value.push(...privateConstructions.value);
    filteredStarredConstructions.value.push(...starredConstructions.value);
  } else {
    lastSearchKey = searchKey.value;
    //openPanels.value.splice(0);
    searchResult.value = "";
    const matchFound = [];
    const privateMatch = privateConstructions.value.filter(
      (c: SphericalConstruction) =>
        c.description.toLowerCase().includes(searchKey.value.toLowerCase())
    );
    if (privateMatch.length > 0) {
      matchFound.push("private");
      filteredPrivateConstructions.value = privateMatch;
    } else {
      filteredPrivateConstructions.value.splice(0);
    }
    const publicMatch = publicConstructions.value.filter(
      (c: SphericalConstruction) =>
        c.description.toLowerCase().includes(searchKey.value.toLowerCase())
    );
    if (publicMatch.length > 0) {
      matchFound.push("public");
      filteredPublicConstructions.value = publicMatch;
    } else {
      filteredPublicConstructions.value.splice(0);
    }
    const starredMatch = starredConstructions.value.filter(
      (c: SphericalConstruction) =>
        c.description.toLowerCase().includes(searchKey.value.toLowerCase())
    );
    if (starredMatch.length > 0) {
      matchFound.push("starred");
      filteredStarredConstructions.value = starredMatch;
    } else {
      filteredStarredConstructions.value.splice(0);
    }
    if (matchFound.length > 1) {
      openMultiple.value = true;
      openPanels.value = matchFound;
      searchResult.value = t(`foundMultiple`, {
        privateCount: privateMatch.length,
        publicCount: publicMatch.length,
        starredCount: privateMatch.length
      });
    } else {
      openMultiple.value = false;
      openPanels.value = matchFound[0];
      searchResult.value = t("foundSingle", {
        count: (privateMatch?.length ?? 0) + publicMatch.length,
        group: matchFound[0]
      });
    }
  }
  reset();
});

watch(
  [
    () => privateConstructions.value,
    () => publicConstructions.value,
    () => starredConstructions.value
  ],
  (
    [privateList, publicList, starredList],
    [oldPrivateList, oldPublicList, oldStarredList]
  ) => {
    // console.debug(`Private changed ${oldPrivateList.length} => ${privateList.length}`)
    // console.debug(`Public changed ${oldPublicList.length} => ${publicList.length}`)
    // console.debug(`Starred changed ${oldStarredList.length} => ${starredList.length}`)
    filteredPrivateConstructions.value.splice(0);
    filteredPrivateConstructions.value.push(...privateList);
    filteredPublicConstructions.value.splice(0);
    filteredPublicConstructions.value.push(...publicList);
    filteredStarredConstructions.value.splice(0);
    filteredStarredConstructions.value.push(...starredList);
  },
  { deep: true }
);
</script>
<i18n locale="en" lang="json">
{
  "constructionDeleted": "Construction {docId} was successfully removed",
  "privateConstructions": "Owned Constructions",
  "starredConstructions": "Starred Constructions",
  "publicConstructions": "Public Constructions",
  "failedToDelete": "Unable to delete construction {docId}",
  "searchLabel": "Search Construction",
  "foundMultiple": "Found {privateCount} private, {publicCount} public, and {starredCount} starred constructions",
  "foundSingle": "Found {count} {group} construction | Found {count} {group} constructions"
}
</i18n>
