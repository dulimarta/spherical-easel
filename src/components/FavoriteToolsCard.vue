<template>
  <v-sheet
    elevation="4"
    :style="{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }">
    <div
      class="py-1"
      :style="{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'baseline',
        width: '100%',
        borderBottom: '1px solid gray'
      }">
      <v-btn
        icon
        size="small"
        :disabled="toolPick === null || model!.length >= 6"
        @click="addToolToFavorites">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <span class="text-truncate font-weight-bold">{{ listTitle }}</span>
      <v-btn
        icon
        size="small"
        :disabled="selection.length === 0"
        @click="removeToolFromFavorites">
        <v-icon>mdi-minus</v-icon>
      </v-btn>
    </div>
    <div>
      <v-list
        v-model:selected="selection"
        selectable
        density="compact"
        :items="prettyList"
        item-value="action"
        item-title="displayedName">
        <template #title="{ title }">{{ t(title as string) }}</template>
        <template #prepend="{ item }">
          <v-icon>{{ "$" + item.action }}</v-icon>
        </template>
      </v-list>
    </div>
  </v-sheet>
</template>

<style lang="scss" scoped>
.cards {
  min-width: 235px;
}

.secondaryList {
  height: 18em;
  overflow-y: auto;
}
</style>

<script setup lang="ts">
import { ActionMode } from "@/types";
import { computed } from "vue";
import { ref } from "vue";
import { TOOL_DICTIONARY } from "./tooldictionary";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const selection = ref([]);
const prettyList = computed(() =>
  model.value?.map((a: ActionMode) => TOOL_DICTIONARY.get(a)!)
);
type ToolProps = {
  // modelValue: Array<ActionMode>;
  id: number;
  toolPick: ActionMode | null;
  listTitle: string;
};
const props = defineProps<ToolProps>();
const model = defineModel<Array<ActionMode>>();
const emit = defineEmits<{
  (e: "tool-added", id: number): void;
  (e: "tool-removed", tool: ActionMode): void;
}>();

function addToolToFavorites(): void {
  if (props.toolPick) model.value?.push(props.toolPick);
  emit("tool-added", props.id);
}

function removeToolFromFavorites(): void {
  if (selection.value.length !== 0 && model.value) {
    const victimPos = model.value.findIndex(
      tool => tool === selection.value[0]
    );
    if (victimPos >= 0) {
      model.value?.splice(victimPos, 1);
      emit("tool-removed", selection.value[0]);
      selection.value = [];
    }
  }
}
</script>
