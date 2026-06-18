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
  useTemplateRef
} from "vue";
// import { useMouseInElement } from "@vueuse/core";
// import { useThree } from "@/composables/useThree";
// import { useSphericTools } from "@/composables/useSphericalTools";
import {
  Clock,
  DirectionalLight,
  GridHelper,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
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
let camera: PerspectiveCamera;
let renderer: WebGPURenderer;
let cameraController: CameraControls;
const clock = new Clock();
const rayCaster = new Raycaster();
const { elementX, elementY, isOutside } = useMouseInElement(webGPUCanvas, {});
const mouseViewportCoordNormalized = new Vector2();
const cursorShape = ref("default");
const mouse3DPosition: Ref<Vector3> = ref(new Vector3());
let lastViewportWidth, lastViewportHeight;

const { idle } = useIdle(500);
// const { setCurrentTool } = useSphericTools(scene, mouse3DPosition);
// const { elementX, elementY, isOutside } = useMouseInElement(webGPUCanvas.value);
CameraControls.install({ THREE });

onBeforeMount(() => {
  console.debug("OnBeforeMount::SphericFrame.vue", props, webGPUCanvas.value);
  const gridHelper = new GridHelper(3, 6, 0x000000, "gray");
  gridHelper.rotateX(Math.PI / 2);
  scene.add(gridHelper);
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
  scene.add(new HemisphereLight(0x404040, 0xa0a0a0));
  const directionalLight = new DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 1, 2);
  scene.add(directionalLight);
  // scene.add(new THREE.DirectionalLightHelper(directionalLight, 2, "red"));
  const unitSphere = new Mesh(
    new SphereGeometry(1, 60, 60),
    new MeshStandardMaterial({
      color: 0x66ff00,
      roughness: 0.04,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8
    })
  );
  unitSphere.name = "unitSphere";
  scene.add(unitSphere);
});

onMounted(async () => {
  console.debug("OnMounted::SphericFrame.vue", props, webGPUCanvas.value);
  // const cx: HTMLCanvasElement | null = toValue(webGPUCanvas);
  // lastViewportWidth = cx!.width;
  // lastViewportHeight = cx!.height;
  camera = new PerspectiveCamera(
    75,
    props.availableWidth / props.availableHeight,
    0.1,
    1000
  );
  camera.position.set(1, 1, 1);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  renderer = new WebGPURenderer({ canvas: webGPUCanvas.value! });
  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x336600, 0.4);
  await renderer.init();

  cameraController = new CameraControls(camera, renderer.domElement);
  // useEventListener(cameraController, "control", () => {
  //   // console.debug("Camera control");
  // });
  // useEventListener(cameraController, "update", () => {
  //   // console.debug("Camera position changed");
  // });
  useEventListener(renderer.domElement, "mousemove", computeMouse3DCoordinates);
  let timestamp;
  renderer.setAnimationLoop(() => {
    // clock.update(timestamp);
    const delta = clock.getDelta();
    cameraController.update(delta);
    renderer.render(scene, camera);
  });
  // setCurrentTool("point");
});

onUpdated(() => {
  if (
    lastViewportWidth !== props.availableWidth ||
    lastViewportHeight !== props.availableHeight
  ) {
    console.debug("OnUpdated::SphericFrame.vue reset camera and renderer");
    camera.aspect = props.availableWidth / props.availableHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(props.availableWidth, props.availableHeight);
    lastViewportWidth = props.availableWidth;
    lastViewportHeight = props.availableHeight;
  }
});

onBeforeUnmount(() => {
  // Cleanup code here
  // if (cameraController) {
  //   cameraController.dispose();
  // }
});

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
  rayCaster
    .intersectObjects(scene.children, false)
    .filter(intersection => intersection.object.name.length > 0)
    .forEach(intersection => {
      // console.debug(
      //   "Intersection with",
      //   intersection.object.name,
      //   intersection.distance.toFixed(2),
      //   intersection.point.toFixed(3)
      // );
      cursorShape.value = "crosshair";
      mouse3DPosition.value.copy(intersection.point);
    });
}
</script>
