<template>
  <div class="pt-2">
    <!--- WARNING: the "id" attribs below are needed for testing -->
    <v-text-field
      type="text"
      v-model="searchKey"
      variant="outlined"
      density="compact"
      :label="t('searchLabel')"
      :hint="searchResult"
      class="px-2" />
    <v-expansion-panels v-model="openPanels" :multiple="openMultiple">
      <v-expansion-panel v-if="privateConstructions !== null" value="private">
        <v-expansion-panel-title>
          {{ t(`privateConstructions`) }}
        </v-expansion-panel-title>
        <v-expansion-panel-text v-if="firebaseUid && firebaseUid.length > 0">
          <ConstructionList
            :allow-sharing="true"
            :items="displayedPrivateConstructions" />
        </v-expansion-panel-text>
        <v-expansion-panel-text v-else>
         Nothing here
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="owned" class="expansion-panel--spaced">
        <v-expansion-panel-title>
          {{ t(`ownedConstructions`) }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            :items="displayedOwnedConstructions"
            :allow-sharing="false" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="public" class="expansion-panel--spaced">
        <v-expansion-panel-title>
          {{ t(`publicConstructions`) }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            :items="displayedPublicConstructions"
            :allow-sharing="false" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="starred" class="expansion-panel--spaced">
        <v-expansion-panel-title>
          {{ t(`starredConstructions`) }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            :items="displayedStarredConstructions"
            :allow-sharing="false" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      </v-expansion-panels>
    <!-- </v-expansion-panels> -->
  </div>
</template>

<style scoped>
.expansion-panel--spaced {
  margin-bottom: 16px; /* gap presented when lists are collapsed*/
}

#shareTextArea {
  font-family: Courier New, Courier, monospace;
}
</style>

<script lang="ts" setup>
import ConstructionList from "@/components/ConstructionList.vue";
import { useI18n } from "vue-i18n";
import { useConstruction } from "@/composables/constructions";
import { useIdle } from "@vueuse/core";
import { watch, computed, ref, Ref } from "vue";
import { SphericalConstruction } from "@/types";
const { t } = useI18n();
const { publicConstructions, privateConstructions, starredConstructions, ownedConstructions} = useConstruction();
const filteredPrivateConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const filteredPublicConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const filteredOwnedConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const filteredStarredConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const searchResult = ref("");
const searchKey = ref("");
let lastSearchKey: string|null = null
const openPanels: Ref<Array<string> | string> = ref("");
const openMultiple = ref(false);
const { idle } = useIdle(1000); // wait for 1 second idle

const displayedPrivateConstructions = computed(
  (): Array<SphericalConstruction> => {
    console.debug("displayed private recomputed");
    if (searchKey.value.length > 0) return filteredPrivateConstructions.value;
    else if (privateConstructions.value != null)
      return privateConstructions.value;
    else return [];
  }
);

const displayedPublicConstructions = computed(
  (): Array<SphericalConstruction> => {
    if (searchKey.value.length > 0) return filteredPublicConstructions.value;
    else return publicConstructions.value;
  }
);

const displayedOwnedConstructions = computed(
  (): Array<SphericalConstruction> => {
    if (searchKey.value.length > 0) return filteredOwnedConstructions.value;
    else return ownedConstructions.value;
  }
);

const displayedStarredConstructions = computed(
  (): Array<SphericalConstruction> => {
    if (searchKey.value.length > 0) return filteredStarredConstructions.value;
    else return starredConstructions.value;
  }
);

watch(idle, () => {
  if (!idle) {
    searchResult.value = "";
    return;
  }
  if (lastSearchKey === searchKey.value) return
  if (searchKey.value.length > 0) {
    lastSearchKey = searchKey.value
    // openPanels.value.splice(0);
    searchResult.value = "";
    const matchFound = [];
    const privateMatch = privateConstructions.value?.filter(
      (c: SphericalConstruction) =>
        c.description.toLowerCase().includes(searchKey.value.toLowerCase())
    );
    if (privateMatch && privateMatch.length > 0) {
      matchFound.push("private");
      filteredPrivateConstructions.value = privateMatch;
    }
    const publicMatch = publicConstructions.value?.filter(
      (c: SphericalConstruction) =>
        c.description.toLowerCase().includes(searchKey.value.toLowerCase())
    );
    if (publicMatch.length > 0) {
      matchFound.push("public");
      filteredPublicConstructions.value = publicMatch;
    }
    if (matchFound.length > 1) {
      openMultiple.value = true;
      openPanels.value = matchFound;
      searchResult.value = t(`foundMultiple`, {
        privateCount: privateMatch!.length,
        publicCount: publicMatch!.length
      });
    } else {
      openMultiple.value = false;
      openPanels.value = matchFound[0];
      searchResult.value = t('foundSingle', {
        count: (privateMatch?.length ?? 0) + (publicMatch.length),
        group: matchFound[0]
      })
    }
  }
});
</script>
<i18n locale="en">
{
  "constructionDeleted": "Construction {docId} was successfully removed",
  "privateConstructions": "Private Constructions",
  "ownedConstructions": "Owned Constructions",
  "publicConstructions": "Public Constructions",
  "starredConstructions": "Starred Constructions",
  "failedToDelete": "Unable to delete construction {docId}",
  "searchLabel": "Search Construction",
  "foundMultiple": "Found {privateCount} private and {publicCount} public constructions",
  "foundSingle": "Found {count} {group} construction | Found {count} {group} constructions"
}
</i18n>
