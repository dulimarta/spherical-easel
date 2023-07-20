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
  AxesHelper
} from "three";
import { watch, onMounted, onBeforeUnmount, onBeforeUpdate } from "vue";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { DateTime } from "luxon";
import { useEarthCoordinate } from "@/composables/earth";
import { useGeolocation } from "@vueuse/core";
const { coords } = useGeolocation();
const { flyTo } = useEarthCoordinate();
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
const textureLoader = new TextureLoader(/*textureManager*/);

let renderer: THREE.WebGLRenderer;
const axes = new AxesHelper(400); // For debugging?
const scene = new Scene();
const ambientLight = new AmbientLight(0xffffff, 0.2);
const light = new PointLight(0xffffff, 1);

scene.add(ambientLight);

// ThreeJS Sphere coordinate frame
// Positive-X axis => latitude 0-degrees (south of Ghana)
// Positive-Y axis => north pole
// Positive-Z axis => latitude 90-degree (west of ecuador)
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
  const [earthTexture, elevationMap, startField] = await Promise.all([
    textureLoader.loadAsync("/earth/earth.jpg"),
    textureLoader.loadAsync("/earth/elevate.jpg"),
    textureLoader.loadAsync("/earth/starfield.jpg")
  ]);
  console.debug("Promise.all(): Loading all textures done");
  scene.background = startField;

  const material = new MeshStandardMaterial({
    map: earthTexture,
    bumpMap: elevationMap,
    bumpScale: 10
  });
  earth = new Mesh(geometry, material);
  earth.add(axes);

  const num = Math.max(prop.availableHeight, prop.availableWidth);
  // Position the Point light based on the estimated
  // current position of the sun?
  // const sunGeoPosition = estimateSunGeoPosition();
  const sunLng = estimateSunGP();
  light.position.set(num * Math.cos(sunLng), 0, num * Math.sin(sunLng));
  // light.setRotationFromEuler(sunEulerRotation)
  // light.updateMatrix()
  // To fix the light to the earth, add it to the earth not the scene
  earth.add(light);
  rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
  earth.setRotationFromMatrix(rotationMatrix);

  scene.add(earth);

  renderer = new WebGLRenderer({
    canvas: document.getElementById("earth") as HTMLCanvasElement,
    preserveDrawingBuffer: true
  });
  renderer.setSize(prop.availableWidth, prop.availableHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);
  setTimeout(async () => {
    // FlyTo current user location
    if (
      (!isNaN(coords.value.latitude) && !isNaN(coords.value.longitude)) ||
      (coords.value.latitude !== Infinity &&
        coords.value.longitude !== Infinity)
    )
      await flyTo(coords.value.latitude, coords.value.longitude);
  }, 2000);
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
    if (renderer) renderer.setSize(canvasWidth, canvasHeight);
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

onBeforeUpdate(() => {
  console.debug("Before update");
});

onBeforeUnmount(() => {
  if (requestAnimFrameHandle != null) {
    cancelAnimationFrame(requestAnimFrameHandle);
  }
});

// Reference: https://astronomy.stackexchange.com/questions/20560/how-to-calculate-the-position-of-the-sun-in-long-lat/20585#20585
function estimateSunGP() {
  const now = DateTime.now();
  // console.debug("Offset ", now.offset, "UTC offset", now.toUTC().offset)
  const startOfYear = now.startOf("year");
  const endOfYear = now.endOf("year");
  const percentageOfYear =
    startOfYear.diffNow().milliseconds /
    endOfYear.diff(startOfYear).milliseconds;
  const nowInUTC = now.toUTC();
  console.debug("Time now is ", now.toISOTime(), nowInUTC.toISOTime());
  const utcMinutesUntilNoon = nowInUTC.minute + 60 * (nowInUTC.hour - 12);
  // 15 degrees in 60 minutes => 1 degree in 4 minutes
  const sunLongitude = utcMinutesUntilNoon / 4;
  console.debug(
    "Number of UTC elapse minutes",
    utcMinutesUntilNoon,
    "Sun estimate longitude",
    sunLongitude
  );
  return (sunLongitude * Math.PI) / 180;
}
</script>
