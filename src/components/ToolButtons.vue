<template>
  <div class="pa-1" id="toolButtonContainer">
    <div id="BasicToolGroup" v-show="nonEmptyGroup('basic')">
      <h3 class="body-1 font-weight-bold">{{ $t('message.toolGroups.BasicTools') }}</h3>
      <v-btn-toggle v-model="editMode" @change="switchEditMode" class="mr-2 d-flex flex-wrap">
        <ToolButton
          v-for="button in buttonList"
          :key="button.id"
          :button="button"
          toolGroup="basic"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc"
        ></ToolButton>
      </v-btn-toggle>
    </div>

    <div id="AdvanceToolGroup" v-show="nonEmptyGroup('advanced')">
      <h3 class="body-1 font-weight-bold">{{ $t('message.toolGroups.AdvancedTools') }}</h3>
      <v-btn-toggle v-model="editMode" @change="switchEditMode" class="mr-2 d-flex flex-wrap">
        <ToolButton
          v-for="button in buttonList"
          :key="button.id"
          :button="button"
          toolGroup="advanced"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc"
        ></ToolButton>
      </v-btn-toggle>
    </div>

    <div id="TransformationalToolGroup" v-show="nonEmptyGroup('transformational')">
      <h3 class="body-1 font-weight-bold">{{ $t('message.toolGroups.TransformationalTools') }}</h3>
      <v-btn-toggle v-model="editMode" @change="switchEditMode" class="mr-2 d-flex flex-wrap">
        <ToolButton
          v-for="button in buttonList"
          :key="button.id"
          :button="button"
          toolGroup="transformational"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc"
        ></ToolButton>
      </v-btn-toggle>
    </div>

    <h3 class="body-1 font-weight-bold">{{ $t('message.toolGroups.EditTools') }}</h3>
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
        <h3 class="body-1 font-weight-bold">{{ $t('message.toolGroups.KeyShortCut') }}</h3>
        <ul>
          <li>{{ $t('message.toolGroups.ResetSphereOrientation') }}</li>
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
  private editMode = "rotate";
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  /* This is a variable that does NOT belong in the global settings but I don't know where else to 
  put it. This is the list of tools that should be displayed*/
  private buttonDisplayList = SETTINGS.userButtonDisplayList;

  private buttonList = [
    {
      id: 0,
      editModeValue: "rotate",
      displayedName: "RotateDisplayedName",
      icon: "mdi-cursor-pointer",
      toolTipMessage: "RotateSphereToolTipMessage",
      toolUseMessage: "RotateSphereToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },
    {
      id: 1,
      editModeValue: "move",
      displayedName: "MoveDisplayedName",
      icon: "mdi-cursor-move",
      toolTipMessage: "MoveObjectToolTipMessage",
      toolUseMessage: "MoveObjectToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },
    {
      id: 2,
      editModeValue: "point",
      displayedName: "CreatePointDisplayedName",
      icon: "mdi-vector-point",
      toolTipMessage: "CreatePointToolTipMessage",
      toolUseMessage: "CreatePointToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },
    {
      id: 3,
      editModeValue: "line",
      displayedName: "CreateLineDisplayedName",
      icon: "mdi-vector-line",
      toolTipMessage: "CreateLineToolTipMessage",
      toolUseMessage: "CreateLineToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },
    {
      id: 4,
      editModeValue: "segment",
      displayedName: "CreateLineSegmentDisplayedName",
      icon: "mdi-vector-radius",
      toolTipMessage: "CreateLineSegmentToolTipMessage",
      toolUseMessage: "CreateLineSegmentToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },
    {
      id: 5,
      editModeValue: "circle",
      displayedName: "CreateCircleDisplayedName",
      icon: "mdi-vector-circle-variant",
      toolTipMessage: "CreateCircleToolTipMessage",
      toolUseMessage: "CreateCircelToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "advanced"
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
  /* This returns true only if there is at least one tool that needs to be displayed in the
  group. */
  nonEmptyGroup(str: string): boolean {
    for (const btn of this.buttonList) {
      if (
        this.buttonDisplayList.indexOf(btn.editModeValue) !== -1 &&
        btn.toolGroup === str
      ) {
        return true;
      }
    }
    return false;
  }

  /* This turns off all other snackbar displays so that multiple snackbar (toolUseMessages) are 
  not displayed at the same time.  */
  displayOnlyThisToolUseMessageFunc(id: number) {
    for (const btn of this.buttonList) {
      if (btn.id !== id) {
        btn.displayToolUseMessage = !btn.displayToolUseMessage;
      }
    }
  }

  log(item: object) {
    console.log(item);
  }
}
</script> 

<style lang="scss">
</style>  
