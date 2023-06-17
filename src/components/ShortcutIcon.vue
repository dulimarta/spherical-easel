<template>
  <v-btn
    v-bind="$attrs"
    icon size="x-small"
    tile
    @click="invokeAction">
    <v-icon v-bind="$attrs" :color="model.iconColor">{{ model.icon }}</v-icon>
    <v-tooltip
      activator="parent"
      location="bottom">
      {{ $t(model.tooltipMessage) }}
    </v-tooltip>
  </v-btn>
</template>

<script lang="ts" setup>
import SETTINGS from "@/global-settings";
import { useSEStore } from "@/stores/se";
import { ShortcutIconType, ToolButtonType } from "@/types";

const seStore = useSEStore();

const props = defineProps<{
  model:ShortcutIconType
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
