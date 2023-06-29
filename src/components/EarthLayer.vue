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
  WebGLRenderer,
  LoadingManager
} from "three";
import { watch, onMounted, onBeforeUnmount } from "vue";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
// import { onBeforeUpdate } from "vue";

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
const ROTATION_X90 = new Matrix4().makeRotationX(Math.PI / 2);
const textureManager = new LoadingManager();
const textureLoader = new TextureLoader(textureManager);

let loadingCount = 0;
let loadedCount = 0;

textureManager.onStart = (url, loaded, total) => {
  console.debug(`Begin loading texture ${url} Count ${loaded}/${total}`);
};
textureManager.onProgress = (url, loaded, total) => {
  if (total > loadingCount) loadingCount = total;
  console.debug(`Progress loading texture ${url} Count ${loaded}/${total}`);
};
textureManager.onLoad = () => {
  loadedCount += 1;
  console.debug("Texture loading completed", loadedCount);
};
textureManager.onError = url => {
  console.error("Unable to load", url);
};

let renderer: THREE.WebGLRenderer;
const scene = new Scene();
const ambientLight = new AmbientLight(0xffffff, 0.2);
const light = new PointLight(0xffffff, 1);
const num = Math.min(prop.availableHeight, prop.availableWidth);
light.position.set(num, num, num);

scene.add(ambientLight);
scene.add(light);

const geometry = new SphereGeometry(
  SETTINGS.boundaryCircle.radius,
  200 /* number of longitude segments */,
  200 /* number of latitude segments */
);
let earth: Mesh;

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
camera.position.z = Math.min(scaledWidth, scaledHeight);
camera.updateProjectionMatrix();
camera.setViewOffset(
  prop.availableWidth,
  prop.availableHeight,
  -zoomTranslation.value[0],
  -zoomTranslation.value[1],
  prop.availableWidth,
  prop.availableHeight
);
console.debug(`Setting up camera viewport for ${scaledWidth}x${scaledHeight}`);

onMounted(async () => {
  const t1 = textureLoader.loadAsync("/earth/earth.jpg");
  const t2 = textureLoader.loadAsync("/earth/elevate.jpg");
  const t3 = textureLoader.loadAsync("/earth/starfield.jpg");
  const [earthTexture, elevationMap, startField] = await Promise.all([
    t1,
    t2,
    t3
  ]);
  console.debug("Promise.all(): Loading all textures done");
  scene.background = startField;

  const material = new MeshStandardMaterial({
    map: earthTexture,
    bumpMap: elevationMap,
    bumpScale: 10
  });
  earth = new Mesh(geometry, material);
  earth.rotation.x = Math.PI / 2;
  rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
  rotationMatrix.multiply(ROTATION_X90);
  earth.setRotationFromMatrix(rotationMatrix);
  scene.add(earth);

  renderer = new WebGLRenderer({
    canvas: document.getElementById("earth") as HTMLCanvasElement
  });
  renderer.setSize(prop.availableWidth, prop.availableHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);
  animate();
});

function animate() {
  requestAnimFrameHandle = requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

watch(
  [
    () => prop.availableWidth,
    () => prop.availableHeight,
    () => zoomMagnificationFactor.value
  ],
  ([canvasWidth, canvasHeight, zoomMagnificationFactor]) => {
    if (renderer)
      renderer.setSize(canvasWidth, canvasHeight);
    const scaledWidth = canvasWidth / (zoomMagnificationFactor * 2.0);
    const scaledHeight = canvasHeight / (zoomMagnificationFactor * 2.0);
    camera.left = -scaledWidth;
    camera.right = scaledWidth;
    camera.top = scaledHeight;
    camera.bottom = -scaledHeight;
    camera.updateProjectionMatrix();
    console.debug("End of watch size and zoom factor");
  }
);

watch(
  () => inverseTotalRotationMatrix.value.elements,
  () => {
    rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
    rotationMatrix.multiply(ROTATION_X90);
    earth.setRotationFromMatrix(rotationMatrix);
    console.debug("End of watch rotation");
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
    console.debug("End of watch zoom translation");
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (requestAnimFrameHandle != null) {
    cancelAnimationFrame(requestAnimFrameHandle);
  }
});
</script>
