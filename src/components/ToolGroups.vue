<template>
  <div class="pa-1 accent"
    id="toolButtonContainer">
    <!-- The Edit Tool Group only shown if the user has permission to use a tool in this group.
    Note the use of the translation $t(key_value).-->
    <div id="EditToolGroup"
      v-show="nonEmptyGroup('edit')">
      <h3 class="body-1 font-weight-bold">{{ $t("toolGroups.EditTools") }}
      </h3>
      <v-btn-toggle v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent">
        <!--- Use Array.filter to select only edit tools -->
        <ToolButton v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'edit'
          )"
          :key="pos"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc">
        </ToolButton>
      </v-btn-toggle>
    </div>

    <!-- The Display Tool Group only shown if the user has permission to use a tool in this group.
    Note the use of the translation $t(key_value).-->
    <div id="DisplayToolGroup"
      v-show="nonEmptyGroup('display')">
      <h3 class="body-1 font-weight-bold">
        {{ $t("toolGroups.DisplayTools") }}
      </h3>
      <v-btn-toggle v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent">
        <!--- Use Array.filter to select only basic tools -->
        <ToolButton v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'display'
          )"
          :key="pos"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc">
        </ToolButton>
      </v-btn-toggle>
    </div>

    <!-- The Basic Tool Group only shown if the user has permission to use a tool in this group.
    Note the use of the translation $t(key_value).-->
    <div id="BasicToolGroup"
      v-show="nonEmptyGroup('basic')">
      <h3 class="body-1 font-weight-bold">{{ $t("toolGroups.BasicTools") }}
      </h3>
      <v-btn-toggle v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent">
        <!--- Use Array.filter to select only basic tools -->
        <ToolButton v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'basic'
          )"
          :key="pos"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc">
        </ToolButton>
      </v-btn-toggle>
    </div>
    <!-- The Construction Tool Group only shown if the user has permission to use a tool in this group.
    Note the use of the translation $t(key_value).-->
    <div id="ConstructionToolGroup"
      v-show="nonEmptyGroup('construction')">
      <h3 class="body-1 font-weight-bold">
        {{ $t("toolGroups.ConstructionTools") }}
      </h3>
      <v-btn-toggle v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent">
        <!--- Use Array.filter to select only basic tools -->
        <ToolButton v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'construction'
          )"
          :key="pos"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc">
        </ToolButton>
      </v-btn-toggle>
    </div>

    <!-- 
      The Measurement Tool Group only shown if the user has permission to use a tool in this 
      group. Note the use of the translation $t(key_value).
    -->
    <div id="MeasurementToolGroup"
      v-show="nonEmptyGroup('measurement')">
      <h3 class="body-1 font-weight-bold">
        {{ $t("toolGroups.MeasurementTools") }}
      </h3>
      <v-btn-toggle v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent">
        <ToolButton v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'measurement'
          )"
          :key="pos"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc">
        </ToolButton>
      </v-btn-toggle>
    </div>

    <!-- 
      The Advanced Tool Group only shown if the user has permission to use a tool in this 
      group. Note the use of the translation $t(key_value).
    -->
    <div id="AdvanceToolGroup"
      v-show="nonEmptyGroup('advanced')">
      <h3 class="body-1 font-weight-bold">
        {{ $t("toolGroups.AdvancedTools") }}
      </h3>
      <v-btn-toggle v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent">
        <!--- Use Array.filter to select only advanced tools -->
        <ToolButton v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'advanced'
          )"
          :key="pos"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc">
        </ToolButton>
      </v-btn-toggle>
    </div>

    <!-- 
      The Transformational Tool Group only shown if the user has permission to use a tool in this 
      group. Note the use of the translation $t(key_value).
    -->
    <div id="TransformationalToolGroup"
      v-show="nonEmptyGroup('transformational')">
      <h3 class="body-1 font-weight-bold">
        {{ $t("toolGroups.TransformationalTools") }}
      </h3>
      <v-btn-toggle v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent">
        <ToolButton v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'transformation'
          )"
          :key="pos"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc">
        </ToolButton>
      </v-btn-toggle>
    </div>

    <!-- 
      The Conice Tool Group only shown if the user has permission to use a tool in this 
      group. Note the use of the translation $t(key_value).
    -->
    <div id="ConicToolGroup"
      v-show="nonEmptyGroup('conic')">
      <h3 class="body-1 font-weight-bold">
        {{ $t("toolGroups.ConicTools") }}
      </h3>
      <v-btn-toggle v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent">
        <ToolButton v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'conic'
          )"
          :key="pos"
          :button="button"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc">
        </ToolButton>
      </v-btn-toggle>
    </div>

    <div id="DeveloperToolGroup"
      v-show="nonEmptyGroup('developerOnly') && !inProductionMode">
      <h3 class="body-1 font-weight-bold">
        {{ $t("toolGroups.DeveloperOnlyTools") }}
      </h3>
      <v-btn-toggle v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent">
        <!--- Use Array.filter to select only edit tools -->
        <ToolButton v-for="(button, pos) in buttonList.filter(
            b => b.toolGroup === 'developerOnly'
          )"
          :key="pos"
          :button="button"
          :elev="elev"
          v-on:displayOnlyThisToolUseMessage="displayOnlyThisToolUseMessageFunc">
        </ToolButton>
      </v-btn-toggle>
    </div>

  </div>
</template>

<script lang="ts">
import Vue from "vue";
/* Import the components so we can use the class-style vue components in TypeScript. */
import Component from "vue-class-component";
import ToolButton from "@/components/ToolButton.vue";
import { ActionMode, ToolButtonType } from "@/types";
import { SEStore } from "@/store";
/* Import the global settings. */
import SETTINGS from "@/global-settings";

/* Declare the components used in this component. */
@Component({
  components: { ToolButton }
})
export default class ToolGroups extends Vue {
  /* Controls the selection of the actionMode using the buttons. The default is segment. */
  private actionMode: { id: ActionMode; name: string } = {
    id: "rotate",
    name: ""
  };

  /* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private elev = 24;
  private inProductionMode = false;

  /* This is a variable that does NOT belong in the global settings but I don't know where else to 
  put it. This is the list of tools that should be displayed*/
  private buttonDisplayList = SETTINGS.userButtonDisplayList;

  created(): void {
    this.inProductionMode = process.env.NODE_ENV === "production";
  }

  /* Writes the current state/edit mode to the store, where the Easel view can read it. */
  switchActionMode(): void {
    SEStore.setActionMode(this.actionMode);
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
      id: 0,
      actionModeValue: "point",
      displayedName: "CreatePointDisplayedName",
      icon: "$vuetify.icons.value.point",
      toolTipMessage: "CreatePointToolTipMessage",
      toolUseMessage: "CreatePointToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },
    {
      id: 5,
      actionModeValue: "line",
      displayedName: "CreateLineDisplayedName",
      icon: "$vuetify.icons.value.line",
      toolTipMessage: "CreateLineToolTipMessage",
      toolUseMessage: "CreateLineToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },
    {
      id: 10,
      actionModeValue: "segment",
      displayedName: "CreateLineSegmentDisplayedName",
      icon: "$vuetify.icons.value.segment",
      toolTipMessage: "CreateLineSegmentToolTipMessage",
      toolUseMessage: "CreateLineSegmentToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },
    {
      id: 20,
      actionModeValue: "circle",
      displayedName: "CreateCircleDisplayedName",
      icon: "$vuetify.icons.value.circle",
      toolTipMessage: "CreateCircleToolTipMessage",
      toolUseMessage: "CreateCircleToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "basic"
    },

    {
      id: 0,
      actionModeValue: "select",
      displayedName: "SelectDisplayedName",
      icon: "mdi-cursor-pointer",
      toolTipMessage: "SelectToolTipMessage",
      toolUseMessage: "SelectToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "edit"
    },
    {
      id: 5,
      actionModeValue: "delete",
      displayedName: "DeleteDisplayedName",
      icon: "mdi-delete",
      toolTipMessage: "DeleteToolTipMessage",
      toolUseMessage: "DeleteToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "edit"
    },

    {
      id: 0,
      actionModeValue: "hide",
      displayedName: "HideDisplayedName",
      icon: "mdi-file-hidden",
      toolTipMessage: "HideObjectToolTipMessage",
      toolUseMessage: "HideObjectToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "display"
    },
    {
      id: 5,
      actionModeValue: "toggleLabelDisplay",
      displayedName: "ToggleLabelDisplayedName",
      icon: "mdi-toggle-switch-off-outline",
      toolTipMessage: "ToggleLabelToolTipMessage",
      toolUseMessage: "ToggleLabelToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "display"
    },

    {
      id: 15,
      actionModeValue: "move",
      displayedName: "MoveDisplayedName",
      icon: "mdi-cursor-move",
      toolTipMessage: "MoveObjectToolTipMessage",
      toolUseMessage: "MoveObjectToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "display"
    },
    {
      id: 20,
      actionModeValue: "rotate",
      displayedName: "RotateDisplayedName",
      icon: "mdi-rotate-3d-variant",
      toolTipMessage: "RotateSphereToolTipMessage",
      toolUseMessage: "RotateSphereToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "display"
    },

    {
      id: 25,
      actionModeValue: "zoomIn",
      displayedName: "PanZoomInDisplayedName",
      icon: "mdi-magnify-plus-outline",
      toolTipMessage: "PanZoomInToolTipMessage",
      toolUseMessage: "PanZoomInToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "edit"
    },
    {
      id: 30,
      actionModeValue: "zoomOut",
      displayedName: "PanZoomOutDisplayedName",
      icon: "mdi-magnify-minus-outline",
      toolTipMessage: "PanZoomOutToolTipMessage",
      toolUseMessage: "PanZoomOutToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "edit"
    },
    {
      id: 35,
      actionModeValue: "zoomFit",
      displayedName: "ZoomFitDisplayedName",
      icon: "mdi-magnify-scan",
      toolTipMessage: "ZoomFitToolTipMessage",
      toolUseMessage: "ZoomFitToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "edit"
    },
    {
      id: 0,
      actionModeValue: "midpoint",
      displayedName: "CreateMidpointDisplayedName",
      icon: "$vuetify.icons.value.midpoint",
      toolTipMessage: "CreateMidpointToolTipMessage",
      toolUseMessage: "CreateMidpointToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "construction"
    },
    {
      id: 5,
      actionModeValue: "angleBisector",
      displayedName: "CreateAngleBisectorDisplayedName",
      icon: "$vuetify.icons.value.angleBisector",
      toolTipMessage: "CreateAngleBisectorToolTipMessage",
      toolUseMessage: "CreateAngleBisectorToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "construction"
    },
    {
      id: 15,
      actionModeValue: "antipodalPoint",
      displayedName: "CreateAntipodalPointDisplayedName",
      icon: "$vuetify.icons.value.antipode",
      toolTipMessage: "CreateAntipodalPointToolTipMessage",
      toolUseMessage: "CreateAntipodalPointToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "construction"
    },
    {
      id: 20,
      actionModeValue: "polar",
      displayedName: "CreatePolarDisplayedName",
      icon: "$vuetify.icons.value.polar",
      toolTipMessage: "CreatePolarToolTipMessage",
      toolUseMessage: "CreatePolarToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "construction"
    },
    {
      id: 25,
      actionModeValue: "tangent",
      displayedName: "CreateTangentDisplayedName",
      icon: "$vuetify.icons.value.tangent",
      toolTipMessage: "CreateTangentToolTipMessage",
      toolUseMessage: "CreateTangentToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "construction"
    },
    {
      id: 30,
      actionModeValue: "perpendicular",
      displayedName: "CreatePerpendicularDisplayedName",
      icon: "$vuetify.icons.value.perpendicular",
      toolTipMessage: "CreatePerpendicularToolTipMessage",
      toolUseMessage: "CreatePerpendicularToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "construction"
    },
    {
      id: 50,
      actionModeValue: "intersect",
      displayedName: "CreateIntersectionDisplayedName",
      icon: "$vuetify.icons.value.intersection",
      toolTipMessage: "CreateIntersectionToolTipMessage",
      toolUseMessage: "CreateIntersectionToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "construction"
    },
    {
      id: 45,
      actionModeValue: "pointOnOneDim",
      displayedName: "CreatePointOnOneDimDisplayedName",
      icon: "$vuetify.icons.value.pointOnObject",
      toolTipMessage: "CreatePointOnOneDimToolTipMessage",
      toolUseMessage: "CreatePointOnOneDimToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "construction"
    },
    {
      id: 0,
      actionModeValue: "segmentLength",
      displayedName: "CreateSegmentLengthDisplayedName",
      icon: "$vuetify.icons.value.segmentLength",
      toolTipMessage: "CreateSegmentLengthToolTipMessage",
      toolUseMessage: "CreateSegmentLengthToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "measurement"
    },
    {
      id: 5,
      actionModeValue: "pointDistance",
      displayedName: "CreatePointDistanceDisplayedName",
      icon: "$vuetify.icons.value.pointDistance",
      toolTipMessage: "CreatePointDistanceToolTipMessage",
      toolUseMessage: "CreatePointDistanceToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "measurement"
    },
    {
      id: 10,
      actionModeValue: "angle",
      displayedName: "CreateAngleDisplayedName",
      icon: "$vuetify.icons.value.angle",
      toolTipMessage: "CreateAngleToolTipMessage",
      toolUseMessage: "CreateAngleToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "measurement"
    },
    {
      id: 15,
      actionModeValue: "coordinate",
      displayedName: "CreateCoordinateDisplayedName",
      icon: "mdi-axis-arrow-info",
      toolTipMessage: "CreateCoordinateToolTipMessage",
      toolUseMessage: "CreateCoordinateToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "measurement"
    },
    {
      id: 20,
      actionModeValue: "measureTriangle",
      displayedName: "MeasureTriangleDisplayedName",
      icon: "$vuetify.icons.value.measuredTriangle",
      toolTipMessage: "MeasureTriangleToolTipMessage",
      toolUseMessage: "MeasureTriangleToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "measurement"
    },
    {
      id: 25,
      actionModeValue: "measurePolygon",
      displayedName: "MeasurePolygonDisplayedName",
      icon: "$vuetify.icons.value.measuredPolygon",
      toolTipMessage: "MeasurePolygonToolTipMessage",
      toolUseMessage: "MeasurePolygonToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "measurement"
    },
    {
      id: 0,
      actionModeValue: "ellipse",
      displayedName: "CreateEllipseDisplayedName",
      icon: "$vuetify.icons.value.ellipse",
      toolTipMessage: "CreateEllipseToolTipMessage",
      toolUseMessage: "CreateEllipseToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "conic"
    },
    {
      id: 10,
      actionModeValue: "nSectPoint",
      displayedName: "CreateNSectSegmentDisplayedName",
      icon: "$vuetify.icons.value.nSectPoint",
      toolTipMessage: "CreateNSectSegmentToolTipMessage",
      toolUseMessage: "CreateNSectSegmentToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "advanced"
    },
    {
      id: 15,
      actionModeValue: "nSectLine",
      displayedName: "CreateNSectAngleDisplayedName",
      icon: "$vuetify.icons.value.nSectLine",
      toolTipMessage: "CreateNSectAngleToolTipMessage",
      toolUseMessage: "CreateNSectAngleToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "advanced"
    },
    {
      id: 0,
      actionModeValue: "iconFactory",
      displayedName: "CreateIconDisplayedName",
      icon: "mdi-plus",
      toolTipMessage: "CreateIconToolTipMessage",
      toolUseMessage: "CreateIconToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "developerOnly"
    }

    //sort the button list by id so that we don't have to reorder the list each item we add a new button
  ].sort((a: ToolButtonType, b: ToolButtonType) => {
    if (a.toolGroup === b.toolGroup) {
      if (a.id > b.id) {
        return 1;
      } else {
        return -1;
      }
    }
    if (a.toolGroup > b.toolGroup) {
      return 1;
    } else {
      return -1;
    }
  });
}
</script>

<style lang="scss"></style>
