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
      <!--span class="mr-1">
        Canvas: ({{ elementX.toFixed(0) }}, {{ elementY.toFixed(0) }}) |
      </!--span-->
      <span v-if="onSurface">
        World:{{ rayIntersectionPosition.toFixed(2) }}
      </span>
      <span class="ml-1">
        In Camera {{ positionInCameraCF.toFixed(2) }}
        Dolly Distance:
        {{ cameraDistance.toFixed(1) }}
        Polar Angle:
        {{ ((cameraPolarAngle * 180) / Math.PI).toFixed(1) }}&deg; ZMaxClip:
        {{ zMaxClippingPlane.constant.toFixed(2) }}
        ZMinClip:
        {{ zMinClippingPlane.constant.toFixed(2) }}
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
            <v-btn icon color="blue" value="pointsAtInfinity">
              <v-icon>mdi-circle-expand</v-icon>
            </v-btn>
            <v-btn icon color="green" value="polarGrid">
              <v-icon>mdi-grid</v-icon>
            </v-btn>
          </v-btn-toggle>
        </div>
      </template>
    </v-hover>
  </div>
  <canvas
    ref="webglCanvas"
    id="webglCanvas"
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
  DoubleSide,
  // GridHelper,
  // Group,
  Intersection,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Object3D,
  Object3DEventMap,
  // PointLight,
  Raycaster,
  Scene,
  // SphereGeometry,
  Vector3,
  Vector2,
  WebGLRenderer
} from "three";
import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import CameraControls from "camera-controls";
import { DispatcherEvent } from "camera-controls/dist/EventDispatcher";
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
import {
  useIdle,
  useMouseInElement,
  useEventListener,
  useMagicKeys
} from "@vueuse/core";

// Store imports
import { useHyperbolicStore } from "@/stores/hyperbolic";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";

// Tool Handlers
import { HyperbolicToolStrategy } from "@/eventHandlers-hyperbolic/ToolStrategy";
import { PointHandler } from "@/eventHandlers-hyperbolic/PointHandler";
import { CircleHandler } from "@/eventHandlers-hyperbolic/CircleHandler";
import { LineHandler } from "@/eventHandlers-hyperbolic/LineHandler";
import { TextHandler } from "@/eventHandlers-hyperbolic/TextHandler";
import { Text } from "troika-three-text";

import SETTINGS, { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import {
  createPolarGridCircle,
  createPolarGridRadialLine,
  createPointsAtInfinity,
  createHyperboloidSheet
} from "@/plottables-hyperbolic/MeshFactory";
import { VisibleHELayersType } from "@/types";
import Settings from "@/views/Settings.vue";

const hyperStore = useHyperbolicStore();
const seStore = useSEStore();
const { idle } = useIdle(250); // in milliseconds
const { surfaceIntersections, objectIntersections, cameraQuaternion } =
  storeToRefs(hyperStore);
const { actionMode } = storeToRefs(seStore);
const enableCameraControl = ref(false);
const hasUpdatedCameraControls = ref(false);
const visibleLayers: Ref<VisibleHELayersType[]> = ref([]);
const showLowerSheet = ref(false);
const showPointsAtInfinity = ref(false);
const showPolarGrid = ref(true);
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

const webglCanvas = useTemplateRef<HTMLCanvasElement>("webglCanvas");
const { elementX, elementY, isOutside } = useMouseInElement(webglCanvas, {});
const { shift: shiftKey, control: controlKey } = useMagicKeys({
  passive: false
});
// const { pressed } = useMousePressed({
//   drag: true,
//   target: webglCanvas
// });
const scene = new Scene();
const clock = new Clock(); // used by camera control animation
const rayCaster = new Raycaster();
const mouseCoordNormalized: Ref<Vector2> = ref(new Vector2()); // used by RayCaster
let camera: PerspectiveCamera;
const cameraDistance = ref(0);
let oldCameraDistance = 0;
const cameraPolarAngle = ref(0);
const tmpMatrix4 = new Matrix4();
const positionInCameraCF = ref(new Vector3());
let renderer: WebGLRenderer;
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

let currentTools: Array<HyperbolicToolStrategy> = []; //new PointHandler();
let pointTool: PointHandler = new PointHandler(scene);
let lineTool: LineHandler | null = null;
let circleTool: CircleHandler | null = null;
let textTool: TextHandler | null = null;

const txtObject = new Text();
// txtObject.name = `La${HENodule.POINT_COUNT}`;
txtObject.text = `Hello`;
txtObject.anchorX = "center";
txtObject.anchorY = "bottom";
// txtObject.position.set(0, 0, 0);
txtObject.fontSize = 0.02;
txtObject.color = "yellow"; //0x000000;

const rayIntersectionPosition = reactive(new Vector3());

const zMaxClippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1); // negative normal for zMax so that the visible side is below the plane z = zMaxClippingPlane.constant
const zMinClippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 1); // positive normal for zMin so that the visible side is above the plane z = -zMinClippingPlane.constant

// Clipping planes that define the visible strip on the cones for the points at infinity
const upperPointsAtInfinityClippingPlanePlus = new THREE.Plane(
  new THREE.Vector3(0, 0, -1),
  1
);
const upperPointsAtInfinityClippingPlaneMinus = new THREE.Plane(
  new THREE.Vector3(0, 0, 1),
  1
);
const lowerPointsAtInfinityClippingPlanePlus = new THREE.Plane(
  new THREE.Vector3(0, 0, -1),
  1
);
const lowerPointsAtInfinityClippingPlaneMinus = new THREE.Plane(
  new THREE.Vector3(0, 0, 1),
  1
);

const upperPolarGridArray: Array<THREE.Mesh> = [];
const lowerPolarGridArray: Array<THREE.Mesh> = [];
// OLD -- points at infinity meshes are not all created in initialize() and then shown or hidden like the polar grid lines. As the user updates the view (zooms in or out) the points at infinity meshes are recreated to match the current view
let upperPointsAtInfinity: THREE.Mesh | undefined = undefined;
let lowerPointsAtInfinity: THREE.Mesh | undefined = undefined;
let maxZClippingHeight: number = 0; //set in initialize()

clock.autoStart = true;
// let customShaderMaterial: THREE.ShaderMaterial;

watch(visibleLayers, (layers: Array<VisibleHELayersType>) => {
  showLowerSheet.value = layers.includes("lowerSheet");
  showPointsAtInfinity.value = layers.includes("pointsAtInfinity");
  showPolarGrid.value = layers.includes("polarGrid");

  if (showPointsAtInfinity.value) {
    updatePointsAtInfinity();
    camera.layers.enable(HYPERBOLIC_LAYER.upperSheetInfPoints);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.upperSheetInfPoints);
    if (showLowerSheet.value) {
      camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
      rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
    } else {
      camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
      rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
    }
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
    camera.layers.disable(HYPERBOLIC_LAYER.upperSheetInfPoints);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.upperSheetInfPoints);
  }

  if (showPolarGrid.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.upperSheetGrid);
    if (showLowerSheet.value) {
      camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetGrid);
    } else {
      camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetGrid);
    }
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetGrid);
    camera.layers.disable(HYPERBOLIC_LAYER.upperSheetGrid);
  }

  if (showLowerSheet.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheet);
    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetPoints);
    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetLines);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheet);
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheet);
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetPoints);
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetLines);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheet);
  }
  renderer.render(scene, camera);
});

// Watch for idle after zooming so that we can update the label display
watch(idle, idleValue => {
  // console.debug("Idle state", idleValue);
  // console.debug("Camera control", hasUpdatedCameraControls.value);
  if (idleValue && hasUpdatedCameraControls.value) {
    hyperStore.adjustTextPose(camera.quaternion);
    hasUpdatedCameraControls.value = false;
  }
});

// When the lower sheet is shown (or not) update the zClipping planes and the camera lookAt
watch(showLowerSheet, show => {
  updateView();
  // console.log("Show lower sheet", show);
  actionMode.value = "rotate";
  renderer.render(scene, camera); // update the scene
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
        if (pointTool === null) pointTool = new PointHandler(scene);
        currentTools.push(pointTool);
        break;
      case "line":
        if (lineTool === null) lineTool = new LineHandler(scene);
        // Extend the line to the end of the hyperboloid
        lineTool.infiniteLineMode = true;
        // console.debug("Add PoincareTool");
        currentTools.push(lineTool);
        break;
      case "segment":
        if (lineTool === null) lineTool = new LineHandler(scene);

        lineTool.infiniteLineMode = false;
        currentTools.push(lineTool);
        break;
      case "text":
        if (textTool === null) textTool = new TextHandler(scene);
        currentTools.push(textTool);
        break;
      case "circle":
        if (circleTool === null) circleTool = new CircleHandler(scene);
        currentTools.push(circleTool);
        break;
      case "rotate":
        console.log("rotate tool selected");
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
  initialize();
});

onMounted(() => {
  console.log(`Mounted size ${props.availableWidth}x${props.availableHeight}`);
  camera.aspect = props.availableWidth / props.availableHeight;

  camera.position.set(8, 7, 6);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 1);
  camera.updateProjectionMatrix();
  camera.layers.enable(HYPERBOLIC_LAYER.upperSheet);
  camera.layers.enable(HYPERBOLIC_LAYER.upperSheetPoints);
  camera.layers.enable(HYPERBOLIC_LAYER.upperSheetLines);
  if (showLowerSheet.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheet);
    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetPoints);
    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetLines);
  }
  if (showPointsAtInfinity.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.upperSheetInfPoints);
    if (showLowerSheet.value) {
      camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
    }
  }

  hyperStore.setScene(scene, camera);

  cameraQuaternion.value.copy(camera.quaternion);
  cameraController = new CameraControls(camera, webglCanvas.value!);
  // Set the parameters of the camera controller
  cameraController.minDistance = SETTINGS.dollyDistanceMin;
  cameraController.maxDistance = SETTINGS.dollyDistanceMax;
  // cameraController.minPolarAngle = 0.1; // radians
  // cameraController.maxPolarAngle = Math.PI - 0.1; // radians
  cameraController.dollySpeed = 0.2;
  cameraController.polarRotateSpeed = 0.5;
  cameraController.azimuthRotateSpeed = 0.2;
  cameraController.smoothTime = 0.22;
  cameraController.draggingSmoothTime = 0.12;

  cameraDistance.value = cameraController.distance;
  oldCameraDistance = cameraController.distance;
  cameraPolarAngle.value = cameraController.polarAngle;
  renderer = new WebGLRenderer({
    canvas: webglCanvas.value!,
    antialias: true
  });

  // Enable local clipping (i.e. clipping on individual materials)
  renderer.localClippingEnabled = true;

  // Initial update of the view of sheets, grid and points at infinity
  updateView();
  updatePointsAtInfinity();

  // This would set the clipping planes for all objects - globally!
  // renderer.clippingPlanes = [zMinClippingPlane, zMaxClippingPlane];

  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.setClearColor(0xcccccc, 1);
  renderer.setAnimationLoop(doRender);
  renderer.render(scene, camera);

  // textRenderer.render(scene, camera);
  // visualContent.value!.appendChild(textRenderer.domElement);
  useEventListener("mousemove", threeMouseTrackerThenMouseMove);
  useEventListener(webglCanvas.value, "mousedown", doMouseDown);
  useEventListener(webglCanvas.value, "mouseup", doMouseUp);
  useEventListener(webglCanvas.value, "mouseleave", doMouseLeave);

  useEventListener(cameraController, "control", updateCameraDetails);
  useEventListener(cameraController, "update", updateCameraDetails);
});

onUpdated(() => {
  // console.debug(`onUpdated size ${props.availableWidth}x${props.availableHeight}`)
  camera.aspect = props.availableWidth / props.availableHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.render(scene, camera);
});

function initialize() {
  camera = new PerspectiveCamera(
    45,
    props.availableWidth / props.availableHeight,
    0.1,
    2 * SETTINGS.dollyDistanceMax
  );

  // const helper = new THREE.CameraHelper(camera);
  // scene.add(helper);

  // const xyGrid = new GridHelper();
  // // xyGrid.translateZ(1);
  // xyGrid.rotateX(Math.PI / 2);
  // scene.add(xyGrid);

  // Insert the grid BEFORE the arrow helper
  // const arrowX = new ArrowHelper(new Vector3(1, 0, 0));
  // arrowX.setColor(0xff0000);
  // arrowX.setLength(2, 0.2, 0.2);
  // const arrowY = new ArrowHelper(new Vector3(0, 1, 0));
  // arrowY.setColor(0x00ff00);
  // arrowY.setLength(2, 0.2, 0.2);
  // const arrowZ = new ArrowHelper(new Vector3(0, 0, 1));
  // arrowZ.setColor(0x0000ff);
  // arrowZ.setLength(2, 0.2, 0.2);
  // scene.add(arrowX);
  // scene.add(arrowY);
  // scene.add(arrowZ);

  //set the maximum value of the clipping plane so that the entire hyperboloid and grid lines are shown at max zoom out
  // This is the maximum value of the zMaxClippingPlane.constant that is set in the updateView function
  const fovRad = ((camera.fov - SETTINGS.angularBorder) * Math.PI) / 180;
  const tanFov2 = Math.tan(fovRad / 2);
  const d = SETTINGS.dollyDistanceMax;
  maxZClippingHeight = Math.max(
    Math.tan((((camera.fov - SETTINGS.angularBorder) / 2) * Math.PI) / 180) *
      d *
      Math.sqrt(1 / 2),
    (tanFov2 * tanFov2 * (d + 1) -
      Math.sqrt(-1 + tanFov2 * tanFov2 * (2 + 2 * d + d * d))) /
      (tanFov2 * tanFov2 - 1)
  );

  // create the hyperboloid sheets
  const upperHyperboloidMesh = createHyperboloidSheet({
    upper: true,
    clippingPlane: zMaxClippingPlane,
    maxZClippingHeight: maxZClippingHeight
  });
  const lowerHyperboloidMesh = createHyperboloidSheet({
    upper: false,
    clippingPlane: zMinClippingPlane,
    maxZClippingHeight: maxZClippingHeight
  });

  lowerHyperboloidMesh.name = "Lower Sheet";
  upperHyperboloidMesh.name = "Upper Sheet";
  lowerHyperboloidMesh.layers.set(HYPERBOLIC_LAYER.lowerSheet);
  upperHyperboloidMesh.layers.set(HYPERBOLIC_LAYER.upperSheet);

  scene.add(upperHyperboloidMesh);
  scene.add(lowerHyperboloidMesh);

  rayCaster.layers.enable(HYPERBOLIC_LAYER.upperSheet);
  if (showLowerSheet.value) {
    visibleLayers.value.push("lowerSheet"); // push lower sheet to visible layers, because it is visible at initialization otherwise the vue button handles the visibleLayers array
    rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheet);
  } else {
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheet);
  }

  // create the boundary cone
  // const upperCone = createBoundaryCone({
  //   upper: true,
  //   clippingPlane: zMaxClippingPlane,
  //   maxZClippingHeight: maxZClippingHeight
  // });
  // const lowerCone = createBoundaryCone({
  //   upper: false,
  //   clippingPlane: zMinClippingPlane,
  //   maxZClippingHeight: maxZClippingHeight
  // });

  // scene.add(upperCone);
  // scene.add(lowerCone);
  // upperCone.layers.set(HYPERBOLIC_LAYER.upperSheetInfPoints);
  // lowerCone.layers.set(HYPERBOLIC_LAYER.lowerSheetInfPoints);
  // upperCone.name = "Upper Cone";
  // lowerCone.name = "Lower Cone";

  // Create the cones from which the points at infinity
  // will be displayed by clipping between two planes
  upperPointsAtInfinity = createPointsAtInfinity({
    maxZClippingHeight: 1.5 * maxZClippingHeight,
    clippingPlanes: [
      upperPointsAtInfinityClippingPlanePlus,
      upperPointsAtInfinityClippingPlaneMinus
    ],
    upper: true
  });
  upperPointsAtInfinity.name = `Upper Points At Infinity`;
  upperPointsAtInfinity.layers.set(HYPERBOLIC_LAYER.upperSheetInfPoints);

  lowerPointsAtInfinity = createPointsAtInfinity({
    maxZClippingHeight: 1.5 * maxZClippingHeight,
    clippingPlanes: [
      lowerPointsAtInfinityClippingPlanePlus,
      lowerPointsAtInfinityClippingPlaneMinus
    ],
    upper: false
  });
  lowerPointsAtInfinity.name = `Lower Points At Infinity`;
  lowerPointsAtInfinity.layers.set(HYPERBOLIC_LAYER.lowerSheetInfPoints);

  // create the radial polar grid lines
  for (let upperLower = 0; upperLower < 2; upperLower++) {
    const numRadialLines = 12;
    for (
      let theta = 0;
      theta < 2 * Math.PI;
      theta += (2 * Math.PI) / numRadialLines
    ) {
      const radialLineMesh = createPolarGridRadialLine({
        radianAngle: theta,
        zMax: maxZClippingHeight,
        clippingPlane: upperLower === 0 ? zMaxClippingPlane : zMinClippingPlane,
        upper: upperLower === 0
      });

      radialLineMesh.layers.set(
        upperLower === 0
          ? HYPERBOLIC_LAYER.upperSheetGrid
          : HYPERBOLIC_LAYER.lowerSheetGrid
      );
      scene.add(radialLineMesh);
      if (upperLower === 0) {
        upperPolarGridArray.push(radialLineMesh);
      } else {
        lowerPolarGridArray.push(radialLineMesh);
      }
    }
  }

  // create the circular polar grid lines
  for (let upperLower = 0; upperLower < 2; upperLower++) {
    for (let r = 0.5; Math.cosh(r) < maxZClippingHeight; r += 0.5) {
      const radialLineMesh = createPolarGridCircle({
        intrinsicRadius: r,
        clippingPlane: upperLower === 0 ? zMaxClippingPlane : zMinClippingPlane,
        upper: upperLower === 0
      });

      radialLineMesh.layers.set(
        upperLower === 0
          ? HYPERBOLIC_LAYER.upperSheetGrid
          : HYPERBOLIC_LAYER.lowerSheetGrid
      );
      scene.add(radialLineMesh);
      if (upperLower === 0) {
        upperPolarGridArray.push(radialLineMesh);
      } else {
        lowerPolarGridArray.push(radialLineMesh);
      }
    }
  }

  if (showPolarGrid.value) {
    visibleLayers.value.push("polarGrid"); // push polar grid to visible layers, because it is visible at initialization otherwise the vue button handles the visibleLayers array
    camera.layers.enable(HYPERBOLIC_LAYER.upperSheetGrid);
    if (showLowerSheet.value) {
      camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetGrid);
    }
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.upperSheetGrid);
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetGrid);
  }

  if (showPointsAtInfinity.value) {
    updatePointsAtInfinity();
    //renderer.render(scene, camera); // update the scene
    visibleLayers.value.push("pointsAtInfinity"); // push points at infinity to visible layers, because it is visible at initialization otherwise the vue button handles the visibleLayers array
    camera.layers.enable(HYPERBOLIC_LAYER.upperSheetInfPoints);
    if (showLowerSheet.value) {
      camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
    }
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.upperSheetInfPoints);
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
  }

  //OLD set the raycaster to detect intersections with line material
  //rayCaster.params.Line.threshold = 100;

  // Set the default tool
  actionMode.value = "rotate";
}

function doRender() {
  if (enableCameraControl.value) {
    const deltaTime = clock.getDelta();
    const hasUpdated = cameraController.update(deltaTime);
    if (hasUpdated) {
      hasUpdatedCameraControls.value = true;
      // console.log(
      //   `Camera control triggers update -do Render`,
      //   camera.quaternion,
      //   camera.matrixWorld.elements
      // );
      cameraQuaternion.value.copy(camera.quaternion);
      renderer.render(scene, camera);
    }
  }
}

function updateCameraDetails(ev: DispatcherEvent) {
  // console.debug("CC::" + ev.type);
  const cc = ev.target as CameraControls;
  cameraDistance.value = cc.distance;
  cameraPolarAngle.value = cc.polarAngle;

  updateView();
  if (
    Math.abs(oldCameraDistance - cc.distance) >
    SETTINGS.minDollyDistanceChangeForGridUpdate
  ) {
    if (showPointsAtInfinity.value) {
      updatePointsAtInfinity();
    }
    oldCameraDistance = cc.distance;
  }

  if (surfaceIntersections.value.length > 0) {
    positionInCameraCF.value
      .copy(surfaceIntersections.value[0].point)
      .applyMatrix4(camera.matrixWorld);
  }
}

//update the z clipping planes
// Set the clipping planes (which only depend on the camera (dolly)distance
// and the field of view (fov) so that the maximally visible part of the
// hyperboloid is shown
// Adjust the shading of the sheets and the polar grid line thickness accordingly
function updateView() {
  // Default value, when both sheets are shown look at the origin.
  var zCoordLookAt = 0;
  if (showLowerSheet.value) {
    // Choose the clipping so that when viewing the hyperboloid sheets with the largest visual amount is shown
    // the image still fit on the field of view. The largest visual amount occurs with the
    // camera is looking directly (i.e. orthogonal) at the the plane(s) that make angle of 45 degrees
    // with the horizontal plane.
    zMaxClippingPlane.constant =
      Math.tan((((camera.fov - SETTINGS.angularBorder) / 2) * Math.PI) / 180) *
      cameraController.distance *
      Math.sqrt(1 / 2);
    zMinClippingPlane.constant = zMaxClippingPlane.constant;
  } else {
    // When only the upper sheet is shown, we set the zClippingPlane so that
    // the when the largest visual amount of the upper sheet is shown, it is
    // fits on the field of view. This occurs when the camera is looking straight down
    // and the display is essentially a circle
    const fovRad = ((camera.fov - SETTINGS.angularBorder) * Math.PI) / 180;
    const tanFov2 = Math.tan(fovRad / 2);

    const d = cameraController.distance;
    zMaxClippingPlane.constant =
      (tanFov2 * tanFov2 * (d + 1) -
        Math.sqrt(-1 + tanFov2 * tanFov2 * (2 + 2 * d + d * d))) /
      (tanFov2 * tanFov2 - 1);

    zMinClippingPlane.constant = 0;

    //When the lower sheet is not shown, we want to look at a point
    // that is depends on the polar angle of the camera
    // when the polar is 0, look at (0,0,1)
    // Then the polar is Pi/2 loot at a point halfway from the (0,0,1) to the (0,0,zClippingPlane.constant)
    // Pi/2 - polar and polar have the same zCoordLookAt value
    zCoordLookAt =
      (1 / Math.PI) *
        Math.min(
          cameraController.polarAngle,
          Math.PI - cameraController.polarAngle
        ) *
        (zMaxClippingPlane.constant - 1) +
      1;
  }

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
  // update the clipping planes for the points at infinity cones to make the points at infinity strip

  // Set up the variables for the calculation
  const dSin =
    cameraController.distance * Math.sin(cameraController.polarAngle);
  const dCos =
    cameraController.distance * Math.cos(cameraController.polarAngle);
  const la = zCoordLookAt;
  const cp = zMaxClippingPlane.constant;

  // Let A be the camera position, (dSin,0,dCos + la)
  // where dSin/dCos is the sine/cosine of the polar angle multiplied by the camera distance

  // Let B be the left most point on the boundary cone at the height
  // of the clipping plane: (0, -cp, cp )
  // Assuming the camera is at A above the x axis.

  // Let C be the point at 45 degree (away from the z axis) in the y-z plane above and to the left of point B. C is the end point of either the gap or the gap + width line segment.
  //   For example, C could be at (0, -cp - G/sqrt(2), cp + G/sqrt(2))

  // The angle ABC is determined by the dot product
  // BA.CB/(|BA||CB|) = cos(ABC)
  // Notice that G (or Gap + Width) cancels on the left hand side

  // Then the length of the side BC is found by the law of sines
  // |AB|/sin(ACB) = |CB|/sin(CAB), since we want ACB to be fixed (this is the angular length of the gap or gap + width) and ACB = 180 - ABC - CAB and so sin(ACB) = sin(ABC + CAB) Thus |CB| = |AB| sin(CAB)/sin(ABC + CAB)

  const lenAB = Math.sqrt(
    dSin * dSin + cp * cp + (dCos + la - cp) * (dCos + la - cp)
  );

  const angleABC = Math.acos(((1 / Math.sqrt(2)) * (dCos + la)) / lenAB);

  upperPointsAtInfinityClippingPlaneMinus.constant =
    -1 *
    (zMaxClippingPlane.constant +
      ((1 / Math.sqrt(2)) *
        (lenAB * Math.sin(SETTINGS.pointsAtInfinityAngularGap))) /
        Math.sin(SETTINGS.pointsAtInfinityAngularGap + angleABC));

  upperPointsAtInfinityClippingPlanePlus.constant =
    zMaxClippingPlane.constant +
    ((1 / Math.sqrt(2)) *
      (lenAB *
        Math.sin(
          SETTINGS.pointsAtInfinityAngularGap +
            SETTINGS.pointsAtInfinityAngularWidth
        ))) /
      Math.sin(
        SETTINGS.pointsAtInfinityAngularGap +
          SETTINGS.pointsAtInfinityAngularWidth +
          angleABC
      );

  lowerPointsAtInfinityClippingPlaneMinus.constant =
    upperPointsAtInfinityClippingPlanePlus.constant;
  lowerPointsAtInfinityClippingPlanePlus.constant =
    upperPointsAtInfinityClippingPlaneMinus.constant;

  // update the fade in the shader materials for the upper and lower sheets
  for (let upper = 0; upper < 2; upper++) {
    const mesh = scene.getObjectByName(
      upper === 0 ? "Upper Sheet" : "Lower Sheet"
    ) as THREE.Mesh;
    // console.log("Lower Sheet mesh", mesh);
    const hyperboloidMaterial = mesh.material as THREE.MeshStandardMaterial;
    // console.log("Hyperboloid material", hyperboloidMaterial);
    // console.log("shader", hyperboloidMaterial.userData.shader);
    if (hyperboloidMaterial.userData.shader !== undefined) {
      hyperboloidMaterial.userData.shader.uniforms.uEndFadeHeight.value =
        (upper === 0 ? 1 : -1) * zMaxClippingPlane.constant;
      hyperboloidMaterial.userData.shader.uniforms.uStartFadeHeight.value =
        (upper === 0 ? 1 : -1) *
        zMaxClippingPlane.constant *
        SETTINGS.fadePercentage;
    }
    if (!showLowerSheet.value) {
      upper = 2; // break the loop because the lower sheet is not shown
    }
  }

  // OLD CODE FOR POLAR GRID LINE THICKNESS UPDATE - before it was a 2D material
  // for (const mesh of upperPolarGridArray) {
  //   const gridMaterial = mesh.material as THREE.MeshStandardMaterial;
  //   if (gridMaterial.userData.shader !== undefined) {
  //     // console.log("shader", gridMaterial.userData.shader);
  //     // const resolution = gridMaterial.userData.shader.u_resolution.value;
  //     // console.log(`Resolution is: ${resolution.x} x ${resolution.y}`);

  //     // gridMaterial.userData.shader.uniforms.uLineWidth.value =
  //     //   polarGridArcThickness * cameraDistance.value;
  //     gridMaterial.userData.shader.uniforms.uEndFadeHeight.value =
  //       zMaxClippingPlane.constant;
  //     gridMaterial.userData.shader.uniforms.uStartFadeHeight.value =
  //       zMaxClippingPlane.constant * SETTINGS.fadePercentage;
  //   }
  // }
}

// function updatePointsAtInfinity() {
//   // Remove the old points at infinity from the scene
//   if (lowerPointsAtInfinity !== undefined) {
//     rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
//     scene.remove(lowerPointsAtInfinity);
//     lowerPointsAtInfinity.geometry.dispose();
//     (lowerPointsAtInfinity.material as THREE.ShaderMaterial).dispose();
//     lowerPointsAtInfinity = undefined;
//   }
//   if (upperPointsAtInfinity !== undefined) {
//     rayCaster.layers.disable(HYPERBOLIC_LAYER.upperSheetInfPoints);
//     scene.remove(upperPointsAtInfinity);
//     upperPointsAtInfinity.geometry.dispose();
//     (upperPointsAtInfinity.material as THREE.ShaderMaterial).dispose();
//     upperPointsAtInfinity = undefined;
//   }
//   // Create new points at infinity strip appropriate for the current camera distance
//   if (showPointsAtInfinity.value) {
//     upperPointsAtInfinity = createPointsAtInfinity({
//       zHeight:
//         zMaxClippingPlane.constant +
//         (SETTINGS.pointsAtInfinityWidth + 0.005) * cameraDistance.value
//     });
//     upperPointsAtInfinity.name = `Upper Points At Infinity`;

//     upperPointsAtInfinity.layers.set(HYPERBOLIC_LAYER.upperSheetInfPoints);
//     scene.add(upperPointsAtInfinity);
//     rayCaster.layers.enable(HYPERBOLIC_LAYER.upperSheetInfPoints);

//     if (showLowerSheet.value) {
//       lowerPointsAtInfinity = createPointsAtInfinity({
//         zHeight:
//           -zMaxClippingPlane.constant -
//           (SETTINGS.pointsAtInfinityWidth + 0.005) * cameraDistance.value
//       });
//       lowerPointsAtInfinity.name = `Lower Points At Infinity`;
//       lowerPointsAtInfinity.layers.set(HYPERBOLIC_LAYER.lowerSheetInfPoints);
//       scene.add(lowerPointsAtInfinity);
//       rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
//     }
//   }
// }

// Update the points at infinity by adjusting the pointsAtInfinity clipping planes
function updatePointsAtInfinity() {
  // Update the clipping planes for the points at infinity based on the current camera distance
  if (showPointsAtInfinity.value) {
    // Add the points at infinity to the scene if not already present
    rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
    scene.add(lowerPointsAtInfinity!);

    rayCaster.layers.enable(HYPERBOLIC_LAYER.upperSheetInfPoints);
    scene.add(upperPointsAtInfinity!);

    // update the clipping planes based on the current camera distance
  } else {
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
    scene.remove(lowerPointsAtInfinity!);

    rayCaster.layers.disable(HYPERBOLIC_LAYER.upperSheetInfPoints);
    scene.remove(upperPointsAtInfinity!);
  }
}

function doMouseDown(ev: MouseEvent) {
  // console.debug("MouseDown");

  // if (intersectionList.value.length > 0) {
  currentTools.forEach(t => {
    t.mousePressed(ev, mouseCoordNormalized.value, intersectionList.value);
  });
  // const { x, y, z } = labelLayerIntersections.value[0].point;

  // txtObject.sync();
  // camera.add(txtObject);
  // } else
  //   currentTools.forEach(t => {
  //     t.mousePressed(ev, mouseCoordNormalized.value, null, null);
  //   });
}

function doMouseUp(ev: MouseEvent) {
  currentTools.forEach(t => {
    t.mouseReleased(ev, mouseCoordNormalized.value, intersectionList.value);
  });
}

function doMouseLeave(ev: MouseEvent) {
  // console.debug("MouseLeave");
  currentTools.forEach(t => {
    t.mouseLeave(ev);
  });
}

// Use the rayCaster to find the intersection point(s) of the mouse with the objects in the scene then
// call the mouseMoved function of the current tool
function threeMouseTrackerThenMouseMove(ev: MouseEvent) {
  mouseCoordNormalized.value.x =
    2 * (elementX.value / renderer.domElement.clientWidth) - 1;
  mouseCoordNormalized.value.y =
    1 - 2 * (elementY.value / renderer.domElement.clientHeight);
  // console.debug(
  //   `Coordinate from event (${ev.offsetX},${ev.offsetY}) ` +
  //     `from VueUse (${elementX.value}, ${elementY.value})`
  // );
  rayCaster.setFromCamera(mouseCoordNormalized.value, camera);

  intersectionList.value = rayCaster
    .intersectObjects(scene.children, true)
    .filter((iSect, idx) => {
      // console.log(
      //   `Raycast intersect #${idx} ${iSect.object.name}`,
      //   iSect.normal?.toFixed(2)
      //   // iSect.object.name.match(regex)
      // );
      if (iSect.object.name.length === 0) {
        return false; // the intersection is not with a named object, ignore it
      } else {
        if (iSect.object.name.endsWith("Sheet")) {
          // only intersections with the visible parts of the sheet should be returned
          if (showLowerSheet.value) {
            return (
              iSect.point.z >= -zMinClippingPlane.constant &&
              iSect.point.z <= zMaxClippingPlane.constant
            );
          } else {
            return iSect.point.z <= zMaxClippingPlane.constant;
          }
        } else if (iSect.object.name.endsWith("Infinity")) {
          // only intersections with the visible points at infinity should be returned
          if (showLowerSheet.value) {
            return (
              (iSect.point.z <=
                upperPointsAtInfinityClippingPlanePlus.constant &&
                iSect.point.z >=
                  -upperPointsAtInfinityClippingPlaneMinus.constant) ||
              (iSect.point.z <=
                lowerPointsAtInfinityClippingPlanePlus.constant &&
                iSect.point.z >=
                  -lowerPointsAtInfinityClippingPlaneMinus.constant)
            );
          } else {
            return (
              iSect.point.z <=
                upperPointsAtInfinityClippingPlanePlus.constant &&
              iSect.point.z >= -upperPointsAtInfinityClippingPlaneMinus.constant
            );
          }
        } else {
          // Here we have an intersection with an object
          //  we must make sure it exists, is visible and is user created but since selection is done graphically, if is is not visible or doesn't exist or is not user created, it won't be intersected - unless we add some flexibility for selecting objects when you are near them
          return true; // intersection with other named objects are always returned
        }
      }
    });

  const regex = /(Sheet|Infinity)$/; // For filtering cursor intersection point(s)
  [surfaceIntersections.value, objectIntersections.value] =
    intersectionList.value.partition(x => {
      return x.object.name.match(regex) !== null;
    });

  let firstIntersection: THREE.Intersection | null =
    surfaceIntersections.value[0];
  // If the mouse is over a surface, update the text displayed at the top of the screen
  if (firstIntersection) {
    txtObject.text = firstIntersection.object.name;
    if (firstIntersection.object.name.endsWith("Sheet"))
      onSurface.value = firstIntersection.object.name
        .substring(0, 6)
        .toUpperCase() as ImportantSurface;
    else {
      onSurface.value = null;
    }
    rayIntersectionPosition.copy(firstIntersection.point);
    positionInCameraCF.value
      .copy(rayIntersectionPosition)
      .applyMatrix4(camera.matrixWorld);
  } else {
    onSurface.value = null;
    firstIntersection = null;
    // camera.remove(txtObject);
  }

  currentTools.forEach(t => {
    t.mouseMoved(ev, mouseCoordNormalized.value, intersectionList.value);
  });

  renderer.render(scene, camera);
}
</script>
