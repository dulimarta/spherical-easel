<template>
  <v-btn
    v-bind="$attrs"
    icon
    size="x-small"
    tile
    :disabled="disabled"
    @click="invokeAction">
    <v-icon v-bind="$attrs">{{ model.icon ?? "$" + model.action }}</v-icon>
    <v-tooltip activator="parent" location="bottom">
      {{ $t(model.toolTipMessage) }}
    </v-tooltip>
  </v-btn>
  <v-btn v-else
  variant="text"
  v-bind="$attrs"
  @click="invokeAction">
  <v-icon v-bind="$attrs">{{ model.icon ?? '$' + model.action }}</v-icon>
  <v-tooltip
      activator="parent"
      location="bottom">
      {{ $t(model.toolTipMessage) }}
    </v-tooltip>
  </v-btn>
</template>

<script lang="ts" setup>
import EventBus from "@/eventHandlers/EventBus";
import { useSEStore } from "@/stores/se";
import { ToolButtonType } from "@/types";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Command } from "@/commands/Command";
const seStore = useSEStore();

const props = defineProps<{
  model: ToolButtonType;
}>();
let disabled = ref(false);
/** mounted() is part of VueJS lifecycle hooks */
onMounted((): void => {
  if (props.model.action === "undoAction") {
    EventBus.listen("undo-enabled", setEnabled);
    disabled.value = Command.commandHistory.length == 0; // initially value
  } else if (props.model.action === "redoAction") {
    EventBus.listen("redo-enabled", setEnabled);
    disabled.value = Command.redoHistory.length == 0; // initially value
  }
});

onBeforeUnmount((): void => {
  if (props.model.action === "undoAction") {
    EventBus.unlisten("undo-enabled");
  } else if (props.model.action === "redoAction") {
    EventBus.unlisten("redo-enabled");
  }
});

function setEnabled(e: { value: boolean }) {
  disabled.value = !e.value;
}
function invokeAction(): void {
  if (props.model.clickFunc) props.model.clickFunc();
  else if (props.model.action) seStore.setActionMode(props.model.action);

  //Set the button selected so it can be tracked
  // if (button) {
  //   seStore.setButton(button);
  // }
}
</script>
