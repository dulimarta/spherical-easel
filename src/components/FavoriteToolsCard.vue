<template>
  <v-card class="cards">
    <v-card-title
      style="
        justify-content: center;
        flex-wrap: nowrap;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
      <v-container>
        <v-row>
          <v-col cols="auto">
            <v-btn
              icon
              size="small"
              :disabled="toolPick === null || model!.length >= 6"
              @click="addToolToFavorites">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-col>
          <v-col>
            <span class="text-body-1">{{ listTitle }}</span>
          </v-col>
          <v-col cols="auto">
            <v-btn
              icon
              size="small"
              :disabled="selectedPos === null"
              @click="removeToolFromFavorites">
              <v-icon>mdi-minus</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-card-title>
    <v-card-text style="height: 100%">
      <v-list class="secondaryList" density="compact">
        <v-list-item
          v-for="(item, pos) in prettyList"
          :key="item.action"
          @click="selectedPos = pos">
          <template #prepend>
            <v-icon>
              {{ item.icon ?? "$" + item.action }}
            </v-icon>
          </template>
          <v-list-item-title>{{ t(item.displayedName) }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
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
import { Ref, ref } from "vue";
import { TOOL_DICTIONARY } from "./tooldictionary";
import { useI18n } from "vue-i18n";
const { t } = useI18n({ useScope: "local" });
const selectedPos: Ref<number | null> = ref(null);
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
  if (selectedPos.value !== null && model.value) {
    const victimTool = model.value[selectedPos.value!];
    model.value?.splice(selectedPos.value, 1);
    selectedPos.value = null;
    emit("tool-removed", victimTool);
  }
}
</script>
