<template>
  <div class="pa-1 accent"
    id="toolButtonContainer">
    <v-btn elevation="2" v-if="userRole === 'instructor'"
      fab small
      color="primary"
      @click="inEditMode = !inEditMode">
      <v-icon>mdi-pencil</v-icon>
    </v-btn>

    <div v-for="(g,gpos) in buttonGroup"
      :key="gpos">
      <h3 v-show="g.children.length > 0"
        class="body-1 font-weight-bold">{{$t(`toolGroups.${g.group}`)}}
      </h3>
      <v-btn-toggle v-model="actionMode"
        @change="switchActionMode">
        <v-container>
          <v-row class="accent">
            <v-col cols="auto"
              v-for="(button,bpos) in g.children"
              :key="bpos">
              <ToolButton z-index="10"
                :disabled="inEditMode"
                :button="button"
                v-on:display-only-this-tool-use-message="displayOnlyThisToolUseMessageFunc">
                <template #overlay
                  v-if="inEditMode"
                  z-index="5">
                  <v-overlay absolute
                    opacity="0.3">
                    <v-icon color="red"
                      v-if="toolIncluded(button.actionModeValue)"
                      @click="excludeTool(button.actionModeValue)">
                      mdi-close-circle</v-icon>
                    <v-icon color="white"
                      v-else
                      @click="includeTool(button.actionModeValue)">
                      mdi-plus-circle</v-icon>
                  </v-overlay>
                </template>
              </ToolButton>
            </v-col>
          </v-row>
        </v-container>
      </v-btn-toggle>
    </div>

    <div id="DeveloperToolGroup"
      v-show="developerButtonList.length > 0 && !inProductionMode">
      <h3 class="body-1 font-weight-bold">
        {{ $t("toolGroups.DeveloperOnlyTools") }}
      </h3>
      <v-btn-toggle v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent">

        <ToolButton v-for="(button, pos) in developerButtonList"
          :key="pos"
          :button="button"
          :elev="elev"
          v-on:display-only-this-tool-use-message="displayOnlyThisToolUseMessageFunc">
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
import { AccountState, ActionMode, ToolButtonType } from "@/types";
import { SEStore } from "@/store";
/* Import the global settings. */
import SETTINGS from "@/global-settings";
import { namespace } from "vuex-class";

const AC = namespace("acct");

type ToolButtonGroup = {
  group: string;
  children: Array<ToolButtonType>;
};

/* Declare the components used in this component. */
@Component({
  components: { ToolButton }
})
export default class ToolGroups extends Vue {

  @AC.State((s: AccountState) => s.userRole)
  readonly userRole!: string | undefined;

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
  private inEditMode = false;
  private includedTools: string[] = [];

  /* This is a variable that does NOT belong in the global settings but I don't know where else to
  put it. This is the list of tools that should be displayed*/
  // private buttonDisplayList = SETTINGS.userButtonDisplayList;

  created(): void {
    this.inProductionMode = process.env.NODE_ENV === "production";
    this.buttonGroup.forEach((gr: ToolButtonGroup) => {
      gr.children.sort((a: ToolButtonType, b: ToolButtonType) => a.id - b.id);
    });
    this.includedTools = this.buttonGroup
      .flatMap(g => g.children)
      .map((b: ToolButtonType) => b.actionModeValue);
  }

  /* Writes the current state/edit mode to the store, where the Easel view can read it. */
  switchActionMode(): void {
    SEStore.setActionMode(this.actionMode);
  }

  /* This returns true only if there is at least one tool that needs to be displayed in the group. */
  // nonEmptyGroup(groupName: string): boolean {
  //   return this.buttonList.filter(b => b.toolGroup === groupName).length > 0;
  // }

  /* This turns off all other snackbar/toolUseMessage displays so that multiple
  snackbar/toolUseMessages are not displayed at the same time.  */
  displayOnlyThisToolUseMessageFunc(actionModeValue: string): void {
    // Alternative solution: use Array high-order functions
    this.buttonGroup
      .flatMap(group => group.children)
      .filter(btn => btn.actionModeValue !== actionModeValue)
      .forEach(btn => {
        btn.displayToolUseMessage = !btn.displayToolUseMessage;
      });
  }

  toolIncluded(name: string): boolean {
    return this.includedTools.findIndex((s: string) => s === name) >= 0;
  }

  includeTool(name: string): void {
    this.includedTools.push(name);
  }
  excludeTool(name: string): void {
    const pos = this.includedTools.findIndex(s => s === name);
    if (pos >= 0) this.includedTools.splice(pos, 1);
  }

  /* A list of all the buttons that are possible to display/use. Only those that the User has
  permission to use will be available. */
  private buttonGroup: Array<ToolButtonGroup> = [
    {
      group: "EditTools",
      children: [
        {
          id: 0,
          actionModeValue: "select",
          displayedName: "SelectDisplayedName",
          icon: "$vuetify.icons.value.select",
          toolTipMessage: "SelectToolTipMessage",
          toolUseMessage: "SelectToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "edit"
        },
        {
          id: 5,
          actionModeValue: "delete",
          displayedName: "DeleteDisplayedName",
          icon: "$vuetify.icons.value.delete",
          toolTipMessage: "DeleteToolTipMessage",
          toolUseMessage: "DeleteToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "edit"
        },
        {
          id: 25,
          actionModeValue: "zoomIn",
          displayedName: "PanZoomInDisplayedName",
          icon: "$vuetify.icons.value.zoomIn",
          toolTipMessage: "PanZoomInToolTipMessage",
          toolUseMessage: "PanZoomInToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "edit"
        },
        {
          id: 30,
          actionModeValue: "zoomOut",
          displayedName: "PanZoomOutDisplayedName",
          icon: "$vuetify.icons.value.zoomOut",
          toolTipMessage: "PanZoomOutToolTipMessage",
          toolUseMessage: "PanZoomOutToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "edit"
        },
        {
          id: 35,
          actionModeValue: "zoomFit",
          displayedName: "ZoomFitDisplayedName",
          icon: "$vuetify.icons.value.zoomFit",
          toolTipMessage: "ZoomFitToolTipMessage",
          toolUseMessage: "ZoomFitToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "edit"
        }
      ]
    },
    {
      group: "DisplayTools",
      children: [
        {
          id: 0,
          actionModeValue: "hide",
          displayedName: "HideDisplayedName",
          icon: "$vuetify.icons.value.hide",
          toolTipMessage: "HideObjectToolTipMessage",
          toolUseMessage: "HideObjectToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "display"
        },
        {
          id: 5,
          actionModeValue: "toggleLabelDisplay",
          displayedName: "ToggleLabelDisplayedName",
          icon: "$vuetify.icons.value.toggleLabelDisplay",
          toolTipMessage: "ToggleLabelToolTipMessage",
          toolUseMessage: "ToggleLabelToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "display"
        },

        {
          id: 15,
          actionModeValue: "move",
          displayedName: "MoveDisplayedName",
          icon: "$vuetify.icons.value.move",
          toolTipMessage: "MoveObjectToolTipMessage",
          toolUseMessage: "MoveObjectToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "display"
        },
        {
          id: 20,
          actionModeValue: "rotate",
          displayedName: "RotateDisplayedName",
          icon: "$vuetify.icons.value.rotate",
          toolTipMessage: "RotateSphereToolTipMessage",
          toolUseMessage: "RotateSphereToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "display"
        }
      ]
    },
    {
      group: "BasicTools",
      children: [
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
        }
      ]
    },
    {
      group: "ConstructionTools",
      children: [
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
          icon: "$vuetify.icons.value.antipodalPoint",
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
          icon: "$vuetify.icons.value.intersect",
          toolTipMessage: "CreateIntersectionToolTipMessage",
          toolUseMessage: "CreateIntersectionToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "construction"
        },
        {
          id: 45,
          actionModeValue: "pointOnObject",
          displayedName: "CreatePointOnOneDimDisplayedName",
          icon: "$vuetify.icons.value.pointOnObject",
          toolTipMessage: "CreatePointOnOneDimToolTipMessage",
          toolUseMessage: "CreatePointOnOneDimToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "construction"
        }
      ]
    },
    {
      group: "MeasurementTools",
      children: [
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
          icon: "$vuetify.icons.value.coordinate",
          toolTipMessage: "CreateCoordinateToolTipMessage",
          toolUseMessage: "CreateCoordinateToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "measurement"
        },
        {
          id: 20,
          actionModeValue: "measureTriangle",
          displayedName: "MeasureTriangleDisplayedName",
          icon: "$vuetify.icons.value.measureTriangle",
          toolTipMessage: "MeasureTriangleToolTipMessage",
          toolUseMessage: "MeasureTriangleToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "measurement"
        },
        {
          id: 25,
          actionModeValue: "measurePolygon",
          displayedName: "MeasurePolygonDisplayedName",
          icon: "$vuetify.icons.value.measurePolygon",
          toolTipMessage: "MeasurePolygonToolTipMessage",
          toolUseMessage: "MeasurePolygonToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "measurement"
        }
      ]
    },
    {
      group: "AdvancedTools",
      children: [
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
        }
      ]
    },
    {
      group: "ConicTools",
      children: [
        {
          id: 0,
          actionModeValue: "ellipse",
          displayedName: "CreateEllipseDisplayedName",
          icon: "$vuetify.icons.value.ellipse",
          toolTipMessage: "CreateEllipseToolTipMessage",
          toolUseMessage: "CreateEllipseToolUseMessage",
          displayToolUseMessage: false,
          toolGroup: "conic"
        }
      ]
    }
  ];

  private developerButtonList: ToolButtonType[] = [
    {
      id: 0,
      actionModeValue: "iconFactory",
      displayedName: "CreateIconDisplayedName",
      icon: "$vuetify.icons.value.iconFactory",
      toolTipMessage: "CreateIconToolTipMessage",
      toolUseMessage: "CreateIconToolUseMessage",
      displayToolUseMessage: false,
      toolGroup: "developerOnly"
    }

    //sort the button list by id so that we don't have to reorder the list each item we add a new button
  ];
}
</script>

<style lang="scss"></style>
