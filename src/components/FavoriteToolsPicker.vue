<template>
  <h2>{{ t('sectionHeading') }}</h2>
  <v-container>
    <v-row>
      <v-col cols="3">
        <v-card>
          <v-card-title>
            {{ t("allTools") }}
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

                <v-list-item-title>
                  {{ t(tool.displayedName) }}
                </v-list-item-title>
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
                :list-title="t('topLeft')"
                v-on:tool-added="onToolAdded"
                v-on:tool-removed="onToolRemoved" />
            </v-col>
            <v-col cols="6">
              <FavoriteToolsCard
                v-model="favoriteTools[1]"
                :tool-pick="selected"
                :id="1"
                :list-title="t('topRight')"
                v-on:tool-added="onToolAdded"
                v-on:tool-removed="onToolRemoved" />
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
const { t } = useI18n({ useScope: "local" });
const allToolsList: Ref<ToolButtonType[]> = ref([]);
const selected: Ref<ActionMode | null> = ref(null);

onBeforeMount(() => {
  allToolsList.value = Array.from(TOOL_DICTIONARY.values()).filter(
    (t: ToolButtonType) =>
      t.action !== "zoomIn" &&
      t.action !== "zoomOut" &&
      t.action !== "zoomFit" &&
      t.action !== "undoAction" &&
      t.action !== "redoAction" &&
      t.action !== "resetAction" &&
      t.action !== "dummy"
  );
  allToolsList.value.sort(toolSortFunc);
});

onMounted(() => {
  favoriteTools.value
    .flatMap(x => x)
    .forEach((a: ActionMode) => {
      const pos = allToolsList.value.findIndex(
        (t: ToolButtonType) => t.action == a
      );
      if (pos >= 0) {
        allToolsList.value.splice(pos, 1);
      }
    });
});

function toolSortFunc(a: ToolButtonType, b: ToolButtonType): number {
  const aText = t(a.displayedName);
  const bText = t(b.displayedName);
  return aText.localeCompare(bText);
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
  allToolsList.value.push(TOOL_DICTIONARY.get(toolName)!);
  allToolsList.value.sort(toolSortFunc);
}
</script>
<style scoped>
#mainToolsList {
  /* display: inline-block; */
  max-height: 50vh;
  overflow-y: auto;
}
</style>
<i18n locale="en">
{
  "allTools": "All Tools",
  "topLeft": "Top-Left Corner",
  "topRight": "Top-Right Corner",
  "bottomLeft": "Bottom-Left Corner",
  "bottomRight": "Bottom-Right Corner",
  "sectionHeading": "Favorite Tool Selection"
}
</i18n>
