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
          rowGap: '8px'
        }">
        <v-item v-slot="{ isSelected, toggle }">
          <v-tooltip activator="#lab-icon" :text="labelTooltip"></v-tooltip>
          <div id="lab-icon">
            <!-- the div is required for tooltip to work -->
            <v-badge
              v-if="selectedLabels.size > 0"
              :content="selectedLabels.size"
              color="secondary">
              <v-icon @click="toggle">mdi-label</v-icon>
            </v-badge>
            <v-icon v-else>mdi-label</v-icon>
          </div>
          <LabelStyle
            :show-popup="isSelected!"
            v-model="styleSelection"></LabelStyle>
        </v-item>
        <v-item v-slot="{ isSelected, toggle }">
          <v-tooltip activator="#front-icon" :text="frontTooltip"></v-tooltip>
          <div id="front-icon">
            <v-badge
              v-if="selectedPlottables.size > 0"
              :content="selectedPlottables.size"
              color="secondary">
              <v-icon @click="toggle" :disabled="selectedPlottables.size === 0">
                mdi-arrange-bring-forward
              </v-icon>
            </v-badge>
            <v-icon v-else>mdi-arrange-bring-forward</v-icon>
          </div>
          <FrontBackStyle
            :show-popup="isSelected!"
            :panel="StyleEditPanels.Front"></FrontBackStyle>
        </v-item>
        <v-item v-slot="{ isSelected, toggle }">
          <v-tooltip activator="#back-icon" :text="backTooltip"></v-tooltip>
          <div id="back-icon">
            <v-badge
              v-if="selectedPlottables.size > 0"
              :content="selectedPlottables.size"
              color="secondary">
              <v-icon @click="toggle" :disabled="selectedPlottables.size === 0">
                mdi-arrange-send-backward
              </v-icon>
            </v-badge>
            <v-icon v-else>mdi-arrange-send-backward</v-icon>
          </div>
          <FrontBackStyle
            :show-popup="isSelected!"
            :panel="StyleEditPanels.Back"></FrontBackStyle>
        </v-item>
      </v-item-group>

      <!--div id="visibility-control" v-if="selectedSENodules.length > 0">
        <span @click="toggleLabelsShowing">
          <v-icon color="black">mdi-tag</v-icon>
          <v-icon v-if="labelsShowingFlag">mdi-eye-off</v-icon>
          <v-icon v-else>mdi-eye</v-icon>
        </span>
        <span>
          <v-icon>mdi-file-tree</v-icon>
          <v-icon color="black">mdi-eye</v-icon>
        </span>
      </div-->
      <v-btn icon size="x-small" @click="minified = !minified">
        <v-icon>mdi-chevron-double-right</v-icon>
      </v-btn>
    </div>
  </transition>
</template>

<style scoped>
.vertical-nav-drawer {
  background-color: white;
  border: solid 1px grey 0.5;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

  border-radius: 0.5em;
  height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
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
import { StyleEditPanels } from "@/types/Styles";
import { useI18n } from "vue-i18n";
import LabelStyle from "./LabelStyle.vue";
import FrontBackStyle from "./FrontBackStyle.vue";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { useStylingStore } from "@/stores/styling";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { watch } from "vue";
const minified = ref(true);
const { t } = useI18n();
const seStore = useSEStore();
const styleStore = useStylingStore();
const { selectedSENodules } = storeToRefs(seStore);
const { selectedPlottables, selectedLabels } = storeToRefs(styleStore);
const styleSelection = ref<number | undefined>(undefined);

watch(() => selectedSENodules.value, (arr) => {
  if (arr.length == 0) {
    // close the popup panel when no objects are selected
    styleSelection.value = undefined
  }
}, { deep: true, immediate: true })

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


// function toggleLabelsShowing() {
//   labelsShowingFlag.value = !labelsShowingFlag.value;
//   const cmdGroup = new CommandGroup();
//   selectedSENodules.value
//     .filter(n => n.getLabel() !== null)
//     .forEach(n => {
//       const lab = n.getLabel();
//       cmdGroup.addCommand(
//         new SetNoduleDisplayCommand(lab!, labelsShowingFlag.value)
//       );
//     });
//   cmdGroup.execute();
// }
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
  "disabledTooltip": "(disabled: no object selected)"
}
</i18n>
<i18n lang="json" locale="id">
{
  "showDrawer": "Buka Panel Gaya Tampilan",
  "label": "Label",
  "object": "Objek"
}
</i18n>
