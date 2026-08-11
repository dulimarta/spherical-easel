<template>
  <span
    id="cursorInfo"
    :style="{
      position: 'fixed',
      backgroundColor: '#FFF7',
      color: isOutside ? 'grey' : 'black'
    }">
    <span class="mx-2">
      Keys
      <v-icon :color="shiftKey ? 'black' : '#0002'">
        mdi-apple-keyboard-shift
      </v-icon>
      <v-icon :color="controlKey ? 'black' : '#0002'">
        mdi-apple-keyboard-control
      </v-icon>
    </span>
    <span class="mr-1">
      <span v-if="!Number.isNaN(rayIntersectionPosition.x)">
        World:{{ rayIntersectionPosition.toFixed(2) }} In Camera
        {{ positionInCameraCF.toFixed(2) }}
      </span>
      <br />
      <span class="ml-1">
        FOV: {{ cameraFOV.toFixed(1) }}
        Dolly Distance:
        {{ cameraDollyDistance.toFixed(1) }}
        Polar Angle:
        {{ ((cameraPolarAngle * 180) / Math.PI).toFixed(1) }}&deg; zUpperClip:
        {{ zUpperClip.value.toFixed(2) }}
        zLowerClip:
        {{ zLowerClip.value.toFixed(2) }}
      </span>
    </span>
  </span>
  <v-tooltip activator="#cursorInfo" location="bottom" class="opacity-70">
    <ul>
      <li>Canvas: the position of the mouse in the canvas</li>
      <ul>
        <li>pixel coordinates</li>
        <li>
          <b>normalized</b>
          pixel coordinates
        </li>
      </ul>
      <li>World: intersection of mouse ray with world objects</li>
      <li>Location of world point in the camera coordinate system</li>
    </ul>
  </v-tooltip>
  <div
    :style="{
      position: 'fixed',
      bottom: '64px',
      left: '384px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start'
    }">
    <v-hover open-delay="250" close-delay="250">
      <template #default="{ props }">
        <div
          v-bind="props"
          :style="{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
          }">
          <v-btn-toggle v-model="visibleLayers" multiple>
            <v-btn icon color="orange" value="lowerSheet">
              <!-- Use CSS trick to rotate the semicircle icon to look like lower sheet :-) -->
              <v-icon
                :style="{ transform: ' translateY(0.3em) rotate(90deg)' }">
                mdi-circle-half
              </v-icon>
            </v-btn>
            <v-tooltip
              activator="[value='lowerSheet']"
              location="top left"
              class="opacity-70">
              <span>{{ t("lowerSheet") }}</span>
            </v-tooltip>
            <v-btn icon color="blue" value="idealStrip">
              <v-icon>mdi-circle-expand</v-icon>
            </v-btn>
            <v-tooltip
              activator="[value='idealStrip']"
              location="top left"
              class="opacity-70">
              <span>{{ t("idealStrip") }}</span>
            </v-tooltip>
            <v-btn icon color="green" value="polarGrid">
              <v-icon>mdi-grid</v-icon>
            </v-btn>
            <v-tooltip
              activator="[value='polarGrid']"
              location="top left"
              class="opacity-70">
              <span>{{ t("polarGrid") }}</span>
            </v-tooltip>
            <v-btn icon color="blue" value="ultraStrip">
              <v-icon>mdi-surround-sound</v-icon>
            </v-btn>
            <v-tooltip
              activator="[value='ultraStrip']"
              location="top left"
              class="opacity-70">
              <span>{{ t("ultraStrip") }}</span>
            </v-tooltip>
          </v-btn-toggle>
        </div>
      </template>
    </v-hover>
  </div>
  <canvas
    ref="webGPUCanvas"
    id="webGPUCanvas"
    :width="props.availableWidth"
    :height="props.availableHeight" />
</template>
<style lang="css" scoped>
ul > ul {
  margin-left: 1em;
}
</style>
<script setup lang="ts">
// ThreeJS imports and Camera Controls
import {
  AmbientLight,
  // ArrowHelper,
  Clock,
  // GridHelper,
  // Group,
  Matrix4,
  PerspectiveCamera,
  // PointLight,
  Raycaster,
  Scene,
  // SphereGeometry,
  Vector3,
  Vector2
} from "three";
import * as THREE from "three/webgpu";
import CameraControls from "camera-controls";
import { EventDispatcher } from "camera-controls";
import { acceleratedRaycast } from "three-mesh-bvh";

// Vue imports
import {
  onUpdated,
  onBeforeMount,
  onMounted,
  Ref,
  ref,
  useTemplateRef,
  watch,
  reactive
} from "vue";
import { useI18n } from "vue-i18n";
import {
  useIdle,
  useMouseInElement,
  useEventListener,
  useMagicKeys
} from "@vueuse/core";

// Store imports
import { useHyperbolicStore } from "@/stores/hyperbolic";
import { useSEStore } from "@/stores/se";
import { useGeometryStore } from "@/stores/geometry";
import { storeToRefs } from "pinia";

// Tool Handlers
import { HyperbolicTool } from "@/eventHandlers-hyperbolic/ToolStrategy";
import { SimplePointHandler } from "@/eventHandlers-hyperbolic/SimplePointHandler";
import { SimpleLineHandler } from "@/eventHandlers-hyperbolic/SimpleLineHandler";
import { CircleHandler } from "@/eventHandlers-hyperbolic/CircleHandler";
import { LineHandler } from "@/eventHandlers-hyperbolic/LineHandler";
import { TextHandler } from "@/eventHandlers-hyperbolic/TextHandler";
import { Text } from "troika-three-text";

import SETTINGS, { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import {
  createPolarGridCircle,
  createPolarGridRadialLine,
  createIdealStrip,
  createUltraStrip,
  createHyperboloidSheet,
  zUpperClip,
  zLowerClip,
  zUpperIdealStripClipPlus,
  zUpperIdealStripClipMinus,
  zLowerIdealStripClipPlus,
  zLowerIdealStripClipMinus,
  unitLength,
  arcLengthScale
} from "@/plottables-hyperbolic/MeshFactory";
import { VisibleHELayersType } from "@/types";
import EventBus from "@/eventHandlers-spherical/EventBus";
import { onBeforeUnmount } from "vue";
import { Handler } from "mitt";
import { CKNodule } from "@/models/CKNodule";
const { t } = useI18n({ useScope: "local" });

const hyperStore = useHyperbolicStore();
const seStore = useSEStore();
const geoStore = useGeometryStore();
const { idle } = useIdle(250); // in milliseconds
const {
  surfaceIntersections,
  closestIntersectionIsSurface,
  cameraQuaternion,
  cameraDollyDistance,
  cameraFieldOfView,
  cameraOrigin
  // hyperboloidIsClosestIntersection,
  // idealStripIsClosestIntersection,
  // ultraStripIsClosestIntersection
} = storeToRefs(hyperStore);
const { objectIntersections } = storeToRefs(geoStore);
const { actionMode } = storeToRefs(seStore);
const enableCameraControl = ref(false);
const hasUpdatedCameraControls = ref(false);
const visibleLayers: Ref<VisibleHELayersType[]> = ref([]);
const showLowerSheet = ref(false);
const showIdealStrip = ref(false);
const showUltraStrip = ref(false);
const showPolarGrid = ref(true);
let hitList: Array<CKNodule | string> = [];
type ImportantSurface = "Upper" | "Lower" | null;
const intersectionList: Ref<
  THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[]
> = ref([]);
let onSurface: Ref<ImportantSurface> = ref(null); // For the display of the information under the mouse cursor when over a hyperbolic sheet
// Inject new BVH functions into current THREE-JS Mesh/BufferGeometry definitions
THREE.Mesh.prototype.raycast = acceleratedRaycast;
// THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
// THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

type ComponentProps = {
  availableHeight: number;
  availableWidth: number;
};
const props = withDefaults(defineProps<ComponentProps>(), {
  availableHeight: 240,
  availableWidth: 240
});

CKNodule.setGAMode("hyperbolic");
const webGPUCanvas = useTemplateRef<HTMLCanvasElement>("webGPUCanvas");
const { elementX, elementY, isOutside } = useMouseInElement(webGPUCanvas, {});
const { shift: shiftKey, control: controlKey } = useMagicKeys({
  passive: false
});
const scene = new Scene();
const clock = new Clock(); // used by camera control animation
const rayCaster = new Raycaster();
const mouseCoordNormalized: Ref<Vector2> = ref(new Vector2()); // used by RayCaster
let camera: PerspectiveCamera;
let oldCameraDistance = 0;
let cameraFOV = ref(SETTINGS.maxFieldOfView);
const cameraPolarAngle = ref(0);
const tmpMatrix4 = new Matrix4();
const positionInCameraCF = ref(new Vector3());
let renderer: THREE.WebGPURenderer;
let cameraController: CameraControls;
CameraControls.install({ THREE });
const ambientLight = new AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

// const pointLight = new PointLight(0xffffff, 100);
// pointLight.position.set(3, 3, -5);
// scene.add(pointLight);

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight1.position.set(0, 10, 10);
directionalLight1.target.position.set(0, 0, 1);
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight2.position.set(10, 0, 10);
directionalLight2.target.position.set(0, 0, 1);
const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight3.position.set(10, 0, -10);
directionalLight3.target.position.set(0, 0, -1);
const directionalLight4 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight4.position.set(0, 10, -10);
directionalLight4.target.position.set(0, 0, -1);
scene.add(directionalLight1);
scene.add(directionalLight2);
scene.add(directionalLight3);
scene.add(directionalLight4);

scene.background = new THREE.Color(0xf5f5f5);
//scene.background = new THREE.Color(0x6082b6);
//scene.environment = await new THREE.RGBELoader().loadAsync("env.hdr");

let currentTools: Array<HyperbolicTool> = [];
let pointTool: HyperbolicTool | null = null;
let lineTool: HyperbolicTool | null = null;
let segmentTool: HyperbolicTool | null = null;
// let circleTool: CircleHandler | null = null;
// let textTool: TextHandler | null = null;

const txtObject = new Text();
txtObject.text = `Hello`;
txtObject.anchorX = "center";
txtObject.anchorY = "bottom";
// txtObject.position.set(0, 0, 0);
txtObject.fontSize = 0.02;
txtObject.color = "yellow"; //0x000000;

const rayIntersectionPosition = reactive(new Vector3());

// Arrays to store the polar grid lines
let upperPolarGridArray: Array<THREE.Mesh> = [];
let lowerPolarGridArray: Array<THREE.Mesh> = [];

let upperIdealStrip: THREE.Mesh | undefined = undefined;
let lowerIdealStrip: THREE.Mesh | undefined = undefined;

let upperUltraStrip: THREE.Mesh | undefined = undefined;
let lowerUltraStrip: THREE.Mesh | undefined = undefined;

let upperHyperboloidSheet: THREE.Mesh | undefined = undefined;
let lowerHyperboloidSheet: THREE.Mesh | undefined = undefined;

clock.autoStart = true;

watch(visibleLayers, (layers: Array<VisibleHELayersType>) => {
  showLowerSheet.value = layers.includes("lowerSheet");
  showIdealStrip.value = layers.includes("idealStrip");
  showUltraStrip.value = layers.includes("ultraStrip");
  showPolarGrid.value = layers.includes("polarGrid");
  updateVisibleLayers();
});

function updateVisibleLayers(): void {
  if (showUltraStrip.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.upperUltraPoints);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.upperUltraPoints);

    camera.layers.enable(HYPERBOLIC_LAYER.upperUltraLabels);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.upperUltraLabels);

    if (upperUltraStrip) {
      scene.add(upperUltraStrip);
    }
    if (showLowerSheet.value) {
      camera.layers.enable(HYPERBOLIC_LAYER.lowerUltraPoints);
      rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerUltraPoints);

      camera.layers.enable(HYPERBOLIC_LAYER.lowerUltraLabels);
      rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerUltraLabels);

      if (lowerUltraStrip) {
        scene.add(lowerUltraStrip);
      }
    } else {
      camera.layers.disable(HYPERBOLIC_LAYER.lowerUltraPoints);
      rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerUltraPoints);

      camera.layers.disable(HYPERBOLIC_LAYER.lowerUltraLabels);
      rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerUltraLabels);

      if (lowerUltraStrip) {
        scene.remove(lowerUltraStrip);
      }
    }
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.lowerUltraPoints);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerUltraPoints);

    camera.layers.disable(HYPERBOLIC_LAYER.lowerUltraLabels);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerUltraLabels);

    camera.layers.disable(HYPERBOLIC_LAYER.upperUltraPoints);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.upperUltraPoints);

    camera.layers.disable(HYPERBOLIC_LAYER.upperUltraLabels);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.upperUltraLabels);

    if (upperUltraStrip) {
      scene.remove(upperUltraStrip);
    }
    if (lowerUltraStrip) {
      scene.remove(lowerUltraStrip);
    }
  }

  if (showIdealStrip.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.upperIdealPoints);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.upperIdealPoints);

    camera.layers.enable(HYPERBOLIC_LAYER.upperIdealLabels);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.upperIdealLabels);

    if (upperIdealStrip) {
      scene.add(upperIdealStrip);
    }
    if (showLowerSheet.value) {
      camera.layers.enable(HYPERBOLIC_LAYER.lowerIdealPoints);
      rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerIdealPoints);

      camera.layers.enable(HYPERBOLIC_LAYER.lowerIdealLabels);
      rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerIdealLabels);

      if (lowerIdealStrip) {
        scene.add(lowerIdealStrip);
      }
    } else {
      camera.layers.disable(HYPERBOLIC_LAYER.lowerIdealPoints);
      rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerIdealPoints);

      camera.layers.disable(HYPERBOLIC_LAYER.lowerIdealLabels);
      rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerIdealLabels);

      if (lowerIdealStrip) {
        scene.remove(lowerIdealStrip);
      }
    }
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.lowerIdealPoints);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerIdealPoints);

    camera.layers.disable(HYPERBOLIC_LAYER.lowerIdealLabels);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerIdealLabels);

    camera.layers.disable(HYPERBOLIC_LAYER.upperIdealPoints);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.upperIdealPoints);

    camera.layers.disable(HYPERBOLIC_LAYER.upperIdealLabels);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.upperIdealLabels);

    if (upperIdealStrip) {
      scene.remove(upperIdealStrip);
    }
    if (lowerIdealStrip) {
      scene.remove(lowerIdealStrip);
    }
  }

  if (showPolarGrid.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.upperSheetGrid);
    upperPolarGridArray.forEach(grid => scene.add(grid));
    if (showLowerSheet.value) {
      camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetGrid);
      lowerPolarGridArray.forEach(grid => scene.add(grid));
    } else {
      camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetGrid);
      lowerPolarGridArray.forEach(grid => scene.remove(grid));
    }
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetGrid);
    camera.layers.disable(HYPERBOLIC_LAYER.upperSheetGrid);
    lowerPolarGridArray.forEach(grid => scene.remove(grid));
    upperPolarGridArray.forEach(grid => scene.remove(grid));
  }

  if (showLowerSheet.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheet);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheet);

    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetPoints);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheetPoints);

    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetLabels);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheetLabels);

    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetLines);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheetLines);

    if (lowerHyperboloidSheet) {
      scene.add(lowerHyperboloidSheet);
    }
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheet);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheet);

    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetPoints);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheetPoints);

    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetLabels);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheetLabels);

    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetLines);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheetLines);

    if (lowerHyperboloidSheet) {
      scene.remove(lowerHyperboloidSheet);
    }
  }
  renderer.renderAsync(scene, camera);
}

// Watch for idle after zooming/dollying so that we can update the label display
watch(idle, idleValue => {
  // console.debug("Idle state", idleValue);
  // console.debug("Camera control", hasUpdatedCameraControls.value);
  if (idleValue || hasUpdatedCameraControls.value) {
    hyperStore.adjustTextPose();
    hyperStore.updateDisplayForCameraUpdate();
    geoStore.adjustLabelPose(cameraQuaternion.value);
    hasUpdatedCameraControls.value = false;
  }
});

// When the lower sheet is shown (or not) update the zClipping planes and the camera lookAt
watch(showLowerSheet, () => {
  // updateView();
  // console.log("Show lower sheet", show);
  // actionMode.value = "rotate";
  renderer.renderAsync(scene, camera); // update the scene
});

// Action mode watcher
watch(
  () => actionMode.value,
  mode => {
    console.log("New action mode", mode);
    currentTools.forEach(t => {
      t.deactivate();
    });
    currentTools.splice(0);
    enableCameraControl.value = false;
    switch (mode) {
      case "point":
        if (pointTool === null) pointTool = new SimplePointHandler(scene);
        currentTools.push(pointTool);
        break;
      case "line":
        if (lineTool === null) {
          // Second arg: true for infinite line
          lineTool = new SimpleLineHandler(scene, true);
        }
        currentTools.push(lineTool);
        break;
      case "segment":
        if (segmentTool === null) {
          // Second arg: false for finite line
          segmentTool = new SimpleLineHandler(scene, false); // segment mode is 2
        }
        currentTools.push(segmentTool);
        break;
      // case "text":
      //   //if (textTool === null) textTool = new TextHandler(scene);
      //   //currentTools.push(textTool);
      //   break;
      // case "circle":
      //   //if (circleTool === null) circleTool = new CircleHandler(scene);
      //   //currentTools.push(circleTool);
      //   break;
      case "rotate":
        enableCameraControl.value = true;
        break;
      default:
        enableCameraControl.value = true;
      // currentTools. = null;
    }
    currentTools.forEach(t => {
      t.activate();
    });
  }
);

onBeforeMount(() => {
  EventBus.listen(
    "raycast-mouse-move",
    threeMouseTrackerThenMouseMove as Handler<unknown>
  );
  initialize();
});

onBeforeUnmount(() => {
  EventBus.unlisten("raycast-mouse-move");
});

onMounted(async () => {
  console.log(`Mounted size ${props.availableWidth}x${props.availableHeight}`);
  camera.aspect = props.availableWidth / props.availableHeight;

  camera.position.set(6, 0, 8);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 1);
  camera.updateProjectionMatrix();

  hyperStore.setScene(scene, camera);
  geoStore.setScene(scene);
  cameraQuaternion.value.copy(camera.quaternion);

  cameraFieldOfView.value = camera.fov;
  cameraController = new CameraControls(camera, webGPUCanvas.value!);
  // Set the parameters of the camera controller
  cameraController.minDistance = SETTINGS.dollyDistanceMin;
  cameraController.maxDistance = SETTINGS.dollyDistanceMax;
  // cameraController.maxZoom = ; // this is "digital zoom" and not field of view
  // cameraController.minZoom = ;
  cameraController.minPolarAngle = 0.1; // radians
  cameraController.maxPolarAngle = Math.PI - 0.1; // radians
  cameraController.dollySpeed = 0.2;
  cameraController.polarRotateSpeed = 0.5;
  cameraController.azimuthRotateSpeed = 0.2;
  cameraController.smoothTime = 0.22;
  cameraController.draggingSmoothTime = 0.12;
  cameraDollyDistance.value = cameraController.distance;
  oldCameraDistance = cameraController.distance;
  cameraPolarAngle.value = cameraController.polarAngle;
  renderer = new THREE.WebGPURenderer({
    canvas: webGPUCanvas.value!,
    antialias: true
    // logarithmicDepthBuffer: true // Attempt to use this to stop z-fighting when the boundary cone is displayed
  });
  await renderer.init();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Enable local clipping (i.e. clipping on individual materials)
  // renderer.localClippingEnabled = true;

  // Initial update of the view of sheets, grid and ideal points
  updateVisibleLayers(); // Use the visibleLayers to update the display
  updateView(); // update the look at, zClipping values for ideal points' strip and hyperboloids

  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.setClearColor(0xcccccc, 1);
  renderer.setAnimationLoop(doRender);
  renderer.renderAsync(scene, camera);

  // textRenderer.renderAsync(scene, camera);
  // visualContent.value!.appendChild(textRenderer.domElement);
  useEventListener(webGPUCanvas, "mousemove", threeMouseTrackerThenMouseMove);
  useEventListener(webGPUCanvas, "mousedown", doMouseDown);
  useEventListener(webGPUCanvas, "mouseup", doMouseUp);
  useEventListener(webGPUCanvas, "mouseleave", doMouseLeave);

  // useEventListener(cameraController, "control", updateCameraDetails);
  // useEventListener(cameraController, "update", updateCameraDetails);
  cameraController.mouseButtons.wheel = CameraControls.ACTION.NONE;
  useEventListener(
    webGPUCanvas.value,
    "wheel",
    event => {
      if (!cameraController) return;

      // Prevent page scrolling
      event.preventDefault();

      // shift key plus mouse wheel will change the field of view, otherwise it will dolly in and out
      if (event.shiftKey) {
        const newFov =
          (cameraController.camera as PerspectiveCamera).fov +
          event.deltaY * 0.2;
        if (
          newFov <= SETTINGS.maxFieldOfView &&
          newFov >= SETTINGS.minFieldOfView
        ) {
          (cameraController.camera as PerspectiveCamera).fov = newFov;
          cameraFOV.value = newFov;
          cameraController.camera.updateProjectionMatrix();
          renderer.renderAsync(scene, camera);
          // updateView();
        }
      } else {
        cameraController.dolly(event.deltaY, true);
        cameraDollyDistance.value = cameraController.distance;
        oldCameraDistance = cameraController.distance;
        // updateView();
        const deltaTime = clock.getDelta();
        cameraController.update(deltaTime);
        hasUpdatedCameraControls.value = true;
        cameraQuaternion.value.copy(camera.quaternion);
        cameraFieldOfView.value = camera.fov;
        renderer.renderAsync(scene, camera);

        // console.log({
        //   currentZoom: cameraController.camera.zoom,
        //   currentFOV: (cameraController.camera as PerspectiveCamera).fov,
        //   currentDistance: cameraController.distance
        // });
        // }
      }
      // console.log({
      //   currentZoom: cameraController.camera.zoom,
      //   currentFOV: (cameraController.camera as PerspectiveCamera).fov,
      //   currentDistance: cameraController.distance,
      //   currentPosition: cameraController.camera.position.toFixed(2)
      // });
    },
    { passive: false }
  );
});

onUpdated(() => {
  // console.debug(`onUpdated size ${props.availableWidth}x${props.availableHeight}`)
  camera.aspect = props.availableWidth / props.availableHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(props.availableWidth, props.availableHeight);
  // renderer.render/(scene, camera);
});

function initialize() {
  camera = new PerspectiveCamera(
    SETTINGS.maxFieldOfView,
    props.availableWidth / props.availableHeight,
    0.1,
    2 * SETTINGS.dollyDistanceMax // because if you view both sheets of the hyperboloid with polar angle of 0 and dolly distance is at a maximum, to see the entire lower sheet you need the far plane to be this.
  );

  // const helper = new THREE.CameraHelper(camera);
  // scene.add(helper);

  // const xyGrid = new THREE.GridHelper();
  // // xyGrid.translateZ(1);
  // xyGrid.rotateX(Math.PI / 2);
  // scene.add(xyGrid);

  // Insert the grid BEFORE the arrow helper
  // const arrowX = new THREE.ArrowHelper(new Vector3(1, 0, 0));
  // arrowX.setColor(0xff0000);
  // arrowX.setLength(2, 0.2, 0.2);
  // const arrowY = new THREE.ArrowHelper(new Vector3(0, 1, 0));
  // arrowY.setColor(0x00ff00);
  // arrowY.setLength(2, 0.2, 0.2);
  // const arrowZ = new THREE.ArrowHelper(new Vector3(0, 0, 1));
  // arrowZ.setColor(0x0000ff);
  // arrowZ.setLength(2, 0.2, 0.2);
  // scene.add(arrowX);
  // scene.add(arrowY);
  // scene.add(arrowZ);

  // create the hyperboloid sheets
  upperHyperboloidSheet = createHyperboloidSheet(true);
  lowerHyperboloidSheet = createHyperboloidSheet(false);

  lowerHyperboloidSheet.name = "Lower Sheet";
  upperHyperboloidSheet.name = "Upper Sheet";
  lowerHyperboloidSheet.layers.set(HYPERBOLIC_LAYER.lowerSheet);
  upperHyperboloidSheet.layers.set(HYPERBOLIC_LAYER.upperSheet);

  // The upper sheet/upper sheet objects are NEVER removed from the scene or the raycaster, so add them here
  scene.add(upperHyperboloidSheet);
  rayCaster.layers.enable(HYPERBOLIC_LAYER.upperSheet);
  rayCaster.layers.enable(HYPERBOLIC_LAYER.upperSheetPoints);
  rayCaster.layers.enable(HYPERBOLIC_LAYER.upperSheetLabels);
  rayCaster.layers.enable(HYPERBOLIC_LAYER.upperSheetLines);
  camera.layers.enable(HYPERBOLIC_LAYER.upperSheet);
  camera.layers.enable(HYPERBOLIC_LAYER.upperSheetPoints);
  camera.layers.enable(HYPERBOLIC_LAYER.upperSheetLabels);
  camera.layers.enable(HYPERBOLIC_LAYER.upperSheetLines);

  // Create the strips on which the ideal points
  // will be displayed by clipping between two planes
  upperIdealStrip = createIdealStrip(true);
  upperIdealStrip.name = `Upper Ideal Strip`;
  upperIdealStrip.layers.set(HYPERBOLIC_LAYER.upperIdealPoints);

  lowerIdealStrip = createIdealStrip(false);
  lowerIdealStrip.name = `Lower Ideal Strip`;
  lowerIdealStrip.layers.set(HYPERBOLIC_LAYER.lowerIdealPoints);

  upperUltraStrip = createUltraStrip(true);
  upperUltraStrip.name = `Upper Ultra Strip`;
  upperUltraStrip.layers.set(HYPERBOLIC_LAYER.upperUltraPoints);

  lowerUltraStrip = createUltraStrip(false);
  lowerUltraStrip.name = `Lower Ultra Strip`;
  lowerUltraStrip.layers.set(HYPERBOLIC_LAYER.lowerUltraPoints);

  // create the radial polar grid lines
  for (let upperLower = 0; upperLower < 2; upperLower++) {
    const numRadialLines = 12;
    for (
      let theta = 0;
      theta < 2 * Math.PI;
      theta += (2 * Math.PI) / numRadialLines
    ) {
      const radialLineMeshPlus = createPolarGridRadialLine(
        theta,
        upperLower === 0,
        true
      );
      const radialLineMeshMinus = createPolarGridRadialLine(
        theta,
        upperLower === 0,
        false
      );
      radialLineMeshPlus.layers.set(
        upperLower === 0
          ? HYPERBOLIC_LAYER.upperSheetGrid
          : HYPERBOLIC_LAYER.lowerSheetGrid
      );
      radialLineMeshMinus.layers.set(
        upperLower === 0
          ? HYPERBOLIC_LAYER.upperSheetGrid
          : HYPERBOLIC_LAYER.lowerSheetGrid
      );
      if (upperLower === 0) {
        upperPolarGridArray.push(radialLineMeshPlus);
        upperPolarGridArray.push(radialLineMeshMinus);
      } else {
        lowerPolarGridArray.push(radialLineMeshPlus);
        lowerPolarGridArray.push(radialLineMeshMinus);
      }
    }

    // create the circular polar grid lines
    for (let r = 0.5; Math.cosh(r) < SETTINGS.maxZClip; r += 0.5) {
      const circularGridMeshPlus = createPolarGridCircle(
        r,
        upperLower === 0,
        true
      );
      const circularGridMeshMinus = createPolarGridCircle(
        r,
        upperLower === 0,
        false
      );

      circularGridMeshPlus.layers.set(
        upperLower === 0
          ? HYPERBOLIC_LAYER.upperSheetGrid
          : HYPERBOLIC_LAYER.lowerSheetGrid
      );
      circularGridMeshMinus.layers.set(
        upperLower === 0
          ? HYPERBOLIC_LAYER.upperSheetGrid
          : HYPERBOLIC_LAYER.lowerSheetGrid
      );
      if (upperLower === 0) {
        upperPolarGridArray.push(circularGridMeshPlus);
        upperPolarGridArray.push(circularGridMeshMinus);
      } else {
        lowerPolarGridArray.push(circularGridMeshPlus);
        lowerPolarGridArray.push(circularGridMeshMinus);
      }
    }
  }

  // push (polar grid)|(ideal points)|(lower sheet) to visible layers, because it is visible at initialization otherwise the vue button handles the visibleLayers array
  if (showPolarGrid.value) {
    visibleLayers.value.push("polarGrid");
  }
  if (showIdealStrip.value) {
    visibleLayers.value.push("idealStrip");
  }
  if (showUltraStrip.value) {
    visibleLayers.value.push("ultraStrip");
  }
  if (showLowerSheet.value) {
    visibleLayers.value.push("lowerSheet");
  }

  // Set the default tool
  actionMode.value = "rotate";
}

function doRender() {
  //console.debug("Rendering.....");
  if (enableCameraControl.value) {
    const deltaTime = clock.getDelta();
    const hasUpdated = cameraController.update(deltaTime);
    if (hasUpdated) {
      hasUpdatedCameraControls.value = true;
      cameraQuaternion.value.copy(camera.quaternion);
      cameraDollyDistance.value = cameraController.distance;
      cameraFieldOfView.value = camera.fov;
      camera.getWorldPosition(cameraOrigin.value);
    }
  }
  renderer.renderAsync(scene, camera); // Put this here so that changes in the GPU/TSL materials will be reflected in the rendering immediately.
}

function updateCameraDetails() {
  // console.log("CC::" + ev.type + " " + cc.distance.toFixed(2));

  cameraDollyDistance.value = cameraController.distance;
  cameraPolarAngle.value = cameraController.polarAngle;
  if (
    Math.abs(oldCameraDistance - cameraController.distance) >
    SETTINGS.minDollyDistanceChangeForViewUpdate
  ) {
    oldCameraDistance = cameraController.distance;
    updateView();
    // console.log({
    //   currentZoom: cameraController.camera.zoom,
    //   currentFOV: (cameraController.camera as PerspectiveCamera).fov,
    //   currentDistance: cameraController.distance
    // });
  }

  if (surfaceIntersections.value.length > 0) {
    positionInCameraCF.value
      .copy(surfaceIntersections.value[0].point)
      .applyMatrix4(camera.matrixWorld);
  }
}

function updateView() {
  // Default value, when both sheets are shown look at the origin.
  var zCoordLookAt = 0;

  if (showLowerSheet.value) {
    // Choose the clipping so that when viewing the hyperboloid sheets with the largest visual amount is shown
    // the image still fit on the field of view. The largest visual amount occurs with the
    // camera is looking directly (i.e. orthogonal) at the the plane(s) that make angle of 45 degrees
    // with the horizontal plane.
    zUpperClip.value =
      Math.tan(
        (((SETTINGS.maxFieldOfView - SETTINGS.angularBorder) / 2) * Math.PI) /
          180
      ) *
      cameraController.distance *
      Math.sqrt(1 / 2);
  } else {
    // When only the upper sheet is shown, we set the zClippingPlane so that
    // the when the largest visual amount of the upper sheet is shown, it is
    // fits on the field of view. This occurs when the camera is looking straight down
    // and the display is essentially a circle
    const fovRad =
      ((SETTINGS.maxFieldOfView - SETTINGS.angularBorder) * Math.PI) / 180;
    const tanFov2 = Math.tan(fovRad / 2);

    const d = cameraController.distance;
    zUpperClip.value =
      (tanFov2 * tanFov2 * (d + 1) -
        Math.sqrt(-1 + tanFov2 * tanFov2 * (2 + 2 * d + d * d))) /
      (tanFov2 * tanFov2 - 1);

    // zLowerClip.value = 0;

    //When the lower sheet is not shown, we want to look at a point
    // that is depends on the polar angle of the camera
    // when the polar is 0, look at (0,0,1)
    // Then the polar is Pi/2 loot at a point halfway from the (0,0,1) to the (0,0,zUpperClip.value)
    // (Pi/2 - polar) and polar have the same zCoordLookAt value
    zCoordLookAt =
      (1 / Math.PI) *
        Math.min(
          cameraController.polarAngle,
          Math.PI - cameraController.polarAngle
        ) *
        (zUpperClip.value - 1) +
      1;
  }
  zLowerClip.value = -zUpperClip.value;

  const currentCameraPosition = new Vector3();
  cameraController.getPosition(currentCameraPosition);
  cameraController.setLookAt(
    currentCameraPosition.x,
    currentCameraPosition.y,
    currentCameraPosition.z,
    0,
    0,
    zCoordLookAt,
    true
  );
  // update the clipping planes for the ideal points' cones to make the ideal points' strip an almost constant width.
  // There are two incompatible issues with a perspective camera while trying to accomplish this:
  // One is that in a perspective camera, objects far/near are rendered smaller/larger and
  // Two is the desire for constant width.
  // The grid lines are actually always drawn in the plane parallel to the screen and are always a certain number of pixels wide no matter the dolly distance and zoom/fov level and the near/far placement of the grid lines. I do not think this is what we want for the geometric objects in the scene. We want to standardize the size of objects so that at *one* place on the hyperboloid they always appear to have the same size for any dolly or zoom levels. For the strip of the ideal points, the place for constant width is the intersection of the plane containing the z axis that intersects the screen plane in a horizontal line. The intersection is two line segments. Each of these are a line segment that should have constant width for any dolly/zoom level. Notice that this still means that the part of the ideal points' strip rendered near/far will be rendered larger/smaller than this constant width/size line segment.

  // Starting at the top of the clipping plane value at the left most edge of the view and move to the cone x^2 + y^2 = z^2 for the start
  const angleOffX = Math.atan2(
    currentCameraPosition.y,
    currentCameraPosition.x
  ); //project the camera position to the x/y plane and compute the angle
  const start = new Vector3(
    Math.cos(angleOffX + Math.PI / 2) * zUpperClip.value,
    Math.sin(angleOffX + Math.PI / 2) * zUpperClip.value,
    1 * zUpperClip.value
  );
  // then move off in a 45 degree angle in that plane from the start (or just origin)
  const dir = new Vector3(
    Math.cos(angleOffX + Math.PI / 2),
    Math.sin(angleOffX + Math.PI / 2),
    1
  );
  const len1 = constantAngleToLength(start, dir, SETTINGS.idealStripAngularGap);
  const len2 = constantAngleToLength(
    start,
    dir,
    SETTINGS.idealStripAngularGap + SETTINGS.idealStripAngularWidth
  );
  zUpperIdealStripClipMinus.value = start.z + len1 * dir.z;
  zUpperIdealStripClipPlus.value = start.z + len2 * dir.z;

  zLowerIdealStripClipMinus.value = -zUpperIdealStripClipPlus.value;
  zLowerIdealStripClipPlus.value = -zUpperIdealStripClipMinus.value;

  // update the unit
  // A line segment starting at (0,0,1) and in the plane parallel to the screen subtending this angle in any zoom/dolly level is considered a unit length. All geometric objects are measured relative to this unit.
  // The screen plane has normal vector N = CameraPosition - LookAt and the plane parallel to this
  // through (0,0,1) has equation N.(x,y,z-1) = 0.
  // To compute the direction (dir) needed to compute the unit length, we only
  // need a vector in any plane parallel to the screen so any non-zero vector perpendicular to N.
  const tempDir = new Vector3();
  if (
    currentCameraPosition.x * currentCameraPosition.x +
      currentCameraPosition.y * currentCameraPosition.y >
    0.0001
  ) {
    tempDir.x = -currentCameraPosition.y;
    tempDir.y = currentCameraPosition.x;
    tempDir.z = 0;
  } else {
    tempDir.x = -currentCameraPosition.z + zCoordLookAt;
    tempDir.y = 0;
    tempDir.z = currentCameraPosition.x;
  }
  unitLength.value = constantAngleToLength(
    new Vector3(0, 0, 1),
    tempDir,
    SETTINGS.angularUnit
  );

  arcLengthScale.value = unitLength.value / cameraController.distance; //as the dolly distance increases this scale gets smaller so that the spacing of the points of lines on the hyperboloid gets smaller
}

function doMouseDown(ev: MouseEvent) {
  currentTools.forEach(t => {
    t.mousePressed(ev, rayIntersectionPosition, []);
  });
}

function doMouseUp(ev: MouseEvent) {
  currentTools.forEach(t => {
    t.mouseReleased(ev, rayIntersectionPosition, hitList);
  });
}

function doMouseLeave(ev: MouseEvent) {
  currentTools.forEach(t => {
    // t.mouseLeave(ev);
  });
}

// Use the rayCaster to find the intersection point(s) of the
// mouse with the objects in the scene then
// call the mouseMoved function of the current tool
function threeMouseTrackerThenMouseMove(ev: MouseEvent) {
  // console.debug("Mouse move", ev);
  mouseCoordNormalized.value.x =
    2 * (elementX.value / renderer.domElement.clientWidth) - 1;
  mouseCoordNormalized.value.y =
    1 - 2 * (elementY.value / renderer.domElement.clientHeight);
  rayCaster.setFromCamera(mouseCoordNormalized.value, camera);

  // console.debug(
  //   "Scene children",
  //   scene.children.map(c => c.name)
  // );
  const hitByRay = rayCaster.intersectObjects(scene.children, true);
  intersectionList.value = hitByRay;
  // .filter(iSect => iSect.object.name.length === 0);
  // const regex = /Sheet|Ideal|Ultra/; // Sorting for surfaces and object intersections
  // Set the closest intersection flags
  // let closestIntersection: THREE.Intersection | null =
  //   intersectionList.value[0];
  const surfaceIntersections = hitByRay.filter(iSect =>
    iSect.object.name.match(/Sheet|Ideal|Ultra/)
  );
  surfaceIntersections.forEach(ix => {
    console.debug("Intersect surface", ix.object.name);
  });
  if (surfaceIntersections.length > 0) {
    // Compute the first intersection(s) information for display
    // If the mouse is over a surface, update the text displayed at the top of the screen
    // if (firstIntersection) {
    //   txtObject.text = firstIntersection.object.name;
    //   if (firstIntersection.object.name.match(regex))
    //     onSurface.value = firstIntersection.object.name
    //       .substring(0, 6)
    //       .toUpperCase() as ImportantSurface;
    //   else {
    //     onSurface.value = null;
    //   }
    rayIntersectionPosition.copy(surfaceIntersections[0].point);
    positionInCameraCF.value
      .copy(rayIntersectionPosition)
      .applyMatrix4(camera.matrixWorld);
    const hitNames = hitByRay.map(x => x.object.name);
    hitList = hitNames.map(objName => {
      const obj = hyperStore.getObjectById(objName);
      return obj ? obj : objName;
    });
  } else {
    rayIntersectionPosition.set(NaN, NaN, NaN);
    positionInCameraCF.value.set(0, 0, 0);
    hitList = [];
  }
  currentTools.forEach(t => {
    t.mouseMoved(ev, rayIntersectionPosition, hitList);
  });

  renderer.render(scene, camera);
}

//Compute the length in world coordinate of a line segment starting at start in the direction dir with a constant angular width angularWidthAtMaxFOV
function constantAngleToLength(
  start: Vector3,
  direction: Vector3,
  angularWidthAtMaxFOV: number
): number {
  // start (B) is the start of the line segment that we want to have apparent
  // constant length at all dolly distances and all zoom levels.
  //
  // direction is the direction of the line segment
  //
  // angularWidthAtMaxFOV is angular width
  // at maximum field of view, which is scaled to the current zoom so the
  // fraction of the total remains the same. That is, the angleWidth at the
  // current zoom (FOV) is

  const angularWidth =
    (camera.fov / SETTINGS.maxFieldOfView) * angularWidthAtMaxFOV;

  // Let A be the camera position
  // Let B be the start point of the line segment (Note: B is the same as start but easier to write)
  // Let C be B +|CB|*direction/direction.length(), the end point of the line segment
  // Thus |CB| is the length to return, the length the line segment should have to have
  // apparent constant length

  // The length of the side CB is found by the law of sines in triangle ABC
  //
  //                         |AB|/sin(ACB) = |CB|/sin(CAB)
  //
  // since ACB = 180 - ABC - CAB we know sin(ACB) = sin(ABC + CAB).  As we want CAB to be fixed (this
  // is the angular length of the line segment at a particular zoom level, angularWidth), we
  // rewrite this in terms of CAB, ABC, and |AB|
  //
  //  |CB| = |AB| sin(CAB)/sin(ABC + CAB)
  //
  const currentCameraPosition = new Vector3();
  cameraController.getPosition(currentCameraPosition);
  const AB = currentCameraPosition.sub(start);
  const angleABC = AB.angleTo(direction);

  return (
    (AB.length() * Math.sin(angularWidth)) / Math.sin(angularWidth + angleABC)
  );
}
</script>
<i18n lang="json" locale="en">
{
  "lowerSheet": "Lower Sheet",
  "idealStrip": "Ideal Points Strip",
  "ultraStrip": "Ultra Ideal Points Strip",
  "polarGrid": "Polar Grid"
}
</i18n>
<i18n lang="json" locale="id">
{
  "lowerSheet": "Lembaran Bawah",
  "idealStrip": "Pita Titik Ideal",
  "ultraStrip": "Pita Titik Ultra Ideal",
  "polarGrid": "Grid Polar"
}
</i18n>
