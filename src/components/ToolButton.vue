<template>
  <!-- Initially tried v-sheet, but had problem with v-overlay covering larger
    area beyond the bound of v-sheet. Switched to v-card to solve the issue -->
  <v-card
    class="ma-1"
    :variant="selected ? 'outlined' : 'flat'"
    elevation="2"
    rounded="lg"
    width="80px"
    :style="{ backgroundColor: selected ? '#002108' : '#8CCD8F' }"
    height="100px">
    <div class="toolbutton" v-bind="props">
      <v-icon
        class="toolIconClass"
        :icon="vuetifyIconAlias"
        :size="mdiIconSize"
        :style="{
          filter: selected
            ? 'invert(100%) sepia(17%) saturate(0%) hue-rotate(91deg) brightness(104%) contrast(104%)'
            : ''
        }"></v-icon>
      <span
        class="tooltext"
        :style="[myTextStyle, { color: selected ? 'white' : 'black' }]">
        {{ t(button.displayedName) }}
      </span>
    </div>
    <v-overlay
      contained
      v-model="isEditing"
      :style="{
        backgroundColor: selected ? '#002108' : '#8CCD8F',
        color: selected ? 'white' : 'black'
      }"
      :scrim="props.included ? '#00F' : '#000'">
      <v-icon v-if="props.included" size="x-large" class="overlayicon">
        mdi-minus-circle
      </v-icon>
      <v-icon v-else size="x-large" class="overlayicon">mdi-plus-circle</v-icon>
    </v-overlay>
    <v-tooltip location="bottom" activator="parent">
      <span class="tooltip">{{ t(button.toolTipMessage) }}</span>
    </v-tooltip>
  </v-card>
</template>

<script lang="ts" setup>
import { Ref, ref, computed, onUpdated } from "vue";
import { ToolButtonType } from "@/types";
import { useI18n } from "vue-i18n";
import { StyleValue } from "vue";
import SETTINGS from "@/global-settings";
import { onMounted, watch } from "vue";
import { onBeforeMount } from "vue";
type ToolButtonProps = {
  button: ToolButtonType;
  selected: boolean;
  editing: boolean;
  included: boolean;
};
/* This component (i.e. ToolButton) has no sub-components so this declaration is empty */
const { t } = useI18n();
/* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay & toolUse */

/* Allow us to bind the button object in the parent (=ToolGroups) with the button object in the
child */
const props = defineProps<ToolButtonProps>();
const elev = ref(5);
const weight: Ref<"bold" | "normal"> = ref("normal");
const isEditing = ref(props.editing);
const mdiIconSize = ref("")
const iconClass = ref({
  size: SETTINGS.icons.buttonIconSize + "px"
});

const myTextStyle = computed((): StyleValue => {
  return {
    fontWeight: weight.value
  };
});
const vuetifyIconAlias = computed(
  () =>
    // Use the icon property (if defined)
    // otherwise use the action name as the Vuetify icon alias
    props.button.icon ?? "$" + props.button.action
);


onMounted(() => {
  const zIcons = SETTINGS.icons as Record<string, any>;
  if (zIcons[props.button.action] && typeof zIcons[props.button.action].props.mdiIcon == "string") {
    mdiIconSize.value = SETTINGS.icons.shortcutIconSize * 0.6 + "px" // mdiIcons are smaller
  }
});

onUpdated(() => {
  isEditing.value = props.editing;
  elev.value = props.selected ? 1 : 5;
  weight.value = props.selected ? "bold" : "normal";
});
</script>

<style lang="scss" scoped>
.toolbutton {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
}

.tooltext {
  // border: 1px solid orange;
  padding-top: 0px;
  width: 85%;
  font-size: 11px;
  // white-space: nowrap;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  font-weight: var(--user-font-weight);
}
.tooltip {
  padding: 0.5em;
  border: 1px solid grey;
  border-radius: 0.5em;
}
.toolIconClass {
  min-height: 64px;
  width: v-bind("iconClass.size");
}
.overlayicon {
  position: absolute;
  color: black;
  top: 60px;
  left: 25px;
  animation-name: shake;
  animation-duration: 500ms;
  animation-iteration-count: infinite;
}

@keyframes shake {
  0% {
    transform: translateX(0px);
  }

  25% {
    transform: translateX(-3px);
  }

  50% {
    transform: translateX(0px);
  }

  75% {
    transform: translateX(+3px);
  }
}
// .v-btn--icon.v-size--x-large {
//   padding-top: 9px;
//   height: 80px;
//   width: 80px;
// }

// .btn-round-border-radius {
//   size: 60%;
// }
</style>
