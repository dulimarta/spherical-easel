<template>
  <div class="pa-1 accent" id="toolButtonContainer">
    <v-btn
      elevation="2"
      v-if="userRole && userRole === 'instructor'"
      fab
      small
      color="primary"
      @click="toggleEditMode">
      <v-icon v-if="inEditMode">mdi-check</v-icon>
      <v-icon v-else>mdi-pencil</v-icon>
    </v-btn>

    <div v-for="(g, gpos) in buttonGroup" :key="gpos">
      <template v-if="g.children.length > 0">
        <h3 class="body-1 font-weight-bold">
          {{ $t(`toolGroups.${g.group}`) }}
        </h3>
        <v-btn-toggle v-model="actionMode" @change="switchActionMode">
          <v-container>
            <v-row justify="start" align="stretch" class="accent">
              <v-col
                cols="auto"
                v-for="(button, bpos) in g.children"
                :key="bpos">
                <ToolButton
                  :disabled="inEditMode"
                  :button="button"
                  v-on:display-only-this-tool-use-message="
                    displayOnlyThisToolUseMessageFunc
                  ">
                  <template #overlay v-if="inEditMode">
                    <v-overlay
                      v-if="toolIncluded(button.actionModeValue)"
                      absolute
                      opacity="0.25">
                      <v-icon
                        color="white"
                        class="overlayicon"
                        @click="excludeTool(button.actionModeValue)">
                        mdi-minus-circle</v-icon
                      >
                    </v-overlay>
                    <v-overlay v-else absolute opacity="0.85">
                      <v-icon
                        color="primary"
                        class="overlayicon"
                        @click="includeTool(button.actionModeValue)">
                        mdi-plus-circle</v-icon
                      >
                    </v-overlay>
                  </template>
                </ToolButton>
              </v-col>
            </v-row>
          </v-container>
        </v-btn-toggle>
      </template>
    </div>

    <div
      id="DeveloperToolGroup"
      v-show="developerButtonList.length > 0 && !inProductionMode">
      <h3 class="body-1 font-weight-bold">
        {{ $t("toolGroups.DeveloperOnlyTools") }}
      </h3>
      <v-btn-toggle
        v-model="actionMode"
        @change="switchActionMode"
        class="mr-2 d-flex flex-wrap accent">
        <ToolButton
          v-for="(button, pos) in developerButtonList"
          :key="pos"
          :button="button"
          :elev="elev"
          v-on:display-only-this-tool-use-message="
            displayOnlyThisToolUseMessageFunc
          ">
        </ToolButton>
      </v-btn-toggle>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Ref, ref, onBeforeMount } from "vue";
/* Import the components so we can use the class-style vue components in TypeScript. */
// import Component from "vue-class-component";
import ToolButton from "@/components/ToolButton.vue";
import { ActionMode, ToolButtonType, ToolButtonGroup } from "@/types";
import { useAccountStore } from "@/stores/account";
/* Import the global settings. */
// import SETTINGS from "@/global-settings";
import { toolGroups } from "./toolgroups";
import cloneDeep from "lodash.clonedeep";
import { useSEStore } from "@/stores/se";
import EventBus from "@/eventHandlers/EventBus";
import { storeToRefs } from "pinia";

const acctStore = useAccountStore();
const { userRole, includedTools } = storeToRefs(acctStore);
const seStore = useSEStore();
const { expressions, seTransformations } = storeToRefs(seStore);

/* Controls the selection of the actionMode using the buttons. The default is segment. */
const actionMode: Ref<{ id: ActionMode; name: string }> = ref({
  id: "rotate" as ActionMode,
  name: ""
});

/* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay */
// private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
// private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

const elev = ref(24);
const inProductionMode = ref(false);
const inEditMode = ref(false);
const buttonGroup: Ref<Array<ToolButtonGroup>> = ref([]);
const currentToolset: Array<ActionMode> = [];

/* This is a variable that does NOT belong in the global settings but I don't know where else to
  put it. This is the list of tools that should be displayed*/
// private buttonDisplayList = SETTINGS.userButtonDisplayList;

onBeforeMount((): void => {
  inProductionMode.value = import.meta.env.MODE === "production";
  buttonGroup.value.push(...toolGroups);
  //sort the button list by id so that we don't have to reorder the list each item we add a new button

  buttonGroup.value.forEach((gr: ToolButtonGroup) => {
    gr.children.sort((a: ToolButtonType, b: ToolButtonType) => a.id - b.id);
  });
  currentToolset.push(...includedTools.value);
});

/* Writes the current state/edit mode to the store, where the Easel view can read it. */
function switchActionMode(): void {
  switch (actionMode.value.id) {
    case "measuredCircle":
      if (expressions.value.length > 0) {
        //...open the object tree tab,
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
        EventBus.fire("expand-measurement-sheet", {});
      } else {
        EventBus.fire("show-alert", {
          key: "objectTree.createMeasurementForMeasuredCircle",
          type: "info"
        });
      }
      break;
    case "translation":
      if (expressions.value.length > 0) {
        //...open the object tree tab,
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
        EventBus.fire("expand-measurement-sheet", {});
      } else {
        EventBus.fire("show-alert", {
          key: "objectTree.createMeasurementForTranslation",
          type: "info"
        });
      }
      break;

    case "rotation":
      if (expressions.value.length > 0) {
        //...open the object tree tab,
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
        EventBus.fire("expand-measurement-sheet", {});
      } else {
        EventBus.fire("show-alert", {
          key: "objectTree.createMeasurementForRotation",
          type: "info"
        });
      }
      break;

    case "applyTransformation":
      if (seTransformations.value.length > 0) {
        //...open the object tree tab,
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
        EventBus.fire("expand-transformation-sheet", {});
      } else {
        EventBus.fire("show-alert", {
          key: "objectTree.createATransformation",
          type: "error"
        });
      }
      break;
    default:
      break;
  }

  seStore.setActionMode(actionMode.value);
}

/* This returns true only if there is at least one tool that needs to be displayed in the group. */
// nonEmptyGroup(groupName: string): boolean {
//   return this.buttonList.filter(b => b.toolGroup === groupName).length > 0;
// }

/* This turns off all other snackbar/toolUseMessage displays so that multiple
  snackbar/toolUseMessages are not displayed at the same time.  */
function displayOnlyThisToolUseMessageFunc(actionModeValue: string): void {
  // Alternative solution: use Array high-order functions
  buttonGroup.value
    .flatMap(group => group.children)
    .filter(btn => btn.actionModeValue !== actionModeValue)
    .forEach(btn => {
      btn.displayToolUseMessage = !btn.displayToolUseMessage;
    });
}

function toggleEditMode(): void {
  inEditMode.value = !inEditMode.value;
  buttonGroup.value.splice(0);
  if (inEditMode.value) {
    // Show all buttons

    buttonGroup.value.push(...toolGroups);
  } else {
    // show only included buttons
    const selected = cloneDeep(toolGroups);
    selected.forEach((g: ToolButtonGroup) => {
      g.children = g.children.filter((tool: ToolButtonType) =>
        includedTools.value.includes(tool.actionModeValue)
      );
    });
    buttonGroup.value.push(...selected);
  }
}

function toolIncluded(name: ActionMode): boolean {
  return includedTools.value.findIndex((s: string) => s === name) >= 0;
}

/* A list of all the buttons that are possible to display/use. Only those that the User has
  permission to use will be available. */
function includeTool(name: ActionMode): void {
  acctStore.includeToolName(name);
}
function excludeTool(name: ActionMode): void {
  acctStore.excludeToolName(name);
}

const developerButtonList: ToolButtonType[] = [
  {
    id: 0,
    actionModeValue: "iconFactory",
    displayedName: "CreateIconDisplayedName",
    icon: "$iconFactory",
    toolTipMessage: "CreateIconToolTipMessage",
    toolUseMessage: "CreateIconToolUseMessage",
    displayToolUseMessage: false
  }
];
</script>

<style lang="scss">
.overlayicon {
  position: absolute;
  top: -40px;
  right: -32px;
  animation-name: shake;
  animation-duration: 250ms;
  animation-iteration-count: infinite;
}

@keyframes shake {
  0% {
    transform: translateX(0px);
  }

  25% {
    transform: translateX(-3px);
  }

  50% {
    transform: translateX(0px);
  }

  75% {
    transform: translateX(+3px);
  }
}
</style>
