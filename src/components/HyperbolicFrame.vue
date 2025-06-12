<template>
  <span
    :style="{
      position: 'fixed',
      backgroundColor: '#FFF7'
    }">
    <span class="mx-2">
      Keys
      <v-icon :color="shiftKey ? 'black' : 'grey'">
        mdi-apple-keyboard-shift
      </v-icon>
      <v-icon :color="controlKey ? 'black' : 'grey'">
        mdi-apple-keyboard-control
      </v-icon>
    </span>
    <span class="mr-2">
      Mouse @ <span :style="{
        color: isOutside ? 'red':'black'
      }">({{ elementX}}, {{elementX }})</span>
      {{ mouseCoordNormalized.toFixed(3) }}
      {{ rayIntersectionPoint.position.toFixed(2) }}
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
  CurvePath,
  Group,
  Curve
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
  ExtendedTriangle,
  MeshBVHHelper
} from "three-mesh-bvh";
import type { UseMouseEventExtractor } from '@vueuse/core'

import { useKeyModifier, useMouse, useMousePressed, useParentElement, useMouseInElement } from "@vueuse/core";
import { degToRad, radToDeg } from "three/src/math/MathUtils";

class HyperbolaCurve extends Curve<Vector3> {
  // Compute the points of a hyperbola on a plane
  // rotated on the X-axis
  v1: Vector3 = new Vector3();
  v2: Vector3 = new Vector3();
  outVec = new Vector3();
  a: number = 1;
  b: number = 1;
  constructor(v1: Vector3) {
    super();
    this.v1.copy(v1); // Must be a vector perpendicular to X-axis
    if (Math.abs(v1.x) > 1e-3)
      throw "The direction vector of hyperbola must be perpendiclar to the X-axis";
    this.v2.set(1, 0, 0);
    const innerA = v1.x * v1.x + v1.y * v1.y - v1.z * v1.z;
    this.a = Math.sqrt(-1.0 / innerA);
  }

  getPoint(t: number, optionalTarget: Vector3 = new Vector3()): Vector3 {
    const theta = 4 * t - 2;
    const lambda = this.a * Math.cosh(theta);
    const mu = this.b * Math.sinh(theta);
    // const out = optionalTarget ?? this.outVec;
    optionalTarget.set(0, 0, 0);
    optionalTarget
      .addScaledVector(this.v1, lambda)
      .addScaledVector(this.v2, mu);
    // console.debug(
    //   `Get 3D point of hyperbola at time ${t} mu=${mu.toFixed(
    //     3
    //   )} lambda=${lambda.toFixed(3)}==> ${optionalTarget.toFixed(3)}`
    // );
    return optionalTarget;
  }
}

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
const shiftKey = useKeyModifier("Shift");
const controlKey = useKeyModifier("Control")

const parentEl = useParentElement()

const extractor: UseMouseEventExtractor = event => (
  event instanceof MouseEvent
    ? [event.offsetX, event.offsetY]
    : null
)

// const { x, y, sourceType } = useMouse({ target: parentEl, type: extractor, touch: true })
const webglCanvas = useTemplateRef<HTMLCanvasElement>("webglCanvas");
const {elementX, elementY, isOutside} = useMouseInElement(webglCanvas)
const scene = new Scene();
const clock = new Clock(); // used by camera control animation
const rayCaster = new Raycaster();
rayCaster.firstHitOnly = true;
const auxLineRayCaster = new Raycaster();
const auxRaycasterStart = new Vector3(0, 0, 0);
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
// scene.add(arrowX);
// scene.add(arrowY);
// scene.add(arrowZ);

const upperHyperboloidGeometry = new ParametricGeometry(
  hyperboloidPlus,
  120,
  300
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
  120,
  300
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
for (let k = 0; k < 10; k++) {
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

// const auxLinePath = new LineCurve3(new Vector3(0, 0, 0), new Vector3(3, 3, 3));
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

// const randomPlane = new Group()
const upperPlaneGeometry = new THREE.PlaneGeometry(6, 10, 20, 20);
upperPlaneGeometry.computeBoundsTree({
  verbose: true,
  maxLeafTris: 0,
  maxDepth: 10
});
const randomPlane = new Mesh(
  upperPlaneGeometry,
  new MeshStandardMaterial({
    color: "darkred",
    roughness: 0.4,
    side: DoubleSide
  })
);
const planeDir1 = new Vector3(1, 0, 0);
const planeDir2 = new Vector3();
const planeDirArrow = new ArrowHelper();
planeDirArrow.setColor("cyan");
planeDirArrow.setLength(3, 0.5, 0.25);
// randomPlane.add(upperPlane)
const planeBVHHelper = new MeshBVHHelper(randomPlane);
// planeBVHHelper.color.set("cyan");
// scene.add(planeBVHHelper);
randomPlane.name = "RedPlane";
// randomPlane.matrixAutoUpdate = true;
randomPlane.rotateX(degToRad(90));
// randomPlane.translateY(5)
randomPlane.updateMatrixWorld(); // This is needed to before bvhcast can do its work
scene.add(randomPlane);
scene.add(planeDirArrow);

const path = new HyperbolaCurve(new Vector3(0, 0, 1));

let hyperTube = new Mesh(
  new TubeGeometry(path, 50, 0.05, 12, false),
  new THREE.MeshStandardMaterial({ color: "greenyellow" })
);
scene.add(hyperTube);
const upperHyperboloidToPlaneMatrix = new THREE.Matrix4()
  .copy(randomPlane.matrixWorld)
  .invert()
  .multiply(upperHyperboloidMesh.matrixWorld);

const aLine: Line3 = new Line3();
const bvhCastCallback = {
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
      const lc = new LineCurve3(aLine.start, aLine.end);
      const intersectionTubeGeo = new TubeGeometry(lc, 10, 0.03, 10, false);
      const intersectionTube = new Mesh(
        intersectionTubeGeo,
        new MeshStandardMaterial({ color: "yellow" })
      );
      // intersectionGroup.add(intersectionTube);
    }
    return false;
  }
};
// Use a Group to host the TubeGeometries which make up the intersection between the plane and the upper hyperboloid
const intersectionGroup = new Group();
upperPlaneGeometry.boundsTree?.bvhcast(
  upperHyperboloidGeometry.boundsTree!,
  upperHyperboloidToPlaneMatrix,
  bvhCastCallback
);
intersectionGroup.applyMatrix4(randomPlane.matrixWorld);
scene.add(intersectionGroup);
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
  mouseCoordNormalized.value.x =
    2 * (elementX.value / renderer.domElement.clientWidth) - 1;
  mouseCoordNormalized.value.y =
    1 - 2 * (elementY.value / renderer.domElement.clientHeight);
  rayCaster.setFromCamera(mouseCoordNormalized.value, camera);
  const allIntersections = rayCaster.intersectObjects(scene.children, true);
  allIntersections.forEach((itx, seq) => {
    console.debug(`Intersection ${seq } ${itx.point.toFixed(2)} ${itx.distance}`)
  })
  if (allIntersections.length > 0) {
    // console.debug(`Number of all intersections ${allIntersections.length}`)
    // We are interested only in intersection with named objects
    const namedIntersections = allIntersections.filter(
      z => z.object.name.length > 0 // we are interested only in named objects
    );
    if (namedIntersections.length > 0) {
      const firstIntersection = namedIntersections[0];
      // console.debug(`First intersection ${firstIntersection.object.name}`);
      rayIntersectionPoint.position.copy(firstIntersection.point);
      scene.add(rayIntersectionPoint);
      // mouseNormalArrow.position.copy(rayIntersectionPoint.position)
      if (firstIntersection.object.name.endsWith("Plane")) {
        // Using the normal from the intersection returned by RayCaster
        // does not give us the correct normal vector direction
        // Must take it from the face normal and then apply the world transformation matrix
        const n = firstIntersection.face?.normal.clone();
        n?.transformDirection(firstIntersection.object.matrixWorld);
        // console.debug(`with normal vector ${n!.toFixed(2)}`);
        mouseNormalArrow.setDirection(n!);
      } else {
        mouseNormalArrow.setDirection(firstIntersection.normal!);
      }
      auxLineIntersectionPoints.forEach(p => scene.remove(p));
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
        auxLine.rotateX(
          -Math.atan2(rayIntersectionPoint.position.z, hypotenuse)
        );
        scene.add(auxLine);

        // Find other intersection points between the auxiliary line and the sphere and/or hyperboloids)
        auxLineDirection.copy(rayIntersectionPoint.position);
        auxRaycasterStart.copy(rayIntersectionPoint.position);
        auxRaycasterStart.multiplyScalar(-10);
        auxLineRayCaster.set(auxRaycasterStart, auxLineDirection.normalize());
        const otherIntersects = auxLineRayCaster
          .intersectObjects(scene.children, true)
          .filter(obj => obj.object.name.length > 0); // ignore unnamed objects
        if (otherIntersects.length > 0) {
          console.debug(
            `Mouse on ${
              firstIntersection.object.name
            } at ${rayIntersectionPoint.position.toFixed(3)} with ${
              otherIntersects.length
            } auxiliary intersections with projective line`
          );
          otherIntersects.forEach((ptx, idx) => {
            // Check each intersection points on the auxiliary line
            const { x, y, z } = otherIntersects[idx].point;

            if (ptx.object.name.endsWith("Sphere")) {
              console.debug(
                `Intersection with sphere at ${ptx.point.toFixed(
                  2
                )} with metric ${(x * x + y * y + z * z).toFixed(1)}`
              );
            } else if (ptx.object.name.endsWith("Sheet")) {
              console.debug(
                `Intersection with hyperboloid at ${ptx.point.toFixed(
                  2
                )} with metric ${(x * x + y * y - z * z).toFixed(1)}`
              );
            } else if (ptx.object.name.endsWith("Plane")) {
              const sx = firstIntersection.point.x / firstIntersection.point.z;
              const sy = firstIntersection.point.y / firstIntersection.point.z;
              console.debug(
                `Intersection with plane Z = 1  at ${ptx.point.toFixed(
                  2
                )} with metric ${(sx * sx + sy * sy).toFixed(1)}`
              );
            }
            if (firstIntersection.object.name !== ptx.object.name) {
              auxLineIntersectionPoints[idx].position.copy(ptx.point);
              scene.add(auxLineIntersectionPoints[idx]);
            }
          });
        } else {
        }
      } else {
        scene.remove(auxLine);
      }
      if (controlKey.value) {
        // Need to use mouse intersection with a non-plane object
        const nonPlane = namedIntersections.find(obj => {
          // console.debug("Check ctrl intersect", obj.object.name);
          return !obj.object.name.endsWith("Plane");
        });
        if (nonPlane) {
          const planeXRotation = Math.atan2(nonPlane.point.y, nonPlane.point.z);
          planeDir2
            .set(0, Math.sin(planeXRotation), Math.cos(planeXRotation))
            .normalize();
          const newPath = new HyperbolaCurve(planeDir2);
          hyperTube.geometry.dispose();
          hyperTube.material.dispose();
          scene.remove(hyperTube);
          hyperTube = new Mesh(
            new TubeGeometry(newPath, 50, 0.03, 12, false),
            new THREE.MeshStandardMaterial({ color: "greenyellow" })
          );
          scene.add(hyperTube);
          const innerB =
            planeDir1.x * planeDir1.x +
            planeDir1.y * planeDir1.y -
            planeDir1.z * planeDir1.z;
          const innerA =
            planeDir2.x * planeDir2.x +
            planeDir2.y * planeDir2.y -
            planeDir2.z * planeDir2.z;
          const lambdaCoeff = Math.sqrt(-1 / innerA);
          // console.debug("Diag metrics", innerA, innerB, lambdaCoeff);
          planeDirArrow.setDirection(planeDir2);

          // console.debug(`Red plane rotation ${radToDeg(planeXRotation)}`);
          randomPlane.rotation.set(0, 0, 0);
          randomPlane.rotateX(Math.PI / 2 - planeXRotation);
          randomPlane.updateMatrixWorld();
          // intersectionGroup.clear();
          // intersectionGroup.rotation.set(0, 0, 0);
          // upperHyperboloidToPlaneMatrix
          //   .copy(randomPlane.matrixWorld)
          //   .invert()
          //   .multiply(upperHyperboloidMesh.matrixWorld);

          // WARNING: the boundary volume casting call is expensive!
          // upperPlaneGeometry.boundsTree?.bvhcast(
          //   upperHyperboloidGeometry.boundsTree!,
          //   upperHyperboloidToPlaneMatrix,
          //   bvhCastCallback
          // );
          // intersectionGroup.rotateX(Math.PI / 2 - planeXRotation);
        }
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
