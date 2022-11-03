<template>
  <!-- Displays a button only if the user has permission to see it. -->
  <div class="pa-0"
    :id="button.actionModeValue"
    :ref="button.actionModeValue">
    <!--v-if="(buttonDisplayList.indexOf(button.actionModeValue) !== -1)"-->
    <!-- The button is wrapped in to tooltip vue component -->
    <v-tooltip bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      :disabled="displayToolTips || $attrs.disabled">
      <template v-slot:activator="{ on }">
        <v-btn icon
          :value="{ id: button.actionModeValue, name: button.displayedName }"
          v-on="on"
          @click="() => {
            if ($attrs.disabled) return;
            $emit('display-only-this-tool-use-message', button.actionModeValue);
            displayToolUseMessage = true;
            setElevation()
            switchButton(button);
          }"
          x-large
          :elevation="elev">
          <v-flex xs12>
            <v-icon x-large>{{ button.icon }}</v-icon>
            <p class="button-text"
              :style="'--user-font-weight: ' + weight"
              v-html="$t('buttons.' + button.displayedName )">
            </p>
          </v-flex>
          <slot name="overlay"></slot>
        </v-btn>
      </template>
      <span>{{ $t("buttons." + button.toolTipMessage) }}</span>
    </v-tooltip>

    <!-- TODO: move the snackbar to ToolGroup? -->

    <!--- To Check: Does the property multi-line allow the snackbars to be formatted correctly
    automatically when the message is many lines long due to font or number of characters? --->
   <!-- <v-snackbar v-model="displayToolUseMessage"
      bottom
      left
      :timeout="toolUseMessageDelay"
      :value="displayToolUseMessages"
      multi-line>
      If the displayed name is zoom in or out add a slash before the word pan
      <span
        v-if="button.displayedName==='PanZoomInDisplayedName' || button.displayedName==='PanZoomOutDisplayedName'">
        <strong class="warning--text"
          v-html="$t('buttons.' +button.displayedName).split('<br>').join('/').trim() + ': '"></strong>
        {{ $t("buttons." + button.toolUseMessage) }}
      </span>

      <span
        v-else-if="button.displayedName==='CreateCoordinateDisplayedName'|| button.displayedName==='ZoomFitDisplayedName'|| button.displayedName==='CreateTangentDisplayedName'|| button.displayedName==='CreateMidpointDisplayedName'|| button.displayedName==='CreatePolarDisplayedName'  || button.displayedName==='CreateEllipseDisplayedName'  || button.displayedName==='DeleteDisplayedName' || button.displayedName==='CreatePerpendicularDisplayedName'">
        <strong class="warning--text"
          v-html="$t('buttons.' +button.displayedName).split('<br>').join('').slice(0,-6) + ': '"></strong>
        {{ $t("buttons." + button.toolUseMessage) }}
      </span>
      <span v-else>
        <strong class="warning--text"
          v-html="$t('buttons.' +button.displayedName).split('<br>').join(' ').trim() + ': '"></strong>
        {{ $t("buttons." + button.toolUseMessage) }}
      </span>
      <v-btn @click="displayToolUseMessage = false"
        icon>
        <v-icon color="success">mdi-close</v-icon>
      </v-btn>
    </v-snackbar>-->
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { ActionMode, ToolButtonType } from "@/types";
import SETTINGS from "@/global-settings";
import { mapState, mapActions} from "pinia";
import { useSEStore } from "@/stores/se";
import EventBus from "@/eventHandlers/EventBus";
import { SEExpression } from "@/models/SEExpression";
import { SETransformation } from "@/models/SETransformation";

/* This component (i.e. ToolButton) has no sub-components so this declaration is empty */
@Component({
  computed: {
    ...mapState(useSEStore, ["actionMode", "buttonSelection", "expressions", "seTransformations"])
  },
  methods: {
    ...mapActions(useSEStore, ["setButton"]),
  }
})
export default class ToolButton extends Vue {
  /* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay & toolUse */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private displayToolTips = SETTINGS.toolTip.disableDisplay;
  private toolUseMessageDelay = SETTINGS.toolUse.delay;
  private displayToolUseMessages = SETTINGS.toolUse.display;

  /* This controls the display of the snackbar Tool Use Message. This is set to false by the
  $emit('displayOnlyThisToolUseMessage',button.id) <-- this turns off all other snackbar messages
  that sends a message to the parent (ToolGroups.vue) that triggers the method
  displayOnlyThisToolUseMessageFunc
  in the parent which changes the value of button.displayToolUseMessage (except in the button with
  id button.id), this is variable is being watched in this child and turns off the display of the
  snackbar/toolUseMessage  */
  private displayToolUseMessage = false;

  /* Allow us to bind the button object in the parent (=ToolGroups) with the button object in the
  child */
  @Prop({ default: null })
  button!: ToolButtonType;

  private elev = 0;
  private weight = "normal";

  private color = "red";

  readonly actionMode!: ActionMode;
  readonly expressions!: SEExpression[];
  readonly seTransformations!: SETransformation[];
  readonly setButton!: (_: ToolButtonType) => void;

  @Watch("actionMode")
  private setElevation(): void {
    if (this.actionMode === this.button.actionModeValue) {
      // console.log("set elevation 1", this.button.actionModeValue);
      this.elev = 5;
      this.weight = "bold";
    } else {
      // console.log("set elevation 0", this.button.actionModeValue);
      this.elev = 0;
      this.weight = "normal";
    }
  }

  switchButton(button: ToolButtonType): void { // Set the button selected so it can be tracked
    this.setButton(button);
  }

  //When switching to the measured circle tool, rotation, translation or any tool that needs a measurement...
  possibleToolAction(): void {
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
}
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
