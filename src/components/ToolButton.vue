<template>
  <div class="pa-0" id="button.id" v-if="buttonDisplayList.indexOf(button.editModeValue) !== -1">
    <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
      <template v-slot:activator="{ on }">
        <v-btn
          icon
          text
          :value="button.editModeValue"
          v-on="on"
          @click="displayToolUseMessage=true"
        >
          <v-icon>{{ button.icon }}</v-icon>
        </v-btn>
      </template>
      <span>{{ $t('message.tools.' + button.toolTipMessage) }}</span>
    </v-tooltip>
    <v-snackbar
      v-model="displayToolUseMessage"
      bottom
      left
      :timeout="toolUseMessageDelay"
      :multi-line="$t('message.tools.' + button.toolUseMessage).length>38"
    >
      {{ $t('message.tools.' + button.toolUseMessage) }}
      <v-btn color="red" text @click="displayToolUseMessage = false" icon>
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import SETTINGS from "@/global-settings";
import { Prop } from "vue-property-decorator";

@Component
export default class ToolButton extends Vue {
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private toolUseMessageDelay = SETTINGS.toolUse.delay;
  private displayToolUseMessage = false;
  /* This is a variable that does NOT belong in the global settings but I don't know where else to 
  put it. This is the list of tools that should be displayed*/
  private buttonDisplayList = SETTINGS.buttonDisplayList;

  @Prop({ default: null })
  button!: object;

  log(item: object) {
    console.log(item);
  }
}
</script>

<style lang="scss">
</style>
 



