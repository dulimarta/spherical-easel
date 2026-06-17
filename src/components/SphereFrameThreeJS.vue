<template>
  <span
    v-if="mouse3DPosition"
    :style="{
      position: 'fixed'
    }">
    Cursor @ {{ mouse3DPosition?.toFixed(2) }}
  </span>
  <canvas
    :style="{ cursor: cursorShape }"
    ref="webGPUCanvas"
    id="webGPUCanvas"
    :width="props.availableWidth"
    :height="props.availableHeight"></canvas>
</template>
<style lang="css" scoped>
#webGPUCanvas {
  margin-bottom: 4px;
}
</style>
<script setup lang="ts">
import { onBeforeMount, onMounted, onUpdated, ref, useTemplateRef } from "vue";
// import { useMouseInElement } from "@vueuse/core";
import { useThree } from "@/composables/useThree";
import { useSphericTools } from "@/composables/useSphericalTools";
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
const { cursorShape, mouse3DPosition, scene } = useThree(webGPUCanvas);
const { setCurrentTool } = useSphericTools(scene, mouse3DPosition);
// const { elementX, elementY, isOutside } = useMouseInElement(webGPUCanvas.value);

// onBeforeMount(() => {
//   console.debug("OnBeforeMount::SphericFrame.vue", props, webGPUCanvas.value);
// });

onMounted(async () => {
  console.debug("OnMounted::SphericFrame.vue", props, webGPUCanvas.value);
  setCurrentTool("point");
});

// onUpdated(() => {
//   console.debug("OnUpdated::SphericFrame.vue", props);
// });
</script>
