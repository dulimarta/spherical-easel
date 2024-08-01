<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: '4px'
    }">
    <CurrentToolSelection />
    <v-btn
      icon
      v-if="userRole && userRole === 'instructor'"
      size="x-small" class="mr-1"
      color="green-darken-1"
      @click="toggleEditMode">
      <v-icon v-if="inEditMode">mdi-check</v-icon>
      <v-icon v-else>mdi-pencil</v-icon>
    </v-btn>
  </div>
  <v-item-group
    v-model="selectedTool"
    @update:model-value="toolSelectionChanged">
    <v-expansion-panels class="pr-2" v-model="expandedPanel">
      <v-expansion-panel
        v-for="grp in buttonGroup"
        :key="grp.group"
        elevation="4"
        :style="{
          marginBottom: '4px'
        }">
        <template #title>
          <span class="text-subtitle-1 font-weight-bold">
            {{ t(grp.group) }}
          </span>
        </template>
        <template #text>
          <div class="button-group">
            <v-item
              v-slot="{ isSelected, toggle }"
              v-for="btn in grp.children"
              :value="btn.action">
              <ToolButton
                :button="btn"
                :selected="isSelected!"
                @click="toggle"
                :editing="inEditMode"
                :included="toolIncluded(btn.action)" />
            </v-item>
          </div>
        </template>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="developerButtonList.length > 0 && !inProductionMode">
        <template #title>
          <span class="text-subtitle-1 font-weight-bold">
            {{ t("DeveloperOnlyTools") }}
          </span>
        </template>
        <template #text>
          <div class="button-group">
            <v-item
              v-slot="{ isSelected, toggle }"
              v-for="btn in developerButtonList"
              :value="btn.action">
              <ToolButton
                :button="btn"
                :selected="isSelected!"
                @click="toggle"
                :editing="inEditMode"
                :included="true" />
            </v-item>
          </div>
        </template>
      </v-expansion-panel>
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
import { useI18n } from "vue-i18n";
import { inject } from "vue";
const { t } = useI18n();
const acctStore = useAccountStore();
const { userRole, includedTools } = storeToRefs(acctStore);
const seStore = useSEStore();
const { seExpressions, seTransformations, actionMode } = storeToRefs(seStore);

const inProductionMode = ref(false);
const inEditMode = ref(false);
const expandedPanel: Ref<number | undefined> = ref(undefined);
const buttonGroup: Ref<Array<ToolButtonGroup>> = ref([]);
let permissibleButtonGroup: Array<ToolButtonGroup> = [];
const currentToolset: Array<ActionMode> = [];
const selectedTool: Ref<ActionMode | null> = ref("rotate");
let lastSelectedTool: ActionMode | null = null;
const appFeature = inject("features");

/* This is a variable that does NOT belong in the global settings but I don't know where else to
  put it. This is the list of tools that should be displayed*/
// private buttonDisplayList = SETTINGS.userButtonDisplayList;

onBeforeMount((): void => {
  inProductionMode.value = import.meta.env.MODE === "production";
  if (appFeature !== "beta") {
    permissibleButtonGroup = toolGroups.filter(
      grp => grp.group.match(/^TransformationTool/) === null
    );
  } else {
    permissibleButtonGroup = toolGroups.splice(0);
  }
  buttonGroup.value.push(...permissibleButtonGroup);
  //sort the button list by id so that we don't have to reorder the list each item we add a new button

  buttonGroup.value.forEach((gr: ToolButtonGroup) => {
    gr.children.sort((a: ToolButtonType, b: ToolButtonType) => a.id - b.id);
  });
  if (appFeature !== "beta") {
  }
  currentToolset.push(...includedTools.value);
});

watch(
  () => actionMode.value,
  act => {
    if (selectedTool.value !== act) selectedTool.value = act;
    const activeGroup = permissibleButtonGroup.findIndex(group => {
      return group.children.some((ch: ToolButtonType) => ch.action === act);
    });
    if (activeGroup !== expandedPanel.value) {
      expandedPanel.value = activeGroup;
    }
    doTransformationEffect();
  }
);

function doTransformationEffect(): void {
  switch (actionMode.value) {
    case "measuredCircle":
      if (seExpressions.value.length > 0) {
        //...open the object tree tab,
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
        EventBus.fire("expand-measurement-sheet", {});
      } else {
        EventBus.fire("show-alert", {
          key: t("createMeasurementForMeasuredCircle"),
          type: "info"
        });
      }
      break;
    case "translation":
      if (seExpressions.value.length > 0) {
        //...open the object tree tab,
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
        EventBus.fire("expand-measurement-sheet", {});
      } else {
        EventBus.fire("show-alert", {
          key: t("createMeasurementForTranslation"),
          type: "info"
        });
      }
      break;

    case "rotation":
      if (seExpressions.value.length > 0) {
        //...open the object tree tab,
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
        EventBus.fire("expand-measurement-sheet", {});
      } else {
        EventBus.fire("show-alert", {
          key: t("createMeasurementForRotation"),
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
      .find((toolBtn: ToolButtonType) => toolBtn.action == selectedTool.value);
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
  if (selectedTool.value) lastSelectedTool = selectedTool.value;
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
    buttonGroup.value.push(...permissibleButtonGroup);
  } else {
    // show only included buttons
    const selected = cloneDeep(permissibleButtonGroup);
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
    toolGroup: "DeveloperOnlyTools",
    toolTipMessage: "buttons.CreateIconToolTipMessage",
    toolUseMessage: "buttons.CreateIconToolUseMessage"
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
<i18n lang="json" locale="en">
{
  "EditTools": "Edit Tools",
  "DisplayTools": "Display Tools",
  "BasicTools": "Basic Tools",
  "ConicTools": "Conic Tools",
  "ConstructionTools": "Construction Tools",
  "AdvancedTools": "Advanced Tools",
  "TransformationTools": "Transformational Tools",
  "MeasurementTools": "Measurement Tools",
  "MeasuredObjectTools": "Measured Objects Tools",
  "createMeasurementForMeasuredCircle": "Create a measurement to use as the radius of a measured circle.",
  "createMeasurementForTranslation": "Create a measurement to use as the translation distance.",
  "createMeasurementForRotation": "Create a measurement to use as the angle of rotation.",
  "DeveloperOnlyTools": "Developer Only Tools"
}
</i18n>
<i18n lang="json" locale="id">
{
  "AdvancedTools": "Perangkat Tambahan",
  "BasicTools": "Perangkat Dasar",
  "ConstructionTools": "Perangkat Konstruksi",
  "DisplayTools": "Perangkat Tampilan",
  "EditTools": "Suntingan",
  "KeyShortCut": "Tombol",
  "MeasurementTools": "",
  "TransformationalTools": "Transformasi",
  "ConicTools": "toolGroups.ConicTools",
  "TransformationTools": "toolGroups.TransformationTools",
  "MeasuredObjectTools": "toolGroups.MeasuredObjectTools",
  "DeveloperOnlyTools": "toolGroups.DeveloperOnlyTools"
}
</i18n>
