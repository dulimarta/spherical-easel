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
  CylinderGeometry,
  Line3,
  CurvePath,
  Group
} from "three";
import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { LineCurve3 } from "three/src/extras/curves/LineCurve3";
import { onUpdated, onMounted, Ref, ref } from "vue";
import CameraControls from "camera-controls";
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
  ExtendedTriangle,
  MeshBVHHelper
} from "three-mesh-bvh";
import { degToRad } from "three/src/math/MathUtils";

// Inject new BVH functions into current THREE-JS Mesh/BufferGeometry definitions
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

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
rayCaster.firstHitOnly = true;
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

const upperHyperboloidGeometry = new ParametricGeometry(
  hyperboloidPlus,
  30,
  30
);
upperHyperboloidGeometry.computeBoundsTree({ maxLeafTris: 2 });
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
  30,
  30
);
lowerHyperboloidGeometry.computeBoundsTree();
const lowerHyperboloidMesh = new Mesh(
  lowerHyperboloidGeometry,
  new MeshStandardMaterial({
    color: "chocolate",
    side: DoubleSide,
    roughness: 0.2
  })
);
// const lowerBVHHelper = new MeshBVHHelper(lowerHyperboloidMesh);

const rayIntersectionPoint = new Mesh(
  new SphereGeometry(0.05),
  new MeshStandardMaterial({ color: "white" })
);

const auxLineIntersectionPoints: Array<Mesh> = [];
for (let k = 0; k < 4; k++) {
  const p = rayIntersectionPoint.clone(true);
  // cloning the mesh does not automatically clone the material
  // so we have to clone the material properties
  p.material = rayIntersectionPoint.material.clone();
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
// scene.add(upperBVHHelper);
scene.add(lowerHyperboloidMesh);
// scene.add(lowerBVHHelper);
const centerSphere = new Mesh(
  new SphereGeometry(1),
  new MeshStandardMaterial({ color: "green", side: DoubleSide, roughness: 0.3 })
);
centerSphere.name = "Center Sphere";
scene.add(centerSphere);

const planeGeometry = new THREE.PlaneGeometry(6, 10, 20, 20);
planeGeometry.computeBoundsTree({
  verbose: true,
  maxLeafTris: 0,
  maxDepth: 10
});
const randomPlane = new Mesh(
  planeGeometry,
  new MeshStandardMaterial({
    color: "darkred",
    roughness: 0.4,
    side: DoubleSide
  })
);
// const planeBVHHelper = new MeshBVHHelper(randomPlane);
// planeBVHHelper.color.set("cyan");
// scene.add(planeBVHHelper);
randomPlane.name = "RedPlane";
randomPlane.matrixAutoUpdate = true;
randomPlane.rotation.set(degToRad(-55), 0, 0);
randomPlane.updateMatrixWorld(); // This is needed to before bvhcast can do its work
scene.add(randomPlane);

const upperHyperboloidToPlaneMatrix = new THREE.Matrix4()
  .copy(randomPlane.matrixWorld)
  .invert()
  .multiply(upperHyperboloidMesh.matrixWorld);

// const intersectionLines: Array<Line3> = [];
// const intersectionLineCurves: Array<LineCurve3> = [];
// const intersectionCurvePath = new CurvePath<Vector3>();
const aLine: Line3 = new Line3();
const intersectionGroup = new Group()
planeGeometry.boundsTree?.bvhcast(
  upperHyperboloidGeometry.boundsTree!,
  upperHyperboloidToPlaneMatrix,
  {
    // intersectsRanges(
    //   t1Offset: number,
    //   t1Count: number,
    //   t2Offset: number,
    //   t2Count: number
    // ): boolean {
    //   console.debug(
    //     `Checking intersection ranges T1: offset ${t1Offset} count ${t1Count} T2: offset ${t2Offset} count ${t2Count}`
    //   );
    //   return false;
    // },
    intersectsTriangles(
      t1: ExtendedTriangle,
      t2: ExtendedTriangle,
      i1: number,
      i2: number,
      t1depth: number,
      t1Index: number,
      t2depth: number,
      t2Index: number
    ): boolean {
      // console.debug(`Check intersection between triangle`, t1, "and", t2)
      if (t1.intersectsTriangle(t2, aLine)) {
        // console.debug(
        //   "Triangle intersection",
        //   aLine.start.toFixed(2),
        //   aLine.end.toFixed(2)
        // );
        const lc = new LineCurve3(aLine.start.clone(), aLine.end.clone());
        const intersectionTubeGeo = new TubeGeometry(lc, 10, 0.03, 10, false);
        const intersectionTube = new Mesh(
          intersectionTubeGeo,
          new MeshStandardMaterial({ color: "yellow" })
        );
        intersectionGroup.add(intersectionTube)
      }
      return false;
    }
  }
);
intersectionGroup.applyMatrix4(randomPlane.matrixWorld)
scene.add(intersectionGroup)
// console.debug("Plane Hyperboloid intersection", intersectionLines.length);
// intersectionLineCurves.forEach((c, idx) => {
//   console.debug(`Curve ${idx} ${c.v1.toFixed(2)} to ${c.v2.toFixed(2)}`);
// });
// scene.add(intersectionTube)
const ambientLight = new AmbientLight(0xffffff, 1.5);
const pointLight = new PointLight(0xffffff, 100);
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
      console.debug(`First intersection ${namedIntersections[0].object.name}`);
      rayIntersectionPoint.position.copy(namedIntersections[0].point);
      scene.add(rayIntersectionPoint);
      // mouseNormalArrow.position.copy(rayIntersectionPoint.position)
      if (namedIntersections[0].object.name.endsWith("Plane")) {
        // Using the normal from the intersection returned by RayCaster
        // does not give us the correct normal vector direction
        // Must take it from the face normal and then apply the world transformation matrix
        const n = namedIntersections[0].face?.normal.clone();
        n?.transformDirection(namedIntersections[0].object.matrixWorld);
        console.debug(`with normal vector ${n!.toFixed(2)}`);
        mouseNormalArrow.setDirection(n!);
      } else mouseNormalArrow.setDirection(namedIntersections[0].normal!);
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
            `Mouse at ${rayIntersectionPoint.position.toFixed(3)} with ${
              x.length
            } auxiliary intersections`
          );
          x.forEach((z, idx) => {
            const dist = z.point.distanceToSquared(
              rayIntersectionPoint.position
            );
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
