<template>
  <v-btn
    id="style-icon"
    icon
    size="small"
    v-if="minified"
    style="
      position: fixed;
      right: 0;
      border-radius: 8px;
      background-color: #002108;
      color: white;
    "
    @click="minified = !minified">
    <v-tooltip activator="parent" location="bottom">
      {{ selectionCounter > 0 ? t("showDrawer") : t("showDrawerDisabled") }}
    </v-tooltip>
    <v-icon>mdi-palette</v-icon>
  </v-btn>
  <transition>
    <div v-if="!minified" class="vertical-nav-drawer">
      <LabelStyle></LabelStyle>
      <!-- <FrontBackStyle :panel="StyleEditPanels.Front"></FrontBackStyle> -->
      <!-- <FrontBackStyle :panel="StyleEditPanels.Back"></FrontBackStyle> -->

      <div id="visibility-control" v-if="selectedSENodules.length > 0">
        <span @click="toggleLabelsShowing">
          <v-icon color="black">mdi-tag</v-icon>
          <v-icon v-if="labelsShowingFlag">mdi-eye-off</v-icon>
          <v-icon v-else>mdi-eye</v-icon>
        </span>
        <span>
          <v-icon>mdi-file-tree</v-icon>
          <v-icon color="black">mdi-eye</v-icon>
        </span>
      </div>
      <v-btn icon size="x-small" @click="minified = !minified">
        <v-icon>mdi-chevron-double-right</v-icon>
      </v-btn>
    </div>
  </transition>
</template>
<i18n lang="json" locale="en">
{
  "showDrawer": "Show Style Drawer",
  "showDrawerDisabled": "Style Draver (disable: no object selected)",
  "label": "Label",
  "object": "Object"
}
</i18n>
<i18n lang="json" locale="id">
{
  "showDrawer": "Buka Panel Gaya Tampilan",
  "label": "Label",
  "object": "Objek"
}
</i18n>
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
import { ref } from "vue";
import { StyleEditPanels } from "@/types/Styles";
import { useI18n } from "vue-i18n";
import LabelStyle from "./LabelStyle.vue";
import FrontBackStyle from "./FrontBackStyle.vue";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { useStylingStore } from "@/stores/styling";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { Labelable } from "@/types";
const minified = ref(true);
const { t } = useI18n();
const seStore = useSEStore();
const styleStore = useStylingStore();
// const styleStore = useStylingStore()
const { selectedSENodules } = storeToRefs(seStore);
const { selectionCounter } = storeToRefs(styleStore);
// const { allLabelsShowing, selectionCount } = storeToRefs(styleStore)
const labelsShowingFlag = ref(false);

function toggleLabelsShowing() {
  labelsShowingFlag.value = !labelsShowingFlag.value;
  const cmdGroup = new CommandGroup();
  selectedSENodules.value
    .filter(n => n.getLabel() !== null)
    .forEach(n => {
      const lab = n.getLabel();
      cmdGroup.addCommand(
        new SetNoduleDisplayCommand(lab!, labelsShowingFlag.value)
      );
    });
  cmdGroup.execute();
}
</script>
