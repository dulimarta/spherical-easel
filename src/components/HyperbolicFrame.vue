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
      <span class="mx-2">
        {{ mouseCoordNormalized.toFixed(3) }}
      </span>
      <span v-if="onSurface">
        3D:{{ rayIntersectionPoint.position.toFixed(2) }}
      </span>
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
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  TubeGeometry,
  CylinderGeometry,
  Line3,
  Group
} from "three";
import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { LineCurve3 } from "three/src/extras/curves/LineCurve3";
import { onUpdated, onMounted, Ref, ref, useTemplateRef } from "vue";
import CameraControls from "camera-controls";
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
  ExtendedTriangle
} from "three-mesh-bvh";
import type { UseMouseEventExtractor } from "@vueuse/core";

import {
  useMouseInElement,
  useEventListener,
  useMagicKeys
} from "@vueuse/core";
import { degToRad } from "three/src/math/MathUtils";
import { useHyperbolicStore } from "@/stores/hyperbolic";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { HyperbolicToolStrategy } from "@/eventHandlers/ToolStrategy";
import { PointHandler } from "@/eventHandlers_hyperbolic/PointHandler";
import { useSEStore } from "@/stores/se";
import { LineHandler } from "@/eventHandlers_hyperbolic/LineHandler";
import { createPoint } from "@/mesh/MeshFactory";
const hyperStore = useHyperbolicStore();
const seStore = useSEStore();
const { mouseIntersections } = storeToRefs(hyperStore);
const { actionMode } = storeToRefs(seStore);
const enableCameraControl = ref(false);

type ImportantSurface = "Upper" | "Lower" | "Sphere" | null;
let onSurface: Ref<ImportantSurface> = ref(null);
// Inject new BVH functions into current THREE-JS Mesh/BufferGeometry definitions
THREE.Mesh.prototype.raycast = acceleratedRaycast;
// THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
// THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
const U_MULTIPLIER = Math.acosh(3);

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
rayCaster.firstHitOnly = true;
const mouseCoordNormalized: Ref<THREE.Vector2> = ref(new THREE.Vector2()); // used by RayCaster
let camera: PerspectiveCamera;
let renderer: WebGLRenderer;
let cameraController: CameraControls;
CameraControls.install({ THREE });
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
// upperHyperboloidGeometry.computeBoundsTree({ maxLeafTris: 2 });
const upperHyperboloidMesh = new Mesh(
  upperHyperboloidGeometry,
  new MeshStandardMaterial({
    color: "chocolate",
    side: DoubleSide,
    roughness: 0.2
  })
);
// const upperBVHHelper = new MeshBVHHelper(upperHyperboloidMesh);

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

const rayIntersectionPoint = createPoint(0.05, "white");

const secondaryIntersections: Array<Mesh> = [];
for (let k = 0; k < 3; k++) {
  const p = createPoint(0.03, "gray");
  secondaryIntersections.push(p);
}

const auxLineDirection = new Vector3();
const auxLine = new Mesh(
  new CylinderGeometry(0.01, 0.01, 100),
  // auxLineTube,
  new MeshStandardMaterial({ color: 0xaaaaaa })
);
// auxLine.rotateX(Math.PI/2)
scene.add(auxLine);
lowerHyperboloidMesh.name = "Lower Sheet";
upperHyperboloidMesh.name = "Upper Sheet";
scene.add(upperHyperboloidMesh);
// scene.add(upperBVHHelper);
scene.add(lowerHyperboloidMesh);
// scene.add(lowerBVHHelper);
const centerSphere = new Mesh(
  new SphereGeometry(1),
  new MeshStandardMaterial({ color: "green", side: DoubleSide, roughness: 0.3 })
);
centerSphere.name = "Center Sphere";
scene.add(centerSphere);

const upperPlaneGeometry = new THREE.PlaneGeometry(6, 10, 20, 20);
// upperPlaneGeometry.computeBoundsTree({
//   verbose: true,
//   maxLeafTris: 0,
//   maxDepth: 10
// });

const ambientLight = new AmbientLight(0xffffff, 1.5);
const pointLight = new PointLight(0xffffff, 100);
pointLight.position.set(3, 3, 5);
scene.add(ambientLight);
scene.add(pointLight);
let currentTool: HyperbolicToolStrategy | null = null; //new PointHandler();
let pointTool: PointHandler = new PointHandler(scene);
let lineTool: LineHandler | null = null;
function doRender() {
  // console.debug("Enable camera control", enableCameraControl.value)
  if (enableCameraControl.value) {
    const deltaTime = clock.getDelta();
    const hasUpdatedControls = cameraController.update(deltaTime);
    // console.debug("Enable camera control?", hasUpdatedControls);
    if (hasUpdatedControls) {
      console.debug(`Camera control triggers update`);
      renderer.render(scene, camera);
    }
  }
}

watch(
  () => actionMode.value,
  mode => {
    console.debug("New action mode", mode);
    currentTool?.deactivate();
    switch (mode) {
      case "point":
        if (pointTool === null) {
          pointTool = new PointHandler(scene);
        }
        currentTool = pointTool;
        enableCameraControl.value = false;
        break;
      case "line":
        if (lineTool === null) lineTool = new LineHandler(scene);
        currentTool = lineTool;
        enableCameraControl.value = false;
        break;
      default:
        enableCameraControl.value = true;
        currentTool = null;
    }
    currentTool?.activate();
  }
);

onMounted(() => {
  hyperStore.setScene(scene);
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
  cameraController = new CameraControls(camera, webglCanvas.value!);
  renderer = new WebGLRenderer({
    canvas: webglCanvas.value!,
    antialias: true
  });
  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.setClearColor(0xcccccc, 1);
  renderer.setAnimationLoop(doRender);
  renderer.render(scene, camera);
  useEventListener("mousemove", threeMouseTracker);
  useEventListener(webglCanvas, "mousedown", doMouseDown);
  useEventListener(webglCanvas, "mouseup", doMouseUp);
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
  if (mouseIntersections.value.length > 0)
    currentTool?.mousePressed(
      ev,
      mouseCoordNormalized.value,
      mouseIntersections.value[0].point,
      mouseIntersections.value[0].normal!
    );
  else currentTool?.mousePressed(ev, mouseCoordNormalized.value, null, null);
}

function doMouseUp(ev: MouseEvent) {
  if (mouseIntersections.value.length > 0)
    currentTool?.mouseReleased(
      ev,
      // mouseCoordNormalized.value,
      mouseIntersections.value[0].point,
      mouseIntersections.value[0].normal!
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
  const regex = /(Sheet|Sphere)$/; // For filtering cursor intersection point(s)
  mouseIntersections.value = rayCaster
    .intersectObjects(scene.children, true)
    .filter(iSect => {
      // console.debug(
      //   "Raycast intersect",
      //   iSect.object.name,
      //   iSect.object.name.match(regex)
      // );
      return iSect.object.name.match(regex);
    });
  // let position3d: Vector3 | null;
  let firstIntersection: THREE.Intersection | null;
  if (mouseIntersections.value.length > 0) {
    // console.debug(`Number of all intersections ${allIntersections.length}`)
    // We are interested only in intersection with named objects
    // const namedIntersections = mouseIntersections.value.filter(
    //   z => z.object.name.length > 0 // we are interested only in named objects
    // );
    firstIntersection = mouseIntersections.value[0];
    // position3d = firstIntersection.point;
    if (firstIntersection.object.name.endsWith("Sheet"))
      onSurface.value = firstIntersection.object.name
        .substring(0, 6)
        .toUpperCase() as ImportantSurface;
    else if (firstIntersection.object.name.endsWith("Sphere"))
      onSurface.value = "Sphere";
    else onSurface.value = null;
    // console.debug(`First intersection ${firstIntersection.object.name}`);
    rayIntersectionPoint.position.copy(firstIntersection.point);
    secondaryIntersections.forEach(p => scene.remove(p));
    if (shiftKey.value) {
      // Show auxiliary line with shift-key
      const hypotenuse = Math.sqrt(
        Math.pow(rayIntersectionPoint.position.x, 2) +
          Math.pow(rayIntersectionPoint.position.y, 2)
      );
      // Reorient the line to follow the mouse (in 3D)
      auxLine.rotation.set(0, 0, 0);
      auxLine.rotateZ(
        Math.PI / 2 +
          Math.atan2(
            rayIntersectionPoint.position.y,
            rayIntersectionPoint.position.x
          )
      );
      auxLine.rotateX(-Math.atan2(rayIntersectionPoint.position.z, hypotenuse));
      scene.add(auxLine);

      // Find other intersection points between the auxiliary line and the sphere and/or hyperboloids)
      auxLineDirection.copy(rayIntersectionPoint.position);
      const { x: x0, y: y0, z: z0 } = rayIntersectionPoint.position;
      let scale = 0;
      if (firstIntersection.object.name === "Center Sphere") {
        // Antipode on the circle
        secondaryIntersections[0].position.set(-x0, -y0, -z0);
        scene.add(secondaryIntersections[0]);

        // Calculate the scaling factor to place the point on hyperbolodi sheets
        const scaleSquared = -1 / (x0 * x0 + y0 * y0 - z0 * z0);
        console.debug(
          "Scaling required to project from sphere to hyperboloid",
          scaleSquared
        );
        if (scaleSquared > 0) {
          scale = Math.sqrt(scaleSquared);
        }
      } else if (firstIntersection.object.name.endsWith("Sheet")) {
        // Antipode on the hyperboloid
        secondaryIntersections[0].position.set(-x0, -y0, -z0);
        scene.add(secondaryIntersections[0]);
        // Calculate the scale factor to place the point on the sphere
        scale = Math.sqrt(1 / (x0 * x0 + y0 * y0 + z0 * z0));
        console.debug(
          "Scaling required to project from hyperboloid to sphere",
          scale
        );
      }
      if (scale > 0) {
        // Draw two more points
        secondaryIntersections[1].position.set(
          scale * x0,
          scale * y0,
          scale * z0
        );
        scene.add(secondaryIntersections[1]);
        secondaryIntersections[2].position.set(
          -scale * x0,
          -scale * y0,
          -scale * z0
        );
        scene.add(secondaryIntersections[2]);
      }
    } else {
      scene.remove(auxLine);
    }
  } else {
    onSurface.value = null;
    firstIntersection = null;
    scene.remove(rayIntersectionPoint);
    scene.remove(auxLine);
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
