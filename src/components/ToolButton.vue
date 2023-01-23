<template>
  <!-- Displays a button only if the user has permission to see it. -->
  <div class="pa-0"
    :id="button.actionModeValue"
    :ref="button.actionModeValue">
    <!--v-if="(buttonDisplayList.indexOf(button.actionModeValue) !== -1)"-->
    <!-- The button is wrapped in to tooltip vue component -->
    <!-- -->
    <v-tooltip bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      :disabled="displayToolTips || $attrs.disabled">
      <template v-slot:activator="{ on }">
        <v-btn icon
          id="btnA"
          :disabled="disabledTools.some(mode => mode===button.actionModeValue) &&
          !editMode"
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
            <!-- <div
              v-if="disabledTools.some(mode => mode===button.actionModeValue)">
              <v-icon x-large>
                {{ button.disabledIcon }}
              </v-icon>
            </div>-->
            <!--- I wish the alternate disabled button icon would work
             but they don't you either get only the normal icon or the disabled (blank) icon, but not both-->
            <!-- so I used the remove disabled css trick found here:
              https://stackoverflow.com/questions/54009721/how-to-disable-vuetify-button-without-changing-colors
             -->
            <v-icon x-large>
              {{ button.icon }}
            </v-icon>

            <!-- v-if="!disabledTools.some(mode => mode===button.actionModeValue)" -->
            <p class="button-text"
              :style="'--user-font-weight: ' + weight"
              v-html="$t('buttons.' + button.displayedName )">
            </p>
            <!--  <p v-else
              class="button-text"
              :style="'--user-font-weight: ' + 200"
              v-html="$t('buttons.' + button.displayedName )">
            </p>-->
          </v-flex>
          <slot name="overlay"></slot>
        </v-btn>
      </template>
      <span>{{ $t("buttons." + button.toolTipMessage) }}</span>
    </v-tooltip>

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
    ...mapState(useSEStore, [
      "actionMode",
      "buttonSelection",
      "expressions",
      "seTransformations",
      "disabledTools"
    ])
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

  @Prop({ default: false })
  editMode!: boolean;

  private elev = 0;
  private weight = 400;

  private color = "red";

  readonly actionMode!: ActionMode;
  readonly expressions!: SEExpression[];
  readonly seTransformations!: SETransformation[];
  readonly disabledTools!: ActionMode[];
  readonly setButton!: (_: ToolButtonType) => void;

  created() {
    // Trick to remove class after initializing form
    this.$nextTick(() => {
      const blah = document.getElementById("btnA");
      if (blah !== null) {
        blah.classList.remove("v-btn--disabled");
      }
    });
  }

  @Watch("actionMode")
  private setElevation(): void {
    if (this.actionMode === this.button.actionModeValue) {
      // console.log("set elevation 1", this.button.actionModeValue);
      this.elev = 5;
      this.weight = 700;
    } else {
      // console.log("set elevation 0", this.button.actionModeValue);
      this.elev = 0;
      this.weight = 400;
    }
  }

  switchButton(button: ToolButtonType): void { // Set the button selected so it can be tracked
    this.setButton(button);
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
button.v-btn[disabled] {
  opacity: 0.4;
}
</style>
