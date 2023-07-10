<template>
  <v-btn
    v-bind="$attrs"
    icon size="small"
    tile
    @click="invokeAction"
    v-if="!isShortcutTool">
    <v-icon v-bind="$attrs">{{ model.icon ?? '$' + model.action }}</v-icon>
    <v-tooltip
      activator="parent"
      location="bottom">
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
import { useSEStore } from "@/stores/se";
import { ToolButtonType } from "@/types";

const seStore = useSEStore();

const props = defineProps<{
  model:ToolButtonType,
  isShortcutTool:{type:Boolean, default:false},
}>();

function invokeAction(): void {
  if (props.model.clickFunc)
    props.model.clickFunc()
  else if (props.model.action)
    seStore.setActionMode(props.model.action)

  //Set the button selected so it can be tracked
  // if (button) {
  //   seStore.setButton(button);
  // }
}
</script>
