<template>
  <p :style="{
    position: 'fixed'
  }">ThreeJS  {{ props.availableWidth }}x{{ props.availableHeight }}</p>
  <canvas
    ref="webglCanvas"
    :width="props.availableWidth"
    :height="props.availableHeight" />
</template>

<script setup lang="ts">
import { AmbientLight, ArrowHelper, Clock, DoubleSide, Mesh, MeshStandardMaterial, PerspectiveCamera, PointLight, Scene, Vector3, WebGLRenderer } from "three";
import * as THREE from "three"
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry"
import { onUpdated, onMounted, Ref, ref } from "vue";
import CameraControls from "camera-controls";
type ComponentProps = {
  availableHeight: number;
  availableWidth: number;
};
const props = withDefaults(defineProps<ComponentProps>(), {
  availableHeight: 240,
  availableWidth: 240
});
const webglCanvas: Ref<HTMLCanvasElement | null> = ref(null);
const scene = new Scene();
const clock = new Clock()
let camera: PerspectiveCamera;
let renderer: WebGLRenderer;
let cameraController: CameraControls
CameraControls.install({ THREE })
const arrowX = new ArrowHelper(new Vector3(1, 0, 0))
arrowX.setColor(0xFF0000)
arrowX.setLength(2, 0.2, 0.2)
const arrowY = new ArrowHelper(new Vector3(0, 1, 0))
arrowY.setColor(0x00FF00)
arrowY.setLength(2, 0.2, 0.2)
const arrowZ = new ArrowHelper(new Vector3(0, 0, 1))
arrowZ.setColor(0x0000FF)
arrowZ.setLength(2, 0.2, 0.2)
scene.add(arrowX)
scene.add(arrowY)
scene.add(arrowZ)

const upperHyperboloidMesh = new Mesh(
  new ParametricGeometry(hyperboloidPlus, 30, 30),
  new MeshStandardMaterial({color: "chocolate", side: DoubleSide, roughness: 0.2})
)
const lowerHyperboloidMesh = new Mesh(
  new ParametricGeometry(hyperboloidMinus, 30, 30),
  new MeshStandardMaterial({color: "chocolate", side: DoubleSide, roughness: 0.2})
)
scene.add(upperHyperboloidMesh)
scene.add(lowerHyperboloidMesh)

const ambientLight = new AmbientLight(0xcccccc, 1.5)
const pointLight = new PointLight(0xffffff, 2, 0)
pointLight.position.set(3,3,5)
scene.add(ambientLight)
scene.add(pointLight)

function doRender() {
  const deltaTime = clock.getDelta()
  const hasUpdatedControls = cameraController.update(deltaTime)
  if (hasUpdatedControls)
    renderer.render(scene, camera)
}

onMounted(() => {
  console.debug(`Mounted size ${props.availableWidth}x${props.availableHeight}`)
  camera = new PerspectiveCamera(
    45,
    props.availableWidth / props.availableHeight,
    0.1,
    500
  );
  camera.position.set(5, 7, 4)
  camera.up.set(0, 0, 1)
  camera.lookAt(0, 0, 0)
  cameraController = new CameraControls(camera, webglCanvas.value!)
  renderer = new WebGLRenderer({
    canvas: webglCanvas.value!,
    antialias: true
  });
  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.setClearColor(0x999999, 1);
  renderer.setAnimationLoop(doRender);
  renderer.render(scene, camera)
});
onUpdated(() => {
  console.debug(`onUpdated size ${props.availableWidth}x${props.availableHeight}`)
  camera.aspect = props.availableWidth / props.availableHeight
  camera.updateProjectionMatrix()
  renderer.setSize(props.availableWidth, props.availableHeight)
})

function hyperboloidPlus(u: number, v: number, pt: Vector3) {
  u = u * 1.5
  const theta = v * 2 * Math.PI
  const x = Math.sinh(u) * Math.cos(theta)
  const y = Math.sinh(u) * Math.sin(theta)
  const z = Math.cosh(u) 
  pt.set(x,y,z)
}
function hyperboloidMinus(u: number, v: number, pt: Vector3) {
  const theta = v * 2 * Math.PI
  u = u * 1.5
  const x = Math.sinh(u) * Math.cos(theta)
  const y = Math.sinh(u) * Math.sin(theta)
  const z = -Math.cosh(u)
  pt.set(x,y,z)
}

</script>
