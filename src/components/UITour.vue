<template>
  <span>Tutorial Mode {{ tooltipIndex }}/{{ anchors.length }}</span>
  <VTooltip
    :activator="tooltipAnchor"
    v-model="showUITour"
    position="right"
    :text="`This is a tooltip inserted programmatically by UITutor to ${tooltipAnchor}`" />
</template>
<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { VTooltip } from "vuetify/components";

const showUITour = ref(true);
const tooltipAnchor = ref("#BasicTools");
let tooltipIndex = ref(0);
let timeoutHandle: number | null = null;
const anchors = [
  "#BasicTools",
  "#EditTools",
  "#DisplayTools",
  "#ConstructionTools",
  "#MeasurementTools",
  "#ConicTools"
];

onMounted(() => {
  timeoutHandle = window.setInterval(() => {
    tooltipAnchor.value = anchors[tooltipIndex.value];
    tooltipIndex.value++;
    if (tooltipIndex.value >= anchors.length) {
      tooltipIndex.value = 0;
    }
  }, 2000);
});

onBeforeUnmount(() => {
  if (timeoutHandle !== null) {
    clearInterval(timeoutHandle);
  }
});
</script>
