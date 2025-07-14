<template>
  <h2>{{ t("sectionHeading") }}</h2>
  <!-- <ul>
    <li v-for="t in allToolsList" :key="t.action">
      {{ t.action }} {{ t.displayedName }}
    </li>
  </ul> -->
  <div
    :style="{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      maxHeight: '60vh',
      columnGap: '2em'
    }">
    <div class="mx-2">
      <span>Available tools ({{ allToolsList.length }})</span>
      <v-list
        density="compact"
        v-model:activated="itemSelection"
        :items="allToolsList"
        item-value="action"
        item-title="displayedName"
        activatable
        active-class="bg-green-lighten-1">
        <template #title="{ title }">{{ t(title as string) }}</template>
        <template #prepend="{ item }">
          <v-icon>{{ "$" + item.action }}</v-icon>
        </template>
      </v-list>
    </div>
    <FavoriteToolsCard
      :style="{ flexGrow: 1 }"
      v-model="favoriteTools[0]"
      :tool-pick="itemSelection.length > 0 ? itemSelection[0] : null"
      :id="0"
      :list-title="t('topLeft')"
      v-on:tool-added="onToolAdded"
      v-on:tool-removed="onToolRemoved" />
    <FavoriteToolsCard
      :style="{ flexGrow: 1 }"
      v-model="favoriteTools[1]"
      :tool-pick="itemSelection.length > 0 ? itemSelection[0] : null"
      :id="1"
      :list-title="t('topRight')"
      v-on:tool-added="onToolAdded"
      v-on:tool-removed="onToolRemoved" />
  </div>
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
// const selected: Ref<ActionMode | null> = ref(null);
const itemSelection = ref([]);
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
    (t: ToolButtonType) => t.action === itemSelection.value[0]
  );
  if (pos >= 0) {
    allToolsList.value.splice(pos, 1);
    itemSelection.value.splice(0);
  }
}

function onToolRemoved(toolName: ActionMode) {
  allToolsList.value.push(TOOL_DICTIONARY.get(toolName)!);
  allToolsList.value.sort(toolSortFunc);
}
</script>
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
