<template>
  <h2>Favorite Tools Picker</h2>
  <v-container>
    <v-row>
      <v-col cols="3">
        <v-card>
          <v-card-title>
            {{ $t("headingNames.allToolsName") }}
          </v-card-title>
          <v-card-text>
            <v-list density="compact" id="mainToolsList">
              <v-list-item
                v-for="tool in allToolsList"
                :key="tool.action"
                @click="selected = tool.action">
                <template #prepend>
                  <v-icon>
                    {{ tool.icon ?? "$" + tool.action }}
                  </v-icon>
                </template>

                <v-list-item-title
                  v-text="$t(tool.displayedName)"></v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="9">
        <v-container>
          <v-row>
            <v-col cols="6">
              <FavoriteToolsCard
                v-model="favoriteTools[0]"
                :tool-pick="selected"
                :id="0"
                :list-title="$t('headingNames.topLeftCorner')"
                v-on:tool-added="onToolAdded"
                v-on:tool-removed="onToolRemoved"/>
            </v-col>
            <v-col cols="6">
              <FavoriteToolsCard
                v-model="favoriteTools[1]"
                :tool-pick="selected"
                :id="1"
                :list-title="$t('headingNames.topRightCorner')"
                v-on:tool-added="onToolAdded"
                v-on:tool-removed="onToolRemoved"/>
            </v-col>
            <v-col cols="6">
              <FavoriteToolsCard
                v-model="favoriteTools[2]"
                :tool-pick="selected"
                :id="2"
                :list-title="$t('headingNames.bottomLeftCorner')"
                v-on:tool-added="onToolAdded"
                v-on:tool-removed="onToolRemoved"/>
            </v-col>
            <v-col cols="6">
              <FavoriteToolsCard
                v-model="favoriteTools[3]"
                :tool-pick="selected"
                :id="3"
                :list-title="$t('headingNames.bottomRightCorner')"
                v-on:tool-added="onToolAdded"
                v-on:tool-removed="onToolRemoved"/>
            </v-col>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { ref, Ref, onBeforeMount } from "vue";
import FavoriteToolsCard from "@/components/FavoriteToolsCard.vue";
import { useI18n } from "vue-i18n";

import { storeToRefs } from "pinia";
import { useAccountStore } from "@/stores/account";
import { ActionMode, ToolButtonType } from "@/types";
import { TOOL_DICTIONARY } from "./tooldictionary";
import { onMounted } from "vue";
const acctStore = useAccountStore();
const { favoriteTools } = storeToRefs(acctStore);
const {t} = useI18n()
const allToolsList: Ref<ToolButtonType[]> = ref([]);
const selected: Ref<ActionMode | null> = ref(null);

onBeforeMount(() => {
  allToolsList.value = Array.from(TOOL_DICTIONARY.values());
  allToolsList.value.sort(toolSortFunc)
});

onMounted(() => {
  favoriteTools.value.flatMap(x => x).forEach((a: ActionMode) => {
    const pos = allToolsList.value.findIndex((t: ToolButtonType) => t.action == a)
    if (pos >= 0) {
      allToolsList.value.splice(pos, 1)
    }
  })
})

function toolSortFunc(a: ToolButtonType, b: ToolButtonType): number {
  const aText = t(a.displayedName)
  const bText = t(b.displayedName)
  console.debug(`Comparing [${aText}] vs. [${bText}]`)
  return aText.localeCompare(bText)
}

function onToolAdded() {
  const pos = allToolsList.value.findIndex(
    (t: ToolButtonType) => t.action === selected.value
  );
  if (pos >= 0) {
    allToolsList.value.splice(pos, 1);
    selected.value = null;
  }
}

function onToolRemoved(toolName: ActionMode) {
  allToolsList.value.push(TOOL_DICTIONARY.get(toolName)!)
  allToolsList.value.sort(toolSortFunc)
}
</script>
<style scoped>
#mainToolsList {
  /* display: inline-block; */
  max-height: 50vh;
  overflow-y: auto;
}
</style>
