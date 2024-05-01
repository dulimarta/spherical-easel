<template>
  <div class="pt-2 mr-2" id="zzz">
    <!--- WARNING: the "id" attribs below are needed for testing -->
    <v-text-field
      style="max-height: 3em"
      persistent-hint
      type="text"
      v-model="searchKey"
      variant="outlined"
      density="compact"
      :label="t('searchLabel')"
      :hint="searchResult" />
    <v-expansion-panels
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
        value="private"
        v-if="firebaseUid && firebaseUid.length > 0">
        <v-expansion-panel-title>
          {{ t(`privateConstructions`) }} ({{
            filteredPrivateConstructions.length
          }})
        </v-expansion-panel-title>
        <v-expansion-panel-text v-if="firebaseUid && firebaseUid.length > 0">
          <ConstructionList
            :allow-sharing="true"
            :items="filteredPrivateConstructions" />
        </v-expansion-panel-text>
        <v-expansion-panel-text v-else>Nothing here</v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel
        value="starred"
        v-if="firebaseUid && firebaseUid.length > 0">
        <v-expansion-panel-title>
          {{ t(`starredConstructions`) }} ({{
            filteredStarredConstructions.length
          }})
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            :allow-sharing="false"
            :items="filteredStarredConstructions" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="public">
        <v-expansion-panel-title>
          {{ t(`publicConstructions`) }} ({{
            filteredPublicConstructions.length
          }})
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            :items="filteredPublicConstructions"
            :allow-sharing="false" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style scoped>
#zzz {
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
const { idle } = useIdle(1000); // wait for 1 second idle

onMounted(() => {
  filteredPublicConstructions.value.push(...publicConstructions.value);
});

watch(idle, (isIdle: boolean) => {
  console.debug("Idler handler", isIdle);
  if (!isIdle) {
    // searchResult.value = "";
    return;
  }
  if (lastSearchKey === searchKey.value) return;
  if (searchKey.value.length == 0) {
    searchResult.value = ""
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
      filteredPrivateConstructions.value.splice(0)
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
});
</script>
<i18n locale="en">
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
