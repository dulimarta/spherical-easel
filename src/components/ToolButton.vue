<template>
  <!-- Displays a button only if the user has permission to see it. -->
  <!--div class="pa-0 debugged" :id="button.actionModeValue" :ref="button.actionModeValue"-->
  <!--v-if="(buttonDisplayList.indexOf(button.actionModeValue) !== -1)"-->
  <!-- The button is wrapped in to tooltip vue component -->
  <!--v-tooltip
      bottom
      <template v-slot:activator="{ props }"-->
  <!--v-btn
          icon
          :value="{ id: button.actionModeValue, name: button.displayedName }"
          v-bind="props"

          x-large-->
  <v-sheet class="ma-1" :elevation="elev" rounded="lg" width="80px">
    <div class="toolbutton" @click="doClick">
      <v-icon class="toolicon">{{ button.icon }}</v-icon>
      <span class="tooltext" :style="myStyle">
        {{ t("buttons." + button.displayedName) }}
      </span>
    </div>
    <v-tooltip
      location="bottom"
      activator="parent"
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      :disabled="displayToolTips">
      <span class="tooltip">{{ t("buttons." + button.toolTipMessage) }}</span>
    </v-tooltip>
  </v-sheet>
  <!--slot name="overlay"></slot-->
  <!--/div-->
</template>

<script lang="ts" setup>
import Vue, { Ref, ref, watch, computed, onUpdated } from "vue";
import { ActionMode, ToolButtonType } from "@/types";
import SETTINGS from "@/global-settings";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { useI18n } from "vue-i18n";
import EventBus from "@/eventHandlers/EventBus";
import { StyleValue } from "vue";
// import { SEExpression } from "@/models/SEExpression";
// import { SETransformation } from "@/models/SETransformation";

/* This component (i.e. ToolButton) has no sub-components so this declaration is empty */
const seStore = useSEStore();
const { actionMode, expressions, seTransformations } = storeToRefs(seStore);
const emit = defineEmits([
  "display-only-this-tool-use-message",
  "toolbutton-clicked"
]);
const { t } = useI18n();
// export default class ToolButton extends Vue {
/* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay & toolUse */
const toolTipOpenDelay = SETTINGS.toolTip.openDelay;
const toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
const displayToolTips = ref(SETTINGS.toolTip.disableDisplay);
const toolUseMessageDelay = SETTINGS.toolUse.delay;
const displayToolUseMessages = SETTINGS.toolUse.display;

/* This controls the display of the snackbar Tool Use Message. This is set to false by the
$emit('displayOnlyThisToolUseMessage',button.id) <-- this turns off all other snackbar messages
that sends a message to the parent (ToolGroups.vue) that triggers the method
displayOnlyThisToolUseMessageFunc
in the parent which changes the value of button.displayToolUseMessage (except in the button with
id button.id), this is variable is being watched in this child and turns off the display of the
snackbar/toolUseMessage  */
let displayToolUseMessage = false;

/* Allow us to bind the button object in the parent (=ToolGroups) with the button object in the
child */
const props = defineProps<{ button: ToolButtonType; selected: boolean }>();
// @Prop({ default: null })
// button!: ToolButtonType;

const elev = ref(0);
const weight: Ref<"bold" | "normal"> = ref("normal");
let selected = false;

const myStyle = computed((): StyleValue => {
  return {
    fontWeight: weight.value
  };
});

onUpdated(() => {
  // if (selected != props.selected)
  //   console.info(
  //     props.button.actionModeValue + " updated to " + props.selected
  //   );
  selected = props.selected;
  elev.value = props.selected ? 5 : 0;
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

function doClick() {
  // if ($attrs.disabled) return;
  // emit("display-only-this-tool-use-message", props.button.actionModeValue);
  if (!selected)
    emit("toolbutton-clicked", props.button.actionModeValue);
  // displayToolUseMessage = true;
  // props.selected = !props.selected;
  // setElevation();
  // switchButton(props.button);

  // elev.value = props.selected ? 5 : 0;
  // weight.value = props.selected ? "bold" : "normal";
}

watch(() => actionMode, setElevation);
function setElevation() {
  if (actionMode.value === props.button.actionModeValue) {
    // console.log("set elevation 1", this.button.actionModeValue);
    elev.value = 5;
    weight.value = "bold";
  } else {
    // console.log("set elevation 0", this.button.actionModeValue);
    elev.value = 0;
    weight.value = "normal";
  }
}

// function switchButton(button: ToolButtonType): void {
//   // Set the button selected so it can be tracked
//   seStore.setButton(button);
// }

// @Prop({ default: 0 }) readonly elev?: number;
/* @Watch if button.displayToolUseMessage changes then set displayToolUseMessage to false so
    that multiple snackbars tool use messages are not displayed at the same time*/
// @Watch("button.displayToolUseMessage")
// protected onButtonChanged() {
//   this.displayToolUseMessage = false;
// }
// }
</script>

<style lang="scss">
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
  white-space: nowrap;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  font-weight: var(--user-font-weight);
}
.tooltip {
  background-color: white;
  padding: 0.5em;
  border: 1px solid grey;
  border-radius: 0.5em;
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
