<template>
  <transition name="slide-out" mode="out-in">

    <div
      v-if="!minified"
      key="full"
      style="height: 100%; overflow: auto"
      @mouseenter="setSelectTool"
      @mouseleave="saveStyleState">
      <!-- Switches for show/hide label(s) and object(s)-->
      <!--v-card flat class="ma-0 pa-0">
        <v-card-text class="ma-0 pa-0"-->
      <v-container fluid class="ma-0 pa-0">

        <v-row justify="center">
          <v-col cols="auto" class="ma-0 py-0">
            <v-switch
              v-model="allLabelsShowing"
              @change="toggleLabelsShowing"
              persistent-hint
              :label="$t('style.showLabels')"
              color="primary"
              :disabled="
                !(selectedSENodules.length > 0) || !allObjectsShowing
              "></v-switch>
          </v-col>
          <v-col cols="auto" class="ma-0 pa-0">
            <v-switch
              v-model="allObjectsShowing"
              @change="toggleObjectsShowing"
              :label="$t('style.showObjects')"
              color="primary"
              hide-details
              :disabled="!(selectedSENodules.length > 0)"></v-switch>
          </v-col>
        </v-row>
      </v-container>
      <!--/v-card-text>
      </v-card-->

      <!-- <v-divider></v-divider> -->

      <!-- Type and number list of objects that are selected-->
      <div class="text-center" v-if="selectedItemArray.length > 0">
        Target for styling:
        <v-chip v-for="item in selectedItemArray" :key="item" size="x-small">
          {{ item }}
        </v-chip>
      </div>

    </div>
    <div v-else class="mini-icons">
      <div class="mini-icons">
        <v-icon>$styleDrawer</v-icon>
      </div>
    </div>
  </transition>
  <!-- Nothing Selected Dialog -->
  <Dialog
    ref="selectObjectsDialog"
    :yes-text="t('style.closeStylingPanel')"
    width="50%"
    :title="t('style.selectAnObject')">
    <div>
    <p>{{ t("style.closeOrSelect") }}</p>
    <p>{{ t("style.toSelectObjects") }}</p>
    <ul>
      <li v-for="(text,pos) in buttonListItems" :key="pos">
        {{ t(text) }}
      </li>
    </ul>
  </div>
  </Dialog>

  <!---OverlayWithFixButton
        v-if="!(selectedSENodules.length > 0)"
        z-index="100"
        i18n-subtitle-line="style.closeOrSelect"
        i18n-list-title="style.toSelectObjects"
        :i18n-list-items="buttonListItems()"
        i18n-button-label="style.closeStylingPanel"
        i18n-button-tool-tip="style.noSelectionToolTip"
        @click="$emit('toggle-style-panel')"></OverlayWithFixButton-->
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import EventBus from "@/eventHandlers/EventBus";
import { Labelable } from "@/types";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEPolygon } from "@/models/SEPolygon";
import { useDialogSequencer } from "@/composables/DialogSequencer";
const { t } = useI18n();
const seStore = useSEStore();
const { selectedSENodules } = storeToRefs(seStore);
const dialogSequencer = useDialogSequencer()

// The order of these panels *must* match the order of the StyleEditPanels in Style.ts
const minified = ref(true);
const emit = defineEmits(["minifyToggled"]);
const selectObjectsDialog = ref<DialogAction | null>(null);

const allLabelsShowing = ref(false);
const allObjectsShowing = ref(false);
// A string list of the number of items and type of them in the current selection
const selectedItemArray = ref<string[]>([]);

onMounted((): void => {
  EventBus.listen("update-all-labels-showing", allLabelsShowingCheck);
  EventBus.listen("update-all-objects-showing", allObjectsShowingCheck);
  EventBus.listen("toggle-object-visibility", toggleObjectsShowing);
  // EventBus.listen("toggle-label-visibility", toggleLabelsShowing);
});

const buttonListItems = computed((): string[] => {
  return [
    "style.selectionDirection1",
    "style.selectionDirection2",
    "style.selectionDirection3",
    // the user is on a PC or Mac
    navigator.userAgent.indexOf("Mac OS X") === -1
      ? "style.selectionDirection4Mac"
      : "style.selectionDirection4PC"
  ];
});

watch(
  [() => selectedSENodules.value, () => minified.value],
  ([selectedObjs, isMinified]) => {
    if (true || selectedObjs.length === 0 && !isMinified)
      dialogSequencer.showDialog(selectObjectsDialog.value!)
  }
);

watch(() => selectedSENodules.value, allLabelsShowingCheck);
function allLabelsShowingCheck(): void {
  console.log("Style All Labels: onSelectionChanged");
  allLabelsShowing.value = selectedSENodules.value.every(node => {
    const nLabel = node.getLabel()
    if (nLabel) {
      return nLabel.showing;
    } else {
      return true;
    }
  });
}

watch(() => selectedSENodules.value, allObjectsShowingCheck);
function allObjectsShowingCheck(): void {
  // console.log("Style All Objects: onSelectionChanged");
  allObjectsShowing.value = selectedSENodules.value.every(node => {
    return node.showing === true;
  });
}

//Convert the selections into a short list of the type (and number) of the objects in the selection
watch(() => selectedSENodules.value, updateSelectedItemArray);
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
        return t(elementListi18nKeys[index], { count: num });
      } else if (num === 1) {
        return t(elementListi18nKeys[index], 1);
      } else {
        return "0";
      }
    })
    .filter(str => !str.startsWith("0"));
}

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

function toggleLabelsShowing(source: any): void {
  // if this method is being called from a panel, then we need to toggle allLabelsShowing
  // if this method is being called from the html (i.e. from the switch) then all LabelsShowing is
  //  automatically toggled
  if (source.fromPanel !== undefined) {
    allLabelsShowing.value = !allLabelsShowing.value;
  }
  const toggleLabelDisplayCommandGroup = new CommandGroup();
  selectedSENodules.value.forEach(node => {
    const nLabel = node.getLabel()
    if (nLabel) {
      toggleLabelDisplayCommandGroup.addCommand(
        new SetNoduleDisplayCommand(nLabel, allLabelsShowing.value)
      );
    }
  });
  toggleLabelDisplayCommandGroup.execute();

  // Showing the labels when the objects are not showing, shows the objects
  if (!allObjectsShowing.value && allLabelsShowing.value) {
    toggleObjectsShowing({ fromPanel: true });
  }
}

function toggleObjectsShowing(source: any): void {
  // if this method is being called from a panel, then we need to toggle allObjectsShowing
  // if this method is being called from the html (i.e. from the switch) then allObjectsShowing is
  //  automatically toggled
  if (source.fromPanel !== undefined) {
    allObjectsShowing.value = !allObjectsShowing.value;
  }

  const toggleObjectDisplayCommandGroup = new CommandGroup();
  selectedSENodules.value.forEach(node => {
    toggleObjectDisplayCommandGroup.addCommand(
      new SetNoduleDisplayCommand(node, allObjectsShowing.value)
    );
  });
  toggleObjectDisplayCommandGroup.execute();

  // update the this.allLabelsShowing variable, because hiding an object hide the label (depending on
  //  SETTINGS.hideObjectHidesLabel) and similarly showing an object shows the label (depending
  //  SETTIGNS.showObjectShowsLabel)
  allLabelsShowingCheck();
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
