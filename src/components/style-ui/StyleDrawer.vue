<template>
  <div id="styleDrawerContainer" v-bind="$attrs">
    <v-btn
      ripple
      id="style-icon"
      icon
      v-if="!showDrawer"
      @click="showDrawer = !showDrawer">
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
    <!-- locationStrategy='connected' means that the overlay is to be positioned relative to the 'target' (#styleDrawerContainer) -->
    <!-- location and origin control the relative placement of the overlay and its activator.
     Location is point on the overlay and origin is a point on the activator. 
     In our case, the midpoint of the start side of the activator (button) is lined up with
     the midpoint of the end side of the overlay
      -->
    <v-overlay
      v-model="showDrawer"
      ref="drawerOverlay"
      persistent
      location-strategy="connected"
      target="#styleDrawerContainer"
      location="start center"
      origin="end center"
      id="style-overlay"
      :scrim="false"
>
      This is just a filler text
    <!--transition!-->
      <!--div v-if="!showDrawer" class="vertical-nav-drawer"-->
        <v-item-group
          v-model="styleSelection"
          :style="{
            display: 'flex',
            flexDirection: 'column',
            rowGap: '24px'
          }">
          <v-item v-slot="labelVSlotObject">
            <v-tooltip activator="#lab-icon" :text="labelTooltip"></v-tooltip>
            <div id="lab-icon" ref="labelPanelIcon">
    <!-- the div is required for tooltip to work -->
    <v-badge
                v-if="selectedLabels.size > 0"
                :content="selectedLabels.size"
                :color="labelPanelShowing ? 'primary' : 'secondary'">
                <v-icon @click="() => { }/*styleIconAction('label', labelVSlotObject )*/">
                  mdi-label
                </v-icon>
              </v-badge>
              <v-icon v-else @click="activateSelectionTool">mdi-label</v-icon>
            </div>
            <!--div-- ref="labelPanel">
              <LabelStyle
                :show-popup="labelPanelShowing"
                v-model="styleSelection"
                @ignore-mouse-down="ignoreMouseDown = true"
                @undo-styles="undoStyleChanges"
                @apply-default-styles="restoreDefaultStyles"
                @pop-up-hidden="
                  labelPanelShowing = false;
                  styleSelection = undefined;
                "></LabelStyle>
            </!--div-->
          </v-item>
          <v-item v-slot="frontVSlotObject">
            <v-tooltip activator="#front-icon" :text="frontTooltip"></v-tooltip>
            <div id="front-icon" ref="frontPanelIcon">
              <v-badge
                v-if="selectedPlottables.size > 0"
                :content="selectedPlottables.size"
                :color="frontPanelShowing ? 'primary' : 'secondary'">
                <v-icon
                  @click="() => { } /*styleIconAction('front', frontVSlotObject)*/"
                  :disabled="selectedPlottables.size === 0">
                  mdi-arrange-bring-forward
                </v-icon>
              </v-badge>
              <v-icon v-else @click="activateSelectionTool">
                mdi-arrange-bring-forward
              </v-icon>
            </div>
            <div ref="frontPanel">
              <!--FrontBackStyle
                :show-popup="frontVSlotObject.isSelected"
                :panel="StyleCategory.Front"
                @undo-styles="undoStyleChanges"
                @apply-default-styles="restoreDefaultStyles"
                @pop-up-hidden="
                  frontPanelShowing = false;
                  styleSelection = undefined;
                "></!--FrontBackStyle-->
            </div>
          </v-item>
          <v-item v-slot="backVSlotObject">
            <v-tooltip activator="#back-icon" :text="backTooltip"></v-tooltip>
            <div id="back-icon" ref="backPanelIcon">
              <v-badge
                v-if="selectedPlottables.size > 0"
                :content="selectedPlottables.size"
                :color="backPanelShowing ? 'primary' : 'secondary'">
                <v-icon
                  @click="() => { } /*styleIconAction('back', backVSlotObject) */"
                  :disabled="selectedPlottables.size === 0">
                  mdi-arrange-send-backward
                </v-icon>
              </v-badge>
              <v-icon v-else @click="activateSelectionTool">
                mdi-arrange-send-backward
              </v-icon>
            </div>
            <div ref="backPanel">
              <!--FrontBackStyle
                :show-popup="backVSlotObject.isSelected"
                :panel="StyleCategory.Back"
                @undo-styles="undoStyleChanges"
                @apply-default-styles="restoreDefaultStyles"
                @pop-up-hidden="
                  backPanelShowing = false;
                  styleSelection = undefined;
                "></!--FrontBackStyle-->
            </div>
          </v-item>
          <v-item v-slot="globalVSlotObject">
            <v-tooltip
              activator="#global-contrast-icon"
              :text="t('globalBackStyleContrastToolTip')"></v-tooltip>
    <!-- Count only visible objects -->
    <div id="global-contrast-icon" ref="globalOptionsPanelIcon">
              <v-badge
                v-if="hasObjects"
                :content="visibleNodulesCount"
                :color="globalOptionsPanelShowing ? 'primary' : 'secondary'">
                <v-icon
                  id="back-contrast-icon"
                  :class="globalOptionsPanelShowing ? '' : 'back-contrast'"
                  @click="() => { } /*styleIconAction('global', globalVSlotObject)*/">
                  mdi-contrast-box
                </v-icon>
              </v-badge>
             
              <v-icon v-else class="back-contrast">mdi-contrast-box</v-icon>
            </div>
    <!--div ref="globalOptionsPanel">
              <v-sheet
                v-if="globalVSlotObject.isSelected"
                position="fixed"
                class="pa-3"
                elevation="4"
                rounded
                :style="{
                  right: '80px',
                  display: 'flex',
                  flexDirection: 'column'
                }">
                <!-- Global contrast slider -->
    <!--v-tooltip
                  location="bottom"
                  max-width="500px"
                  activator="#global-contrast">
                  <span>{{ t("backStyleContrastToolTip") }}</span>
                </!--v-tooltip>
                <p id="global-contrast">
                  <span class="text-subtitle-2" style="color: red">
                    {{ t("globalBackStyleContrast") + " " }}
                  </span>
                  <span class="text-subtitle-2">
                    {{ " (" + Math.floor(backStyleContrast * 100) + "%)" }}
                  </span>

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
                </p>
                <v-divider></v-divider>
                <!-- Global fill option -->
    <!--v-tooltip
                  location="bottom"
                  max-width="400px"
                  activator="#global-fill-choice">
                  <span>{{ t("globalFillStyleToolTip") }}</span>
                </!--v-tooltip>
                <div id="global-fill-choice">
                  <span class="text-subtitle-2" style="color: red">
                    {{ t("globalFillStyle") + " " }}
                  </span>
                  <v-select
                    v-model="fillStyle"
                    sel:label="t('globalFillStyleOptions')"
                    :items="fillStyleItems"
                    item-title="text"
                    item-value="value"
                    @mousedown="ignoreMouseDown = true"
                    variant="outlined"
                    density="compact"></v-select>

                  <v-btn
                    :style="{
                      alignSelf: 'flex-end'
                    }"
                    icon="mdi-check"
                    size="small"
                    @click="
                      globalVSlotObject.toggle();
                      globalOptionsPanelShowing = false;
                      styleSelection = undefined;
                    "></v-btn>
                </div>
              </v-sheet>
            </!--div-->
          </v-item>
        </v-item-group>
        <template v-if="selectedLabels.size > 0">
          <v-tooltip
            activator="#show-labels-icon"
            :text="showHideLabels"></v-tooltip>
          <div id="show-labels-icon">
            <v-badge :content="nonTextSelectedLabelsCount" color="secondary">
              <v-icon
                class="show-labels"
                @click="toggleLabelVisibility"
                :icon="
                  hasVisibleLabels ? 'mdi-label-off-outline' : 'mdi-label'
                "></v-icon>
            </v-badge>
          </div>
        </template>
        <v-btn icon size="x-small" @click="closeStyleDrawer" class="my-2">
          <v-icon>$closePanelRight</v-icon>
        </v-btn>
      <!-- </div> -->
    </v-overlay>
  </div>
</template>

<style scoped>
#styleDrawerContainer {
  background: red;
  padding: 1em;
  position: fixed;
  top: 120px;
  /* add 64px to the top (or the height of the bottom panel) */
  bottom: 184px;
  right: 8px;
  /* height: calc(100vh - 64px); */
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  z-index: 1000;
}
#style-overlay {
  left: 400px;
  border: 3px solid red;
}
.vertical-nav-drawer {
  /* white background is required to override "transparent".
     Otherwise, when the display is zoomed in the boundary circle
     will see thru the style drawer */
  background: white;
  border: solid 1px lightgray;
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
import { ref, computed, onMounted, onBeforeUnmount, onBeforeUpdate } from "vue";
import { StyleCategory } from "@/types/Styles";
import { useI18n } from "vue-i18n";
import LabelStyle from "./LabelStyle.vue";
import FrontBackStyle from "./FrontBackStyle.vue";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { useStylingStore } from "@/stores/styling";
import { watch } from "vue";
import Nodule from "@/plottables/Nodule";
import { SEText } from "@/models/SEText";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { FillStyle } from "@/types";
import { useTemplateRef } from "vue";
const styleDrawerRef = useTemplateRef("drawerOverlay");
const showDrawer = ref(false);
const { t } = useI18n();
const seStore = useSEStore();
const styleStore = useStylingStore();
const { hasObjects, seNodules, seLabels } = storeToRefs(seStore);
const { selectedPlottables, selectedLabels } = storeToRefs(styleStore);
const { i18nMessageSelector, hasLabelObject, resetInitialAndDefaultStyleMaps } =
  styleStore;
const styleSelection = ref<number | undefined>(undefined);
// const { hasStyle, hasDisagreement } = styleStore;
const fillStyle = ref(Nodule.getFillStyle());
const fillStyleItems = [
  {
    text: t("noFill"),
    value: FillStyle.NoFill
  },
  {
    text: t("plainFill"),
    value: FillStyle.PlainFill
  },
  {
    text: t("shadeFill"),
    value: FillStyle.ShadeFill
  }
];

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
// variables to control the display of the style panels
const labelPanelShowing = ref(false);
const frontPanelShowing = ref(false);
const backPanelShowing = ref(false);
const globalOptionsPanelShowing = ref(false);
// HTML elements to determine the location of a mouse click (to close the panel and save the style state)

const labelPanel = ref<HTMLElement | null>(null);
const labelPanelIcon = ref<HTMLElement | null>(null);
const backPanel = ref<HTMLElement | null>(null);
const backPanelIcon = ref<HTMLElement | null>(null);
const frontPanel = ref<HTMLElement | null>(null);
const frontPanelIcon = ref<HTMLElement | null>(null);
const globalOptionsPanel = ref<HTMLElement | null>(null);
const globalOptionsPanelIcon = ref<HTMLElement | null>(null);
const ignoreMouseDown = ref(false);

watch(
  () => backStyleContrast.value,
  contrast => {
    console.debug("Updating back contrast to", contrast);
    styleStore.changeBackContrast(contrast);
  }
);

watch(
  () => fillStyle.value,
  newFillStyle => {
    console.log("Updating fill style to", newFillStyle);
    styleStore.changeFillStyle(newFillStyle);
  }
);

watch(
  () => selectedLabels.value,
  labels => {
    hasVisibleLabels.value = false;
    if (labels.size === 0) {
      styleSelection.value = undefined;
    }
    // Update hasVisibleLabels to true if at least
    // one of the selected labels is visible
    labels.forEach(labname => {
      // selectedLabels is both labels and text so search both, but this only
      // set a variable for labels so we don't have to search text
      const lab = seLabels.value.find(z => z.name === labname);
      if (lab && lab.ref.showing) {
        hasVisibleLabels.value = true;
      }
    });
  },
  { deep: true }
);

watch(
  () => styleSelection.value,
  (selectedTab: number | undefined, prevTab: number | undefined) => {
    if (typeof prevTab === "number" && selectedTab === undefined) {
      styleStore.deselectActiveGroup();
    } else {
      switch (selectedTab) {
        case 0:
          styleStore.recordCurrentStyleProperties(StyleCategory.Label);
          break;
        case 1:
          styleStore.recordCurrentStyleProperties(StyleCategory.Front);
          break;
        case 2:
          styleStore.recordCurrentStyleProperties(StyleCategory.Back);
          break;
        case 3:
          styleStore.recordGlobalContrast();
          styleStore.recordFillStyle();
          break;
        default:
          // TODO: should we deselect or do nothing?
          styleStore.deselectActiveGroup();
      }
    }
  }
);

watch(
  () => showDrawer.value,
  isDrawerMinified => {
    // When the style drawer is expanded, automatically switch
    // to the selection tool
    if (!isDrawerMinified) seStore.setActionMode("select");
  }
);

const handleClick = (event: MouseEvent) => {
  //if no style panels are open, do nothing
  if (
    !(
      labelPanelShowing.value ||
      frontPanelShowing.value ||
      backPanelShowing.value ||
      globalOptionsPanelShowing.value
    )
  ) {
    return;
  }

  if (
    labelPanel.value &&
    frontPanel.value &&
    backPanel.value &&
    globalOptionsPanel.value &&
    labelPanelIcon.value &&
    frontPanelIcon.value &&
    backPanelIcon.value &&
    globalOptionsPanelIcon.value
  ) {
    //detect a click outside of the showing panel and outside of the corresponding icon (which *only* open the panel) and close the panel and record the style
    if (
      labelPanelShowing.value &&
      !(
        labelPanel.value.contains(event.target as Node) ||
        labelPanelIcon.value.contains(event.target as Node)
      )
    ) {
      // make sure that the click is *not* in any of the drop down menus on the
      // text tab i.e. any descendants of the labelPanel
      if (!ignoreMouseDown.value) {
        labelPanelShowing.value = false;
        styleSelection.value = undefined; //Ensures the current style changes are recorded if necessary}
      }
      ignoreMouseDown.value = false;
    }

    if (
      frontPanelShowing.value &&
      !(
        frontPanel.value.contains(event.target as Node) ||
        frontPanelIcon.value.contains(event.target as Node)
      )
    ) {
      frontPanelShowing.value = false;
      styleSelection.value = undefined; //Ensures the current style changes are recorded if necessary
    }
    if (
      backPanelShowing.value &&
      !(
        backPanel.value.contains(event.target as Node) ||
        backPanelIcon.value.contains(event.target as Node)
      )
    ) {
      backPanelShowing.value = false;
      styleSelection.value = undefined; //Ensures the current style changes are recorded if necessary
    }
    if (
      globalOptionsPanelShowing.value &&
      !(
        globalOptionsPanel.value.contains(event.target as Node) ||
        globalOptionsPanelIcon.value.contains(event.target as Node)
      )
    ) {
      if (!ignoreMouseDown.value) {
        globalOptionsPanelShowing.value = false;
        styleSelection.value = undefined; //Ensures the current style changes are recorded if necessary
      }
      ignoreMouseDown.value = false;
    }
  }
};

function styleIconAction(
  panel: string,
  vSlotObject: {
    isSelected: boolean;
    selectedClass: boolean | string[];
    select: (value: boolean) => void;
    toggle: () => void;
    value: unknown;
    disabled: boolean;
  }
) {
  // show the panel
  switch (panel) {
    case "label":
      labelPanelShowing.value = true;
      // Every time the user opens a panel, record the state of the selected objects
      resetInitialAndDefaultStyleMaps(StyleCategory.Label);
      break;
    case "front":
      frontPanelShowing.value = true;
      // Every time the user opens a panel, record the state of the selected objects
      resetInitialAndDefaultStyleMaps(StyleCategory.Front);
      break;
    case "back":
      backPanelShowing.value = true;
      // Every time the user opens a panel, record the state of the selected objects
      resetInitialAndDefaultStyleMaps(StyleCategory.Back);
      break;
    case "global":
      globalOptionsPanelShowing.value = true;
      break;
    default:
      console.error("No such panel to show!");
  }
  // set the isSelected value for the v-item
  vSlotObject.toggle();
}

onMounted((): void => {
  document.addEventListener("mousedown", handleClick); //MUST be mousedown because, if is it mouse up or click, then the other event handlers process this event first. For example, if this was mouseup or click, and the user clicks in the sphere, then the selection tool clears the selection *before* the user style choices can be recorded (which defeats the whole purpose of this listener).
  fillStyle.value = Nodule.getFillStyle();
  console.debug(
    "Content Element ",
    styleDrawerRef.value?.globalTop,
    styleDrawerRef.value?.scrimEl
  );
});
onBeforeUpdate((): void => {
  fillStyle.value = Nodule.getFillStyle();
  backStyleContrast.value = Nodule.getBackStyleContrast(); // If these lines are removed when you load a construction that doesn't have the default fill (shading) or default global back style (50%) then when you initially open the global options panel the fill type/contrast is displayed incorrectly
});

onBeforeUnmount((): void => {
  document.removeEventListener("mousedown", handleClick);
});

const labelTooltip = computed((): string => {
  let text = t("labelTooltip", i18nMessageSelector());
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

const showHideLabels = computed((): string => {
  let text = "";
  if (!hasLabelObject()) {
    text += t("textHasNoLabel");
  } else {
    text += t("showHideLabels");
  }
  return text;
});

const visibleNodulesCount = computed(
  () => seNodules.value.filter(n => n.showing && !(n instanceof SEText)).length
);

const nonTextSelectedLabelsCount = computed(() => {
  let count = 0;
  selectedLabels.value.forEach(labName => {
    const lab = seLabels.value.find(z => {
      return z.ref.name === labName;
    })?.ref;
    if (lab) {
      count += 1;
    }
  });
  return count;
});

function closeStyleDrawer() {
  showDrawer.value = !showDrawer.value;
}

function undoStyleChanges() {
  styleStore.restoreInitialStyles();
}

function restoreDefaultStyles() {
  styleStore.restoreDefaultStyles();
}

function toggleLabelVisibility() {
  hasVisibleLabels.value = !hasVisibleLabels.value;
  const cmdGroup = new CommandGroup();
  let subCommandCount = 0;

  selectedLabels.value.forEach(labName => {
    // Searching for the plottable; must use 'z.ref.name' (and not z.name)
    const lab = seLabels.value.find(z => z.ref.name === labName);
    if (lab) {
      if (lab.ref.showing != hasVisibleLabels.value) {
        const newCmd = new SetNoduleDisplayCommand(lab, hasVisibleLabels.value);
        cmdGroup.addCommand(newCmd);
        subCommandCount++;
      }
    }
  });
  if (subCommandCount > 0) {
    cmdGroup.execute();
  }
}

function activateSelectionTool() {
  seStore.setActionMode("select");
}
</script>
<i18n lang="json" locale="en">
{
  "showDrawer": "Show Style Drawer",
  "showDrawerDisabled": "Style Drawer (disable: no object selected)",
  "label": "Label",
  "object": "Object",
  "labelTooltip": "Label Style|Text Style|Label & Text Style",
  "backgroundTooltip": "Background Style",
  "textObjectsAndBackground": "Text objects have no background style to edit",
  "foregroundTooltip": "Foreground Style",
  "textObjectsAndForeground": "Text objects have no foreground style to edit",
  "disabledTooltip": "Disabled: no editable object selected",
  "backStyleContrast": "Back Style Contrast",
  "backStyleContrastToolTip": "By default the back side display style of an object is determined by the front style of that object and the value of Global Back Style Contrast. A Back Style Contrast of 100% means there is no color or size difference between front and back styling. A Back Style Contrast of 0% means that the object is invisible and its size reduction is maximized.",
  "globalBackStyleContrast": "Global Back Style Contrast",
  "globalBackStyleContrastToolTip": "Adjusts the default display of objects on the back of the sphere and the fill style.",
  "globalFillStyleOptions": "Global Fill Style Options",
  "globalFillStyle": "Global Fill Style",
  "globalFillStyleToolTip": "Change the fill style for circles, ellipses, polygons, and angle markers. Shading makes the objects appear more three-dimensional.",
  "shadeFill": "Shading",
  "plainFill": "Solid",
  "noFill": "No Fill",
  "showHideLabels": "Show/Hide Labels",
  "textHasNoLabel": "Text objects have no labels"
}
</i18n>
<i18n lang="json" locale="id">
{
  "showDrawer": "Buka Panel Gaya Tampilan",
  "label": "Label",
  "object": "Objek"
}
</i18n>
