<template>
  <v-icon
    v-if="mdiIcon"
    :class="mdiIconName"
    class="mdi" />
  <svg
    v-else
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-250 -250 500 500"
    preserveAspectRatio="xMidYMid meet"
    :aria-labelledby="iconName"
    :style="customIconStyle"
    vector-effect="non-scaling-stroke"
    width="100%">
    <g v-html="svgSnippetAmended"></g>
  </svg>
</template>

<script lang="ts" setup>
import axios from "axios";
import { onMounted, ref, Ref } from "vue";
import SETTINGS from "../../src/global-settings";
import { IconNames } from "@/types/index";

const props = defineProps<{
  iconName: IconNames;
  iconSize?: number;
  notInLine?: boolean;
}>();

const mdiIcon: Ref<boolean | string> = ref(false);
let filePath: string | undefined = undefined;
let svgFileName: string | undefined = undefined;

const svgSnippetAmended = ref("");
const mdiIconName = ref("");
const customIconStyle = ref("");

onMounted((): void => {
  // THE CONTAINER OF THE ICON Determines the size of the icon
  customIconStyle.value =
    "overflow: visible;"
  const zIcons = SETTINGS.icons as Record<string, any>;
  svgFileName = zIcons[props.iconName].props.svgFileName;
  filePath = "../../icons/" + svgFileName;
  mdiIcon.value = zIcons[props.iconName].props.mdiIcon;
  if (typeof mdiIcon.value !== "string") {
    //This means we are working with an SVG icon and not a mdi icon

    // By default, axios assumes a JSON response and the input will be parsed as JSON.
    // We want to override it to "text"
    axios.get(filePath, { responseType: "text" }).then(r => {
      let completeSVGString:string = r.data;
      //strip off the first and last lines of the svg code
      completeSVGString=completeSVGString.replace(/.*\n/, '')
      completeSVGString=completeSVGString.replace(/\n.*$/, '')
      svgSnippetAmended.value =completeSVGString
    });
  } else {
    mdiIconName.value = mdiIcon.value;
  }
});
</script>

<style scoped>
@import "https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css";
svg {
  display: inline-block;
  vertical-align: text-bottom;
  margin-bottom: -2px;
}
</style>
