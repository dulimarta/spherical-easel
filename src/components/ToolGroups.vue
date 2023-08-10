<template>
  <v-btn
    elevation="2"
    v-if="userRole && userRole === 'instructor'"
    fab
    size="small"
    color="primary"
    @click="toggleEditMode">
    <v-icon v-if="inEditMode">mdi-check</v-icon>
    <v-icon v-else>mdi-pencil</v-icon>
  </v-btn>
  <CurrentToolSelection/>
  <v-item-group
    v-model="selectedTool"
    @update:model-value="toolSelectionChanged">
    <v-expansion-panels style="gap:10px;padding-right: 8px;">
    <!-- <div v-for="(g, gpos) in buttonGroup" :key="gpos"> -->
          <v-expansion-panels v-for="(g,gpos) in buttonGroup" :key="gpos" >
            <v-expansion-panel  style="border-radius: 8px;">
            <div v-if="g.children.length>0">
            </div>
            <v-expansion-panel-title>
              <h3 class="body-1 font-weight-bold button-group-heading">
                {{ $t(`toolGroups.${g.group}`) }}
              </h3>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="button-group">
          <!-- To remove boolean properties in Vue3, we have to use null or undefined -->
          <template v-for="btn in g.children" :key="btn.action">
            <v-item
              v-slot="{ isSelected, toggle }"
              :value="btn.action">
              <ToolButton
                @click="toggle"
                :button="btn"
                :selected="isSelected!"
                :included="toolIncluded(btn.action)"
                :editing="inEditMode" />
            </v-item>
          </template>
        </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
    </v-expansion-panels>
    <v-expansion-panels id="DeveloperToolGroup"
      v-show="developerButtonList.length > 0 && !inProductionMode">
      <v-expansion-panel style="border-radius: 8px;">
        <v-expansion-panel-title>
          <h3 class="body-1 font-weight-bold">
            {{ $t("toolGroups.DeveloperOnlyTools") }}
          </h3>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
        <v-item v-slot="{ isSelected, toggle }">
        <ToolButton
          @click="toggle"
          v-for="(button, pos) in developerButtonList"
          :key="pos"
          :button="button"
          :editing="inEditMode"
          :selected="isSelected!"
          :included="true"
        />
        </v-item>
        </v-expansion-panel-text>
        </v-expansion-panel>
    </v-expansion-panels>
  </v-expansion-panels>
  </v-item-group>
</template>

<script lang="ts" setup>
import { Ref, ref, onBeforeMount, watch } from "vue";
/* Import the components so we can use the class-style vue components in TypeScript. */
import ToolButton from "@/components/ToolButton.vue";
import CurrentToolSelection from "./CurrentToolSelection.vue";
import { ActionMode, ToolButtonType, ToolButtonGroup } from "@/types";
import { useAccountStore } from "@/stores/account";
import { toolGroups } from "./toolgroups";
import cloneDeep from "lodash.clonedeep";
import { useSEStore } from "@/stores/se";
import EventBus from "@/eventHandlers/EventBus";
import { storeToRefs } from "pinia";

const acctStore = useAccountStore();
const { userRole, includedTools } = storeToRefs(acctStore);
const seStore = useSEStore();
const { expressions, seTransformations, actionMode } = storeToRefs(seStore);

const inProductionMode = ref(false);
const inEditMode = ref(false);
const buttonGroup: Ref<Array<ToolButtonGroup>> = ref([]);
const currentToolset: Array<ActionMode> = [];
const selectedTool: Ref<ActionMode | null> = ref("rotate");
let lastSelectedTool: ActionMode | null = null;

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

watch(() => actionMode.value, (act) => {
  if (selectedTool.value !== act)
    selectedTool.value = act
  doTransformationEffect()
})

function doTransformationEffect(): void {
  switch (actionMode.value) {
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
}

function toolSelectionChanged() {
  // Warning: when the same tool button is clicked in succession,
  // selectedTool.value toggles from someValue to undefined
  if (!inEditMode.value) {
    const whichButton = buttonGroup.value
      .flatMap((group: ToolButtonGroup) => group.children)
      .find(
        (toolBtn: ToolButtonType) =>
          toolBtn.action == selectedTool.value
      );
    // console.log("Toolbutton handler, found the button", whichButton);
    if (whichButton) {
      // seStore.setButton(whichButton);
      seStore.setActionMode(selectedTool.value!);
    }
  } else {
    const toolCheck = selectedTool.value
      ? selectedTool.value
      : lastSelectedTool!;
    if (includedTools.value.includes(toolCheck))
      acctStore.excludeToolName(toolCheck);
    else acctStore.includeToolName(toolCheck);
  }
  // Remember the last selection
  if (selectedTool.value)
    lastSelectedTool = selectedTool.value
}



/* This returns true only if there is at least one tool that needs to be displayed in the group. */
// nonEmptyGroup(groupName: string): boolean {
//   return this.buttonList.filter(b => b.toolGroup === groupName).length > 0;
// }

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
        includedTools.value.includes(tool.action)
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
    action: "iconFactory",
    displayedName: "buttons.CreateIconDisplayedName",
    toolTipMessage: "buttons.CreateIconToolTipMessage",
    toolUseMessage: "buttons.CreateIconToolUseMessage",
  }
];
</script>

<style scoped>
.button-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.button-group-heading {
  margin-top: 0.5em;
}

</style>
