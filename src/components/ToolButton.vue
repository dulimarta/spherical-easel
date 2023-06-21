<template>
  <!-- Displays a button only if the user has permission to see it. -->
  <!--div class="pa-0 debugged" :id="button.action" :ref="button.action"-->
  <!--v-if="(buttonDisplayList.indexOf(button.action) !== -1)"-->
  <!-- Initially tried v-sheet, but had problem with v-overlay covering larger
    area beyond the bound of v-sheet. Switched to v-card to solve the issue -->
  <v-card
    class="ma-1"
    :elevation="elev"
    rounded="lg"
    width="80px"
    height="100px">
    <div class="toolbutton" v-bind="props">
      <v-icon class="toolicon" :icon="vuetifyIconAlias"></v-icon>
      <span class="tooltext" :style="myStyle">
        {{ t(button.displayedName) }}
      </span>
    </div>
    <v-overlay
      contained
      v-model="isEditing"
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
import { useSEStore } from "@/stores/se";
import { useI18n } from "vue-i18n";
import { StyleValue } from "vue";

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

const elev = ref(1);
const weight: Ref<"bold" | "normal"> = ref("normal");
const isEditing = ref(props.editing);

const myStyle = computed((): StyleValue => {
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

onUpdated(() => {
  isEditing.value = props.editing;
  elev.value = props.selected ? 5 : 1;
  weight.value = props.selected ? "bold" : "normal";
});

const buttonLabel1 = computed((): string => {
  return "label1";
  // return (
  //   $t(`buttons.${props.button.displayedName}`).split("<br>").join("/").trim() +
  //   ": "
  // );
});

const buttonLabel2 = computed((): string => {
  return "label2";
  // $t('buttons.' + button.displayedName)
  //             .split('<br>')
  //             .join('')
  //             .slice(0, -6) + ': '
  // "
});
const buttonLabel3 = computed((): string => {
  return "label3";
  // $t('buttons.' + button.displayedName)
  //   .split('<br>')
  //   .join(' ')
  //   .trim() + ': '
  // "
});
</script>

<style lang="scss" scoped>
.toolbutton {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
}

.toolicon {
  min-width: 64px;
  min-height: 64px;
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
