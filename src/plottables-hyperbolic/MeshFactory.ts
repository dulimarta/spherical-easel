import SETTINGS from "@/global-settings-hyperbolic";
import * as THREE from "three/webgpu";
import {
  uniform,
  float,
  vec3,
  vec4,
  Fn,
  positionLocal,
  varying,
  smoothstep,
  attribute,
  uv,
  mix,
  color,
  modelWorldMatrix,
  rotate,
  sin,
  cos,
  mat3,
  sqrt,
  select,
  bool
} from "three/tsl";
// import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { Line2 } from "three/addons/lines/Line2.js";
import {
  Vector3,
  Mesh,
  DoubleSide,
  SphereGeometry,
  CylinderGeometry,
  LineCurve3,
  ConeGeometry
} from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { LineGeometry } from "three/examples/jsm/Addons.js";
import MathNode from "three/src/nodes/math/MathNode.js";

const rayCasterIntersectionPoint = new THREE.Vector3();

// The z coordinate of all points on the hyperboloid(s) are between zUpperClip and zLowerClip and their negations
export const zUpperClip = uniform(1.0, "float");
export const zLowerClip = uniform(-1.0, "float");

// The z coordinate of all point of the upperPointsAtInfinity are between zUpperPAIClipPlus and zUpperPAIClipMinus,
export const zUpperPAIClipPlus = uniform(2.0, "float");
export const zUpperPAIClipMinus = uniform(1.5, "float");

// The z coordinate of all point of the lowerPointsAtInfinity are between zLowerPAIClipPlus and zLowerPAIClipMinus,
export const zLowerPAIClipPlus = uniform(-1.5, "float");
export const zLowerPAIClipMinus = uniform(2.0, "float");

export const unitLength: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>> =
  uniform(1.0, "float");

interface CustomMaterialUserData {
  angle: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  radius: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  height: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  upper: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; // we must use 1/0 for true/false because TSL doesn't recognize boolean wrapped uniforms
  position: THREE.TSL.ShaderNodeObject<THREE.UniformNode<THREE.Vector3>>;
}

export class CustomNodeMaterial extends THREE.MeshStandardNodeMaterial {
  declare userData: CustomMaterialUserData;
  constructor(parameters: THREE.MeshStandardNodeMaterialParameters) {
    super(parameters);
    this.userData = {
      angle: uniform(0.0, "float"),
      radius: uniform(1.0, "float"),
      height: uniform(1.0, "float"),
      upper: uniform(1, "uint"),
      position: uniform(new Vector3(0, 0, 0), "vec3")
    };
  }
  get angle(): number {
    return this.userData.angle.value;
  }
  set angle(value: number) {
    this.userData.angle.value = value;
  }
  get radius(): number {
    return this.userData.radius.value;
  }
  set radius(value: number) {
    this.userData.radius.value = value;
  }
  get height(): number {
    return this.userData.height.value;
  }
  set height(value: number) {
    this.userData.height.value = value;
  }
  // get upper(): number {
  //   return this.userData.upper.value === 1;
  // }
  set upper(value: number) {
    this.userData.upper.value = value ? 1 : 0;
  }
  get position(): THREE.Vector3 {
    return this.userData.position.value;
  }
  set position(value: THREE.Vector3) {
    this.userData.position.value = value;
  }
}

export function createPoint(
  radiusNumber: number = 0.1,
  color: string = "white",
  name: string = "tempPoint"
): Mesh {
  const sphereMaterial = new CustomNodeMaterial({
    color: color,
    roughness: 0.3
  });
  const position = sphereMaterial.userData.position;
  const radius = sphereMaterial.userData.radius;
  radius.value = radiusNumber;

  sphereMaterial.positionNode = positionLocal
    .mul(unitLength)
    .mul(radius)
    .add(position);

  const returnMesh = new Mesh(new SphereGeometry(), sphereMaterial);

  returnMesh.name = name;

  // returnMesh.raycast = function (raycaster, intersects) {
  //   intersects.push({
  //       distance: distance,
  //       point: rayCasterIntersectionPoint.clone(),
  //       normal: rayCasterIntersectionPoint
  //         .clone()
  //         .multiply(new Vector3(-1, -1, 1)) //inward pointing normal
  //         .normalize(),
  //       object: this
  // }

  return returnMesh;
}

export function createPointAtInfinity(
  upper: number = 1, // we must use 1/0 for true/false because TSL doesn't recognize boolean wrapped uniforms
  angle: number = 0,
  radius: number = 0.18, // in multiples of the unit length
  height: number = 0.33, //  in multiples of the unit length
  myColor: string = "red",
  name: string = "tempPointAtInfinity"
): Mesh {
  const coneMaterial = new CustomNodeMaterial({
    color: myColor,
    opacity: 1.0
  });
  const angleUniform = coneMaterial.userData.angle;
  const radiusUniform = coneMaterial.userData.radius;
  const heightUniform = coneMaterial.userData.height;
  const upperUniform = coneMaterial.userData.upper;
  angleUniform.value = angle;
  radiusUniform.value = radius;
  heightUniform.value = height;
  upperUniform.value = upper;

  coneMaterial.positionNode = Fn(() => {
    const scaleAndTranslate = positionLocal
      .add(vec3(0, 0.5, 0))
      .mul(
        vec3(
          radiusUniform.mul(unitLength),
          heightUniform.mul(unitLength),
          radiusUniform.mul(unitLength)
        )
      )
      .add(vec3(0, zUpperPAIClipMinus.mul(Math.SQRT2), 0));

    const minusPlusOne = select(upperUniform.equal(1), float(-1.0), float(1.0));
    // ca -sa 0        1   0     0
    // sa  ca 0    *   0  c+/-45   -s+/-45
    // 0   0  1        0  s+/-45    c+/-45

    const rotationMatrixAboutZAxis = zAxisRotationMatrix([
      float(Math.PI / 2).sub(angleUniform)
    ]);

    const rotationMatrixAboutXAxis = xAxisRotationMatrix([
      float(Math.PI / 4).mul(minusPlusOne)
    ]);
    // return scaleAndTranslate;
    // return rotationMatrixAboutXAxis.mul(scaleAndTranslate);

    return rotationMatrixAboutZAxis
      .mul(rotationMatrixAboutXAxis)
      .mul(scaleAndTranslate);
  })();

  const returnMesh = new Mesh(new ConeGeometry(), coneMaterial);
  returnMesh.name = name;
  return returnMesh;
}
export function create2DLine(width: number = 0.03, color: string = "white") {
  return new Mesh(
    new CylinderGeometry(width, width, 1),
    new THREE.MeshStandardNodeMaterial({ color })
  );
}
/**
 * Creates the cone on which the points at infinity lie, the  portion of the cone representing the points at infinity are between the given clipping planes.
 * @param param0
 * @returns
 */
export function createPointsAtInfinityStrip({
  upper
}: {
  upper: boolean;
}): Mesh {
  const pointAtInfinityMaterial = new THREE.MeshPhysicalNodeMaterial({
    color: "blue",
    side: DoubleSide,
    transparent: true
  });

  const posFunc = Fn(() => {
    // Scale and translate the original tube segment {(x,y,z) | x^2 + y^2 = 1, 0<=z<=1 } to
    //  {(x,y,z) | x^2 + y^2 = z^2, lowerZValue <= z <= upperZValue}
    const upperZValue = upper ? zUpperPAIClipPlus : zLowerPAIClipPlus;
    const lowerZValue = upper ? zUpperPAIClipMinus : zLowerPAIClipMinus;
    const transformedZ = positionLocal.z
      .mul(upperZValue.sub(lowerZValue))
      .add(lowerZValue);

    return vec3(
      positionLocal.x.mul(transformedZ),
      positionLocal.y.mul(transformedZ),
      transformedZ
    );
  });

  pointAtInfinityMaterial.positionNode = posFunc();

  // Add opacity to the edges of the points at infinity strip
  const opacityAtEdges = 0.7;
  const percentOfEdgeReduceInOpacity = 0.005;

  if (upper) {
    pointAtInfinityMaterial.opacityNode = smoothstep(
      zUpperPAIClipMinus,
      zUpperPAIClipMinus.mul(1 + percentOfEdgeReduceInOpacity),
      positionLocal.z
    )
      .mul(1 - opacityAtEdges)
      .sub(
        smoothstep(
          zUpperPAIClipPlus.mul(1 - percentOfEdgeReduceInOpacity),
          zUpperPAIClipPlus,
          positionLocal.z
        ).mul(1 - opacityAtEdges)
      )
      .add(opacityAtEdges);
  } else {
    pointAtInfinityMaterial.opacityNode = smoothstep(
      zLowerPAIClipPlus,
      zLowerPAIClipPlus.mul(1 + percentOfEdgeReduceInOpacity),
      positionLocal.z
    )
      .mul(1 - opacityAtEdges)
      .sub(
        smoothstep(
          zLowerPAIClipMinus.mul(1 - percentOfEdgeReduceInOpacity),
          zLowerPAIClipMinus,
          positionLocal.z
        ).mul(1 - opacityAtEdges)
      )
      .add(opacityAtEdges);
  }

  // path is the center line of the initial(untransformed) tube.
  const path = new LineCurve3(new Vector3(0, 0, 0), new Vector3(0, 0, 1));
  const geometry = new THREE.TubeGeometry(path, 64, 1, 128, false);

  const pointAtInfinityMesh = new Mesh(geometry, pointAtInfinityMaterial);

  // --- Override the raycast for the mesh otherwise the ray caster detects only the untransformed mesh---
  pointAtInfinityMesh.raycast = function (raycaster, intersects) {
    const partialIntersects = intersectWithPointAtInfinityStrip(
      raycaster,
      upper
    );
    partialIntersects.forEach(obj =>
      intersects.push({
        distance: obj.distance,
        point: obj.point,
        normal: obj.normal,
        object: this
      })
    );
  };

  return pointAtInfinityMesh;
}

export function createPolarGridCircle({
  intrinsicRadius, // The intrinsic hyperbolic radius
  upper,
  thickness = 3 //pixels
}: {
  intrinsicRadius: number;
  upper: boolean;
  thickness?: number;
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
    transparent: true,
    blending: THREE.NormalBlending,
    alphaTest: 0.1,
    depthTest: true,
    depthWrite: true
    // polygonOffset: true, // attempt to limit z fighting when polar angle is 0 or pi
    // polygonOffsetFactor: -1.0, // Nudge the line toward the camera
    // polygonOffsetUnits: -4.0 // Higher value = more aggressive nudge
  });

  // Clipping Logic -- line2NodeMaterial is really just a center line that is
  // thickened with quadrilaterals. It is the union of a series of instances,
  // each of which is a quadrilateral (= two triangles with a common edge
  // (diagonal)), with a center line down the middle. The vertices of the quad
  // are determined by moving perpendicular to the center line half the
  // thickness of the line material (in pixels). uv coordinates are the
  // coordinates of a location in the quad. I know that uv().y goes from -1 to
  // 1. I'm not sure about the uv().x range. Each vertex of the quad has the
  // (same) instanceStart and instanceEnd data associated to it so doesn't
  // matter which vertex you get this information from. In this case all the z
  // coordinates of the instanceStart and instanceEnd along circular line are
  // the same so it doesn't matter which you choose

  const instanceStart = attribute("instanceStart", "vec3");
  const varyingInstanceStartLocal = varying(instanceStart);
  const worldInstanceStartZ = modelWorldMatrix.mul(
    vec4(varyingInstanceStartLocal, 1.0)
  ).z;
  const clippingLogic = Fn(() => {
    // discard any instances that start/end after/before zClip
    const shouldClip = upper
      ? worldInstanceStartZ.greaterThan(zUpperClip)
      : worldInstanceStartZ.lessThan(zLowerClip);
    shouldClip.discard();

    return float(1.0);
  });

  // Apply to your material
  lineMaterial.opacityNode = clippingLogic();

  // @ts-expect-error: Line2 constructor type definition is outdated for WebGPU materials
  const mesh = new Line2(geometry, lineMaterial);

  mesh.name = `PolarGridCircle_r=${intrinsicRadius.toFixed(2)}`;
  return mesh;
}

export function createPolarGridRadialLine({
  radianAngle,
  upper,
  thickness = 3 //pixels
}: {
  radianAngle: number;
  upper: boolean;
  thickness?: number;
}): Mesh {
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
    blending: THREE.NormalBlending, //If this is not set the radial lines near (0,0,1) looks whitish grey
    alphaTest: 0.1,
    depthTest: true,
    depthWrite: true
    // polygonOffset: true, // attempt to limit z fighting when polar angle is 0 or pi
    // polygonOffsetFactor: -1.0, // Nudge the line toward the camera
    // polygonOffsetUnits: -4.0 // Higher value = more aggressive nudge
  });

  // Clipping Logic
  // First get the instance data and use the varying to make the vertex data
  // available to the fragment shader (which includes the color and opacity nodes)
  const instanceStart = attribute("instanceStart", "vec3");
  const instanceEnd = attribute("instanceEnd", "vec3");
  const varyingInstanceStartLocal = varying(instanceStart);
  const varyingInstanceEndLocal = varying(instanceEnd);

  const clippingLogic = Fn(() => {
    //compute the intermediate location in local coords then transform to world
    // The uv().y is the direction corresponding to the z direction of
    // the rendering of the quad (i.e. two triangles with a common edge)
    const intermediatePositionLocal = mix(
      varyingInstanceStartLocal,
      varyingInstanceEndLocal,
      uv().y.add(1.0).div(2.0) // uv().y  goes from -1 to 1 and NOT 0 to 1 as expected!
    );
    const intermediatePositionWorldZ = modelWorldMatrix.mul(
      vec4(intermediatePositionLocal, 1.0)
    ).z;
    const clipPixel = upper
      ? intermediatePositionWorldZ.greaterThan(zUpperClip)
      : intermediatePositionWorldZ.lessThan(zLowerClip);
    clipPixel.discard();

    const returnSmooth = upper
      ? smoothstep(
          zUpperClip.mul(SETTINGS.fadePercentage),
          zUpperClip,
          intermediatePositionWorldZ
        )
      : smoothstep(
          zLowerClip.mul(SETTINGS.fadePercentage),
          zLowerClip,
          intermediatePositionWorldZ
        );

    return returnSmooth
      .oneMinus()
      .mul(float(SETTINGS.startOpacityFade).sub(float(SETTINGS.endOpacityFade)))
      .add(float(SETTINGS.endOpacityFade));
  });

  // Apply to your material
  lineMaterial.opacityNode = clippingLogic();

  // @ts-expect-error: Line2 constructor type definition is outdated for WebGPU materials
  const lineMesh = new Line2(geometry, lineMaterial);
  // lineMesh.computeLineDistances();

  return lineMesh;
}

export function createHyperboloidSheet({
  upper
}: {
  upper: boolean;
}): THREE.Mesh {
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
      positionLocal.z.greaterThan(upper ? zUpperClip : zLowerClip).discard();
    } else {
      positionLocal.z.lessThan(upper ? zUpperClip : zLowerClip).discard();
    }

    return baseColor.mul(1.2);
  });

  hyperboloidMaterial.colorNode = clippingLogic();

  // Smooth the opacity of the top edge of the hyperboloid
  hyperboloidMaterial.opacityNode = smoothstep(
    (upper ? zUpperClip : zLowerClip).mul(SETTINGS.fadePercentage),
    upper ? zUpperClip : zLowerClip,
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

  hyperboloidMesh.raycast = function (raycaster, intersects) {
    const partialIntersects = intersectWithHyperboloid(raycaster, upper);
    partialIntersects.forEach(obj =>
      intersects.push({
        distance: obj.distance,
        point: obj.point,
        normal: obj.normal,
        object: this
      })
    );
  };

  return hyperboloidMesh;
}

// export function createBoundaryCone({
//   clippingPlane,
//   maxZClippingHeight,
//   upper = true
// }: {
//   clippingPlane: Plane;
//   maxZClippingHeight: number;
//   upper?: boolean;
// }): Mesh {
//   const coneMaterial = new THREE.MeshPhysicalNodeMaterial({
//     color: 0x88ccff, // base color
//     roughness: 0.0, // very smooth surface
//     transmission: 0.5, // glasslike transparency
//     thickness: 0.05, // thin glass layer (in world units)
//     ior: 1.45, // index of refraction of glass
//     transparent: true, // must enable for opacity/transmission
//     opacity: 1.0, // keep at 1, transparency handled via transmission
//     metalness: 0.0,
//     // reflectivity: 0.15, // helps glass reflections
//     // clearcoat: 1.0, // improves highlight realism
//     // clearcoatRoughness: 0.05,
//     // specularIntensity: 0.2,
//     //soap bubble" thin-film interferences
//     // iridescence: 1.0,
//     // iridescenceIOR: 1.3,
//     // iridescenceThicknessRange: [50, 150], // in nanometers
//     clippingPlanes: [clippingPlane]
//   });

//   const coneGeometry = new ParametricGeometry(
//     (u, v, out) => {
//       let r = u * maxZClippingHeight * (upper ? 1 : -1); // 0 to +/-maxZClippingHeight
//       if (r == 0) {
//         r = 0.0001 * (upper ? 1 : -1); // avoid singularity at the tip
//       }
//       const theta = v * 2 * Math.PI;
//       // This is how points on the hyperboloid are calculated
//       // u = u * (Math.acosh(maxZClippingHeight) + 1);
//       // const x = Math.sinh(u) * Math.cos(theta);
//       // const y = Math.sinh(u) * Math.sin(theta);
//       // const z = Math.cosh(u);

//       const x = r * Math.cos(theta);
//       const y = r * Math.sin(theta);
//       const z = r + 0.001; // small offset to avoid z-fighting with hyperboloid
//       out.set(x, y, z);
//     },
//     120,
//     300
//   );
//   coneMaterial.depthWrite = false; // try to avoid z-fighting with hyperboloid
//   const coneMesh = new Mesh(coneGeometry, coneMaterial);

//   return coneMesh;
// }

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

type partialIntersectionType = {
  distance: number;
  point: Vector3;
  normal: Vector3;
};

function intersectWithHyperboloid(
  raycaster: THREE.Raycaster,
  upper: boolean
): partialIntersectionType[] {
  const intersects: partialIntersectionType[] = [];
  // Check the intersection of the ray with the hyperboloid
  const ox = raycaster.ray.origin.x;
  const oy = raycaster.ray.origin.y;
  const oz = raycaster.ray.origin.z;
  const dx = raycaster.ray.direction.x;
  const dy = raycaster.ray.direction.y;
  const dz = raycaster.ray.direction.z;

  // Expand substitutions for intersection of Ray P(t) with hyperboloid
  // (oz + t*dz)^2 - (ox + t*dx)^2 - (oy + t*dy)^2  -1 = 0

  // A term (t^2)
  const A = dz * dz - dx * dx - dy * dy;

  // B term (t)
  const B = 2 * (oz * dz - ox * dx - oy * dy);

  // C term (constant)
  const C = oz * oz - ox * ox - oy * oy - 1;

  // Solve the Quadratic
  const discriminant = B * B - 4 * A * C;

  if (discriminant < 0) return []; // No real intersection

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-B - sqrtDisc) / (2 * A);
  const t2 = (-B + sqrtDisc) / (2 * A);

  // Check both solutions (entry and exit points)
  [t1, t2].forEach(t => {
    if (t < raycaster.near || t > raycaster.far) return;

    // Calculate intersection point in world space
    rayCasterIntersectionPoint
      .copy(raycaster.ray.direction)
      .multiplyScalar(t)
      .add(raycaster.ray.origin);

    // Check that the ray intersects the hyperboloid where it is drawn
    if (upper) {
      if (
        rayCasterIntersectionPoint.z > zUpperClip.value ||
        rayCasterIntersectionPoint.z < 0
      ) {
        return;
      }
    } else {
      if (
        rayCasterIntersectionPoint.z < zLowerClip.value ||
        rayCasterIntersectionPoint.z > 0
      ) {
        return;
      }
    }

    const distance = raycaster.ray.origin.distanceTo(
      rayCasterIntersectionPoint
    );

    intersects.push({
      distance: distance,
      point: rayCasterIntersectionPoint.clone(),
      normal: rayCasterIntersectionPoint
        .clone()
        .multiply(new Vector3(-1, -1, 1)) // always the inward pointing normal
        .normalize()
    });
  });
  return intersects;
}

function intersectWithPointAtInfinityStrip(
  raycaster: THREE.Raycaster,
  upper: boolean
): partialIntersectionType[] {
  const intersects: partialIntersectionType[] = [];
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

  if (discriminant < 0) return []; // No intersection

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-B - sqrtDisc) / (2 * A);
  const t2 = (-B + sqrtDisc) / (2 * A);

  // Check both solutions (entry and exit points)
  [t1, t2].forEach(t => {
    if (t < raycaster.near || t > raycaster.far) return;

    // Calculate intersection point in world space
    rayCasterIntersectionPoint
      .copy(raycaster.ray.direction)
      .multiplyScalar(t)
      .add(raycaster.ray.origin);
    // console.log(
    //   "POIraycast, disc>0",
    //   t,
    //   rayCasterIntersectionPoint.toFixed(2),
    //   lowerZValue.value,
    //   upperZValue.value
    // );
    // Check that the ray intersects the cone in the correct strip
    const upperZValue = upper ? zUpperPAIClipPlus : zLowerPAIClipPlus;
    const lowerZValue = upper ? zUpperPAIClipMinus : zLowerPAIClipMinus;
    if (
      rayCasterIntersectionPoint.z < lowerZValue.value ||
      rayCasterIntersectionPoint.z > upperZValue.value
    ) {
      return;
    }

    const distance = raycaster.ray.origin.distanceTo(
      rayCasterIntersectionPoint
    );

    intersects.push({
      distance: distance,
      point: rayCasterIntersectionPoint.clone(),
      normal: rayCasterIntersectionPoint
        .clone()
        .multiply(new Vector3(-1, -1, 1)) //inward pointing normal
        .normalize()
    });
  });
  return intersects;
}

// The hyperbolic distance between two points on the same sheet of the hyperboloid, null if on different sheets
function h2Distance(point1: Vector3, point2: Vector3): number | null {
  if (point1.z * point2.z < 0) {
    return null; // the points are on different sheets so there is no distance between them
  }
  return Math.acosh(
    -point1.x * point2.x - point1.y * point2.y + point1.z * point2.z
  );
}

//The TSL formulation of a 3 x 3 rotation matrix about an axis (UNIT!) by an angle
const arbitraryAxisRotationMatrix = Fn(
  ([vectorAxis, angle]: [
    THREE.TSL.ShaderNodeObject<THREE.Node>,
    THREE.TSL.ShaderNodeObject<THREE.Node>
  ]) => {
    const axis = vectorAxis.normalize();
    const s = sin(angle);
    const c = cos(angle);
    const t = c.oneMinus();
    return mat3(
      t.mul(axis.x).mul(axis.x).add(c),
      t.mul(axis.x).mul(axis.y).sub(axis.z.mul(s)),
      t.mul(axis.x).mul(axis.z).add(axis.y.mul(s)),

      t.mul(axis.y).mul(axis.x).add(axis.z.mul(s)),
      t.mul(axis.y).mul(axis.y).add(c),
      t.mul(axis.y).mul(axis.z).sub(axis.x.mul(s)),

      t.mul(axis.z).mul(axis.x).sub(axis.y.mul(s)),
      t.mul(axis.z).mul(axis.y).add(axis.x.mul(s)),
      t.mul(axis.z).mul(axis.z).add(c)
    );
  }
) as unknown as (
  args: THREE.TSL.ShaderNodeObject<THREE.Node>[]
) => THREE.TSL.ShaderNodeObject<THREE.Node>;

const xAxisRotationMatrix = Fn(
  ([angle]: [THREE.TSL.ShaderNodeObject<THREE.Node>]) => {
    const s = sin(angle);
    const c = cos(angle);
    return mat3(
      float(1.0),
      float(0.0),
      float(0.0),
      float(0.0),
      c,
      s.negate(),
      float(0.0),
      s,
      c
    );
  }
) as unknown as (
  args: THREE.TSL.ShaderNodeObject<THREE.Node>[]
) => THREE.TSL.ShaderNodeObject<THREE.Node>;

const zAxisRotationMatrix = Fn(
  ([angle]: [THREE.TSL.ShaderNodeObject<THREE.Node>]) => {
    const s = sin(angle);
    const c = cos(angle);
    return mat3(
      c,
      s.negate(),
      float(0.0),
      s,
      c,
      float(0.0),
      float(0.0),
      float(0.0),
      float(1.0)
    );
  }
) as unknown as (
  args: THREE.TSL.ShaderNodeObject<THREE.Node>[]
) => THREE.TSL.ShaderNodeObject<THREE.Node>;

const yAxisRotationMatrix = Fn(
  ([angle]: [THREE.TSL.ShaderNodeObject<THREE.Node>]) => {
    const s = sin(angle);
    const c = cos(angle);
    return mat3(
      c,
      float(0.0),
      s,
      float(0.0),
      float(1.0),
      float(0.0),
      s.negate(),
      float(0.0),
      c
    );
  }
) as unknown as (
  args: THREE.TSL.ShaderNodeObject<THREE.Node>[]
) => THREE.TSL.ShaderNodeObject<THREE.Node>;
