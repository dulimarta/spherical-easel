<template>
  <canvas
    ref="webGPUCanvas"
    id="webGPUCanvas"
    :width="props.availableWidth"
    :height="props.availableHeight"></canvas>
</template>
<style lang="css" scoped>
#webGPUCanvas {
  border: 2px solid red;
  margin-bottom: 4px;
}
</style>
<script setup lang="ts">
import { onBeforeMount, onMounted, onUpdated, ref, useTemplateRef } from "vue";
import { useThree } from "@/composables/useThree";
const webGPUCanvas = useTemplateRef<HTMLCanvasElement>("webGPUCanvas");
type ComponentProps = {
  availableHeight: number;
  availableWidth: number;
};
const props = withDefaults(defineProps<ComponentProps>(), {
  availableHeight: 240,
  availableWidth: 240
});
// Factor out ThreeJS initialization details into a new composable
useThree(webGPUCanvas);

onBeforeMount(() => {
  console.debug("OnBeforeMount::SphericFrame.vue", props, webGPUCanvas.value);
});

onMounted(async () => {
  console.debug("OnMounted::SphericFrame.vue", props, webGPUCanvas.value);
});

onUpdated(() => {
  console.debug("OnUpdated::SphericFrame.vue", props);
});
</script>
