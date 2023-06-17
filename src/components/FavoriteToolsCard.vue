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
      <v-col style="flex-grow: 2">
        <v-btn
          style="font-size: 2rem"
          :disabled="addDisabled"
          @click="addToolToFavorites(mainListIndex)">
          +
        </v-btn>
      </v-col>
      <v-col style="flex-grow: 8">
        <div style="text-align: center; align-self: center">
          {{ listTitle }}
        </div>
      </v-col>
      <v-col style="flex-grow: 2">
        <v-btn
          style="font-size: 2rem"
          :disabled="removeDisabled"
          @click="removeToolFromFavorites(selectedIndex)">
          -
        </v-btn>
      </v-col>
    </v-card-title>
    <v-card-text style="height: 100%">
      <v-list class="secondaryList">
        <v-list-item-group v-model="selectedIndex">
          <v-list-item
            v-for="item in itemList"
            :key="item.icon"
            :disabled="item.disabled">
            <v-list-item-icon>
              <v-icon v-text="item.icon"></v-icon>
            </v-list-item-icon>
            <v-list-item-content
              v-html="
                $t('buttons.' + item.displayedName)
              "></v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.cards {
  min-width: 235px;
}

.secondaryList {
  height: 362px;
  overflow-y: auto;
}
</style>

<script setup lang="ts">
import { FavoriteTool } from "@/types";
import { Ref, ref } from "vue";

type ToolProps = {
  itemList: FavoriteTool[];
  itemListBackend: FavoriteTool[];
  mainList: FavoriteTool[];
  listTitle: string | undefined;
  mainListIndex: number | null;
  maxFavoriteToolsLimit: number;
};
const props = defineProps<ToolProps>();
const emit = defineEmits(["update:DeselectTool"]);
const selectedIndex: Ref<number | null> = ref(null);
const addDisabled = ref(false);
const removeDisabled = ref(false);

function addToolToFavorites(index: number | null): void {
  if (index === null) return;
  if (props.itemList.length >= props.maxFavoriteToolsLimit) {
    removeDisabled.value = false;
    addDisabled.value = true;
    return;
  }

  props.itemList.push(Object.assign({}, props.mainList[index]));
  props.itemListBackend.push(Object.assign({}, props.mainList[index]));

  props.mainList[index].disabled = true;
  props.itemList[props.itemList.length - 1].disabled = false;

  removeDisabled.value = false;
  emit("update:DeselectTool");
}

function removeToolFromFavorites(index: number | null): void {
  if (index === null) {
    if (props.itemListBackend.length <= 0) {
      removeDisabled.value = true;
      addDisabled.value = false;
      return;
    }
    return;
  }

  let toolName = props.itemList[index].actionModeValue;

  let indexDelta = props.itemList.length - props.itemListBackend.length;
  let userFavoriteToolsIndex = index - indexDelta;

  props.itemList.splice(index, 1);
  props.itemListBackend.splice(userFavoriteToolsIndex, 1);

  let allToolsListIndex = props.mainList.findIndex(
    tool => tool.actionModeValue === toolName
  );
  props.mainList[allToolsListIndex].disabled = false;

  addDisabled.value = false;
  selectedIndex.value = null;
}
</script>
