import SETTINGS from "@/global-settings-hyperbolic";
import * as THREE from "three/webgpu";
import {
  positionWorld,
  dot,
  uniform,
  Discard,
  float,
  vec3,
  vec4,
  mat4,
  select,
  If,
  Fn,
  positionLocal,
  varying,
  materialReference,
  cond,
  color,
  stack,
  smoothstep,
  PI
} from "three/tsl";
// import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { Line2 } from "three/addons/lines/Line2.js";
import {
  Vector3,
  Mesh,
  DoubleSide,
  Plane,
  SphereGeometry,
  CylinderGeometry,
  Vector2,
  LineCurve3
} from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";

import { LineGeometry } from "three/examples/jsm/Addons.js";
import { grey } from "vuetify/util/colors";
import { smootherstep } from "three/src/math/MathUtils.js";
import { updateShorthandPropertyAssignment } from "typescript";
import { mx_bilerp_0 } from "three/src/nodes/materialx/lib/mx_noise.js";

const _intersectionPoint = new THREE.Vector3();

export function createPoint(
  size: number = 0.05,
  color: string = "white"
): Mesh {
  const lineMaterial = new THREE.MeshStandardNodeMaterial({
    color: color,
    roughness: 0.3
    //clippingPlanes: [minClippingPlane, maxClippingPlane] //No clipping planes for points
  });
  return new Mesh(new SphereGeometry(size), lineMaterial);
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
  upperZValue,
  lowerZValue,
  upper = true
}: {
  upperZValue: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  lowerZValue: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  upper?: boolean;
}): Mesh {
  const pointAtInfinityMaterial = new THREE.MeshPhysicalNodeMaterial({
    color: "blue",
    side: DoubleSide,
    transparent: true
  });

  const posFunc = Fn(() => {
    // Scale and translate the original tube segment {(x,y,z) | x^2 + y^2 = 1, 0<=z<=1 } to
    //  {(x,y,z) | x^2 + y^2 = z^2, lowerZValue <= z <= upperZValue}
    const transformedZ = positionLocal.z
      .mul(upperZValue.sub(lowerZValue))
      .add(lowerZValue);
    // Project the scaled and moved tube segment to the surface x^2 + y^2 = z^2
    return vec3(
      positionLocal.x.mul(transformedZ),
      positionLocal.y.mul(transformedZ),
      transformedZ
    );
  });

  pointAtInfinityMaterial.positionNode = posFunc();

  //Add opacity to the edges of the points at infinity
  pointAtInfinityMaterial.opacityNode = smoothstep(
    lowerZValue,
    lowerZValue.mul(1.01),
    positionLocal.z
  ).sub(smoothstep(upperZValue.mul(0.99), upperZValue, positionLocal.z));

  // path is the center line of the initial(untransformed) tube.
  const path = new LineCurve3(new Vector3(0, 0, 0), new Vector3(0, 0, 1));
  const geometry = new THREE.TubeGeometry(path, 64, 1, 128, false);

  const pointAtInfinityMesh = new Mesh(geometry, pointAtInfinityMaterial);

  // --- Override the raycast for the mesh otherwise the ray caster detects only the untransformed mesh---
  pointAtInfinityMesh.raycast = function (raycaster, intersects) {
    // Check the intersection of the ray with the transformed points at infinity
    const ox = raycaster.ray.origin.x;
    const oy = raycaster.ray.origin.y;
    const oz = raycaster.ray.origin.z;
    const dx = raycaster.ray.direction.x;
    const dy = raycaster.ray.direction.y;
    const dz = raycaster.ray.direction.z;

    // Expand substitutions for intersection of Ray P(t) with Cone Surface
    // (ox + t*dx)^2 + (oy + t*dy)^2 = (oz + t*dz)^2

    // A term (t^2)
    const A = dx * dx + dy * dy - dz * dz;

    // B term (t)
    const B = 2 * (ox * dx + oy * dy - oz * dz);

    // C term (constant)
    const C = ox * ox + oy * oy - oz * oz;

    // Solve the Quadratic
    const discriminant = B * B - 4 * A * C;

    if (discriminant < 0) return; // No intersection

    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-B - sqrtDisc) / (2 * A);
    const t2 = (-B + sqrtDisc) / (2 * A);

    // Check both solutions (entry and exit points)
    [t1, t2].forEach(t => {
      if (t < raycaster.near || t > raycaster.far) return;

      // Calculate intersection point in local space
      _intersectionPoint
        .copy(raycaster.ray.direction)
        .multiplyScalar(t)
        .add(raycaster.ray.origin);

      // Check that the ray intersects the cone in the correct strip
      if (
        _intersectionPoint.z < lowerZValue.value ||
        _intersectionPoint.z > upperZValue.value
      )
        return;

      const distance = raycaster.ray.origin.distanceTo(_intersectionPoint);

      intersects.push({
        distance: distance,
        point: _intersectionPoint,
        normal: _intersectionPoint
          .clone()
          .multiply(new Vector3(1, 1, -1))
          .normalize(),
        object: this,
        uv: new THREE.Vector2(0, _intersectionPoint.z) // Approximation for UV
      });
    });
  };

  return pointAtInfinityMesh;
}

export function createPolarGridCircle({
  intrinsicRadius, // The intrinsic hyperbolic radius
  zClip,
  thickness = 2, //pixels
  upper = true
}: {
  intrinsicRadius: number;
  zClip: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
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

  const geometry = new LineGeometry();
  geometry.setPositions(circlePoints);

  const lineMaterial = new THREE.Line2NodeMaterial({
    color: "grey",
    linewidth: thickness, // Width in pixels
    transparent: true
  });

  // THIS CLIPPING LOGIC DOESN'T WORK DESPITE BEING THE SAME AS FOR THE HYPERBOLOID SHEETS
  const colorNode = materialReference("color", "color");
  const clippingLogic = Fn(() => {
    if (upper) {
      positionLocal.z.greaterThan(zClip).discard(); // if upper sheet greater than zClip is discarded
    } else {
      positionLocal.z.lessThan(zClip).discard(); // if lower sheet less than zClip is discarded
    }
    return colorNode;
  });
  lineMaterial.colorNode = clippingLogic();

  // @ts-expect-error: Line2 constructor type definition is outdated for WebGPU materials
  const mesh = new Line2(geometry, lineMaterial);

  mesh.name = `PolarGridCircle_r=${intrinsicRadius.toFixed(2)}`;
  return mesh;
}

export function createPolarGridRadialLine({
  radianAngle,
  zClip,
  thickness = 2, //pixels
  upper = true
}: {
  radianAngle: number;
  zClip: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  thickness?: number;
  upper?: boolean;
}): {
  mesh: Mesh;
  zClipUpdateFunction: (newVal: number) => void;
} {
  const points: number[] = [];

  let nextTValue = 0.01;
  let myContinue = true;
  for (let i = 0; myContinue; i++) {
    if (nextTValue > Math.acosh(SETTINGS.maxZClip + 1.0)) {
      nextTValue = Math.acosh(SETTINGS.maxZClip + 1.0);
      // add one to zMax because the dolly max distance is sometimes exceeded when all the way zoomed out to allow for smooth zooming and motion. This way the clipping planes limit the display and very little extra (which is cut off by the clipping plane) is stored in the scene.
      myContinue = false;
    }
    points.push(
      Math.sinh(nextTValue) * Math.cos(radianAngle),
      Math.sinh(nextTValue) * Math.sin(radianAngle),
      (upper ? 1 : -1) * Math.cosh(nextTValue)
    );
    nextTValue += 0.01 * Math.exp(1.3 * nextTValue); //controls the spacing of the points along the hyperbolic radial line. The points on the radial do not need to be uniformly spaced in t - more points near zero are better for accuracy, because eventually the hyperboloid radial lines are almost linear.
  }

  const geometry = new LineGeometry();
  geometry.setPositions(points);

  const lineMaterial = new THREE.Line2NodeMaterial({
    linewidth: thickness, // Width in pixels
    transparent: true,
    color: "grey",
    blending: THREE.NormalBlending //If this is not set the radial lines near (0,0,1) looks whitish grey
  });

  // THIS CLIPPING LOGIC DOESN'T WORK THE NODE MESH IS VERY DIFFERENT THAN LINE NODE MATERIAL
  const colorNode = materialReference("color", "color");

  const clippingLogic = Fn(() => {
    let returnNode = color("grey");
    if (upper) {
      If(positionLocal.z.greaterThan(zClip), () => {
        returnNode = color("red"); // This never executes
      });
      //positionLocal.z.greaterThan(zClip).discard(); // if upper sheet greater than zClip is discarded
    } else {
      //return color("blue");
      positionLocal.z.lessThan(zClip).discard(); // if lower sheet less than zClip is discarded
    }
    return returnNode;
  });
  lineMaterial.fragmentNode = clippingLogic();

  // @ts-expect-error: Line2 constructor type definition is outdated for WebGPU materials
  const lineMesh = new Line2(geometry, lineMaterial);
  // lineMesh.computeLineDistances();

  return {
    mesh: lineMesh,
    zClipUpdateFunction: (newVal: number) => {
      console.log("Updating zClip to", newVal);
      zClip.value = newVal;
    }
  };
}

export function createHyperboloidSheet(
  zClip: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
  upper: boolean
): THREE.Mesh {
  const hyperboloidMaterial = new THREE.MeshPhysicalNodeMaterial({
    color: "chocolate",
    side: DoubleSide,
    metalness: 0.1,
    roughness: 0.2,
    opacity: 0.8,
    transparent: true,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });
  const baseColor = color(hyperboloidMaterial.color); //Chocolate

  //const zClip = uniform(zClipInitial);
  const localPositionZ = varying(positionLocal.z);

  const clippingLogic = Fn(() => {
    if (upper) {
      positionLocal.z.greaterThan(zClip).discard(); // if upper sheet greater then zClip is discarded
    } else {
      positionLocal.z.lessThan(zClip).discard(); // if lower sheet less then zClip is discarded
    }

    return baseColor.mul(1.2);
  });

  hyperboloidMaterial.colorNode = clippingLogic();

  // Smooth the opacity of the top edge of the hyperboloid
  hyperboloidMaterial.opacityNode = smoothstep(
    zClip.mul(SETTINGS.fadePercentage),
    zClip,
    localPositionZ
  )
    .oneMinus()
    .mul(float(SETTINGS.startOpacityFade).sub(float(SETTINGS.endOpacityFade)))
    .add(float(SETTINGS.endOpacityFade));

  const hyperboloidGeometry = new ParametricGeometry(
    upper ? upperHyperboloid : lowerHyperboloid,
    120,
    300
  );

  const hyperboloidMesh = new Mesh(hyperboloidGeometry, hyperboloidMaterial);

  return hyperboloidMesh;
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
  // // where u is the radial coordinate and v is the angular coordinate
  u = u * (Math.acosh(SETTINGS.maxZClip) + 1) + 0.001; // add one because the dolly max distance is sometimes exceeded when all the way zoomed out to allow for smooth zooming and motion. This way the clipping planes limit the display and very little extra (which is cut off by the clipping plane) is stored in the scene. Adding 0.001 to avoid clumping of points at the tip which causes rendering issues.
  const theta = v * 2 * Math.PI;
  const x = Math.sinh(u) * Math.cos(theta);
  const y = Math.sinh(u) * Math.sin(theta);
  const z = Math.cosh(u);
  pt.set(x, y, z);
}

// Parametric function for the lower sheet of the hyperboloid in polar coordinates 0 <= u <= 1 and 0 <= v <= 1
function lowerHyperboloid(u: number, v: number, pt: Vector3) {
  u = u * (Math.acosh(SETTINGS.maxZClip) + 1) + 0.001; // add one because the dolly max distance is sometimes exceeded when all the way zoomed out to allow for smooth zooming and motion. This way the clipping planes limit the display and very little extra (which is cut off by the clipping plane) is stored in the scene. Adding 0.001 to avoid clumping of points at the tip which causes rendering issues.
  const theta = v * 2 * Math.PI;
  const x = Math.sinh(u) * Math.cos(theta);
  const y = Math.sinh(u) * Math.sin(theta);
  const z = -Math.cosh(u);
  pt.set(x, y, z);
}
