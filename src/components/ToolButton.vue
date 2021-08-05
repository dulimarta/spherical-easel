<template>
  <!-- Displays a button only if the user has permission to see it. -->
  <div class="pa-0"
    :id="button.id">
    <!--v-if="(buttonDisplayList.indexOf(button.actionModeValue) !== -1)"-->
    <!-- The button is wrapped in to tooltip vue component -->
    <v-tooltip bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      :disabled="displayToolTips">
      <template v-slot:activator="{ on }">
        <v-btn icon
          :value="{ id: button.actionModeValue, name: button.displayedName }"
          v-on="on"
          @click="
            $emit('display-only-this-tool-use-message', button.id);
            displayToolUseMessage = true;
            setElevation()
          "
          x-large
          :elevation="elev">
          <v-flex xs12>
            <v-icon x-large>{{ button.icon }}</v-icon>
            <p class="button-text"
              :style="'--user-font-weight: ' + weight"
              v-html="$t('buttons.' + button.displayedName )">
            </p>
          </v-flex>
        </v-btn>
      </template>
      <span>{{ $t("buttons." + button.toolTipMessage) }}</span>
    </v-tooltip>
    <!--- To Check: Does the property multi-line allow the snackbars to be formated correctly
    automatically when the message is many lines long due to font or number of characters? --->
    <v-snackbar v-model="displayToolUseMessage"
      bottom
      left
      :timeout="toolUseMessageDelay"
      :value="displayToolUseMessages"
      multi-line>
      <!---If the displayed name is zoom in or out add a slash before the word pan --->
      <span
        v-if="button.displayedName==='PanZoomInDisplayedName' || button.displayedName==='PanZoomOutDisplayedName'">
        <strong class="warning--text"
          v-html="$t('buttons.' +button.displayedName).split('<br>').join('/').trim() + ': '"></strong>
        {{ $t("buttons." + button.toolUseMessage) }}
      </span>
      <!---If the displayed name is only one line delete the non-breaking space --->
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
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import { AppState, ToolButtonType } from "@/types";
import SETTINGS from "@/global-settings";
import { namespace } from "vuex-class";

const SE = namespace("se");

/* This component (i.e. ToolButton) has no sub-components so this declaration is empty */
@Component
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

  /* This is a variable that does NOT belong in the global settings but I don't know where else to 
  put it. This is the list of tools that should be displayed*/
  private buttonDisplayList = SETTINGS.userButtonDisplayList;

  /* Allow us to bind the button object in the parent (=ToolGroups) with the button object in the
  child */
  @Prop({ default: null })
  button!: ToolButtonType;

  private elev = 0;
  private weight = "normal";

  private color = "red";

  @SE.State((s: AppState) => s.actionMode)
  readonly actionMode!: string;

  @Watch("actionMode")
  private setElevation(): void {
    if (this.actionMode === this.button.actionModeValue) {
      // console.log("set elevation in");
      this.elev = 1;
      this.weight = "bold";
    } else {
      this.elev = 0;
      this.weight = "normal";
    }
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
