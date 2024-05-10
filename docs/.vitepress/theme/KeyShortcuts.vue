<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = defineProps<{
  macShift?: boolean;
  pcShift?: boolean;
  macCmd?: boolean;
  pcCtrl?: boolean;
  macOpt?: boolean;
  pcAlt?: boolean;
  macCtrl?: boolean;
  macLetter?: string;
  pcLetter?: string;
}>();

const macOperatingSystem = ref(false);
const displayString = ref("");

onMounted((): void => {
  if (navigator.userAgent.indexOf("Mac OS X") !== -1) {
    console.log("macShift", props.macShift);
    console.log("macCmd", props.macCmd);
    console.log("macOpt", props.macOpt);
    console.log("macLetter", props.macLetter);
    macOperatingSystem.value = true;
    if (props.macShift) {
      displayString.value +=
        '<kbd>Shift(<span style="font-size:18pt; vertical-align: inherit;display: inline-block;  position: relative;  width: 0.537em;  height: 0.5em;"> <span style="position: absolute;  left: -0.059em;  top: -0.35em;" >&#8679;</span></span>)</kbd>';
    }
    if (props.macCmd) {
      if (displayString.value !== "") {
        displayString.value += " + ";
      }
      displayString.value +=
        '<kbd>Cmd(<span <span style="font-size:18pt; vertical-align: middle;display: inline-block;  position: relative;  width: 0.537em;  height: 0.5em;"> <span style="position: absolute;  left: -0.059em;  top: -0.3em;" >&#8984;</span></span>)</kbd>';
    }
    if (props.macOpt) {
      if (displayString.value !== "") {
        displayString.value += " + ";
      }
      displayString.value +=
        '<kbd>Opt(<span <span style="font-size:20pt; vertical-align: inherit;display: inline-block;  position: relative;  width: 0.537em;  height: 0.5em;"> <span style="position: absolute;  left: -0.059em;  top: -0.2em;" >&#8997;</span></span>)</kbd>';
    }
    if (props.macLetter) {
      if (displayString.value !== "") {
        displayString.value += " + ";
      }
      displayString.value += "<kbd>" + props.macLetter + "</kbd>";
    }
  } else {
    macOperatingSystem.value = false;
    if (props.pcShift) {
      displayString.value += "<kbd>Shift</kbd>";
    }
    if (props.pcCtrl) {
      if (displayString.value !== "") {
        displayString.value += " + ";
      }
      displayString.value += "<kbd>Ctrl</kbd>";
    }
    if (props.pcAlt) {
      if (displayString.value !== "") {
        displayString.value += " + ";
      }
      displayString.value += "<kbd>Alt</kbd>";
    }
    if (props.pcLetter) {
      if (displayString.value !== "") {
        displayString.value += " + ";

      displayString.value += "<kbd>" + props.pcLetter + "</kbd>";
      }
    }
  }
});
</script>

<template>
  <span v-if="macOperatingSystem" v-html="displayString"></span>
  <span v-else v-html="displayString"></span>
</template>

<style scoped>
.unicode-id {
  color: blue;
}
</style>
