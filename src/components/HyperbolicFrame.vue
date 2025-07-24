<template>
  <span
    :style="{
      position: 'fixed',
      backgroundColor: '#FFF7'
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
    <span
      class="mr-2"
      :style="{
        color: isOutside ? 'red' : 'black'
      }">
      Mouse @
      <span>2D:({{ elementX.toFixed(0) }}, {{ elementY.toFixed(0) }})</span>
      <span class="mr-1">
        {{ mouseCoordNormalized.toFixed(3) }}
      </span>
      <span v-if="onSurface">
        World:{{ rayIntersectionPoint.position.toFixed(2) }}
      </span>
      <span class="ml-1">In Camera {{ positionInCameraCF.toFixed(2) }}</span>
    </span>
  </span>
  <canvas
    ref="webglCanvas"
    id="webglCanvas"
    :width="props.availableWidth"
    :height="props.availableHeight" />
</template>

<script setup lang="ts">
import {
  AmbientLight,
  ArrowHelper,
  Clock,
  DoubleSide,
  GridHelper,
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
import { createPoint } from "@/mesh/MeshFactory";
import { onBeforeMount } from "vue";
import { TextHandler } from "@/eventHandlers_hyperbolic/TextHandler";
import { Text } from "troika-three-text";
import { LAYER } from "@/global-settings";
import { useIdle } from "@vueuse/core";
const hyperStore = useHyperbolicStore();
const seStore = useSEStore();
const { idle, reset: idleReset } = useIdle(1 * 1000); // 3 seconds
const {
  surfaceIntersections,
  objectIntersections,
  labelLayerIntersections,
  cameraQuaternion,
  cameraInverseMatrix
} = storeToRefs(hyperStore);
const { actionMode } = storeToRefs(seStore);
const enableCameraControl = ref(false);
const hasUpdatedCameraControls = ref(false);

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
const positionInCameraCF = ref(new Vector3());
let renderer: WebGLRenderer;
let cameraController: CameraControls;
CameraControls.install({ THREE });
const ambientLight = new AmbientLight(0xffffff, 1.5);
const pointLight = new PointLight(0xffffff, 100);
pointLight.position.set(3, 3, 5);
scene.add(ambientLight);
scene.add(pointLight);

const rayIntersectionPoint = createPoint(0.05, "white");

watch(idle, idleValue => {
  console.debug("Idle state", idleValue);
  console.debug("Camera control", hasUpdatedCameraControls.value);
  if (idleValue && hasUpdatedCameraControls.value) {
    console.debug("Reorient text labels");

    hyperStore.reorientText(camera.quaternion);
    hasUpdatedCameraControls.value = false;
  }
});
function initialize() {
  // cameraQuaternion.value.copy(camera.q);
  const xyGrid = new GridHelper();
  xyGrid.translateZ(1);
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
  const upperHyperboloidMesh = new Mesh(
    upperHyperboloidGeometry,
    new MeshStandardMaterial({
      color: "chocolate",
      side: DoubleSide,
      roughness: 0.2
    })
  );

  const lowerHyperboloidGeometry = new ParametricGeometry(
    hyperboloidMinus,
    120,
    300
  );
  // lowerHyperboloidGeometry.computeBoundsTree();
  const lowerHyperboloidMesh = new Mesh(
    lowerHyperboloidGeometry,
    new MeshStandardMaterial({
      color: "chocolate",
      side: DoubleSide,
      roughness: 0.2
    })
  );
  lowerHyperboloidMesh.name = "Lower Sheet";
  upperHyperboloidMesh.name = "Upper Sheet";
  lowerHyperboloidMesh.layers.set(LAYER.midground);
  upperHyperboloidMesh.layers.set(LAYER.midground);
  scene.add(upperHyperboloidMesh);
  scene.add(lowerHyperboloidMesh);

  const centerSphere = new Mesh(
    new SphereGeometry(1),
    new MeshStandardMaterial({
      color: "green",
      side: DoubleSide,
      roughness: 0.3
    })
  );
  centerSphere.name = "Center Sphere";
  scene.add(centerSphere);

  /* Show Klein disk? */
  const kleinDisk = new Mesh(
    new THREE.CircleGeometry(1, 30),
    new MeshStandardMaterial({
      transparent: true,
      opacity: 0.7,
      color: "darkorange"
    })
  );
  kleinDisk.position.z = 1;
  scene.add(kleinDisk);
}

let currentTool: HyperbolicToolStrategy | null = null; //new PointHandler();
let pointTool: PointHandler = new PointHandler(scene);
let lineTool: LineHandler | null = null;
// let textTool: TextHandler | null = null;
const labelPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(3, 3),
  new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0
  })
);
labelPlane.name = "LabelPlane";

const txtObject = new Text();
// txtObject.name = `La${HENodule.POINT_COUNT}`;
txtObject.text = `Hello`;
txtObject.anchorX = "center";
txtObject.anchorY = "bottom";
// txtObject.position.set(0, 0, 0);
txtObject.fontSize = 0.02;
txtObject.color = "yellow"; //0x000000;
// txtObject.position.set(0, 0, -0.3);

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
    currentTool?.deactivate();
    enableCameraControl.value = false;
    switch (mode) {
      case "point":
        if (pointTool === null) pointTool = new PointHandler(scene);
        currentTool = pointTool;
        break;
      case "line":
        if (lineTool === null) lineTool = new LineHandler(scene);
        // Extend the line to the end of the hyperboloid
        lineTool.setInfiniteMode(true);
        currentTool = lineTool;
        break;
      case "segment":
        if (lineTool === null) lineTool = new LineHandler(scene);
        // Constrain the line to fit between the two end points
        lineTool.setInfiniteMode(false);
        currentTool = lineTool;
        break;
      // case "text":
      //   if (textTool === null) textTool = new TextHandler(scene);
      //   currentTool = textTool;
      //   break;
      default:
        enableCameraControl.value = true;
        currentTool = null;
    }
    currentTool?.activate();
  }
);

onBeforeMount(() => {
  initialize();
});

onMounted(() => {
  console.debug(
    `Mounted size ${props.availableWidth}x${props.availableHeight}`
  );
  camera = new PerspectiveCamera(
    45,
    props.availableWidth / props.availableHeight,
    0.1,
    500
  );
  camera.position.set(8, 7, 6);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);
  // By default, only layer 0 is enabled
  // camera.layers.enable(LAYER.foreground);
  // camera.layers.enable(LAYER.midground);
  camera.layers.enableAll();
  // txtObject.position.set(0, 0, -1);
  // txtObject.sync();
  // camera.add(txtObject);

  // In order to add objects as a child of the camera, the camera itself
  // must be inserted into the scene
  scene.add(camera);
  camera.add(labelPlane);
  labelPlane.position.set(0, 0, -1); // 1 unit IN FRONT of camera
  // kleinDisk.position.set(0, 0, -20);
  // x.position.set(0, 0, 6);
  hyperStore.setScene(scene, camera);

  cameraQuaternion.value.copy(camera.quaternion);
  cameraController = new CameraControls(camera, webglCanvas.value!);
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
  currentTool = new PointHandler(scene);
});

onUpdated(() => {
  // console.debug(`onUpdated size ${props.availableWidth}x${props.availableHeight}`)
  camera.aspect = props.availableWidth / props.availableHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.render(scene, camera);
});

function doMouseDown(ev: MouseEvent) {
  // console.debug("MouseDown");
  positionInCameraCF.value
    .copy(labelLayerIntersections.value[0].point)
    .applyMatrix4(cameraInverseMatrix.value);
  // console.debug(
  //   `${labelLayerIntersections.value[0].point.toFixed(
  //     2
  //   )} => ${positionInCameraCF.value.toFixed(2)}`
  // );

  if (surfaceIntersections.value.length > 0) {
    currentTool?.mousePressed(
      ev,
      mouseCoordNormalized.value,
      surfaceIntersections.value[0].point,
      surfaceIntersections.value[0].normal!
    );
    // const { x, y, z } = labelLayerIntersections.value[0].point;

    // txtObject.sync();
    // camera.add(txtObject);
  } else currentTool?.mousePressed(ev, mouseCoordNormalized.value, null, null);
}

function doMouseUp(ev: MouseEvent) {
  // console.debug("MouseUp");
  if (surfaceIntersections.value.length > 0)
    currentTool?.mouseReleased(
      ev,
      // mouseCoordNormalized.value,
      surfaceIntersections.value[0].point,
      surfaceIntersections.value[0].normal!
    );
  else currentTool?.mouseReleased(ev, null, null);
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
  rayCaster.layers.enableAll();
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
  [labelLayerIntersections.value, surfaceIntersections.value] =
    surfaceIntersections.value.partition(x => x.object.name.endsWith("Plane"));
  // let position3d: Vector3 | null;
  positionInCameraCF.value
    .copy(labelLayerIntersections.value[0].point)
    .applyMatrix4(cameraInverseMatrix.value);
  txtObject.position.copy(positionInCameraCF.value);
  txtObject.sync();
  // console.debug(
  //   "Cursor pos in camera CF",
  //   labelLayerIntersections.value[0].point,
  //   positionInCameraCF.value.toFixed(3)
  // );

  let firstIntersection: THREE.Intersection | null;
  if (surfaceIntersections.value.length > 0) {
    // console.debug(`Number of all intersections ${surfaceIntersections.value.length}`)
    // We are interested only in intersection with named objects
    // const namedIntersections = mouseIntersections.value.filter(
    //   z => z.object.name.length > 0 // we are interested only in named objects
    // );
    firstIntersection = surfaceIntersections.value[0];
    txtObject.text = firstIntersection.object.name;
    if (currentTool === null) camera.add(txtObject);
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
    // console.debug(`First intersection ${firstIntersection.object.name}`);
    rayIntersectionPoint.position.copy(firstIntersection.point);
  } else {
    onSurface.value = null;
    firstIntersection = null;
    scene.remove(rayIntersectionPoint);
    camera.remove(txtObject);
  }

  currentTool?.mouseMoved(
    ev,
    mouseCoordNormalized.value,
    firstIntersection?.point ?? null,
    firstIntersection?.normal ?? null
  );
  // doMouseMove(!isOutside.value, onSurface.value, position3d);
}

function hyperboloidPlus(u: number, v: number, pt: Vector3) {
  const theta = v * 2 * Math.PI;
  const x = Math.sinh(2 * u) * Math.cos(theta);
  const y = Math.sinh(2 * u) * Math.sin(theta);
  const z = Math.cosh(2 * u);
  pt.set(x, y, z);
}

function hyperboloidMinus(u: number, v: number, pt: Vector3) {
  const theta = v * 2 * Math.PI;
  const x = Math.sinh(2 * u) * Math.cos(theta);
  const y = Math.sinh(2 * u) * Math.sin(theta);
  const z = -Math.cosh(2 * u);
  pt.set(x, y, z);
}
</script>
