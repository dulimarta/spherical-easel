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
  WebGLRenderer
} from "three";
import { watch, onMounted, onBeforeUnmount } from "vue";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { DateTime } from "luxon";
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
const textureLoader = new TextureLoader(/*textureManager*/);

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
  1,
  2 * SETTINGS.boundaryCircle.radius * zoomMagnificationFactor.value
);
// When the magnification factor is below 1.0, we don't want to place the camera
// inside the unit sphere, so place it at least 10% further
camera.position.z =
  SETTINGS.boundaryCircle.radius * Math.max(1.1, zoomMagnificationFactor.value);

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
  const num = Math.max(prop.availableHeight, prop.availableWidth);
  // Position the Point light based on the estimated
  // current position of the sun?
  // const sunGeoPosition = estimateSunGeoPosition();
  const sunLng = estimateSunGP();
  // console.debug(`Sun longitude: ${sunGeoPosition.lon.toDegrees()} degrees`)
  // (1,0,0) => Equator GMT-0
  // (0,1,0) => North Pole   (0,-1,0) => South Pole
  // (0,0,1) => Equator GMT-6
  light.position.set(num * Math.cos(sunLng), 0, num * Math.sin(sunLng));
  // light.setRotationFromEuler(sunEulerRotation)
  // light.updateMatrix()
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
  setTimeout(async () => {
    // FlyTo current user location
    if (
      !isNaN(coords.value.latitude) &&
      !isNaN(coords.value.longitude) &&
      coords.value.latitude !== Infinity &&
      coords.value.longitude !== Infinity
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
    camera.far = 2 * SETTINGS.boundaryCircle.radius * zoomMagnificationFactor;
    // When the magnification factor is below 1.0, we don't want to place the camera
    // inside the unit sphere, so place it at least 10% further
    camera.position.z =
      SETTINGS.boundaryCircle.radius * Math.max(1.1, zoomMagnificationFactor);
    // console.debug(`Camera z-range [${camera.near}, ${camera.far}] and position`, camera.position)

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
function estimateSunGeoPosition() {
  const now = new Date();

  // The boilerplate: fiddling with dates
  const startOfYear = new Date(now.getFullYear(), 0, 0).getTime();
  const endOfYear = new Date(now.getFullYear() + 1, 0, 0).getTime();
  const nows = now.getTime();
  const percetageOfYear = (nows - startOfYear) / (endOfYear - startOfYear);

  const secs =
    now.getUTCMilliseconds() / 1e3 +
    now.getUTCSeconds() +
    60 * (now.getUTCMinutes() + 60 * now.getUTCHours());
  const percentOfDay = secs / 86400; // leap secs? nah.

  // The actual magic
  const lat = (-percentOfDay + 0.5) * Math.PI * 2;
  const lon = Math.sin((percetageOfYear - 0.22) * Math.PI * 2) * 0.41;
  console.debug(`Sun geo position is ${lat.toDegrees()},${lon.toDegrees()}`);
  // return new Euler(0, lat, lon, 'YZX')
  return { lat, lon };
}
</script>
