import SETTINGS from "@/global-settings-hyperbolic";
import * as THREE from "three/webgpu";
import { color, texture, uv, time } from "three/tsl";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { THREESubset } from "camera-controls/dist/types";
import {
  Vector3,
  Mesh,
  DoubleSide,
  Plane,
  SphereGeometry,
  CylinderGeometry,
  MeshStandardMaterialParameters,
  Vector2
} from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { error } from "happy-dom/lib/PropertySymbol";

export function createPoint(
  size: number = 0.05,
  color: string = "white"
): Mesh {
  const material = new THREE.MeshStandardNodeMaterial({
    color: color,
    roughness: 0.3
    //clippingPlanes: [minClippingPlane, maxClippingPlane] //No clipping planes for points
  });
  return new Mesh(new SphereGeometry(size), material);
}

export function create2DLine(width: number = 0.03, color: string = "white") {
  return new Mesh(
    new CylinderGeometry(width, width, 1),
    new THREE.MeshStandardNodeMaterial({ color })
  );
}
// The problem with this that the raycaster will rarely hit the line mesh because the line is rendered infinitesimally thin in 3D space.
// export function createPointsAtInfinity({
//   zHeight,
//   thickness = 10
// }: {
//   zHeight: number;
//   thickness?: number;
// }): Mesh {
//   const circlePoints: number[] = [];
//   const error = 0.004; // maximum allowable error (as a world space distance) in the linear segments approximating the circle
//   // Calculate number of points needed to achieve the desired maximum error in linear approximation of circle
//   const numPoints = Math.ceil(Math.PI / Math.acos(1 - error / zHeight));
//   // Build the path
//   for (let angle = 0; angle < 2 * Math.PI; angle += (2 * Math.PI) / numPoints) {
//     circlePoints.push(
//       zHeight * Math.cos(angle),
//       zHeight * Math.sin(angle),
//       zHeight
//     );
//   }
//   // Close the circle
//   circlePoints.push(circlePoints[0], circlePoints[1], circlePoints[2]);

//   const pointsAtInfinityGeometry = new LineGeometry();
//   pointsAtInfinityGeometry.setPositions(circlePoints);

//   const pointsAtInfinityMaterial = new LineMaterial({
//     color: "blue",
//     linewidth: thickness, // Width in pixels
//     resolution: new Vector2(window.innerWidth, window.innerHeight),
//     transparent: false
//   });

//   const mesh = new Mesh(
//     pointsAtInfinityGeometry,
//     //customShaderMaterial
//     pointsAtInfinityMaterial
//   );

//   return mesh;
// }

/**
 * Creates the cone on which the points at infinity lie, the  portion of the cone representing the points at infinity are between the given clipping planes.
 * @param param0
 * @returns
 */
export function createPointsAtInfinity({
  maxZClippingHeight,
  clippingPlanes,
  upper = true
}: {
  maxZClippingHeight: number;
  clippingPlanes: Plane[];
  upper?: boolean;
}): Mesh {
  const coneMaterial = new THREE.MeshPhysicalNodeMaterial({
    color: "blue",
    clippingPlanes: clippingPlanes,
    side: DoubleSide
  });

  const coneGeometry = new ParametricGeometry(
    (u, v, out) => {
      let r = u * maxZClippingHeight * (upper ? 1 : -1); // 0 to +/-maxZClippingHeight
      if (r == 0) {
        r = 0.0001 * (upper ? 1 : -1); // avoid singularity at the tip
      }
      const theta = v * 2 * Math.PI;
      // This is how points on the hyperboloid are calculated
      // u = u * (Math.acosh(maxZClippingHeight) + 1);
      // const x = Math.sinh(u) * Math.cos(theta);
      // const y = Math.sinh(u) * Math.sin(theta);
      // const z = Math.cosh(u);

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = r;
      out.set(x, y, z);
    },
    120,
    300
  );
  const coneMesh = new Mesh(coneGeometry, coneMaterial);

  return coneMesh;
}

export function createPolarGridCircle({
  intrinsicRadius, // The intrinsic hyperbolic radius
  clippingPlane,
  thickness = 2, //pixels
  upper = true
}: {
  intrinsicRadius: number;
  clippingPlane: Plane;
  thickness?: number;
  upper?: boolean;
}): Mesh {
  const circlePoints: number[] = [];
  // Calculate number of points needed to achieve the desired maximum error in linear approximation of circle
  const error = 0.004; // maximum allowable error (as a world space distance) in the linear segments approximating the circle
  const numPoints = Math.ceil(
    Math.PI / Math.acos(1 - error / Math.sinh(intrinsicRadius))
  );

  // Build the path
  for (let angle = 0; angle < 2 * Math.PI; angle += (2 * Math.PI) / numPoints) {
    circlePoints.push(
      Math.sinh(intrinsicRadius) * Math.cos(angle),
      Math.sinh(intrinsicRadius) * Math.sin(angle),
      upper ? Math.cosh(intrinsicRadius) : -Math.cosh(intrinsicRadius)
    );
  }
  // Close the circle
  circlePoints.push(circlePoints[0], circlePoints[1], circlePoints[2]);

  // const geometry = new LineGeometry();
  // geometry.setPositions(circlePoints);

  // const material = new LineMaterial({
  //   color: "grey",
  //   linewidth: thickness, // Width in pixels
  //   resolution: new Vector2(window.innerWidth, window.innerHeight),
  //   clippingPlanes: [clippingPlane],
  //   transparent: false
  // });

  // const mesh = new Mesh(geometry, material);
  const mesh = new Mesh(
    new CylinderGeometry(thickness, thickness, 1),
    new THREE.MeshStandardNodeMaterial({ color: "white" })
  );
  mesh.name = `PolarGridCircle_r=${intrinsicRadius.toFixed(2)}`;
  return mesh;
}

export function createPolarGridRadialLine({
  radianAngle,
  zMax, // maximum z height of the radial line
  clippingPlane,
  thickness = 2, // in pixels
  upper = true
}: {
  radianAngle: number;
  zMax: number;
  clippingPlane: Plane;
  thickness?: number;
  upper?: boolean;
}): Mesh {
  const points: number[] = [];

  let nextTValue = 0;
  let myContinue = true;
  for (let i = 0; myContinue; i++) {
    if (nextTValue > Math.acosh(zMax + 1.0)) {
      nextTValue = Math.acosh(zMax + 1.0);
      // add one to zMax because the dolly max distance is sometimes exceeded when all the way zoomed out to allow for smooth zooming and motion. This way the clipping planes limit the display and very little extra (which is cut off by the clipping plane) is stored in the scene.
      myContinue = false;
    }
    points.push(
      Math.sinh(nextTValue) * Math.cos(radianAngle),
      Math.sinh(nextTValue) * Math.sin(radianAngle),
      upper ? Math.cosh(nextTValue) : -Math.cosh(nextTValue)
    );
    nextTValue += 0.01 * Math.exp(1.3 * nextTValue); //controls the spacing of the points along the hyperbolic radial line. The points on the radial do not need to be uniformly spaced in t - more points near zero are better for accuracy, because eventually the hyperboloid radial lines are almost linear.
  }

  const lineMesh = new Mesh(
    new CylinderGeometry(thickness, thickness, 1),
    new THREE.MeshStandardNodeMaterial({ color: "white" })
  );
  // const lineMesh = new Line2(geometry, material);
  //const mesh = new Mesh(geometry, material);
  lineMesh.name = `PolarGridRadialLine_angle=${radianAngle.toFixed(2)}`;

  return lineMesh;
}

export function createHyperboloidSheet({
  clippingPlane,
  maxZClippingHeight,
  upper = true
}: {
  clippingPlane: Plane;
  maxZClippingHeight: number;
  upper?: boolean;
}): Mesh {
  const hyperboloidMaterialParameters: MeshStandardMaterialParameters = {
    color: "chocolate",
    side: DoubleSide,
    roughness: 0.2,
    transparent: true,
    opacity: 0.75,
    clippingPlanes: [clippingPlane]
  };

  const hyperboloidMaterial = new THREE.MeshStandardNodeMaterial(
    hyperboloidMaterialParameters
  );

  const hyperboloidGeometry = new ParametricGeometry(
    upper ? upperHyperboloid : lowerHyperboloid,
    120,
    300
  );

  const hyperboloidMesh = new Mesh(
    hyperboloidGeometry,
    hyperboloidMaterial //new MeshStandardMaterial(hyperboloidMaterial)
  );

  return hyperboloidMesh;

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
}

export function createBoundaryCone({
  clippingPlane,
  maxZClippingHeight,
  upper = true
}: {
  clippingPlane: Plane;
  maxZClippingHeight: number;
  upper?: boolean;
}): Mesh {
  const coneMaterial = new THREE.MeshPhysicalNodeMaterial({
    color: 0x88ccff, // base color
    roughness: 0.0, // very smooth surface
    transmission: 0.5, // glasslike transparency
    thickness: 0.05, // thin glass layer (in world units)
    ior: 1.45, // index of refraction of glass
    transparent: true, // must enable for opacity/transmission
    opacity: 1.0, // keep at 1, transparency handled via transmission
    metalness: 0.0,
    // reflectivity: 0.15, // helps glass reflections
    // clearcoat: 1.0, // improves highlight realism
    // clearcoatRoughness: 0.05,
    // specularIntensity: 0.2,
    //soap bubble" thin-film interferences
    // iridescence: 1.0,
    // iridescenceIOR: 1.3,
    // iridescenceThicknessRange: [50, 150], // in nanometers
    clippingPlanes: [clippingPlane]
  });

  const coneGeometry = new ParametricGeometry(
    (u, v, out) => {
      let r = u * maxZClippingHeight * (upper ? 1 : -1); // 0 to +/-maxZClippingHeight
      if (r == 0) {
        r = 0.0001 * (upper ? 1 : -1); // avoid singularity at the tip
      }
      const theta = v * 2 * Math.PI;
      // This is how points on the hyperboloid are calculated
      // u = u * (Math.acosh(maxZClippingHeight) + 1);
      // const x = Math.sinh(u) * Math.cos(theta);
      // const y = Math.sinh(u) * Math.sin(theta);
      // const z = Math.cosh(u);

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = r + 0.001; // small offset to avoid z-fighting with hyperboloid
      out.set(x, y, z);
    },
    120,
    300
  );
  coneMaterial.depthWrite = false; // try to avoid z-fighting with hyperboloid
  const coneMesh = new Mesh(coneGeometry, coneMaterial);

  return coneMesh;
}
