<template>
  <div class="pt-2 mr-2" id="zzz">
    <!--- WARNING: the "id" attribs below are needed for testing -->
    <v-text-field style="max-height:3em"
      type="text"
      v-model="searchKey"
      variant="outlined"
      density="compact"
      :label="t('searchLabel')"
      :hint="searchResult"/>
    <v-expansion-panels v-model="openPanels" :multiple="openMultiple"
    style="gap:10px; padding-right: 8px; padding-left: 8px;">
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
      <v-expansion-panel v-if= " firebaseUid && firebaseUid.length > 0" value="starred"> <!-- "starredConstructions !== null &&-->
        <v-expansion-panel-title>
          {{ t(`starredConstructions`) }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            :allow-sharing="true"
            :items="displayedStarredConstructions" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      <v-expansion-panel value="public">
        <v-expansion-panel-title>
          {{ t(`publicConstructions`) }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConstructionList
            :items="displayedPublicConstructions"
            :allow-sharing="false" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      </v-expansion-panels>
    <!-- </v-expansion-panels> -->
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
import { useConstruction } from "@/composables/constructions";
import { useIdle } from "@vueuse/core";
import { watch, computed, ref, Ref } from "vue";
import { SphericalConstruction } from "@/types";
import { useAccountStore } from "@/stores/account";
import { useUserAccountStore } from '@/stores/userAccountStore';
import { storeToRefs } from "pinia";
import { onMounted } from 'vue'; //trying to async call to setup UserProfile call
const { t } = useI18n();
const { publicConstructions, privateConstructions, starredConstructions} = useConstruction();
const filteredPrivateConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const filteredPublicConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const acctStore = useAccountStore()
const { firebaseUid } = storeToRefs(acctStore)
const searchResult = ref("");
const searchKey = ref("");
//grabbing user email for filtering
const { userEmail } = storeToRefs(acctStore);
const accountStore = useUserAccountStore();
const uid = firebaseUid.value; //need to figure out how to call that
const { userProfile } = storeToRefs(useUserAccountStore());

let lastSearchKey: string|null = null
const openPanels: Ref<Array<string> | string> = ref("");
const openMultiple = ref(false);
const { idle } = useIdle(1000); // wait for 1 second idle

onMounted(async () => {
  if (uid) {
    await accountStore.fetchUserProfile(uid!);
  }
});

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
        // If there's a search, use the filtered list
  if (searchKey.value.length > 0) {
    return filteredPublicConstructions.value;
  } else if (userEmail.value) {
      const userstarredIDs = userProfile.value?.userStarredConstructions || [];
      return publicConstructions.value.filter(
        (construction) => construction.author !== userEmail.value && !userstarredIDs.includes(construction.id)
      );
    } else {
      // If no user is logged in, display all public constructions
      return publicConstructions.value;
    }
  }
);

//working function to display filtered public constructions
//revert the console log code in lambda
// const displayedPublicConstructions = computed(
//   (): Array<SphericalConstruction> => {

//   // If there's a search, use the filtered list
//   if (searchKey.value.length > 0) {
//     return filteredPublicConstructions.value;
//   } else {
//     // If the user is logged in, filter out their own constructions
//     if (userEmail.value) {
//       return publicConstructions.value.filter(
//         (construction) => { console.log(construction.author, userEmail.value);
//           return construction.author !== userEmail.value
//         });
//     } else {
//       // If no user is logged in, display all public constructions
//       return publicConstructions.value;
//     }
//   }
// });


//version that works with changes to firebase config file and a new file for userAccountStore.ts that initalizes UserProfile as a export
//while everything compiles and runs, still no constructions are displaying
const displayedStarredConstructions = computed(() => {
  const starredIDs = userProfile.value?.userStarredConstructions || [];

  if (starredIDs.length > 0) {
    return publicConstructions.value.filter(construction =>
      starredIDs.includes(construction.id)
    );
  }
  return [];
});

watch(idle, () => {
  if (!idle) {
    searchResult.value = "";
    return;
  }
  if (lastSearchKey === searchKey.value) return
  if (searchKey.value.length > 0) {
    lastSearchKey = searchKey.value
    //openPanels.value.splice(0);
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
  "privateConstructions": "Owned Constructions",
  "starredConstructions": "Starred Constructions",
  "publicConstructions": "Public Constructions",
  "failedToDelete": "Unable to delete construction {docId}",
  "searchLabel": "Search Construction",
  "foundMultiple": "Found {privateCount} private and {publicCount} public constructions",
  "foundSingle": "Found {count} {group} construction | Found {count} {group} constructions"
}
</i18n>
