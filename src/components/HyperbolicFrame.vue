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
        In Camera {{ positionInCameraCF.toFixed(2) }} Dolly Distance:
        {{ cameraDistance.toFixed(1) }} Polar Angle:
        {{ ((cameraPolarAngle * 180) / Math.PI).toFixed(1) }}&deg;
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
import {
  AmbientLight,
  ArrowHelper,
  Clock,
  DoubleSide,
  GridHelper,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer
} from "three";
import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { onUpdated, onMounted, Ref, ref, useTemplateRef } from "vue";
import CameraControls from "camera-controls";
import {
  acceleratedRaycast
  // computeBoundsTree,
  // disposeBoundsTree,
  // ExtendedTriangle
} from "three-mesh-bvh";
// import type { UseMouseEventExtractor } from "@vueuse/core";
import vertexShader from "../plottables-hyperbolic/vertex.glsl";
import fragmentShader from "../plottables-hyperbolic/fragment.glsl";

import {
  useMouseInElement,
  useEventListener,
  useMagicKeys
} from "@vueuse/core";
import { useHyperbolicStore } from "@/stores/hyperbolic";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { HyperbolicToolStrategy } from "@/eventHandlers-hyperbolic/ToolStrategy";
import { PointHandler } from "@/eventHandlers-hyperbolic/PointHandler";
import { useSEStore } from "@/stores/se";
import { LineHandler } from "@/eventHandlers-hyperbolic/LineHandler";
// import { SphericalLineHandler } from "@/eventHandlers-hyperbolic/SphericalLineHandler";
import {
  createPolarGridCircle,
  createPolarGridRadialLine
} from "@/plottables-hyperbolic/MeshFactory";
import { onBeforeMount } from "vue";
import { TextHandler } from "@/eventHandlers-hyperbolic/TextHandler";
import { Text } from "troika-three-text";

import { useIdle } from "@vueuse/core";

import { reactive } from "vue";
import { DispatcherEvent } from "camera-controls/dist/EventDispatcher";
import { CircleHandler } from "@/eventHandlers-hyperbolic/CircleHandler";
import SETTINGS, { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import { VisibleHELayersType } from "@/types";

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
type ImportantSurface = "Upper" | "Lower" | "Sphere" | null;
let onSurface: Ref<ImportantSurface> = ref(null);
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
const mouseCoordNormalized: Ref<THREE.Vector2> = ref(new THREE.Vector2()); // used by RayCaster
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
directionalLight1.position.set(0, 1, 1);
directionalLight1.target.position.set(0, 0, 0);
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight2.position.set(1, 0, 1);
directionalLight2.target.position.set(0, 0, 0);
const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight3.position.set(1, 0, -1);
directionalLight3.target.position.set(0, 0, 0);
const directionalLight4 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight4.position.set(0, 1, -1);
directionalLight4.target.position.set(0, 0, 0);
scene.add(directionalLight1);
scene.add(directionalLight2);
scene.add(directionalLight3);
scene.add(directionalLight4);

let currentTools: Array<HyperbolicToolStrategy> = []; //new PointHandler();
let pointTool: PointHandler = new PointHandler(scene);
let lineTool: LineHandler | null = null;
// let sphericalLineTool: SphericalLineHandler | null = null;
// let kleinLineTool: KleinLineHandler | null = null;
// let poincareTool: PoincareLineHandler | null = null;
let circleTool: CircleHandler | null = null;
// let textTool: TextHandler | null = null;

const txtObject = new Text();
// txtObject.name = `La${HENodule.POINT_COUNT}`;
txtObject.text = `Hello`;
txtObject.anchorX = "center";
txtObject.anchorY = "bottom";
// txtObject.position.set(0, 0, 0);
txtObject.fontSize = 0.02;
txtObject.color = "yellow"; //0x000000;

const rayIntersectionPosition = reactive(new Vector3());

const zMaxClippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1);
const zMinClippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 1);

const upperPolarGridArray: Array<THREE.Mesh> = [];
const lowerPolarGridArray: Array<THREE.Mesh> = [];

let maxZClippingHeight: number = 0;
const polarGridArcThickness = 0.001;

watch(visibleLayers, (layers: Array<VisibleHELayersType>) => {
  showLowerSheet.value = layers.includes("lowerSheet");
  showPointsAtInfinity.value = layers.includes("pointsAtInfinity");
  showPolarGrid.value = layers.includes("polarGrid");

  if (showPointsAtInfinity.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.upperSheetInfPoints);
    if (showLowerSheet.value) {
      camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
    } else {
      camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
    }
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetInfPoints);
    camera.layers.disable(HYPERBOLIC_LAYER.upperSheetInfPoints);
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
  console.log("Show lower sheet", show);
  actionMode.value = "move";
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
        // if (sphericalLineTool === null)
        //   sphericalLineTool = new SphericalLineHandler(scene, unitSphere, true);
        // if (kleinLineTool === null)
        //   kleinLineTool = new KleinLineHandler(scene, kleinDisk, true);
        // if (poincareTool === null)
        //   poincareTool = new PoincareLineHandler(scene, poincareDisk, true);

        // Extend the line to the end of the hyperboloid
        lineTool.setInfiniteMode(true);
        // console.debug("Add PoincareTool");
        currentTools.push(lineTool);
        // currentTools.push(sphericalLineTool);
        // currentTools.push(kleinLineTool);
        // currentTools.push(poincareTool);
        break;
      case "segment":
        if (lineTool === null) lineTool = new LineHandler(scene);
        // if (sphericalLineTool === null)
        //   sphericalLineTool = new SphericalLineHandler(
        //     scene,
        //     unitSphere,
        //     false
        //   );
        // if (kleinLineTool === null)
        //   kleinLineTool = new KleinLineHandler(scene, kleinDisk, false);
        // if (poincareTool === null)
        //   poincareTool = new PoincareLineHandler(scene, poincareDisk, false);
        // Constrain the line to fit between the two end points
        lineTool.setInfiniteMode(false);
        currentTools.push(lineTool);
        // currentTools.push(sphericalLineTool);
        // currentTools.push(kleinLineTool);
        // currentTools.push(poincareTool);
        break;
      // case "text":
      //   if (textTool === null) textTool = new TextHandler(scene);
      //   currentTool = textTool;
      //   break;
      case "circle":
        if (circleTool === null) circleTool = new CircleHandler(scene);
        currentTools.push(circleTool);
        break;
      case "move":
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
  console.debug(
    `Mounted size ${props.availableWidth}x${props.availableHeight}`
  );
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

  hyperStore.setScene(scene, camera);

  cameraQuaternion.value.copy(camera.quaternion);
  cameraController = new CameraControls(camera, webglCanvas.value!);
  // Control the parameters of the camera controller
  cameraController.minDistance = 10;
  cameraController.maxDistance = 100;
  cameraController.dollySpeed = 0.2;
  cameraController.polarRotateSpeed = 0.2;
  cameraController.azimuthRotateSpeed = 0.2;

  cameraDistance.value = cameraController.distance;
  oldCameraDistance = cameraController.distance;
  cameraPolarAngle.value = cameraController.polarAngle;
  renderer = new WebGLRenderer({
    canvas: webglCanvas.value!,
    antialias: true
  });

  // Enable local clipping (i.e. clipping on individual materials)
  renderer.localClippingEnabled = true;

  updateView();

  // This would set the clipping planes for all objects
  // renderer.clippingPlanes = [zMinClippingPlane, zMaxClippingPlane];

  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.setClearColor(0xcccccc, 1);
  renderer.setAnimationLoop(doRender);
  renderer.render(scene, camera);

  // textRenderer.render(scene, camera);
  // visualContent.value!.appendChild(textRenderer.domElement);
  useEventListener("mousemove", threeMouseTracker);
  useEventListener(webglCanvas.value, "mousedown", doMouseDown);
  useEventListener(webglCanvas.value, "mouseup", doMouseUp);

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
    500
  );

  if (showPolarGrid.value) {
    visibleLayers.value.push("polarGrid");
    camera.layers.enable(HYPERBOLIC_LAYER.upperSheetGrid);
    if (showLowerSheet.value) {
      camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetGrid);
    }
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.upperSheetGrid);
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetGrid);
  }

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

  //set the maximum value of the clipping plane so that the entire hyperboloid and grid lines is shown at max zoom out
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

  // Create the ShaderMaterial with the GLSL code.
  const customShaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true // enabling opacity
  });

  const hyperboloidMaterial: THREE.MeshStandardMaterialParameters = {
    color: "chocolate",
    side: DoubleSide,
    roughness: 0.2,
    transparent: true,
    opacity: 0.75,
    clippingPlanes: [zMinClippingPlane, zMaxClippingPlane]
  };

  const upperHyperboloidGeometry = new ParametricGeometry(
    upperHyperboloid,
    120,
    300
  );

  const upperHyperboloidMesh = new Mesh(
    upperHyperboloidGeometry,
    //customShaderMaterial
    new MeshStandardMaterial(hyperboloidMaterial)
  );

  const lowerHyperboloidGeometry = new ParametricGeometry(
    lowerHyperboloid,
    120,
    300
  );
  // lowerHyperboloidGeometry.computeBoundsTree();
  const lowerHyperboloidMesh = new Mesh(
    lowerHyperboloidGeometry,
    new MeshStandardMaterial(hyperboloidMaterial)
  );

  lowerHyperboloidMesh.name = "Lower Sheet";
  upperHyperboloidMesh.name = "Upper Sheet";
  lowerHyperboloidMesh.layers.set(HYPERBOLIC_LAYER.lowerSheet);
  upperHyperboloidMesh.layers.set(HYPERBOLIC_LAYER.upperSheet);

  scene.add(upperHyperboloidMesh);
  scene.add(lowerHyperboloidMesh);

  rayCaster.layers.enable(HYPERBOLIC_LAYER.upperSheet);
  if (showLowerSheet.value) {
    visibleLayers.value.push("lowerSheet");
    rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheet);
  } else {
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheet);
  }

  // const pointsAtInfinityMaterial = new MeshStandardMaterial({
  //   color: "blue",
  //   side: DoubleSide,
  //   roughness: 0.2,
  //   transparent: true,
  //   opacity: 0.75
  // });

  // const upperPointsAtInfinityGeometry = new ParametricGeometry(
  //   upperHyperboloidStrip,
  //   120,
  //   300
  // );

  if (showPointsAtInfinity.value) {
    visibleLayers.value.push("pointsAtInfinity");
  }

  // Set the default tool
  actionMode.value = "move";
}

function doRender() {
  // console.debug("Enable camera control", enableCameraControl.value)
  if (enableCameraControl.value) {
    const deltaTime = clock.getDelta();
    const hasUpdated = cameraController.update(deltaTime);
    // console.debug("Enable camera control?", hasUpdatedControls);
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
    updateGrid(); // called after updateView so that clipping planes are set
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
    // Pi/2- polar and polar have the same zCoordLookAt value
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
}

function updateGrid() {
  // The zMin and zMax clipping planes are set so we can now add the polar grid at this zoom level
  // Remove the old grid from the scene
  upperPolarGridArray.forEach(c => {
    scene.remove(c);
    c.geometry.dispose();
    (c.material as THREE.ShaderMaterial).dispose();
  });
  upperPolarGridArray.splice(0);

  lowerPolarGridArray.forEach(c => {
    scene.remove(c);
    c.geometry.dispose();
    (c.material as THREE.ShaderMaterial).dispose();
  });
  lowerPolarGridArray.splice(0);

  // Create new grid circles and radial lines appropriate for the current camera distance (both number and thickness)
  // loop if need to create lower sheet grid
  for (let loop = 0; loop < (showLowerSheet.value ? 2 : 1); loop++) {
    for (let r = 0.1; r < Math.acosh(zMaxClippingPlane.constant); ) {
      // for (let r = 0.1; r < Math.acosh(maxZClippingHeight); ) {
      const circleMesh = createPolarGridCircle({
        zRadius: Math.sinh(r),
        zPosition: Math.cosh(r),
        numPoints: 100,
        thickness: polarGridArcThickness * cameraDistance.value,
        upper: loop === 0
      });
      circleMesh.layers.set(
        loop === 0
          ? HYPERBOLIC_LAYER.upperSheetGrid
          : HYPERBOLIC_LAYER.lowerSheetGrid
      );
      scene.add(circleMesh);
      if (loop === 0) {
        upperPolarGridArray.push(circleMesh);
      } else {
        lowerPolarGridArray.push(circleMesh);
      }
      if (r < 0.2) {
        r = 0.5;
      } else {
        r += 0.5;
      }
    }
    const numRadialLines = 12;
    for (
      let theta = 0;
      theta < 2 * Math.PI;
      theta += (2 * Math.PI) / numRadialLines
    ) {
      const radialLineMesh = createPolarGridRadialLine({
        radianAngle: theta,
        numPoints: 100,
        zMax: zMaxClippingPlane.constant,
        thickness: polarGridArcThickness * cameraDistance.value,
        clippingPlanes: [zMaxClippingPlane, zMinClippingPlane],
        upper: loop === 0
      });
      // (radialLineMesh.material as THREE.MeshStandardMaterial).clippingPlanes = [
      //   zMaxClippingPlane,
      //   zMinClippingPlane
      // ];

      radialLineMesh.layers.set(
        loop === 0
          ? HYPERBOLIC_LAYER.upperSheetGrid
          : HYPERBOLIC_LAYER.lowerSheetGrid
      );
      scene.add(radialLineMesh);
      if (loop === 0) {
        upperPolarGridArray.push(radialLineMesh);
      } else {
        lowerPolarGridArray.push(radialLineMesh);
      }
    }
  }
}
function doMouseDown(ev: MouseEvent) {
  // console.debug("MouseDown");

  if (surfaceIntersections.value.length > 0) {
    currentTools.forEach(t => {
      t.mousePressed(
        ev,
        mouseCoordNormalized.value,
        surfaceIntersections.value[0].point,
        surfaceIntersections.value[0].normal!
      );
    });
    // const { x, y, z } = labelLayerIntersections.value[0].point;

    // txtObject.sync();
    // camera.add(txtObject);
  } else
    currentTools.forEach(t => {
      t.mousePressed(ev, mouseCoordNormalized.value, null, null);
    });
}

function doMouseUp(ev: MouseEvent) {
  // console.debug("MouseUp");
  if (surfaceIntersections.value.length > 0)
    currentTools.forEach(t => {
      t.mouseReleased(
        ev,
        // mouseCoordNormalized.value,
        surfaceIntersections.value[0].point,
        surfaceIntersections.value[0].normal!
      );
    });
  else
    currentTools.forEach(t => {
      t.mouseReleased(ev, null, null);
    });
}

function threeMouseTracker(ev: MouseEvent) {
  mouseCoordNormalized.value.x =
    2 * (elementX.value / renderer.domElement.clientWidth) - 1;
  mouseCoordNormalized.value.y =
    1 - 2 * (elementY.value / renderer.domElement.clientHeight);
  // console.debug(
  //   `Coordinate from event (${ev.offsetX},${ev.offsetY}) ` +
  //     `from VueUse (${elementX.value}, ${elementY.value})`
  // );
  rayCaster.setFromCamera(mouseCoordNormalized.value, camera);
  const regex = /(Sheet|Sphere|LabelPlane)$/; // For filtering cursor intersection point(s)
  [surfaceIntersections.value, objectIntersections.value] = rayCaster
    .intersectObjects(scene.children, true)
    .filter((iSect, idx) => {
      // console.debug(
      //   `Raycast intersect #${idx} ${iSect.object.name}`,
      //   iSect.normal?.toFixed(2)
      //   // iSect.object.name.match(regex)
      // );
      return iSect.object.name.length > 0;
    })
    .partition(x => x.object.name.match(regex) !== null);
  // let position3d: Vector3 | null;
  // txtObject.position.copy(positionInCameraCF.value);
  // txtObject.sync();
  // console.debug(
  //   "Cursor pos in camera CF",
  //   labelLayerIntersections.value[0].point,
  //   positionInCameraCF.value.toFixed(3)
  // );

  let firstIntersection: THREE.Intersection | null;
  // console.debug(
  //   `Number of all intersections ${surfaceIntersections.value.length}`
  // );
  if (surfaceIntersections.value.length > 0) {
    // We are interested only in intersection with named objects
    // const namedIntersections = mouseIntersections.value.filter(
    //   z => z.object.name.length > 0 // we are interested only in named objects
    // );
    firstIntersection = surfaceIntersections.value[0];
    txtObject.text = firstIntersection.object.name;
    if (currentTools.length === 0) camera.add(txtObject);
    // position3d = firstIntersection.point;
    if (firstIntersection.object.name.endsWith("Sheet"))
      onSurface.value = firstIntersection.object.name
        .substring(0, 6)
        .toUpperCase() as ImportantSurface;
    else if (firstIntersection.object.name.endsWith("Sphere"))
      onSurface.value = "Sphere";
    else {
      onSurface.value = null;
      console.debug(
        `Intersection with ${firstIntersection.object.name}`,
        firstIntersection.normal
      );
    }
    // console.debug(
    //   `First intersection ${
    //     firstIntersection.object.name
    //   } ${firstIntersection.point.toFixed(2)}`
    // );
    rayIntersectionPosition.copy(firstIntersection.point);
    positionInCameraCF.value
      .copy(rayIntersectionPosition)
      .applyMatrix4(camera.matrixWorld);
    // console.debug("CC distance", cameraController.distance);
  } else {
    onSurface.value = null;
    firstIntersection = null;
    camera.remove(txtObject);
  }

  currentTools.forEach(t => {
    t.mouseMoved(
      ev,
      mouseCoordNormalized.value,
      firstIntersection?.point ?? null,
      firstIntersection?.normal ?? null
    );
  });
  // doMouseMove(!isOutside.value, onSurface.value, position3d);
  renderer.render(scene, camera);
}

// Parametric function for the upper sheet of the hyperboloid where 0 <= u <= 1 and 0 <= v <= 1, the point is returned in pt
function upperHyperboloid(u: number, v: number, pt: Vector3) {
  // This is a one-to-one mapping from R^2 to a sheet of the hyperboloid.
  // https://math.stackexchange.com/questions/697245/parametrization-of-the-hyperboloid-of-two-sheets
  // Maybe this is useful if we run into multi-value issues
  // The edges of this do not form a rectangle in 3D
  // const scale = 3;
  // const myU = 2 * scale * u - scale; // map to -scale <= u <= scale
  // const myV = 2 * scale * v - scale; // map to -scale <= v <= scale
  // const x = Math.sinh(myU) * Math.cosh(myV);
  // const y = Math.sinh(myV);
  // const z = Math.cosh(myU) * Math.cosh(myV);

  // This is the standard polar coordinate parameterization
  // https://en.wikipedia.org/wiki/Hyperboloid_of_two_sheets#Parametrization
  // where u is the radial coordinate and v is the angular coordinate
  u = u * (Math.acosh(maxZClippingHeight) + 1); // add one because the dolly max distance is sometimes exceeded when all the way zoomed out to allow for smooth zooming and motion. This way the clipping planes limit the display and very little extra (which is cut off by the clipping plane) is stored in the scene.
  const theta = v * 2 * Math.PI;
  const x = Math.sinh(u) * Math.cos(theta);
  const y = Math.sinh(u) * Math.sin(theta);
  const z = Math.cosh(u);
  pt.set(x, y, z);
}

// Parametric function for the lower sheet of the hyperboloid in polar coordinates 0 <= u <= 1 and 0 <= v <= 1
function lowerHyperboloid(u: number, v: number, pt: Vector3) {
  u = u * (Math.acosh(maxZClippingHeight) + 1);
  const theta = v * 2 * Math.PI;
  const x = Math.sinh(u) * Math.cos(theta);
  const y = Math.sinh(u) * Math.sin(theta);
  const z = -Math.cosh(u);
  pt.set(x, y, z);
}

// function upperHyperboloidStrip(u: number, v: number, pt: Vector3) {
//   // This is the standard polar coordinate parameterization
//   // https://en.wikipedia.org/wiki/Hyperboloid_of_two_sheets#Parametrization
//   // where u is the radial coordinate and v is the angular coordinate
//   u = u * SETTINGS.Z_MAX; // map to 0 <= u <= SETTINGS.Z_MAX
//   const theta = v * 2 * Math.PI;
//   const x = Math.sinh(u) * Math.cos(theta);
//   const y = Math.sinh(u) * Math.sin(theta);
//   const z = Math.cosh(u);
//   pt.set(x, y, z);
// }
</script>
