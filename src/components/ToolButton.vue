<template>
  <!-- Displays a button only if the user has permission to see it. -->
  <div class="pa-0" id="button.id" v-if="(buttonDisplayList.indexOf(button.editModeValue) !== -1)">
    <!-- The button is wrapped in to tooltip vue component -->
    <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
      <template v-slot:activator="{ on }">
        <!-- FIXME: unused event triggered by $emit EDIT:  This is used. This event is used to turn off all 
        snackbar messages except the one emiting this event.-->
        <v-btn
          icon
          text
          :value="button.editModeValue"
          v-on="on"
          @click="$emit('displayOnlyThisToolUseMessage',button.id); displayToolUseMessage = true;"
        >
          <v-icon>{{ button.icon }}</v-icon>
        </v-btn>
      </template>
      <span>{{ $t('message.buttons.' + button.toolTipMessage) }}</span>
    </v-tooltip>

    <!--- FIXME: length compare with 38 may break when using bigger fonts EDIT: How? --->
    <v-snackbar
      v-model="displayToolUseMessage"
      bottom
      left
      :timeout="toolUseMessageDelay"
      :multi-line="($t('message.buttons.'+ button.displayedName) +': ' + $t('message.buttons.' + button.toolUseMessage)).length>38"
    >
      <span>
        <strong class="warning--text">{{$t('message.buttons.'+ button.displayedName) +': '}}</strong>
        {{ $t('message.buttons.' + button.toolUseMessage) }}
      </span>
      <v-btn @click="displayToolUseMessage = false" icon>
        <v-icon color="success">mdi-close</v-icon>
      </v-btn>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { ToolButtonType } from "@/types";
import SETTINGS from "@/global-settings";

/* This component (i.e. ToolButton) has no sub-components so this declaration is empty */
@Component
export default class ToolButton extends Vue {
  /* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay & toolUse */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private toolUseMessageDelay = SETTINGS.toolUse.delay;

  /* This controls the display of the snackbar Tool Use Message. This is set to false by the 
  $emit('displayOnlyThisToolUseMessage',button.id) <-- this turns off all other snackbar messages
  that sends a message to the parent (ToolButtons.vue) that triggers the method 
  displayOnlyThisToolUseMessageFunc 
  in the parent which changes the value of button.displayToolUseMessage (except in the button with
  id button.id), this is variable is being watched in this child and turns off the display of the
  snackbar/toolUseMessage  */
  private displayToolUseMessage = false;

  /* This is a variable that does NOT belong in the global settings but I don't know where else to 
  put it. This is the list of tools that should be displayed*/
  private buttonDisplayList = SETTINGS.userButtonDisplayList;

  /* Allow us to bind the button object in the parent (=ToolButtons) with the button object in the
  child */
  @Prop({ default: null })
  button!: ToolButtonType;

  /* @Watch if button.displayToolUseMessage changes then set displayToolUseMessage to false so
      that multiple snackbars tool use messages are not displayed at the same time*/
  @Watch("button.displayToolUseMessage")
  protected onButtonChanged() {
    this.displayToolUseMessage = false;
  }
}
</script>

<style lang="scss">
</style>
