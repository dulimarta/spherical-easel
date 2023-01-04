<template>
  <!-- Displays a button only if the user has permission to see it. -->
  <div
    class="pa-0"
    :id="button.actionModeValue"
    :ref="button.actionModeValue"
  >
    <!--v-if="(buttonDisplayList.indexOf(button.actionModeValue) !== -1)"-->
    <!-- The button is wrapped in to tooltip vue component -->
    <v-tooltip
      bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      :disabled="displayToolTips || $attrs.disabled"
    >
      <template v-slot:activator="{ on }">
        <v-btn
          icon
          :value="{ id: button.actionModeValue, name: button.displayedName }"
          v-on="on"
          @click="
  () => {
    if ($attrs.disabled) return;
    $emit(
      'display-only-this-tool-use-message',
      button.actionModeValue
    );
    displayToolUseMessage = true;
    setElevation();
    switchButton(button);
  }
"
          x-large
          :elevation="elev"
        >
          <v-flex xs12>
            <v-icon x-large>{{ button.icon }}</v-icon>
            <p
              class="button-text"
              :style="'--user-font-weight: ' + weight"
              v-html="$t('buttons.' + button.displayedName)"
            ></p>
          </v-flex>
          <slot name="overlay"></slot>
        </v-btn>
      </template>
      <span>{{ $t("buttons." + button.toolTipMessage) }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts" setup>
import Vue, { ref, watch, computed } from "vue";
import { ActionMode, ToolButtonType } from "@/types";
import SETTINGS from "@/global-settings";
import {  storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import EventBus from "@/eventHandlers/EventBus";
// import { SEExpression } from "@/models/SEExpression";
// import { SETransformation } from "@/models/SETransformation";

/* This component (i.e. ToolButton) has no sub-components so this declaration is empty */
// @Component({
//   computed: {
//     ...mapState(useSEStore, ["actionMode", "expressions", "seTransformations"])
//   }
// })
const seStore = useSEStore();
const { actionMode, expressions, seTransformations } = storeToRefs(seStore);
// export default class ToolButton extends Vue {
/* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay & toolUse */
const toolTipOpenDelay = SETTINGS.toolTip.openDelay;
const toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
const displayToolTips = SETTINGS.toolTip.disableDisplay;
const toolUseMessageDelay = SETTINGS.toolUse.delay;
const displayToolUseMessages = SETTINGS.toolUse.display;

/* This controls the display of the snackbar Tool Use Message. This is set to false by the
$emit('displayOnlyThisToolUseMessage',button.id) <-- this turns off all other snackbar messages
that sends a message to the parent (ToolGroups.vue) that triggers the method
displayOnlyThisToolUseMessageFunc
in the parent which changes the value of button.displayToolUseMessage (except in the button with
id button.id), this is variable is being watched in this child and turns off the display of the
snackbar/toolUseMessage  */
const displayToolUseMessage = false;

/* Allow us to bind the button object in the parent (=ToolGroups) with the button object in the
child */
const props = defineProps<{ button: ToolButtonType }>();
// @Prop({ default: null })
// button!: ToolButtonType;

const elev = ref(0);
const weight = ref("normal");

// private color = "red";

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

function switchButton(button: ToolButtonType): void { // Set the button selected so it can be tracked
  seStore.setButton(button);
}

//When switching to the measured circle tool, rotation, translation or any tool that needs a measurement...
function possibleToolAction(): void {
  /*if (this.button.actionModeValue === "measuredCircle") {
    //...open the measurement panel and close the others or tell the user to create a measurement
    if (this.expressions.length > 0) {
      //...open the object tree tab,
      EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
      EventBus.fire("expand-measurement-sheet", {});
    } else {
      EventBus.fire("show-alert", {
        key: "objectTree.createMeasurementForMeasuredCircle",
        type: "info"
      });
    }
  } else if (this.button.actionModeValue === "translation") {
    //...open the measurement panel and close the others or tell the user to create a measurement
    if (this.expressions.length > 0) {
      //...open the object tree tab,
      EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
      EventBus.fire("expand-measurement-sheet", {});
    } else {
      EventBus.fire("show-alert", {
        key: "objectTree.createMeasurementForTranslation",
        type: "info"
      });
    }
  } else if (this.button.actionModeValue === "rotation") {
    //...open the measurement panel and close the others or tell the user to create a measurement
    if (this.expressions.length > 0) {
      //...open the object tree tab,
      EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
      EventBus.fire("expand-measurement-sheet", {});
    } else {
      EventBus.fire("show-alert", {
        key: "objectTree.createMeasurementForRotation",
        type: "info"
      });
    }
  } else if (this.button.actionModeValue === "applyTransformation") {
    //...open the measurement panel and close the others or tell the user to create a measurement
    if (this.seTransformations.length > 0) {
      //...open the object tree tab,
      EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
      EventBus.fire("expand-transformation-sheet", {});
    } else {
      EventBus.fire("show-alert", {
        key: "objectTree.createATransformation",
        type: "error"
      });
    }
  }*/
}


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
.button-text {
  padding-top: 9px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 11px;
  word-wrap: break-word;
  white-space: pre-wrap;
  letter-spacing: 0px;
  font-weight: var(--user-font-weight);
}

.v-btn--icon.v-size--x-large {
  padding-top: 9px;
  height: 80px;
  width: 80px;
}

.btn-round-border-radius {
  size: 60%;
}
</style>
