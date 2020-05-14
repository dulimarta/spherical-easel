<template>
  <div class="pa-1 accent" id="toolButtonContainer">
    <!-- The Basic Tool Group only shown if the user has permission to use a tool in this group. -->
    <div id="BasicToolGroup" v-show="nonEmptyGroup('basic')">
      <h3 class="body-1 font-weight-bold">{{ $t('message.toolGroups.BasicTools') }}</h3>

      <!-- 
      The Basic Tool Group only shown if the user has permission to use a tool in this 
      group. 
      -->
      <v-btn-toggle
        v-model="editMode"
        @change="switchEditMode"
        class="mr-2 d-flex flex-wrap accent"
      >
        <!--- Use Array.filter to select only basic tools -->
        <ToolButton
          v-for="button in buttonList.filter(b => b.toolGroup === 'basic')"
          :key="button.id"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc"
        ></ToolButton>
      </v-btn-toggle>
    </div>

    <!-- 
      The Advanced Tool Group only shown if the user has permission to use a tool in this 
      group. Note the use of the translation $t(key_value).
    -->
    <div id="AdvanceToolGroup" v-show="nonEmptyGroup('advanced')">
      <h3 class="body-1 font-weight-bold">{{ $t('message.toolGroups.AdvancedTools') }}</h3>
      <!-- This group of buttons/tools sets the bound editMode variable using the switchEditMode
      method.-->
      <v-btn-toggle
        v-model="editMode"
        @change="switchEditMode"
        class="mr-2 d-flex flex-wrap accent"
      >
        <!--- Use Array.filter to select only andvanced tools -->
        <ToolButton
          v-for="button in buttonList.filter(b => b.toolGroup === 'advanced')"
          :key="button.id"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc"
        ></ToolButton>
      </v-btn-toggle>
    </div>

    <!-- 
      The Transformational Tool Group only shown if the user has permission to use a tool in this 
      group. Note the use of the translation $t(key_value).
    -->
    <div id="TransformationalToolGroup" v-show="nonEmptyGroup('transformational')">
      <h3 class="body-1 font-weight-bold">{{ $t('message.toolGroups.TransformationalTools') }}</h3>
      <v-btn-toggle
        v-model="editMode"
        @change="switchEditMode"
        class="mr-2 d-flex flex-wrap accent"
      >
        <!--- Use Array.filter to select only transformational tools -->
        <ToolButton
          v-for="button in buttonList.filter(b => b.toolGroup === 'transformational')"
          :key="button.id"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc"
        ></ToolButton>
      </v-btn-toggle>
    </div>

    <!-- TODO: Move these edit controls to the the panel containing the sphere. 
    When not available they should be greyed out (i.e. disabled).-->
    <h3 class="body-1 font-weight-bold">{{ $t('message.toolGroups.EditTools') }}</h3>
    <v-btn-toggle class="accent">
      <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
        <template v-slot:activator="{ on }">
          <v-btn icon @click="undoEdit" v-on="on">
            <v-icon>mdi-undo</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('message.main.UndoLastAction') }}</span>
      </v-tooltip>
      <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
        <template v-slot:activator="{ on }">
          <v-btn icon @click="redoAction" v-on="on">
            <v-icon>mdi-redo</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('message.main.RedoLastAction') }}</span>
      </v-tooltip>
    </v-btn-toggle>

    <!-- TODO: Move this into a tool tip somewhere. -->
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

/* Import the components so we can use the class-style vue components in TypeScript. */
import Component from "vue-class-component";
import ToolButton from "@/components/ToolButton.vue";
import { ToolButtonType } from "@/types";

/* Import the global settings. */
import SETTINGS from "@/global-settings";
import { Command } from "@/commands/Comnand";

/* Declare the components used in this component. */
@Component({
  components: { ToolButton }
})
export default class ToolButtons extends Vue {
  /* Controls the selection of the editMode using the buttons. The default is rotate. */
  private editMode = "rotate";

  /* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  /* This is a variable that does NOT belong in the global settings but I don't know where else to 
  put it. This is the list of tools that should be displayed*/
  private buttonDisplayList = SETTINGS.userButtonDisplayList;

  /* A list of all the buttons that are possible to display/use. Only those that the User has
  permission to use will be available. */
  private buttonList: ToolButtonType[] = [
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

  /* Writes the current state/edit mode to the store, where the Easel view can read it. */
  switchEditMode() {
    this.$store.commit("setEditMode", this.editMode);
  }

  /* Undoes the last user action that changed the state of the sphere. */
  undoEdit() {
    Command.undo();
  }
  /* Redoes the last user action that changed the state of the sphere. */
  redoAction() {
    Command.redo();
  }
  // cantUndo() { return Command.canUndo() === false },
  // cantRedo: () => !Command.canRedo(),

  /* This returns true only if there is at least one tool that needs to be displayed in the
  group because the user has permission to use it.*/
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

  /* This turns off all other snackbar/toolUseMessage displays so that multiple 
  snackbar/toolUseMessages are not displayed at the same time.  */
  displayOnlyThisToolUseMessageFunc(id: number) {
    for (const btn of this.buttonList) {
      if (btn.id !== id) {
        btn.displayToolUseMessage = !btn.displayToolUseMessage;
      }
    }
  }
}
</script> 

<style lang="scss">
</style>  
