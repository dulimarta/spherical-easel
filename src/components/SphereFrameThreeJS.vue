<template>
  <span
    v-if="!Number.isNaN(mouse3DPosition.x)"
    :style="{
      position: 'fixed'
    }">
    Cursor @ {{ mouse3DPosition.toFixed(2) }}
  </span>
  <canvas
    :style="{ cursor: cursorShape }"
    ref="webGPUCanvas"
    id="webGPUCanvas"
    :width="props.availableWidth"
    :height="props.availableHeight"></canvas>
</template>
<style lang="css" scoped>
#webGPUCanvas {
  margin-bottom: 4px;
}
</style>
<script setup lang="ts">
import {
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  Ref,
  ref,
  toValue,
  useTemplateRef,
  watch
} from "vue";
import {
  ArcCurve,
  Clock,
  DirectionalLight,
  GridHelper,
  HemisphereLight,
  Line2NodeMaterial,
  Mesh,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGPURenderer
} from "three/webgpu";
import * as THREE from "three/webgpu";
import CameraControls from "camera-controls";
import { useEventListener, useIdle, useMouseInElement } from "@vueuse/core";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { useGeometryStore } from "@/stores/geometry";
import { SphericalTool } from "@/eventHandlers-spherical/ToolStrategy";
import { PointHandler } from "@/eventHandlers-spherical/NewPointHandler";
import { CKNodule } from "@/models/CKNodule";
import { abs, asin, color, Fn, positionLocal, vec3, atan } from "three/tsl";
import { LineHandler } from "@/eventHandlers-spherical/NewLineHandler";
import { Line2 } from "three/examples/jsm/lines/webgpu/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
const geoStore = useGeometryStore();
const webGPUCanvas = useTemplateRef<HTMLCanvasElement>("webGPUCanvas");
type ComponentProps = {
  availableHeight: number;
  availableWidth: number;
};
const props = withDefaults(defineProps<ComponentProps>(), {
  availableHeight: 240,
  availableWidth: 240
});
const scene: Scene = new Scene();
// let camera: PerspectiveCamera = new PerspectiveCamera(
//   50,
//   props.availableWidth / props.availableHeight,
//   0.1,
//   1000
// );
const aspect = props.availableWidth / props.availableHeight;
let camera = new THREE.OrthographicCamera(
  -1.25 * aspect /* left */,
  1.25 * aspect /* right */,
  1.25 /* top */,
  -1.25 /* bottom */,
  1 /* near */,
  100 /* far */
);
let renderer: WebGPURenderer;
let cameraController: CameraControls;
const clock = new Clock();
const rayCaster = new Raycaster();
const mouseViewportCoordNormalized = new Vector2();
const cursorShape = ref("default");
const mouse3DPosition: Ref<Vector3> = ref(new Vector3());
let lastViewportWidth, lastViewportHeight;
let hasUpdatedCameraControls = false;
let currentTool: SphericalTool | null = null;
let pointTool: SphericalTool | null = null;
let lineTool: SphericalTool | null = null;
let segmentTool: SphericalTool | null = null;
let unitSphere: Mesh;
const hitObjects: CKNodule[] = [];
const { idle } = useIdle(500);
const { elementX, elementY, isOutside } = useMouseInElement(webGPUCanvas, {});
const seStore = useSEStore();
const { actionMode } = storeToRefs(seStore);
CameraControls.install({ THREE });
CKNodule.setGAMode("elliptic");

onBeforeMount(() => {
  // console.debug("OnBeforeMount::SphericFrame.vue", props, webGPUCanvas.value);
  const gridHelper = new GridHelper(3, 6, "black", "gray");
  gridHelper.rotateX(Math.PI / 2);
  scene.add(gridHelper);
  geoStore.setScene(scene);
  // const arrowLength = 1.5;
  // const arrowHeadLength = 0.2;
  // const arrowHeadDiameter = 0.1;
  // scene.add(
  //   new ArrowHelper(
  //     new Vector3(1, 0, 0),
  //     new Vector3(0, 0, 0),
  //     arrowLength,
  //     0xff0000,
  //     arrowHeadLength,
  //     arrowHeadDiameter
  //   )
  // );
  // scene.add(
  //   new ArrowHelper(
  //     new Vector3(0, 1, 0),
  //     new Vector3(0, 0, 0),
  //     arrowLength,
  //     0x00ff00,
  //     arrowHeadLength,
  //     arrowHeadDiameter
  //   )
  // );
  // scene.add(
  //   new ArrowHelper(
  //     new Vector3(0, 0, 1),
  //     new Vector3(0, 0, 0),
  //     arrowLength,
  //     0x0000ff,
  //     arrowHeadLength,
  //     arrowHeadDiameter
  //   )
  // );
  const hemiLight = new HemisphereLight(0x404040, 0xa0a0a0);
  hemiLight.position.set(0, 1.5, 0);
  scene.add(hemiLight);
  const directionalLight = new DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 1, 2);
  scene.add(directionalLight);
  const unitSphereMaterial = new THREE.MeshStandardNodeMaterial({
    roughness: 0.04,
    metalness: 0.2,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide // to enable selecting points on the back side of the sphere
  });
  unitSphere = new Mesh(
    new SphereGeometry(1, 120, 120),
    unitSphereMaterial
    // new THREE.NodeMaterial({
    //   color: 0x66ff00,
    //   roughness: 0.04,
    //   metalness: 0.2,
    //   transparent: true,
    //   opacity: 0.8
    // })
  );
  const latitudeLine = Fn(() => {
    const angle1 = abs(asin(positionLocal.z).mul(15).div(Math.PI))
      .fract()
      .step(0.97);
    const angle2 = atan(positionLocal.y, positionLocal.x)
      .mul(3)
      .fract()
      .step(0.97);
    const angle = angle1.add(angle2);
    return vec3(angle, angle, 0);
  });
  // unitSphereMaterial.fragmentNode = vec3(positionLocal.z)
  //   .mul(10)
  //   .fract()
  //   .step(0.95);
  // unitSphereMaterial.colorNode = latitudeLine();
  unitSphere.name = "unitSphere";
  scene.add(unitSphere);
});

onMounted(async () => {
  // console.debug("OnMounted::SphericFrame.vue", props, webGPUCanvas.value);
  const cx: HTMLCanvasElement | null = toValue(webGPUCanvas);
  lastViewportWidth = cx!.width;
  lastViewportHeight = cx!.height;
  // camera = new PerspectiveCamera(
  //   75,
  //   props.availableWidth / props.availableHeight,
  //   0.1,
  //   1000
  // );
  camera.position.set(1.5, 1.5, 2);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  renderer = new WebGPURenderer({
    canvas: webGPUCanvas.value!,
    antialias: true
  });
  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x336600, 0.4);
  await renderer.init();

  // const db = await renderer.debug.getShaderAsync(scene, camera, l2);
  // console.debug("VS for L2", db.vertexShader);
  // console.debug("FS for L2", db.fragmentShader);

  cameraController = new CameraControls(camera, renderer.domElement);
  // useEventListener(cameraController, "control", () => {
  //   // console.debug("Camera control");
  // });
  // useEventListener(cameraController, "update", () => {
  //   // console.debug("Camera position changed");
  // });
  useEventListener(renderer.domElement, "mousemove", computeMouse3DCoordinates);
  useEventListener(renderer.domElement, "mousedown", doMousePressed);
  // let timestamp;
  renderer.setAnimationLoop(() => {
    // clock.update(timestamp);
    if (actionMode.value === "rotate") {
      // activate camera control only when the rotate sphere tool is active
      const delta = clock.getDelta();
      hasUpdatedCameraControls = cameraController.update(delta);
    }
    renderer.render(scene, camera);
  });
});

onUpdated(() => {
  if (
    lastViewportWidth !== props.availableWidth ||
    lastViewportHeight !== props.availableHeight
  ) {
    console.debug("OnUpdated::SphericFrame.vue reset camera and renderer");
    const aspect = props.availableWidth / props.availableHeight;
    // camera.aspect = props.availableWidth / props.availableHeight;
    camera.left = -1.25 * aspect;
    camera.right = 1.25 * aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(props.availableWidth, props.availableHeight);
    lastViewportWidth = props.availableWidth;
    lastViewportHeight = props.availableHeight;
  }
});

onBeforeUnmount(() => {
  // Cleanup code here
  if (cameraController) {
    cameraController.dispose();
  }
});

watch(
  () => actionMode.value,
  mode => {
    currentTool?.deactivate();
    currentTool = null;

    switch (mode) {
      case "point":
        if (pointTool === null) pointTool = new PointHandler(scene);
        currentTool = pointTool;
        break;
      case "line":
        if (lineTool === null) lineTool = new LineHandler(scene, true);
        currentTool = lineTool;
        break;
      case "segment":
        if (segmentTool === null) segmentTool = new LineHandler(scene, false);
        currentTool = segmentTool;
        break;
    }
    currentTool?.activate();
  }
);

watch(idle, idleValue => {
  // console.debug("Idle state", idleValue);
  // console.debug("Camera control", hasUpdatedCameraControls);
  if (idleValue || hasUpdatedCameraControls) {
    geoStore.adjustLabelPose(camera.quaternion);
    //   hyperStore.updateDisplayForCameraUpdate();
    //   geoStore.adjustLabelPose(cameraQuaternion.value);
    //   hasUpdatedCameraControls.value = false;
  }
});
function doMousePressed(event: MouseEvent) {
  currentTool?.mousePressed(event, mouse3DPosition.value, hitObjects);
}

function computeMouse3DCoordinates(ev: MouseEvent) {
  // console.debug(
  //   "Mouse move",
  //   elementX.value.toFixed(2),
  //   elementY.value.toFixed(2)
  // );
  mouseViewportCoordNormalized.set(
    2 * (elementX.value / renderer.domElement.clientWidth) - 1,
    1 - 2 * (elementY.value / renderer.domElement.clientHeight)
  );
  rayCaster.setFromCamera(mouseViewportCoordNormalized, camera);
  cursorShape.value = "default";
  mouse3DPosition.value.set(NaN, NaN, NaN);
  hitObjects.splice(0);
  const hitByRay = rayCaster
    .intersectObjects(scene.children, false)
    .filter(intersection => intersection.object.name.length > 0);
  // .forEach(intersection => {
  //   // console.debug(
  //   //   "Intersection with",
  //   //   intersection.object.name,
  //   //   intersection.distance.toFixed(2),
  //   //   intersection.point.toFixed(3)
  //   // );
  // });
  if (hitByRay.length > 0) {
    // console.debug("Ray hit", hitByRay);
    // If shift key is pressed, use the last hit point (farthest), otherwise use the first hit point (nearest)
    if (ev.shiftKey) {
      mouse3DPosition.value.copy(hitByRay[hitByRay.length - 1].point);
      cursorShape.value = "pointer";
    } else {
      mouse3DPosition.value.copy(hitByRay[0].point);
      cursorShape.value = "crosshair";
    }
    const namesOfHitObjects = hitByRay.map(x => x.object.name);
    // console.debug("Hit objects: ", namesOfHitObjects.join());
    hitObjects.push(
      ...namesOfHitObjects
        .map(name => geoStore.getObjectById(name))
        .filter(z => z !== null)
    );
  }
  currentTool?.mouseMoved(ev, mouse3DPosition.value, hitObjects);
}
</script>
