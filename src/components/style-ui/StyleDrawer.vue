<template>
  <v-btn
    id="style-icon"
    icon
    v-if="minified"
    :style="{
      position: 'fixed',
      right: '4px',
      borderRadius: '8px',
      backgroundColor: '#002108',
      color: 'white'
    }"
    @click="minified = !minified">
    <v-tooltip activator="parent" location="bottom">
      {{ t("showDrawer") }}
    </v-tooltip>
    <v-badge
      v-if="selectedPlottables.size > 0"
      floating
      color="green"
      :content="selectedPlottables.size">
      <v-icon>mdi-palette</v-icon>
    </v-badge>
    <v-icon v-else>mdi-palette</v-icon>
  </v-btn>
  <transition>
    <div v-if="!minified" class="vertical-nav-drawer">
      <v-item-group
        v-model="styleSelection"
        :style="{
          display: 'flex',
          flexDirection: 'column',
          rowGap: '24px'
        }">
        <v-item v-slot="{ isSelected, toggle }">
          <v-tooltip activator="#lab-icon" :text="labelTooltip"></v-tooltip>
          <div id="lab-icon">
            <!-- the div is required for tooltip to work -->
            <v-badge
              v-if="selectedLabels.size > 0"
              :content="selectedLabels.size"
              :color="isSelected ? 'primary' : 'secondary'">
              <v-icon @click="toggle">mdi-label</v-icon>
            </v-badge>
            <v-icon v-else @click="activateSelectionTool">mdi-label</v-icon>
          </div>
          <LabelStyle
            :show-popup="isSelected!"
            v-model="styleSelection"
            @undo-styles="undoStyleChanges"
            @apply-default-styles="restoreDefaultStyles"></LabelStyle>
        </v-item>
        <v-item v-slot="{ isSelected, toggle }">
          <v-tooltip activator="#front-icon" :text="frontTooltip"></v-tooltip>
          <div id="front-icon">
            <v-badge
              v-if="selectedPlottables.size > 0"
              :content="selectedPlottables.size"
              :color="isSelected ? 'primary' : 'secondary'">
              <v-icon @click="toggle" :disabled="selectedPlottables.size === 0">
                mdi-arrange-bring-forward
              </v-icon>
            </v-badge>
            <v-icon v-else @click="activateSelectionTool">
              mdi-arrange-bring-forward
            </v-icon>
          </div>
          <FrontBackStyle
            :show-popup="isSelected!"
            :panel="StyleCategory.Front"
            @undo-styles="undoStyleChanges"
            @apply-default-styles="restoreDefaultStyles"></FrontBackStyle>
        </v-item>
        <v-item v-slot="{ isSelected, toggle }">
          <v-tooltip activator="#back-icon" :text="backTooltip"></v-tooltip>
          <div id="back-icon">
            <v-badge
              v-if="selectedPlottables.size > 0"
              :content="selectedPlottables.size"
              :color="isSelected ? 'primary' : 'secondary'">
              <v-icon @click="toggle" :disabled="selectedPlottables.size === 0">
                mdi-arrange-send-backward
              </v-icon>
            </v-badge>
            <v-icon v-else @click="activateSelectionTool">
              mdi-arrange-send-backward
            </v-icon>
          </div>
          <FrontBackStyle
            :show-popup="isSelected!"
            :panel="StyleCategory.Back"
            @undo-styles="undoStyleChanges"
            @apply-default-styles="restoreDefaultStyles"></FrontBackStyle>
        </v-item>
        <v-item v-slot="{ isSelected, toggle }">
          <v-tooltip
            activator=".back-contrast"
            text="Global Back Style Contrast"></v-tooltip>
            <!-- Count only visible objects -->
          <v-badge v-if="hasObjects" :content="visibleNodulesCount">
            <v-icon class="back-contrast" @click="toggle">
              mdi-contrast-box
            </v-icon>
          </v-badge>
          <v-icon v-else class="back-contrast">mdi-contrast-box</v-icon>
          <v-sheet
            v-if="isSelected"
            position="fixed"
            class="pa-3"
            elevation="4"
            rounded
            :style="{
              right: '80px'
            }">
            <!-- Global contrast slider -->
            <v-tooltip
              location="bottom"
              max-width="400px"
              activator="#global-contrast">
              <span>{{ t("backStyleContrastToolTip") }}</span>
            </v-tooltip>
            <p id="global-contrast">
              <span class="text-subtitle-2" style="color: red">
                {{ t("globalBackStyleContrast") + " " }}
              </span>
              <span class="text-subtitle-2">
                {{ " (" + Math.floor(backStyleContrast * 100) + "%)" }}
              </span>
            </p>
            <v-slider
              v-model="backStyleContrast"
              :min="0"
              :step="0.1"
              :max="1"
              density="compact">
              <template v-slot:thumb-label="{ modelValue }">
                {{
                  backStyleContrastSelectorThumbStrings[
                    Math.floor(modelValue * 10)
                  ]
                }}
              </template>
            </v-slider>
          </v-sheet>
        </v-item>
      </v-item-group>
      <template v-if="selectedLabels.size > 0">
        <v-tooltip activator=".show-labels" text="Show/Hide Labels"></v-tooltip>
        <v-badge :content="selectedLabels.size">
          <v-icon
            class="show-labels"
            @click="toggleLabelVisibility"
            :icon="
              hasVisibleLabels ? 'mdi-label-off-outline' : 'mdi-label'
            "></v-icon>
        </v-badge>
      </template>
      <v-btn icon size="x-small" @click="minified = !minified" class="my-2">
        <v-icon>$closePanelRight</v-icon>
      </v-btn>
    </div>
  </transition>
</template>

<style scoped>
.vertical-nav-drawer {
  border: solid 1px grey 0.5;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

  border-radius: 0.5em;
  height: 50vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
}

#visibility-control {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.v-enter-active,
.v-leave-active {
  transition: all 300ms ease-out;
}
.v-enter-from,
.v-leave-to {
  transform: translateX(100%) scale(0);
}
.v-enter-to,
.v-leave-from {
  transform: translateX(0%) scale(1);
}
</style>
<script setup lang="ts">
import { ref, computed } from "vue";
import { StyleCategory } from "@/types/Styles";
import { useI18n } from "vue-i18n";
import LabelStyle from "./LabelStyle.vue";
import FrontBackStyle from "./FrontBackStyle.vue";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { useStylingStore } from "@/stores/styling";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { watch } from "vue";
import { Command } from "@/commands/Command";
import Nodule from "@/plottables/Nodule";
import { SELabel } from "@/models/internal";
const minified = ref(true);
const { t } = useI18n();
const seStore = useSEStore();
const styleStore = useStylingStore();
const { selectedSENodules, hasObjects, seNodules } = storeToRefs(seStore);
const { selectedPlottables, selectedLabels, styleOptions, editedLabels } =
  storeToRefs(styleStore);
const styleSelection = ref<number | undefined>(undefined);
const { hasStyle, hasDisagreement } = styleStore;

const backStyleContrast = ref(Nodule.getBackStyleContrast());
const backStyleContrastSelectorThumbStrings = [
  "Min",
  "10%",
  "20%",
  "30%",
  "40%",
  "50%",
  "60%",
  "70%",
  "80%",
  "90%",
  "Same"
];

const hasVisibleLabels = ref(false);

watch(
  () => selectedSENodules.value,
  arr => {
    if (arr.length === 0) {
      styleSelection.value = undefined;
    }
  },
  { deep: true, immediate: true }
);

watch(
  () => backStyleContrast.value,
  contrast => {
    console.debug("Updating back contrast to", contrast);
    styleStore.changeBackContrast(contrast);
  }
);

watch(
  () => selectedLabels.value,
  labels => {
    hasVisibleLabels.value = false;
    // Update te hasVisibleLabels to true if at least
    // one of the selected labels is visible
    labels.forEach((lab, _name) => {
      if (lab.showing) {
        hasVisibleLabels.value = true;
      }
    });
  },
  { deep: true }
);

watch(
  () => editedLabels.value,
  editSet => {
    // When the edited label set is NOT empty,
    // those modified labels will stay visible
    // Reflect this fact in our internal flag
    hasVisibleLabels.value = editSet.size > 0;
  }
);

watch(
  () => styleSelection.value,
  (selectedTab: number | undefined, prevTab: number | undefined) => {
    if (typeof prevTab === "number" && selectedTab === undefined) {
      styleStore.deselectActiveGroup();
    } else {
      switch (selectedTab) {
        case 0:
          styleStore.selectActiveGroup(StyleCategory.Label);
          break;
        case 1:
          styleStore.selectActiveGroup(StyleCategory.Front);
          break;
        case 2:
          styleStore.selectActiveGroup(StyleCategory.Back);
          break;
        default:
          // TODO: should we deselect or do nothing?
          styleStore.deselectActiveGroup();
      }
    }
  }
);

watch(
  () => minified.value,
  isDrawerMinified => {
    // When the style drawer is expanded, automatically switch
    // to the selection tool
    if (!isDrawerMinified) seStore.setActionMode("select");
  }
);

const labelTooltip = computed((): string => {
  let text = t("LabelTooltip");
  if (selectedLabels.value.size <= 0) {
    text += " " + t("disabledTooltip");
  }
  return text;
});

const backTooltip = computed((): string => {
  let text = t("backgroundTooltip");
  if (selectedPlottables.value.size <= 0) {
    text += " " + t("disabledTooltip");
  }
  return text;
});

const frontTooltip = computed((): string => {
  let text = t("foregroundTooltip");
  if (selectedPlottables.value.size <= 0) {
    text += " " + t("disabledTooltip");
  }
  return text;
});

const visibleNodulesCount = computed(() =>
  seNodules.value.filter(n => n.showing).length
)

function undoStyleChanges() {
  styleStore.restoreInitialStyles();
}

function restoreDefaultStyles() {
  styleStore.restoreDefaultStyles();
}

function toggleLabelVisibility() {
  hasVisibleLabels.value = !hasVisibleLabels.value;
  selectedLabels.value.forEach(lab => {
    lab.showing = hasVisibleLabels.value;
  });
}

function activateSelectionTool() {
  seStore.setActionMode("select")
}
</script>
<i18n lang="json" locale="en">
{
  "showDrawer": "Show Style Drawer",
  "showDrawerDisabled": "Style Draver (disable: no object selected)",
  "label": "Label",
  "object": "Object",
  "LabelTooltip": "Label Style",
  "backgroundTooltip": "Background Style",
  "foregroundTooltip": "Foreground Style",
  "disabledTooltip": "(disabled: no object selected)",
  "backStyleContrast": "Back Style Contrast",
  "backStyleContrastToolTip": "By default the back side display style of an object is determined by the front style of that object and the value of Global Back Style Contrast. A Back Style Contrast of 100% means there is no color or size difference between front and back styling. A Back Style Contrast of 0% means that the object is invisible and its size reduction is maximized.",
  "globalBackStyleContrast": "Global Back Style Contrast"
}
</i18n>
<i18n lang="json" locale="id">
{
  "showDrawer": "Buka Panel Gaya Tampilan",
  "label": "Label",
  "object": "Objek"
}
</i18n>
