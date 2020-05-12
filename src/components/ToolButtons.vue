<template>
  <div class="pa-1" id="toolButtonContainer">
    <h3 class="body-1 font-weight-bold">{{ $t('message.main.BasicTools') }}</h3>
    <v-btn-toggle v-model="editMode" @change="switchEditMode" class="mr-2 d-flex flex-wrap">
      <ToolButton v-for="button in buttonList" :key="button.id" :button="button"></ToolButton>
    </v-btn-toggle>
    <h3 class="body-1 font-weight-bold">{{ $t('message.main.EditTools') }}</h3>
    <v-btn-toggle>
      <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
        <template v-slot:activator="{ on }">
          <v-btn @click="undoEdit" v-on="on">
            <v-icon>mdi-undo</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('message.main.UndoLastAction') }}</span>
      </v-tooltip>
      <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
        <template v-slot:activator="{ on }">
          <v-btn @click="redoAction" v-on="on">
            <v-icon>mdi-redo</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('message.main.RedoLastAction') }}</span>
      </v-tooltip>
    </v-btn-toggle>
    <div class="ml-2" style="height:100%;">
      <div>
        <h3 class="body-1 font-weight-bold">{{ $t('message.main.KeyShortCut') }}</h3>
        <ul>
          <li>{{ $t('message.main.ResetSphereOrientation') }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import SETTINGS from "@/global-settings";
import { Command } from "@/commands/Comnand";
import ToolButton from "@/components/ToolButton.vue";

@Component({
  components: { ToolButton }
})
export default class ToolButtons extends Vue {
  private editMode = "none";
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private buttonList = [
    {
      id: 0,
      editModeValue: "none",
      icon: "mdi-cursor-pointer",
      toolTipMessage: "RotateSphereToolTipMessage",
      toolUseMessage: "RotateSphereToolUseMessage"
    },
    {
      id: 1,
      editModeValue: "move",
      icon: "mdi-cursor-move",
      toolTipMessage: "MoveObjectToolTipMessage",
      toolUseMessage: "MoveObjectToolUseMessage"
    },
    {
      id: 2,
      editModeValue: "point",
      icon: "mdi-vector-point",
      toolTipMessage: "CreatePointToolTipMessage",
      toolUseMessage: "CreatePointToolUseMessage"
    },
    {
      id: 3,
      editModeValue: "line",
      icon: "mdi-vector-line",
      toolTipMessage: "CreateLineToolTipMessage",
      toolUseMessage: "CreateLineToolUseMessage"
    },
    {
      id: 4,
      editModeValue: "segment",
      icon: "mdi-vector-radius",
      toolTipMessage: "CreateLineSegmentToolTipMessage",
      toolUseMessage: "CreateLineSegmentToolUseMessage"
    },
    {
      id: 5,
      editModeValue: "circle",
      icon: "mdi-vector-circle-variant",
      toolTipMessage: "CreateCircleToolTipMessage",
      toolUseMessage: "CreateCircelToolUseMessage"
    }
  ];

  switchEditMode() {
    this.$store.commit("setEditMode", this.editMode);
  }
  undoEdit() {
    Command.undo();
  }
  redoAction() {
    Command.redo();
  }
  log(item: object) {
    console.log(item);
  }
}
</script> 

<style lang="scss">
</style>  
