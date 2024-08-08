<template>
  <v-btn
    v-bind="$attrs"
    icon
    :size="shortCutButtonSize"
    :disabled="disabled"
    @click="invokeAction">
    <v-icon :size="iconSize">
      {{ model.icon ?? "$" + model.action }}
    </v-icon>
    <v-tooltip activator="parent" location="bottom">
      {{ t(model.toolTipMessage) }}
    </v-tooltip>
  </v-btn>
</template>

<script lang="ts" setup>
import EventBus from "@/eventHandlers/EventBus";
import { useSEStore } from "@/stores/se";
import { ToolButtonType } from "@/types";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Command } from "@/commands/Command";
import SETTINGS from "@/global-settings";
import { useI18n } from "vue-i18n"
const seStore = useSEStore();
const iconSize = ref(SETTINGS.icons.shortcutIconSize);
const shortCutButtonSize = ref(SETTINGS.icons.shortcutButtonSize);
const { t } = useI18n()
const props = defineProps<{
  model: ToolButtonType
}>()
let disabled = ref(false)
/** mounted() is part of VueJS lifecycle hooks */
onMounted((): void => {
  // console.debug("Incoming model is ", props.model)
  if (props.model.action === "undoAction") {
    EventBus.listen("undo-enabled", setEnabled)
    disabled.value = Command.commandHistory.length == 0 // initially value
  } else if (props.model.action === "redoAction") {
    EventBus.listen("redo-enabled", setEnabled)
    disabled.value = Command.redoHistory.length == 0 // initially value
  }
  const zIcons = SETTINGS.icons as Record<string, any>;
  if (zIcons[props.model.action] && typeof zIcons[props.model.action].props.mdiIcon == "string") {
    iconSize.value = SETTINGS.icons.shortcutIconSize * 0.6; // mdiIcons are smaller
  }
});

onBeforeUnmount((): void => {
  if (props.model.action === "undoAction") {
    EventBus.unlisten("undo-enabled")
  } else if (props.model.action === "redoAction") {
    EventBus.unlisten("redo-enabled")
  }
})

function setEnabled(e: { value: boolean }) {
  disabled.value = !e.value
}
function invokeAction(): void {
  if (typeof props.model.clickFunc === "function") {
    props.model.clickFunc!()
  } else if (props.model.action) seStore.setActionMode(props.model.action)
}
</script>
