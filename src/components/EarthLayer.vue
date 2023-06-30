<template>
  <canvas id="earth"></canvas>
</template>
<style scoped>
#earth {
  position: absolute;
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

type EarthLayerProps = {
  availableWidth: number;
  availableHeight: number;
};
const prop = defineProps<EarthLayerProps>();
const store = useSEStore();
const { zoomMagnificationFactor, zoomTranslation, inverseTotalRotationMatrix } =
  storeToRefs(store);
let requestAnimFrameHandle: number | null = null;

const rotationMatrix = new Matrix4(); // temporary matrix for rotating the sphere
// The TwoJS drawing canvas is our assumed XY-plane, and our unit sphere is
// initially position with its north pole(Z - plus axis) pointing towards the viewer.
// However, the ThreeJS sphere wrapped with the earth texture shows its north pole
// pointing up to the sky (our Y-plus axis).
// A rotation by 90 degrees is required to lineup both north poles
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

scene.add(ambientLight);

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
  const num = Math.min(prop.availableHeight, prop.availableWidth);
  // TODO: position the Point light based on the current position
  // of the sun?
  light.position.set(num, 0, 0); // I think this is the GMT+0 position
  // To fix the light to the earth, add it to the earth not the scene
  earth.add(light);
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

// Watch screen resize and zoom changes
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
  }
);

// Watch sphere rotation
watch(
  () => inverseTotalRotationMatrix.value.elements,
  () => {
    rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
    rotationMatrix.multiply(ROTATION_X90);
    earth.setRotationFromMatrix(rotationMatrix);
  },
  { deep: true }
);

// Watch zoom translate
watch(
  () => zoomTranslation.value,
  translation => {
    camera.setViewOffset(
      prop.availableWidth,
      prop.availableHeight,
      -translation[0],
      -translation[1],
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
