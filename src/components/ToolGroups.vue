<template>
  <div class="pa-1 accent" id="toolButtonContainer">
    <!-- The Edit Tool Group only shown if the user has permission to use a tool in this group.
    Note the use of the translation $t(key_value).-->
    <div id="EditToolGroup" v-show="nonEmptyGroup('edit')">
      <h3 class="body-1 font-weight-bold">{{ $t("toolGroups.EditTools") }}</h3>
      <v-btn-toggle
        v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent"
      >
        <!--- Use Array.filter to select only edit tools -->
        <ToolButton
          v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'edit'
          )"
          :key="pos"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc"
        ></ToolButton>
      </v-btn-toggle>
    </div>

    <!-- The Basic Tool Group only shown if the user has permission to use a tool in this group.
    Note the use of the translation $t(key_value).-->
    <div id="BasicToolGroup" v-show="nonEmptyGroup('basic')">
      <h3 class="body-1 font-weight-bold">{{ $t("toolGroups.BasicTools") }}</h3>
      <v-btn-toggle
        v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent"
      >
        <!--- Use Array.filter to select only basic tools -->
        <ToolButton
          v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'basic'
          )"
          :key="pos"
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
      <h3 class="body-1 font-weight-bold">
        {{ $t("toolGroups.AdvancedTools") }}
      </h3>
      <v-btn-toggle
        v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent"
      >
        <!--- Use Array.filter to select only advanced tools -->
        <ToolButton
          v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'advanced'
          )"
          :key="pos"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc"
        ></ToolButton>
      </v-btn-toggle>
    </div>

    <!-- 
      The Transformational Tool Group only shown if the user has permission to use a tool in this 
      group. Note the use of the translation $t(key_value).
    -->
    <div
      id="TransformationalToolGroup"
      v-show="nonEmptyGroup('transformational')"
    >
      <h3 class="body-1 font-weight-bold">
        {{ $t("toolGroups.TransformationalTools") }}
      </h3>
      <v-btn-toggle
        v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent"
      >
        <ToolButton
          v-for="(button, pos) in buttonList"
          :key="pos"
          :button="button"
          toolGroup="transformational"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc"
        ></ToolButton>
      </v-btn-toggle>
    </div>

    <!-- TODO: Move this into a tool tip somewhere. -->
    <div class="ml-2" style="height:100%;">
      <div>
        <h3 class="body-1 font-weight-bold">
          {{ $t("toolGroups.KeyShortCut") }}
        </h3>
        <ul>
          <li>{{ $t("toolGroups.ResetSphereOrientation") }}</li>
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

/* Declare the components used in this component. */
@Component({
  components: { ToolButton }
})
export default class ToolGroups extends Vue {
  /* Controls the selection of the actionMode using the buttons. The default is segment. */
  private actionMode = "segment";

  /* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  /* This is a variable that does NOT belong in the global settings but I don't know where else to 
  put it. This is the list of tools that should be displayed*/
  private buttonDisplayList = SETTINGS.userButtonDisplayList;
  /* Writes the current state/edit mode to the store, where the Easel view can read it. */
  switchActionMode(): void {
    this.$store.commit("setActionMode", this.actionMode);
  }

  /* This returns true only if there is at least one tool that needs to be displayed in the group. */
  nonEmptyGroup(groupName: string): boolean {
    return this.buttonList.filter(b => b.toolGroup === groupName).length > 0;
  }

  /* This turns off all other snackbar/toolUseMessage displays so that multiple 
  snackbar/toolUseMessages are not displayed at the same time.  */
  displayOnlyThisToolUseMessageFunc(id: number): void {
    // Alternative solution: use Array high-order functions
    this.buttonList
      .filter(btn => btn.id !== id)
      .forEach(btn => {
        btn.displayToolUseMessage = !btn.displayToolUseMessage;
      });
  }
  /* A list of all the buttons that are possible to display/use. Only those that the User has
  permission to use will be available. */
  private buttonList: ToolButtonType[] = [
    {
      id: 40,
      actionModeValue: "select",
      displayedName: "CreateSelectDisplayedName",
      icon: "mdi-cursor-pointer",
      toolTipMessage: "CreateSelectToolTipMessage",
      toolUseMessage: "CreateSelectToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "edit"
    },
    {
      id: 50,
      actionModeValue: "rotate",
      displayedName: "RotateDisplayedName",
      icon: "mdi-rotate-3d-variant",
      toolTipMessage: "RotateSphereToolTipMessage",
      toolUseMessage: "RotateSphereToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "edit"
    },
    {
      id: 60,
      actionModeValue: "move",
      displayedName: "MoveDisplayedName",
      icon: "mdi-cursor-move",
      toolTipMessage: "MoveObjectToolTipMessage",
      toolUseMessage: "MoveObjectToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "edit"
    },
    {
      id: 0,
      actionModeValue: "point",
      displayedName: "CreatePointDisplayedName",
      icon: "mdi-vector-point",
      toolTipMessage: "CreatePointToolTipMessage",
      toolUseMessage: "CreatePointToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },
    {
      id: 20,
      actionModeValue: "line",
      displayedName: "CreateLineDisplayedName",
      icon: "mdi-vector-line",
      toolTipMessage: "CreateLineToolTipMessage",
      toolUseMessage: "CreateLineToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },
    {
      id: 10,
      actionModeValue: "segment",
      displayedName: "CreateLineSegmentDisplayedName",
      icon: "mdi-vector-radius",
      toolTipMessage: "CreateLineSegmentToolTipMessage",
      toolUseMessage: "CreateLineSegmentToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },
    {
      id: 30,
      actionModeValue: "circle",
      displayedName: "CreateCircleDisplayedName",
      icon: "mdi-vector-circle-variant",
      toolTipMessage: "CreateCircleToolTipMessage",
      toolUseMessage: "CreateCircleToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "advanced"
    },
    {
      id: 70,
      actionModeValue: "zoomIn",
      displayedName: "PanZoomInDisplayedName",
      icon: "mdi-magnify-plus-outline",
      toolTipMessage: "PanZoomInToolTipMessage",
      toolUseMessage: "PanZoomInToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "edit"
    },
    {
      id: 80,
      actionModeValue: "zoomOut",
      displayedName: "PanZoomOutDisplayedName",
      icon: "mdi-magnify-minus-outline",
      toolTipMessage: "PanZoomOutToolTipMessage",
      toolUseMessage: "PanZoomOutToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "edit"
    }
    //sort the button list by id so that we don't have to reorder the list each item we add a new button
  ].sort((a: ToolButtonType, b: ToolButtonType) => a.id - b.id);
}
</script>

<style lang="scss"></style>
