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
        v-if="filteredStarredConstructions.length > 0 && firebaseUid && firebaseUid.length > 0">
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
const { t } = useI18n();
const filteredPrivateConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const filteredPublicConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const filteredStarredConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const acctStore = useAccountStore();
const constructionStore = useConstructionStore();
const { publicConstructions, privateConstructions, starredConstructions } =
  storeToRefs(constructionStore);
const { firebaseUid } = storeToRefs(acctStore);
const searchResult = ref("");
const searchKey = ref("");

let lastSearchKey: string | null = null;
const openPanels: Ref<Array<string> | string> = ref("");
const openMultiple = ref(false);
const { idle, reset } = useIdle(1000); // wait for 1 second idle

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
    reset()
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
  reset()
});

watch(
  [
    () => privateConstructions.value,
    () => publicConstructions.value,
    () => starredConstructions.value
  ],
  ([privateList, publicList, starredList],
    [oldPrivateList, oldPublicList, oldStarredList]) => {
    // console.debug(`Private changed ${oldPrivateList.length} => ${privateList.length}`)
    // console.debug(`Public changed ${oldPublicList.length} => ${publicList.length}`)
    // console.debug(`Starred changed ${oldStarredList.length} => ${starredList.length}`)
    filteredPrivateConstructions.value.splice(0)
    filteredPrivateConstructions.value.push(...privateList)
    filteredPublicConstructions.value.splice(0)
    filteredPublicConstructions.value.push(...publicList)
    filteredStarredConstructions.value.splice(0)
    filteredStarredConstructions.value.push(...starredList)
  }, {deep: true}
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
