<template>
  <canvas id="earth"></canvas>
</template>
<style scoped>
#earth {
  /* border: 5px solid #a46e6e; */
  position: absolute;
  /* top: 0; */

  /* width:100px;
    height:100px; */
}
</style>
<script setup lang="ts">
// se store magnification factor * 240 over orthographic camera
import SETTINGS from "@/global-settings";
import {
  Matrix4,
  Scene,
  OrthographicCamera,
  SphereGeometry,
  MeshStandardMaterial,
  TextureLoader,
  Mesh,
  AmbientLight,
  PointLight,
  WebGLRenderer
} from "three";
import { watch, onMounted, onBeforeUnmount } from "vue";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";

type EarthLayerProps = {
  availableWidth: number;
  availableHeight: number;
};
const prop = defineProps<EarthLayerProps>();
const store = useSEStore();
const { zoomMagnificationFactor, zoomTranslation, inverseTotalRotationMatrix } =
  storeToRefs(store);
let requestAnimFrameHandle: number | null = null;
const rotationMatrix = new Matrix4();
const scene = new Scene();
const scaledHeight = prop.availableHeight / (zoomMagnificationFactor.value * 2);
const scaledWidth = prop.availableWidth / (zoomMagnificationFactor.value * 2);
const camera = new OrthographicCamera(
  -scaledWidth,
  scaledWidth,
  scaledHeight,
  -scaledHeight,
  0.1,
  1000
);
//  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const x = -zoomTranslation.value[0];
const y = -zoomTranslation.value[1];
camera.setViewOffset(
  prop.availableWidth,
  prop.availableHeight,
  x,
  y,
  prop.availableWidth,
  prop.availableHeight
);

const geometry = new SphereGeometry(
  SETTINGS.boundaryCircle.radius,
  200 /* number of longitude segments */,
  200 /* number of latitude segments */
);
const material = new MeshStandardMaterial({
  map: new TextureLoader().load("/earth/earth.jpg"),
  bumpMap: new TextureLoader().load("/earth/elevate.jpg"),
  bumpScale: 10
});
const earth = new Mesh(geometry, material);
earth.rotation.x = Math.PI / 2;
const ROTATION_X90 = new Matrix4().makeRotationX(Math.PI / 2);
const ambientLight = new AmbientLight(0xffffff, 0.2);
const light = new PointLight(0xffffff, 1);
let renderer: THREE.WebGLRenderer;
const num = Math.min(prop.availableHeight, prop.availableWidth);
light.position.set(num, num, num);

scene.add(earth);
scene.add(ambientLight);
scene.add(light);
scene.background = new TextureLoader().load("/earth/starfield.jpg");

function animate() {
  requestAnimFrameHandle = requestAnimationFrame(animate);
  // earth.rotation.y += 0.0001;
  renderer.render(scene, camera);
}

onMounted(() => {
  renderer = new WebGLRenderer({
    canvas: document.getElementById("earth") as HTMLCanvasElement
  });

  renderer.setSize(prop.availableWidth, prop.availableHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);
  rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
  rotationMatrix.multiply(ROTATION_X90);
  earth.setRotationFromMatrix(rotationMatrix);
  animate();
});

watch(
  [
    () => prop.availableWidth,
    () => prop.availableHeight,
    () => zoomMagnificationFactor.value
  ],
  ([canvasWidth, canvasHeight, zoomMagnificationFactor]) => {
    renderer.setSize(canvasWidth, canvasHeight);
    const scaledWidth = canvasWidth / (zoomMagnificationFactor * 2.0);
    const scaledHeight = canvasHeight / (zoomMagnificationFactor * 2.0);
    camera.left = -scaledWidth;
    camera.right = scaledWidth;
    camera.top = scaledHeight;
    camera.bottom = -scaledHeight;
    camera.position.z =
      Math.min(canvasHeight, canvasWidth) / (zoomMagnificationFactor * 2) + 10;
    camera.updateProjectionMatrix();
    // camera.setViewOffset(prop.canvasSize,prop.canvasSize,0,0,prop.canvasSize,prop.canvasSize);
  }
);

watch(
  () => inverseTotalRotationMatrix.value.elements,
  () => {
    rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
    rotationMatrix.multiply(ROTATION_X90);
    earth.setRotationFromMatrix(rotationMatrix);
  },
  { deep: true }
);

// zoom translate
watch(
  () => zoomTranslation.value,
  translation => {
    camera.setViewOffset(
      prop.availableWidth,
      prop.availableHeight,
      translation[0],
      translation[1],
      prop.availableWidth,
      prop.availableHeight
    );
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (requestAnimFrameHandle != null) {
    cancelAnimationFrame(requestAnimFrameHandle);
  }
});
</script>
