<template>
  <transition name="slide-out" mode="out-in">
    <div
      v-if="!minified"
      key="full"
      style="height: 100%; overflow: auto"
      @mouseenter="setSelectTool"
      @mouseleave="saveStyleState">
      <v-btn icon size="x-small">
        <v-icon @click="toggleMinify">mdi-arrow-right</v-icon>
      </v-btn>
      <!-- Switches for show/hide label(s) and object(s)-->
      <!--v-card flat class="ma-0 pa-0">
        <v-card-text class="ma-0 pa-0">
          <v-container fluid class="ma-0 pa-0">
            <v-row no-gutters justify="center">
              <v-col cols="12" sm="4" md="4" class="ma-0 pl-0 pb-0 pt-0 pr-0">
                <v-switch
                  :model-value="allLabelsShowing"
                  @change="toggleLabelsShowing"
                  :label="$t('style.showLabels')"
                  color="primary"
                  hide-details
                  class="ma-0 pl-0 pb-0 pt-0 pr-0"
                  :disabled="
                    !(selectedSENodules.length > 0) || !allObjectsShowing
                  "></v-switch>
              </v-col>
              <v-col cols="12" sm="4" md="4" class="ma-0 pl-0 pb-0 pt-0 pr-0">
                <v-switch
                  :model-value="allObjectsShowing"
                  @change="toggleObjectsShowing"
                  :label="$t('style.showObjects')"
                  color="primary"
                  hide-details
                  class="ma-0 pl-0 pb-0 pt-0 pr-0"
                  :disabled="!(selectedSENodules.length > 0)"></v-switch>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card-->

      <!-- <v-divider></v-divider> -->

      <!-- Type and number list of objects that are selected-->
      <div class="text-center">
        Target for styling:
        <v-chip v-for="item in selectedItemArray" :key="item" x-small>
          {{ item }}
        </v-chip>
      </div>

      <!-- Nothing Selected Overlay-->
      <!---OverlayWithFixButton
        v-if="!(selectedSENodules.length > 0)"
        z-index="100"
        i18n-title-line="style.selectAnObject"
        i18n-subtitle-line="style.closeOrSelect"
        i18n-list-title="style.toSelectObjects"
        :i18n-list-items="buttonListItems()"
        i18n-button-label="style.closeStylingPanel"
        i18n-button-tool-tip="style.noSelectionToolTip"
        @click="$emit('toggle-style-panel')"></OverlayWithFixButton-->

      <v-expansion-panels>
        <v-expansion-panel v-for="(p, idx) in panels" :key="idx">
          <v-expansion-panel-title
            class="ps-6 pe-0 pt-n4 pb-n4 pm-0">
            {{ $t(p.i18n_key) }}
          </v-expansion-panel-title>
          <v-expansion-panel-text
            :color="panelBackgroundColor(idx)">
            <component
              :is="p.component"
              :panel="p.panel"
              :active-panel="activePanel"></component>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <div v-else class="mini-icons">
      <v-btn key="partial" icon size="x-small" class="pa-0 mx-0">
        <v-icon @click="toggleMinify">mdi-arrow-left</v-icon>
      </v-btn>
      <div class="mini-icons">
        <v-icon>$stylePanel</v-icon>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import Vue, { ref, onMounted } from "vue";
import LabelStyle from "./LabelStyle.vue";
// import Component from "vue-class-component";
import BasicFrontBackStyle from "@/components/FrontBackStyle.vue";
// import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import EventBus from "../eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { StyleEditPanels } from "@/types/Styles";
import { Labelable } from "@/types";
import { SENodule } from "@/models/SENodule";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import i18n from "../i18n";
import { mapState, storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEPolygon } from "@/models/SEPolygon";
import { watch } from "vue";

const seStore = useSEStore();
const { selectedSENodules } = storeToRefs(seStore);

const minified = ref(true);
const emit = defineEmits(["minifyToggled"]);

const toolTipOpenDelay = ref(SETTINGS.toolTip.openDelay);
const toolTipCloseDelay = ref(SETTINGS.toolTip.closeDelay);

const activePanel = ref<number | undefined>(0); // Default selection is the Label panel

const allLabelsShowing = ref(false);
const allObjectsShowing = ref(false);

// A string list of the number of items and type of them in the current selection
const selectedItemArray = ref<string[]>([]);

onMounted((): void => {
  EventBus.listen("update-all-labels-showing", allLabelsShowingCheck);
  EventBus.listen("update-all-objects-showing", allObjectsShowingCheck);
  EventBus.listen("toggle-object-visibility", toggleObjectsShowing);
  EventBus.listen("toggle-label-visibility", toggleLabelsShowing);
});
function buttonListItems(): string[] {
  if (navigator.userAgent.indexOf("Mac OS X") === -1) {
    // the user is on a PC
    return [
      "style.selectionDirection1",
      "style.selectionDirection2",
      "style.selectionDirection3",
      "style.selectionDirection4PC"
    ];
  } else {
    // the user is on a Mac
    return [
      "style.selectionDirection1",
      "style.selectionDirection2",
      "style.selectionDirection3",
      "style.selectionDirection4Mac"
    ];
  }
}

// watch(
//   () => props.minified,
//   () => closeAllPanels
// );

function closeAllPanels(): void {
  activePanel.value = undefined;
  // If the user has been styling objects and then, without selecting new objects, or deactivating selection the style state should be saved.
  EventBus.fire("save-style-state", {});
}

watch(selectedSENodules, allLabelsShowingCheck);
function allLabelsShowingCheck(): void {
  console.log("Style All Labels: onSelectionChanged");
  allLabelsShowing.value = selectedSENodules.value.every(node => {
    if (node.isLabelable()) {
      return (node as unknown as Labelable).label!.showing;
    } else {
      return true;
    }
  });
}

watch(selectedSENodules, allObjectsShowingCheck);
function allObjectsShowingCheck(): void {
  // console.log("Style All Objects: onSelectionChanged");
  allObjectsShowing.value = selectedSENodules.value.every(node => {
    return node.showing === true;
  });
}

//Convert the selections into a short list of the type (and number) of the objects in the selection
watch(selectedSENodules, updateSelectedItemArray);
function updateSelectedItemArray(): void {
  console.log("Style update selected item array: onSelectionChanged");

  const tempArray: string[] = [];
  const alreadyCounted: boolean[] = []; // records if the tempArray item has already been counted (helps avoid one tempArray item being counted multiple times -- make sure the order of the search dictated by firstPartialList is correct)
  selectedSENodules.value.forEach(node => {
    if (node instanceof SEAngleMarker) {
      tempArray.push("Am");
    } else if (node instanceof SEPolygon) {
      tempArray.push("Po");
    } else {
      tempArray.push(node.name);
    }
    alreadyCounted.push(false);
  });
  const elementListi18nKeys = [
    "style.parametric",
    "style.polygon",
    "style.point",
    "style.line",
    "style.segment",
    "style.circle",
    "style.label",
    "style.angleMarker",
    "style.ellipse"
  ];
  const firstPartList = ["Pa", "Po", "P", "Li", "Ls", "C", "La", "Am", "E"]; // The *internal* names of the objects start with these strings (the oder must match the order of the singular/plural i18n keys)
  const countList: number[] = [];
  firstPartList.forEach(str => {
    let count = 0;
    tempArray.forEach((name, ind) => {
      if (name.startsWith(str) && !alreadyCounted[ind]) {
        alreadyCounted[ind] = true;
        count++;
      }
    });
    countList.push(count);
  });

  selectedItemArray.value = countList
    .map((num, index) => {
      if (num > 1) {
        return String(
          i18n.global.t(elementListi18nKeys[index], { count: num })
        );
      } else if (num === 1) {
        return String(i18n.global.t(elementListi18nKeys[index], 1));
      } else {
        return "0";
      }
    })
    .filter(str => !str.startsWith("0"));
}

// The order of these panels *must* match the order of the StyleEditPanels in Style.ts
const panels = [
  {
    i18n_key: "style.labelStyle",
    component: LabelStyle,
    panel: StyleEditPanels.Label
  },
  // {
  //   i18n_key: "style.foregroundStyle",
  //   component: () => import("@/components/FrontBackStyle.vue"),
  //   panel: StyleEditPanels.Front
  // },
  // {
  //   i18n_key: "style.backgroundStyle",
  //   component: () => import("@/components/FrontBackStyle.vue"),
  //   panel: StyleEditPanels.Back
  // }
  // {
  //   i18n_key: "style.advancedStyle",
  //   component: () => import("@/components/AdvancedStyle.vue"),
  //   panel: StyleEditPanels.Advanced
  // }
];

//When ever the mouse enters the style panel, set the active tool to select because it is likely that the
// user is going to style objects.
function setSelectTool(): void {
  EventBus.fire("set-action-mode-to-select-tool", {});
}

//When ever the mouse leaves the style panel, save the state because it is likely that the user is done styling
function saveStyleState(): void {
  EventBus.fire("save-style-state", {});
}

function panelBackgroundColor(idx: number): string {
  if (idx === 1) {
    return "grey lighten-2"; //used to be different but I changed my mind
  } else {
    return "grey lighten-2";
  }
}

function toggleLabelsShowing(fromPanel: unknown): void {
  // if this method is being called from a panel, then we need to toogle allLabelsShowing
  // if this method is being called from the html (i.e. from the switch) then all LabelsShowing is
  //  automatically toggled
  if ((fromPanel as any).fromPanel !== undefined) {
    allLabelsShowing.value = !allLabelsShowing.value;
  }
  const toggleLabelDisplayCommandGroup = new CommandGroup();
  selectedSENodules.value.forEach(node => {
    if (node.isLabelable()) {
      toggleLabelDisplayCommandGroup.addCommand(
        new SetNoduleDisplayCommand(
          (node as unknown as Labelable).label!,
          allLabelsShowing.value
        )
      );
    }
  });
  toggleLabelDisplayCommandGroup.execute();

  // Showing the labels when the objects are not showing, shows the objects
  if (!allObjectsShowing.value && allLabelsShowing.value) {
    toggleObjectsShowing({ fromPanel: true });
  }
}

function toggleObjectsShowing(fromPanel: unknown): void {
  // if this method is being called from a panel, then we need to toogle allObjectssShowing
  // if this method is being called from the html (i.e. from the switch) then allObjectsShowing is
  //  automatically toggled
  if ((fromPanel as any).fromPanel !== undefined) {
    allObjectsShowing.value = !allObjectsShowing.value;
  }

  const toggleObjectDisplayCommandGroup = new CommandGroup();
  selectedSENodules.value.forEach(node => {
    toggleObjectDisplayCommandGroup.addCommand(
      new SetNoduleDisplayCommand(node, allObjectsShowing.value)
    );
  });
  toggleObjectDisplayCommandGroup.execute();

  // update the this.allLabelsShowing varaible, because hiding an object hide the label (depending on
  //  SETTINGS.hideObjectHidesLabel) and similarly showing an object shows the label (depending
  //  SETTIGNS.showObjectShowsLabel)
  allLabelsShowingCheck();
}

function toggleMinify() {
  minified.value = !minified.value;
  emit("minifyToggled", minified.value);
}
</script>

<style scoped>
.mini-icons {
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.slide-out-enter-active,
.slide-out-leave-active {
  transition-property: all;
  transition-duration: 250ms;
  transition-timing-function: ease;
}

.slide-out-enter,
.slide-out-leave-to {
  transform: translateX(200%);
}
</style>
