<template>
  <p
    :style="{
      position: 'fixed'
    }">
    ThreeJS {{ props.availableWidth }}x{{ props.availableHeight }} Mouse @ ({{
      mouseCoord.toFixed(2)
    }}) {{ mouseCoordNormalized.toFixed(3) }}
  </p>
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
  CylinderGeometry
} from "three";
import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { LineCurve3 } from "three/src/extras/curves/LineCurve3";
import { onUpdated, onMounted, Ref, ref } from "vue";
import CameraControls from "camera-controls";
import { au } from "vitest/dist/chunks/reporters.nr4dxCkA";
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
const clock = new Clock(); // used by camera control animation
const rayCaster = new Raycaster();
const auxLineRayCaster = new Raycaster();
const auxRaycasterStart = new Vector3(0, 0, 0);
const mouseCoord: Ref<THREE.Vector2> = ref(new THREE.Vector2());
const mouseCoordNormalized: Ref<THREE.Vector2> = ref(new THREE.Vector2()); // used by RayCaster
let camera: PerspectiveCamera;
let renderer: WebGLRenderer;
let cameraController: CameraControls;
CameraControls.install({ THREE });
const xyGrid = new GridHelper();
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

const upperHyperboloidMesh = new Mesh(
  new ParametricGeometry(hyperboloidPlus, 30, 30),
  new MeshStandardMaterial({
    color: "chocolate",
    side: DoubleSide,
    roughness: 0.2
  })
);
const lowerHyperboloidMesh = new Mesh(
  new ParametricGeometry(hyperboloidMinus, 30, 30),
  new MeshStandardMaterial({
    color: "chocolate",
    side: DoubleSide,
    roughness: 0.2
  })
);
const rayIntersectionPoint = new Mesh(
  new SphereGeometry(0.05),
  new MeshStandardMaterial({ color: "white" })
);

const auxLineIntersectionPoints: Array<Mesh> = [];
for (let k = 0; k < 4; k++) {
  const p = rayIntersectionPoint.clone(true);
  // cloning the mesh does not automatically clone the material
  // so we have to clone the material properties
  p.material = rayIntersectionPoint.material.clone()
  p.material.color.setColorName("black");
  auxLineIntersectionPoints.push(p);
}

const mouseNormalArrow = new ArrowHelper(); // ArrowHelper to show the normal vector of mouse intersection point
mouseNormalArrow.setColor(0xffffff);
mouseNormalArrow.setLength(1, 0.2, 0.2);
// Attach the arrowhelper of the mouse normal to the intersectionpoint itself
rayIntersectionPoint.add(mouseNormalArrow);

const auxLinePath = new LineCurve3(new Vector3(0, 0, 0), new Vector3(3, 3, 3));
const auxLineTube = new TubeGeometry(auxLinePath, 20, 0.03, 16, true);
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
scene.add(lowerHyperboloidMesh);

const centerSphere = new Mesh(
  new SphereGeometry(1),
  new MeshStandardMaterial({ color: "green", side: DoubleSide })
);
centerSphere.name = "Center Sphere";
scene.add(centerSphere);
const ambientLight = new AmbientLight(0xcccccc, 1.5);
const pointLight = new PointLight(0xffffff, 2, 0);
pointLight.position.set(3, 3, 5);
scene.add(ambientLight);
scene.add(pointLight);

function doRender() {
  const deltaTime = clock.getDelta();
  const hasUpdatedControls = cameraController.update(deltaTime);
  if (hasUpdatedControls) renderer.render(scene, camera);
}

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
  cameraController = new CameraControls(camera, webglCanvas.value!);
  renderer = new WebGLRenderer({
    canvas: webglCanvas.value!,
    antialias: true
  });
  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.setClearColor(0xcccccc, 1);
  renderer.setAnimationLoop(doRender);
  renderer.render(scene, camera);
  window.addEventListener("mousemove", mouseTracker);
});
onUpdated(() => {
  // console.debug(`onUpdated size ${props.availableWidth}x${props.availableHeight}`)
  camera.aspect = props.availableWidth / props.availableHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(props.availableWidth, props.availableHeight);
  renderer.render(scene, camera);
});

function mouseTracker(ev: MouseEvent) {
  // ev.stopPropagation()
  // console.debug(`Mouse move to (${ev.clientX},${ev.clientY})`
  //  + ` Event offset ${ev.offsetX} ${ev.offsetY}`
  //   + ` ClientLeft ${webglCanvas.value?.clientLeft}`
  //   + ` Container ${webglCanvas.value?.clientWidth}x${webglCanvas.value?.clientHeight}`
  //   + ` Renderer ${renderer.domElement.clientWidth}x${renderer.domElement.clientHeight}`
  // )
  mouseCoord.value.x = ev.offsetX;
  mouseCoord.value.y = ev.offsetY;
  mouseCoordNormalized.value.x =
    2 * (ev.offsetX / renderer.domElement.clientWidth) - 1;
  mouseCoordNormalized.value.y =
    1 - 2 * (ev.offsetY / renderer.domElement.clientHeight);
  rayCaster.setFromCamera(mouseCoordNormalized.value, camera);
  const allIntersections = rayCaster.intersectObjects(scene.children, true);
  if (allIntersections.length > 0) {
    // console.debug(`Number of all intersections ${allIntersections.length}`)
    // We are interested only in intersection with named objects
    const namedIntersections = allIntersections.filter(
      z => z.object.name.length > 0 // we are interested only in named objects
    );
    if (namedIntersections.length > 0) {
      // console.debug(`First intersection ${namedIntersections[0].object.name}`)
      rayIntersectionPoint.position.copy(namedIntersections[0].point);
      scene.add(rayIntersectionPoint);
      // mouseNormalArrow.position.copy(rayIntersectionPoint.position)
      mouseNormalArrow.setDirection(namedIntersections[0].normal!);
      // Show auxiliary line with shift-key
      auxLineIntersectionPoints.forEach(p => scene.remove(p));
      if (ev.shiftKey) {
        // auxLinePath.v1.set(0, 0, 0)
        // auxLinePath.v2.copy(rayIntersectionPoint.position)
        // auxLinePath.updateArcLengths()
        // const pts = auxLinePath.getPoints();
        // console.debug("First point", pts[0], "Last point ", pts[pts.length - 1])
        // auxLineTube.attributes.position.needsUpdate = true
        // auxLineTube.scale(1, 1, 1)
        // auxLineTube.refresh()
        // const b = auxLineTube.boundingBox
        // console.debug("Bounding box", b?.min, b?.max)
        // auxLine.updateMatrix()
        const hypotenuse = Math.sqrt(
          Math.pow(rayIntersectionPoint.position.x, 2) +
            Math.pow(rayIntersectionPoint.position.y, 2)
        );
        auxLine.rotation.set(0, 0, 0);
        auxLine.rotateZ(
          Math.PI / 2 +
            Math.atan2(
              rayIntersectionPoint.position.y,
              rayIntersectionPoint.position.x
            )
        );
        auxLine.rotateX(
          -Math.atan2(rayIntersectionPoint.position.z, hypotenuse)
        );
        scene.add(auxLine);
        auxLineDirection.copy(rayIntersectionPoint.position);
        auxRaycasterStart.copy(rayIntersectionPoint.position);
        auxRaycasterStart.multiplyScalar(-10);
        auxLineRayCaster.set(auxRaycasterStart, auxLineDirection.normalize());
        const x = auxLineRayCaster
          .intersectObjects(scene.children, true)
          .filter(obj => obj.object.name.length > 0);
        if (x.length > 0) {
          console.debug(
            `Mouse at ${rayIntersectionPoint.position.toFixed(3)} with ${x.length} auxiliary intersections`
          );
          x.forEach((z, idx) => {
            const dist = z.point.distanceToSquared(rayIntersectionPoint.position)
            // console.debug(
            //   `AuxLine intersection ${idx} with ${
            //     z.object.name
            //   } at ${z.point.toFixed(3)} ${dist} away from mouse intersection`
            // );
            if (dist > 1e-4) {
              auxLineIntersectionPoints[idx].position.copy(z.point);
              scene.add(auxLineIntersectionPoints[idx]);
            }
          });
        } else {
        }
      } else {
        scene.remove(auxLine);
      }
    } else {
      scene.remove(rayIntersectionPoint);
      scene.remove(auxLine);
    }
  } else {
    scene.remove(rayIntersectionPoint);
    scene.remove(auxLine);
  }
}
function hyperboloidPlus(u: number, v: number, pt: Vector3) {
  u = u * 2;
  const theta = v * 2 * Math.PI;
  const x = Math.sinh(u) * Math.cos(theta);
  const y = Math.sinh(u) * Math.sin(theta);
  const z = Math.cosh(u);
  pt.set(x, y, z);
}
function hyperboloidMinus(u: number, v: number, pt: Vector3) {
  const theta = v * 2 * Math.PI;
  u = u * 2;
  const x = Math.sinh(u) * Math.cos(theta);
  const y = Math.sinh(u) * Math.sin(theta);
  const z = -Math.cosh(u);
  pt.set(x, y, z);
}
</script>
<!-- <style scoped>
#webglCanvas {
  border: 2px solid red
}
</style> -->
