<!--
  component that encapsulates the search and display functionality of the panel view for the constructions page.
-->
<template>
  <!-- change visibility -->
  <div v-if="selectedVisible" class="mb-4">
    <v-btn
      color="#40A082"
      class="mt-4"
      @click="filteredSelectedConstructions.clear()"
      block
      max-width="300px">
      return to default view
    </v-btn>
  </div>

  <!-- search bar -->
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
      v-if="!selectedVisible && firebaseUid && firebaseUid.length > 0">
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
        !selectedVisible &&
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
        <ConstructionList
          :allow-sharing="false"
          :items="filteredStarredConstructions" />
      </v-expansion-panel-text>
    </v-expansion-panel>
    <v-expansion-panel
      value="public"
      data-testid="publicPanel"
      v-if="!selectedVisible">
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
    <v-expansion-panel
      data-testid="selectedPanel"
      value="selected"
      v-if="selectedVisible">
      <v-expansion-panel-title>
        {{ selectedFolder }} ({{ filteredSelectedConstructions.length }})
      </v-expansion-panel-title>
      <v-expansion-panel-text data-testid="selectedList">
        <ConstructionList
          :allow-sharing="false"
          :items="filteredSelectedConstructions" />
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts" setup>
import { defineProps, Ref, ref, onMounted, watch, toRefs, computed } from "vue";
import { useIdle } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import {
  ConstructionPath,
  ConstructionPathRoots,
  SphericalConstruction,
  TreeviewNode
} from "@/types/ConstructionTypes";
import ConstructionList from "./ConstructionList.vue";
import { useConstructionStore } from "@/stores/construction";
import { useAccountStore } from "@/stores/account";

// Get the translation function
const { t } = useI18n();

/* get the constructions from the store */
const constructionStore = useConstructionStore();
const { publicConstructions, privateConstructions, starredConstructions } =
  storeToRefs(constructionStore);

/* get the user's firebaseid from the account store */
const acctStore = useAccountStore();
const { firebaseUid } = storeToRefs(acctStore);

/* idle timer */
const { idle, reset } = useIdle(500); // wait for 0.5 second idle

// Define props for the component
const props = defineProps({
  /** the user-selected folder to load into the side panel */
  selectedFolder: {
    type: String,
    required: true
  }
});

const { selectedFolder } = toRefs(props);

/** selected constructions array - to be built based on user selection */
let selectedConstructions: Array<SphericalConstruction> = [];

/* filtered arrays for search functionality */
const filteredPrivateConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const filteredPublicConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const filteredStarredConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const filteredSelectedConstructions: Ref<Array<SphericalConstruction>> = ref(
  []
);

/* populate the filtered arrays */
onMounted(() => {
  filteredPublicConstructions.value.push(...publicConstructions.value);
  filteredPrivateConstructions.value.push(...privateConstructions.value);
  filteredStarredConstructions.value.push(...starredConstructions.value);
});

// watch the selected folder value so the side panel can be updated reactively
watch(
  () => selectedFolder.value,
  value => {
    const path: ConstructionPath = new ConstructionPath(value);
    /* path validity is checked in getFolderContents */
    var contents: Array<TreeviewNode> | undefined =
      constructionStore.constructionTree.getFolderContents(path);
    /* clear selected constructions */
    selectedConstructions.splice(0);
    /* if the contents result is not undefined, use it to build the new contents array */
    if (contents) {
      /* remove any non-leaves */
      contents = contents.filter(item => item.leaf);
      /* build the array */
      if (path.getRoot() == ConstructionPathRoots.OWNED) {
        selectedConstructions = privateConstructions.value.filter(item =>
          contents!.some(content => content.id === item.id)
        );
      } else if (path.getRoot() == ConstructionPathRoots.STARRED) {
        selectedConstructions = starredConstructions.value.filter(item =>
          contents!.some(content => content.id === item.id)
        );
      }
    }
    filteredSelectedConstructions.value.splice(0);
    filteredSelectedConstructions.value.push(...selectedConstructions);
  }
);

/* search variables */
const searchResult = ref("");
const searchKey = ref("");
const openPanels: Ref<Array<string> | string> = ref("");
const openMultiple = ref(false);

let lastSearchKey: string | null = null;

const selectedVisible = computed(() => {
  return (
    selectedFolder.value &&
    selectedFolder.value.length > 0 &&
    filteredSelectedConstructions.value.length > 0
  );
});

// handle the search
watch(idle, (isIdle: boolean) => {
  /* don't run if the user is still typing */
  if (!isIdle) {
    return;
  }
  if (lastSearchKey === searchKey.value) {
    /* do nothing if the search key is the same as it was last time we checked */
    reset();
    return;
  }
  /* if the search key is blank, reset the lists */
  if (searchKey.value.length == 0) {
    searchResult.value = "";
    filteredPublicConstructions.value.splice(0);
    filteredPrivateConstructions.value.splice(0);
    filteredStarredConstructions.value.splice(0);
    filteredPublicConstructions.value.push(...publicConstructions.value);
    filteredPrivateConstructions.value.push(...privateConstructions.value);
    filteredStarredConstructions.value.push(...starredConstructions.value);
    /* if the search key is not empty, filter the array elements */
  } else {
    lastSearchKey = searchKey.value;
    searchResult.value = "";
    const matchFound = [];
    /* filter the private constructions to those whose title matches the search key */
    const privateMatch = privateConstructions.value.filter(
      (c: SphericalConstruction) =>
        c.description.toLowerCase().includes(searchKey.value.toLowerCase())
    );
    /* if we found any matches in the private/owned folder, add it to the output string */
    if (privateMatch.length > 0) {
      matchFound.push("private");
      filteredPrivateConstructions.value = privateMatch;
      /* if we didn't find any constructions in the private/owned folder, clear the display list */
    } else {
      filteredPrivateConstructions.value.splice(0);
    }

    /* filter the public constructions */
    const publicMatch = publicConstructions.value.filter(
      (c: SphericalConstruction) =>
        c.description.toLowerCase().includes(searchKey.value.toLowerCase())
    );
    /* if we found any matches in the public folder, add it to the output string */
    if (publicMatch.length > 0) {
      matchFound.push("public");
      filteredPublicConstructions.value = publicMatch;
    } else {
      /* if we didn't find any constructions in the public folder, clear the display list */
      filteredPublicConstructions.value.splice(0);
    }

    /* filter the starred constructions */
    const starredMatch = starredConstructions.value.filter(
      (c: SphericalConstruction) =>
        c.description.toLowerCase().includes(searchKey.value.toLowerCase())
    );
    /* if we found any matches in the public folder, add it to the output string */
    if (starredMatch.length > 0) {
      matchFound.push("starred");
      filteredStarredConstructions.value = starredMatch;
      /* if we didn't find any constructions in the public folder, clear the display list */
    } else {
      filteredStarredConstructions.value.splice(0);
    }

    /* if we found multiple matches, use the foundMultiple string */
    if (matchFound.length > 1) {
      openMultiple.value = true;
      openPanels.value = matchFound;
      searchResult.value = t(`foundMultiple`, {
        privateCount: privateMatch.length,
        publicCount: publicMatch.length,
        starredCount: privateMatch.length
      });
      /* if we found only one match, use the foundSingle string */
    } else {
      openMultiple.value = false;
      openPanels.value = matchFound[0];
      searchResult.value = t("foundSingle", {
        count: (privateMatch?.length ?? 0) + publicMatch.length,
        group: matchFound[0]
      });
    }
  }
  // reset the idle timer
  reset();
});

// update the filtered lists alongside the private/public/starred constructions updating
watch(
  [
    () => privateConstructions.value,
    () => publicConstructions.value,
    () => starredConstructions.value
  ],
  ([privateList, publicList, starredList]) => {
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
  "privateConstructions": "Private Constructions",
  "publicConstructions": "Public Constructions",
  "starredConstructions": "Starred Constructions",
  "searchLabel": "Search Construction",
  "foundMultiple": "Found {privateCount} private, {publicCount} public, and {starredCount} starred constructions",
  "foundSingle": "Found {count} {group} construction | Found {count} {group} constructions"
}
</i18n>
