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
import {
  AmbientLight,
  ArrowHelper,
  Color,
  GridHelper,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGPURenderer
} from "three/webgpu";
// import * as THREE from "three/webgpu";

const webGPUCanvas = useTemplateRef<HTMLCanvasElement>("webGPUCanvas");
let scene!: Scene;
let camera!: PerspectiveCamera;
let renderer!: WebGPURenderer;
type ComponentProps = {
  availableHeight: number;
  availableWidth: number;
};
const props = withDefaults(defineProps<ComponentProps>(), {
  availableHeight: 240,
  availableWidth: 240
});

onBeforeMount(() => {
  console.debug("OnBeforeMount::SphericFrame.vue", props);
  initThreeJS();
});

onMounted(async () => {
  console.debug("OnMounted::SphericFrame.vue", props);
  camera = new PerspectiveCamera(
    75,
    props.availableWidth / props.availableHeight,
    0.1,
    1000
  );
  camera.position.set(4, 2, 4);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  renderer = new WebGPURenderer({ canvas: webGPUCanvas.value! });
  renderer.setSize(props.availableWidth, props.availableHeight);

  renderer.setClearColor(0x33ff00, 0.2);
  renderer.setPixelRatio(window.devicePixelRatio);
  await renderer.init();
  renderer.render(scene, camera);
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
});

onUpdated(() => {
  console.debug("OnUpdated::SphericFrame.vue", props);
  camera.aspect = props.availableWidth / props.availableHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
});

function initThreeJS() {
  scene = new Scene();
  // scene.background = new Color(0xf00000);
  scene.add(new HemisphereLight(0x543288, 0xad762e, 0.5));
  scene.add(new GridHelper(5, 5));
  scene.add(
    new ArrowHelper(new Vector3(1, 0, 0), new Vector3(0, 0, 0), 1.25, 0xff0000)
  );
  scene.add(
    new ArrowHelper(new Vector3(0, 1, 0), new Vector3(0, 0, 0), 1.25, 0x00ff00)
  );
  scene.add(
    new ArrowHelper(new Vector3(0, 0, 1), new Vector3(0, 0, 0), 1.25, 0x0000ff)
  );
}
</script>
