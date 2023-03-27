<template>
  <v-tooltip
    bottom
    :open-delay="toolTipOpenDelay"
    :close-delay="toolTipCloseDelay"
  >
    <!-- TODO: shortcut icons do not use @click="switchButton(button)"; Others do -->
    <template v-slot:activator="{on}">
      <v-btn
        :disabled="disableBtn"
        :color="btnColor"
        :value="button"
        icon
        tile
        v-on:click="$listeners.click"
        @click="switchButton(button)"
        v-on="on"
      >

        <v-icon :disabled="disableBtn" :color="iconColor">{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span v-html="$t('buttons.' + labelMsg )"></span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";
import SETTINGS from "@/global-settings";
import { mapState, mapActions} from "pinia";
import { useSEStore } from "@/stores/se";
import {ActionMode, ToolButtonType} from "@/types";


@Component({
 methods: {
    ...mapActions(useSEStore, ["setActionMode", "setButton"]),
  }}
  )

export default class ShortcutIcon extends Vue {
  @Prop() readonly labelMsg!: string;
  @Prop() readonly icon!: string;
  @Prop() readonly iconColor!: string;
  @Prop() readonly btnColor!: string;
  @Prop() readonly disableBtn!: boolean;
  @Prop() button!: ToolButtonType | null;

  readonly setActionMode!: (arg: { id: ActionMode; name: string }) => void;

  readonly setButton!: (_: ToolButtonType) => void;

  toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  switchButton(button: ToolButtonType | null): void { //Set the button selected so it can be tracked
    if (button?.clickFunc != null) {
      button.clickFunc();
    } else {
      this.setButton(button!);
      this.setActionMode({
        id: "point",
        name: "CreatePointDisplayedName"
      });
    }
  }
}

</script>

<style></style>
