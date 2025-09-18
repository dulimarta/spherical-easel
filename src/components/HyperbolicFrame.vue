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
        {{ cameraDistance.toFixed(1) }}
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
      <template #default="{ isHovering, props }">
        <div
          v-bind="props"
          :style="{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
          }">
          <v-slider
            :style="{ marginLeft: '8px' }"
            v-if="
              isHovering &&
              (visibleLayers.includes('klein') ||
                visibleLayers.includes('poincare'))
            "
            v-model="kleinDiskElevation"
            :direction="
              visibleLayers.includes('klein') ? 'vertical' : 'horizontal'
            "
            density="compact"
            thumb-label
            :min-width="visibleLayers.includes('klein') ? undefined : '200'"
            min="1"
            :max="Math.round(Math.cosh(2))"></v-slider>
          <v-btn-toggle v-model="visibleLayers" multiple>
            <v-btn size="small" color="green-lighten-3" value="klein">
              Klein
            </v-btn>
            <v-btn size="small" color="yellow-lighten-2" value="poincare">
              Poincar&eacute;
            </v-btn>
            <v-btn icon color="green-darken-3" value="sphere">
              <v-icon>mdi-circle-outline</v-icon>
            </v-btn>
            <v-btn icon color="orange" value="lowerSheet">
              <!-- Use CSS trick to rotate the semicircle icon to look like lower sheet :-) -->
              <v-icon
                :style="{ transform: ' translateY(0.3em) rotate(90deg)' }">
                mdi-circle-half
              </v-icon>
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
import vertexShader from "../mesh/vertex.glsl";
import fragmentShader from "../mesh/fragment.glsl";

import {
  useMouseInElement,
  useEventListener,
  useMagicKeys
} from "@vueuse/core";
import { useHyperbolicStore } from "@/stores/hyperbolic";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { HyperbolicToolStrategy } from "@/eventHandlers/ToolStrategy";
import { PointHandler } from "@/eventHandlers_hyperbolic/PointHandler";
import { useSEStore } from "@/stores/se";
import { LineHandler } from "@/eventHandlers_hyperbolic/LineHandler";
import { SphericalLineHandler } from "@/eventHandlers_hyperbolic/SphericalLineHandler";
import { createPoint } from "@/mesh/MeshFactory";
import { onBeforeMount } from "vue";
import { TextHandler } from "@/eventHandlers_hyperbolic/TextHandler";
import { Text } from "troika-three-text";
import { HYPERBOLIC_LAYER } from "@/global-settings";
import { useIdle } from "@vueuse/core";
import { KleinLineHandler } from "@/eventHandlers_hyperbolic/KleinLineHandler";
import { PoincareLineHandler } from "@/eventHandlers_hyperbolic/PoincareLineHandler";
import { reactive } from "vue";
import { DispatcherEvent } from "camera-controls/dist/EventDispatcher";
import { CircleHandler } from "@/eventHandlers_hyperbolic/CircleHandler";
const hyperStore = useHyperbolicStore();
const seStore = useSEStore();
const { idle } = useIdle(250); // in milliseconds
const {
  surfaceIntersections,
  objectIntersections,
  cameraQuaternion,
  cameraInverseMatrix,
  kleinDiskElevation
} = storeToRefs(hyperStore);
const { actionMode } = storeToRefs(seStore);
const enableCameraControl = ref(false);
const hasUpdatedCameraControls = ref(false);
const visibleLayers: Ref<string[]> = ref([]);
const showKleinDisk = ref(false);
const showPoincareDisk = ref(true);
const showSphere = ref(false);
const showLowerSheet = ref(true);
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
const tmpMatrix4 = new Matrix4();
const positionInCameraCF = ref(new Vector3());
let renderer: WebGLRenderer;
let cameraController: CameraControls;
CameraControls.install({ THREE });
const ambientLight = new AmbientLight(0xffffff, 1.5);
const pointLight = new PointLight(0xffffff, 100);
pointLight.position.set(3, 3, 5);
scene.add(ambientLight);
scene.add(pointLight);
const unitSphere = new Mesh(
  new SphereGeometry(1),
  new MeshStandardMaterial({
    color: "green",
    side: DoubleSide,
    roughness: 0.3,
    transparent: true,
    opacity: 0.75
  })
);
let currentTools: Array<HyperbolicToolStrategy> = []; //new PointHandler();
let pointTool: PointHandler = new PointHandler(scene);
let lineTool: LineHandler | null = null;
let sphericalLineTool: SphericalLineHandler | null = null;
let kleinLineTool: KleinLineHandler | null = null;
let poincareTool: PoincareLineHandler | null = null;
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
// txtObject.position.set(0, 0, -0.3);

// To enable resizing the "disk" using scaling trick and constraining
// the scaling only to the "disk" (and not other objects attached on on)
// we represent the Klein "disk" as a THREE.Group() and make the circle
// as a child of this group
const kleinCircle = new Mesh(
  new THREE.CircleGeometry(1, 30),
  new MeshStandardMaterial({
    transparent: true,
    opacity: 0.5,
    color: "ForestGreen"
  })
);
kleinCircle.layers.set(HYPERBOLIC_LAYER.kleinDisk);
const kleinDisk = new Group();
// WARNING: setting layers on a THREE.Group has no effect on its children
// kleinDisk.layers.set(HYPERBOLIC_LAYER.kleinDisk);
kleinDisk.add(kleinCircle);
// Apply position adjustment to the Group
kleinDisk.position.z = kleinDiskElevation.value;
// Apply scaling only to the circle
kleinCircle.scale.set(kleinDiskElevation.value, kleinDiskElevation.value, 1);

// Poincare
const poincareDisk = new Group();
const poincareCircle = new Mesh(
  new THREE.CircleGeometry(1, 30),
  new MeshStandardMaterial({
    transparent: true,
    opacity: 0.5,
    color: "Yellow"
  })
);
// const poincareRadius = (Rk * Rk) / (Rk + 1);
poincareCircle.scale.set(kleinDiskElevation.value, kleinDiskElevation.value, 1);
poincareDisk.add(poincareCircle);
if (showPoincareDisk.value) scene.add(poincareDisk);
const rayIntersectionPosition = reactive(new Vector3());

watch(visibleLayers, (layers: Array<string>) => {
  showKleinDisk.value = layers.includes("klein");
  if (showKleinDisk.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.kleinDisk);
    scene.add(kleinDisk);
  } else {
    scene.remove(kleinDisk);
    camera.layers.disable(HYPERBOLIC_LAYER.kleinDisk);
  }
  showSphere.value = layers.includes("sphere");
  if (showSphere.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.unitSphere);
    // camera.layers.enable(HYPERBOLIC_LAYER.foregroundSpherical);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.unitSphere);
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.unitSphere);
    // camera.layers.disable(HYPERBOLIC_LAYER.foregroundSpherical);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.unitSphere);
  }
  showPoincareDisk.value = layers.includes("poincare");
  if (showPoincareDisk.value) {
    scene.add(poincareDisk);
  } else {
    scene.remove(poincareDisk);
    camera.layers.disable(HYPERBOLIC_LAYER.poincareDisk);
  }
  showLowerSheet.value = layers.includes("lowerSheet");
  if (showLowerSheet.value) {
    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheet);
    camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetPoints);
    camera.layers.enable(HYPERBOLIC_LAYER.lowerShettLines);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheet);
  } else {
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheet);
    camera.layers.disable(HYPERBOLIC_LAYER.lowerSheetPoints);
    camera.layers.disable(HYPERBOLIC_LAYER.lowerShettLines);
    rayCaster.layers.disable(HYPERBOLIC_LAYER.lowerSheet);
  }
  renderer.render(scene, camera);
});
watch(idle, idleValue => {
  // console.debug("Idle state", idleValue);
  // console.debug("Camera control", hasUpdatedCameraControls.value);
  if (idleValue && hasUpdatedCameraControls.value) {
    hyperStore.adjustTextPose(camera.quaternion);
    hasUpdatedCameraControls.value = false;
  }
});

watch(kleinDiskElevation, h => {
  kleinCircle.scale.set(h, h, 1);
  kleinDisk.position.z = h;
  // const poincareRadius = (h * h) / (h + 1);
  poincareCircle.scale.set(h, h, 1);
  // Poincare disk is 1 unit below Klein Disk
  // poincareDisk.position.z = h - 1;
});

function initialize() {
  camera = new PerspectiveCamera(
    45,
    props.availableWidth / props.availableHeight,
    0.1,
    500
  );
  // Add hyperbolic polar grid to the upper and lower sheets
  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-10, 0, 0),
    new THREE.Vector3(-5, 15, 0),
    new THREE.Vector3(20, 15, 0),
    new THREE.Vector3(10, 0, 0)
  );

  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

  // Create the final object to add to the scene
  const curveObject = new THREE.Line(geometry, material);
  scene.add(curveObject);

  const xyGrid = new GridHelper();
  // xyGrid.translateZ(1);
  xyGrid.rotateX(Math.PI / 2);
  scene.add(xyGrid);

  // Insert the grid BEFORE the arrow helper
  const arrowX = new ArrowHelper(new Vector3(1, 0, 0));
  arrowX.setColor(0xff0000);
  arrowX.setLength(2, 0.2, 0.2);
  const arrowY = new ArrowHelper(new Vector3(0, 1, 0));
  arrowY.setColor(0x00ff00);
  arrowY.setLength(2, 0.2, 0.2);
  const arrowZ = new ArrowHelper(new Vector3(0, 0, 1));
  arrowZ.setColor(0x0000ff);
  arrowZ.setLength(2, 0.2, 0.2);
  scene.add(arrowX);
  scene.add(arrowY);
  scene.add(arrowZ);
  const upperHyperboloidGeometry = new ParametricGeometry(
    hyperboloidPlus,
    120,
    300
  );

  // Create the ShaderMaterial with the GLSL code.
  const customShaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true // Crucial for enabling opacity
  });

  const hyperboloidMaterial: THREE.MeshStandardMaterialParameters = {
    color: "chocolate",
    side: DoubleSide,
    roughness: 0.2,
    transparent: true,
    opacity: 0.75
  };
  const upperHyperboloidMesh = new Mesh(
    upperHyperboloidGeometry,
    customShaderMaterial
    //new MeshStandardMaterial(hyperboloidMaterial)
  );

  const lowerHyperboloidGeometry = new ParametricGeometry(
    hyperboloidMinus,
    120,
    300
  );
  // lowerHyperboloidGeometry.computeBoundsTree();
  const lowerHyperboloidMesh = new Mesh(
    lowerHyperboloidGeometry,
    new MeshStandardMaterial(hyperboloidMaterial)
  );
  if (showLowerSheet.value) {
    visibleLayers.value.push("lowerSheet");
  }
  if (showPoincareDisk.value) {
    visibleLayers.value.push("poincare");
  }
  lowerHyperboloidMesh.name = "Lower Sheet";
  upperHyperboloidMesh.name = "Upper Sheet";
  lowerHyperboloidMesh.layers.set(HYPERBOLIC_LAYER.lowerSheet);
  upperHyperboloidMesh.layers.set(HYPERBOLIC_LAYER.upperSheet);
  rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheet);
  rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheet);
  scene.add(upperHyperboloidMesh);
  scene.add(lowerHyperboloidMesh);

  unitSphere.name = "Unit Sphere";
  unitSphere.layers.set(HYPERBOLIC_LAYER.unitSphere);
  scene.add(unitSphere);
  if (showSphere.value) {
    rayCaster.layers.enable(HYPERBOLIC_LAYER.unitSphere);
  }

  /* Show Klein disk? */
  scene.add(kleinDisk);
}

function doRender() {
  // console.debug("Enable camera control", enableCameraControl.value)
  if (enableCameraControl.value) {
    const deltaTime = clock.getDelta();
    const hasUpdated = cameraController.update(deltaTime);
    // console.debug("Enable camera control?", hasUpdatedControls);
    if (hasUpdated) {
      hasUpdatedCameraControls.value = true;
      // console.debug(
      //   `Camera control triggers update`,
      //   camera.quaternion,
      //   camera.matrixWorld.elements
      // );
      cameraQuaternion.value.copy(camera.quaternion);
      renderer.render(scene, camera);
    }
  }
}

watch(
  () => actionMode.value,
  mode => {
    console.debug("New action mode", mode);
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
        if (sphericalLineTool === null)
          sphericalLineTool = new SphericalLineHandler(scene, unitSphere, true);
        if (kleinLineTool === null)
          kleinLineTool = new KleinLineHandler(scene, kleinDisk, true);
        if (poincareTool === null)
          poincareTool = new PoincareLineHandler(scene, poincareDisk, true);

        // Extend the line to the end of the hyperboloid
        lineTool.setInfiniteMode(true);
        console.debug("Add PoincareTool");
        currentTools.push(lineTool);
        currentTools.push(sphericalLineTool);
        currentTools.push(kleinLineTool);
        currentTools.push(poincareTool);
        break;
      case "segment":
        if (lineTool === null) lineTool = new LineHandler(scene);
        if (sphericalLineTool === null)
          sphericalLineTool = new SphericalLineHandler(
            scene,
            unitSphere,
            false
          );
        if (kleinLineTool === null)
          kleinLineTool = new KleinLineHandler(scene, kleinDisk, false);
        if (poincareTool === null)
          poincareTool = new PoincareLineHandler(scene, poincareDisk, false);
        // Constrain the line to fit between the two end points
        lineTool.setInfiniteMode(false);
        currentTools.push(lineTool);
        currentTools.push(sphericalLineTool);
        currentTools.push(kleinLineTool);
        currentTools.push(poincareTool);
        break;
      // case "text":
      //   if (textTool === null) textTool = new TextHandler(scene);
      //   currentTool = textTool;
      //   break;
      case "circle":
        if (circleTool === null) circleTool = new CircleHandler(scene);
        currentTools.push(circleTool);
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
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.layers.enable(HYPERBOLIC_LAYER.upperSheet);
  camera.layers.enable(HYPERBOLIC_LAYER.upperSheetPoints);
  camera.layers.enable(HYPERBOLIC_LAYER.upperSheetLines);
  camera.layers.enable(HYPERBOLIC_LAYER.lowerSheet);
  camera.layers.enable(HYPERBOLIC_LAYER.lowerSheetPoints);
  camera.layers.enable(HYPERBOLIC_LAYER.lowerShettLines);
  if (showKleinDisk.value) camera.layers.enable(HYPERBOLIC_LAYER.kleinDisk);
  if (showPoincareDisk.value)
    camera.layers.enable(HYPERBOLIC_LAYER.poincareDisk);

  // txtObject.position.set(0, 0, -1);
  // txtObject.sync();
  // camera.add(txtObject);

  // In order to add objects as a child of the camera, the camera itself
  // must be inserted into the scene
  // scene.add(camera);
  // kleinDisk.position.set(0, 0, -20);
  // x.position.set(0, 0, 6);
  hyperStore.setScene(scene, camera);

  cameraQuaternion.value.copy(camera.quaternion);
  cameraController = new CameraControls(camera, webglCanvas.value!);
  cameraDistance.value = cameraController.distance;
  renderer = new WebGLRenderer({
    canvas: webglCanvas.value!,
    antialias: true
  });
  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.setClearColor(0xcccccc, 1);
  renderer.setAnimationLoop(doRender);
  renderer.render(scene, camera);
  // Computing the inverse must be done after the first render call
  // Otherwise, the camera matrix is not up-to-date

  // textRenderer.render(scene, camera);
  // visualContent.value!.appendChild(textRenderer.domElement);
  useEventListener("mousemove", threeMouseTracker);
  useEventListener(webglCanvas.value, "mousedown", doMouseDown);
  useEventListener(webglCanvas.value, "mouseup", doMouseUp);

  useEventListener(cameraController, "control", updateCameraDetails);
  useEventListener(cameraController, "update", updateCameraDetails);
});

function updateCameraDetails(ev: DispatcherEvent) {
  // console.debug("CC::" + ev.type);
  const cc = ev.target as CameraControls;
  cameraDistance.value = cc.distance;
  if (surfaceIntersections.value.length > 0) {
    positionInCameraCF.value
      .copy(surfaceIntersections.value[0].point)
      .applyMatrix4(camera.matrixWorld);
  }
}

onUpdated(() => {
  // console.debug(`onUpdated size ${props.availableWidth}x${props.availableHeight}`)
  camera.aspect = props.availableWidth / props.availableHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.render(scene, camera);
});

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

// Parametric function for the upper sheet of the hyperboloid in polar coordinates 0 <= u <= 1 and 0 <= v <= 1
function hyperboloidPlus(u: number, v: number, pt: Vector3) {
  const scale = 3;
  const myU = 2 * scale * u - scale; // map to -scale <= u <= scale
  const myV = 2 * scale * v - scale; // map to -scale <= v <= scale
  const x = Math.sinh(myU) * Math.cosh(myV);
  const y = Math.sinh(myV);
  const z = Math.cosh(myU) * Math.cosh(myV);

  // const theta = v * 2 * Math.PI;
  // const x = Math.sinh(2 * u) * Math.cos(theta);
  // const y = Math.sinh(2 * u) * Math.sin(theta);
  // const z = Math.cosh(2 * u);
  pt.set(x, y, z);
}

// Parametric function for the lower sheet of the hyperboloid in polar coordinates 0 <= u <= 1 and 0 <= v <= 1
function hyperboloidMinus(u: number, v: number, pt: Vector3) {
  const theta = v * 2 * Math.PI;
  const x = Math.sinh(2 * u) * Math.cos(theta);
  const y = Math.sinh(2 * u) * Math.sin(theta);
  const z = -Math.cosh(2 * u);
  pt.set(x, y, z);
}
</script>
