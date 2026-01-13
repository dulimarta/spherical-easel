import SETTINGS from "@/global-settings-hyperbolic";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { THREESubset } from "camera-controls/dist/types";
import {
  Vector3,
  Mesh,
  ShaderMaterial,
  Uniform,
  DoubleSide,
  Plane,
  CurvePath,
  CubicBezierCurve3,
  TubeGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  CylinderGeometry,
  LineCurve3,
  MeshStandardMaterialParameters,
  Vector2,
  MeshPhysicalMaterial
} from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { error } from "happy-dom/lib/PropertySymbol";

export function createPoint(
  size: number = 0.05,
  color: string = "white"
): Mesh {
  return new Mesh(
    new SphereGeometry(size),
    new MeshStandardMaterial({ color })
  );
}

export function create2DLine(width: number = 0.03, color: string = "white") {
  return new Mesh(
    new CylinderGeometry(width, width, 1),
    new MeshStandardMaterial({ color })
  );
}

export function createPointsAtInfinity({
  zRadius,
  zPosition,
  // numPoints = 100,
  thickness = 10,
  center = { x: 0, y: 0 },
  upper = true
}: {
  zRadius: number;
  zPosition: number;
  //numPoints?: number;
  thickness?: number;
  center?: { x: number; y: number };
  clippingPlanes?: Array<Plane>;
  upper?: boolean;
}): Mesh {
  // OLD Tube Geometry - Comment this out while testing line geometry version below
  // const curvePath = new CurvePath<Vector3>();

  // const k = (4 / 3) * (Math.sqrt(2) - 1);
  // const d = zRadius * k;
  // const { x, y } = center;

  // zPosition = upper ? zPosition : -zPosition;
  // // Define control points for four cubic Bezier segments approximating a circle
  // const points = [
  //   new Vector3(x, y + zRadius, zPosition),
  //   new Vector3(x + d, y + zRadius, zPosition),
  //   new Vector3(x + zRadius, y + d, zPosition),
  //   new Vector3(x + zRadius, y, zPosition),

  //   new Vector3(x + zRadius, y, zPosition),
  //   new Vector3(x + zRadius, y - d, zPosition),
  //   new Vector3(x + d, y - zRadius, zPosition),
  //   new Vector3(x, y - zRadius, zPosition),

  //   new Vector3(x, y - zRadius, zPosition),
  //   new Vector3(x - d, y - zRadius, zPosition),
  //   new Vector3(x - zRadius, y - d, zPosition),
  //   new Vector3(x - zRadius, y, zPosition),

  //   new Vector3(x - zRadius, y, zPosition),
  //   new Vector3(x - zRadius, y + d, zPosition),
  //   new Vector3(x - d, y + zRadius, zPosition),
  //   new Vector3(x, y + zRadius, zPosition)
  // ];

  // // Build the path
  // for (let i = 0; i < 16; i += 4) {
  //   curvePath.add(
  //     new CubicBezierCurve3(
  //       points[i],
  //       points[i + 1],
  //       points[i + 2],
  //       points[i + 3]
  //     )
  //   );
  // }

  // const radialSegments = 3;
  // const closed = true;

  // const pointsAtInfinityGeometry = new TubeGeometry(
  //   curvePath,
  //   numPoints,
  //   thickness,
  //   radialSegments,
  //   closed
  // );
  // const pointsAtInfinityMaterial: MeshStandardMaterialParameters = {
  //   color: "darkgray",
  //   side: DoubleSide,
  //   roughness: 0.2,
  //   transparent: false,
  //   opacity: 1.0
  // };
  // const mesh = new Mesh(
  //   pointsAtInfinityGeometry,
  //   //customShaderMaterial
  //   new Mesh(pointsAtInfinityMaterial)
  // );

  const circlePoints: number[] = [];
  const error = 0.004; // maximum allowable error (as a world space distance) in the linear segments approximating the circle
  const numPoints = Math.ceil(Math.PI / Math.acos(1 - error / zRadius)); // Calculate number of points needed to achieve the desired maximum error in linear approximation of circle
  // Build the path
  for (let angle = 0; angle < 2 * Math.PI; angle += (2 * Math.PI) / numPoints) {
    circlePoints.push(
      zRadius * Math.cos(angle),
      zRadius * Math.sin(angle),
      upper ? zPosition : -zPosition
    );
  }
  // Close the circle
  circlePoints.push(circlePoints[0], circlePoints[1], circlePoints[2]);

  const pointsAtInfinityGeometry = new LineGeometry();
  pointsAtInfinityGeometry.setPositions(circlePoints);

  const pointsAtInfinityMaterial = new LineMaterial({
    color: "blue",
    linewidth: thickness, // Width in pixels
    resolution: new Vector2(window.innerWidth, window.innerHeight),
    transparent: false
  });

  const mesh = new Mesh(
    pointsAtInfinityGeometry,
    //customShaderMaterial
    pointsAtInfinityMaterial
  );
  mesh.name = upper ? `UpperPointsAtInfinity` : `LowerPointsAtInfinity`;
  return mesh;
}

export function createPolarGridCircle({
  intrinsicRadius, // The intrinsic hyperbolic radius
  clippingPlane,
  thickness = 2, //pixels
  error = 0.004, // maximum allowable error (as a world space distance) in the linear segments approximating the circle
  upper = true
}: {
  intrinsicRadius: number;
  clippingPlane: Plane;
  numPoints?: number;
  thickness?: number;
  error?: number;
  upper?: boolean;
}): Mesh {
  const circlePoints: number[] = [];
  const numPoints = Math.ceil(
    Math.PI / Math.acos(1 - error / Math.sinh(intrinsicRadius))
  ); // Calculate number of points needed to achieve the desired maximum error in linear approximation of circle

  // console.log(
  //   `Creating polar grid circle at intrinsic radius ${intrinsicRadius} with ${numPoints} points to achieve max error ${error}`
  // );
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

  const material = new LineMaterial({
    color: "grey",
    linewidth: thickness, // Width in pixels
    resolution: new Vector2(window.innerWidth, window.innerHeight),
    clippingPlanes: [clippingPlane],
    transparent: false
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = `PolarGridCircle_r=${intrinsicRadius.toFixed(2)}`;
  return mesh;
}

// OLD TUBE GEOMETRY ATTEMPT - I couldn't get constant thickness in screen space working this way
// export function createPolarGridCircle({
//   zRadius,
//   zPosition,
//   maxClippingPlane,
//   minClippingPlane,
//   numPoints = 50,
//   thickness = 0.02,
//   center = { x: 0, y: 0 },
//   upper = true
// }: {
//   zRadius: number;
//   zPosition: number;
//   maxClippingPlane: Plane;
//   minClippingPlane: Plane;
//   numPoints?: number;
//   thickness?: number;
//   center?: { x: number; y: number };
//   upper?: boolean;
// }): Mesh {
//   const curvePath = new CurvePath<Vector3>();

//   const k = (4 / 3) * (Math.sqrt(2) - 1);
//   const d = zRadius * k;
//   const { x, y } = center;

//   zPosition = upper ? zPosition : -zPosition;
//   // Define control points for four cubic Bezier segments approximating a circle
//   const points = [
//     new Vector3(x, y + zRadius, zPosition),
//     new Vector3(x + d, y + zRadius, zPosition),
//     new Vector3(x + zRadius, y + d, zPosition),
//     new Vector3(x + zRadius, y, zPosition),

//     new Vector3(x + zRadius, y, zPosition),
//     new Vector3(x + zRadius, y - d, zPosition),
//     new Vector3(x + d, y - zRadius, zPosition),
//     new Vector3(x, y - zRadius, zPosition),

//     new Vector3(x, y - zRadius, zPosition),
//     new Vector3(x - d, y - zRadius, zPosition),
//     new Vector3(x - zRadius, y - d, zPosition),
//     new Vector3(x - zRadius, y, zPosition),

//     new Vector3(x - zRadius, y, zPosition),
//     new Vector3(x - zRadius, y + d, zPosition),
//     new Vector3(x - d, y + zRadius, zPosition),
//     new Vector3(x, y + zRadius, zPosition)
//   ];

//   // Build the path
//   for (let i = 0; i < 16; i += 4) {
//     curvePath.add(
//       new CubicBezierCurve3(
//         points[i],
//         points[i + 1],
//         points[i + 2],
//         points[i + 3]
//       )
//     );
//   }

//   const radialSegments = 16;
//   const closed = true;

//   const geometry = new TubeGeometry(
//     curvePath,
//     numPoints,
//     thickness,
//     radialSegments,
//     closed
//   );

//   const material = new MeshStandardMaterial({
//     color: "gray",
//     roughness: 0.3,
//     clippingPlanes: [minClippingPlane, maxClippingPlane]
//   });

//   material.onBeforeCompile = shader => {
//     shader.uniforms.uStartFadeHeight = {
//       value: SETTINGS.fadePercentage * maxClippingPlane.constant
//     }; // height of start of fade
//     shader.uniforms.uEndFadeHeight = { value: maxClippingPlane.constant }; // height of end of fade
//     shader.uniforms.uStartOpacity = { value: SETTINGS.startOpacityFade }; //  opacity at the start of fade
//     shader.uniforms.uEndOpacity = { value: SETTINGS.endOpacityFade }; // opacity at the end of fade
//     shader.uniforms.uBaseOpacity = { value: 1.0 }; // max opacity
//     shader.uniforms.uLineWidth = { value: thickness }; // dynamic

//     // Pass the vertex height to the fragment shader
//     shader.vertexShader = shader.vertexShader.replace(
//       `#include <common>`,
//       `#include <common>
//       uniform float uLineWidth;
//       varying float vHeight;`
//     );

//     shader.vertexShader = shader.vertexShader.replace(
//       `#include <begin_vertex>`,
//       `#include <begin_vertex>
//       transformed = normal*uLineWidth + transformed;
//       vHeight = transformed.z;`
//     );

//     // Use vHeight in fragment shader to adjust opacity
//     shader.fragmentShader = shader.fragmentShader.replace(
//       `#include <common>`,
//       `#include <common>
//        uniform float uStartFadeHeight;
//        uniform float uEndFadeHeight;
//        uniform float uEndOpacity;
//        uniform float uStartOpacity;
//        uniform float uBaseOpacity;
//        varying float vHeight;`
//     );

//     shader.fragmentShader = shader.fragmentShader.replace(
//       `#include <dithering_fragment>`,
//       `
//       float heightFactor = clamp(
//         (vHeight - uStartFadeHeight) / (uEndFadeHeight - uStartFadeHeight),
//         0.0,
//         1.0
//       );
//       float opacityFactor = mix(
//         uStartOpacity,
//         uEndOpacity,
//         heightFactor
//       );
//       gl_FragColor.a *= opacityFactor * uBaseOpacity;
//       #include <dithering_fragment>
//       `
//     );

//     // Keep uniforms for later updates
//     material.userData.shader = shader;
//   };

//   const mesh = new Mesh(geometry, material);
//   mesh.name = `PolarGridCircle_r=${zRadius.toFixed(2)}`;
//   return mesh;
// }

// zMax is the maximum z height of the radial line
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
  const geometry = new LineGeometry();
  geometry.setPositions(points);

  const material = new LineMaterial({
    color: "grey",
    linewidth: thickness, // Width in pixels
    resolution: new Vector2(window.innerWidth, window.innerHeight),
    clippingPlanes: [clippingPlane],
    transparent: false
    //depthWrite: false, // Recommended for transparent lines
    // optional:
    // dashed: true,
    // dashSize: 2,
    // gapSize: 100
  });
  const lineMesh = new Line2(geometry, material);
  //const mesh = new Mesh(geometry, material);
  lineMesh.name = `PolarGridRadialLine_angle=${radianAngle.toFixed(2)}`;

  return lineMesh;
}
// OLD TUBE GEOMETRY ATTEMPT - I couldn't get constant thickness in screen space working this way
// const curvePath = new CurvePath<Vector3>();
// for (let i = 0; i < points.length - 1; i++) {
//   curvePath.add(new LineCurve3(points[i], points[i + 1]));
// }
// const radialSegments = 30;
// const closed = false;

// const geometry = new TubeGeometry(
//   curvePath,
//   numPoints,
//   thickness,
//   radialSegments,
//   closed
// );
// const material = new MeshStandardMaterial({
//   color: "gray",
//   roughness: 0.3
//   //clippingPlanes: [minClippingPlane, maxClippingPlane]
// });

// material.onBeforeCompile = shader => {
//   shader.uniforms.uStartFadeHeight = {
//     value: SETTINGS.fadePercentage * maxClippingPlane.constant
//   }; // height of start of fade
//   shader.uniforms.uEndFadeHeight = { value: maxClippingPlane.constant }; // height of end of fade
//   shader.uniforms.uStartOpacity = { value: SETTINGS.startOpacityFade }; //  opacity at the start of fade
//   shader.uniforms.uEndOpacity = { value: SETTINGS.endOpacityFade }; // opacity at the end of fade
//   shader.uniforms.uBaseOpacity = { value: 1.0 }; // max opacity
//   // shader.uniforms.uLineWidth = { value: 10.0 }; // dynamic
//   // shader.uniforms.initialTubeThickness = { value: thickness };
//   // shader.uniforms.uResolution = {
//   //   value: new Vector2(window.innerWidth, window.innerHeight)
//   //};

//   // Pass the vertex height to the fragment shader
//   shader.vertexShader = shader.vertexShader.replace(
//     `#include <color_vertex>`,
//     `
//     //uniform float uLineWidth;
//     //uniform vec2 uResolution;
//     //attribute vec3 tangent;
//     #include <color_vertex>
//     varying float vHeight;
//     `
//   );
//   shader.vertexShader = shader.vertexShader.replace(
//     `#include <begin_vertex>`,
//     `#include <begin_vertex>
//     //transformed = normal*uLineWidth + transformed;// old naive thickness adjustment
//     vHeight = transformed.z;`
//   );
//   //   shader.vertexShader = shader.vertexShader.replace(
//   //     `#include <project_vertex>`,
//   //     `
//   //     vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
//   //     //gl_Position = projectionMatrix * mvPosition;

//   //     vec4 position_clipSpace = projectionMatrix * mvPosition;
//   //     vec3 ndcPosition = position_clipSpace.xyz / position_clipSpace.w;
//   //     mat4 A = mat4(
//   //                 vec4(0.5 * uResolution.x, 0.0, 0.0, 0.0),  // Column 0
//   //                 vec4(0.0, 0.5 * uResolution.y, 0.0, 0.0),  // Column 1
//   //                 vec4(0.0, 0.0, 1.0, 0.0),   // Column 2
//   //                 vec4(0.5 * uResolution.x, 0.5 * uResolution.y, 0.0, 1.0) // Column 3
//   //             );
//   //     vec4 screenPosition = A * vec4(ndcPosition, 1.0);

//   //     vec4 unitScreenNormal = normalize(transpose(inverse(A*projectionMatrix * modelViewMatrix)) * vec4(normal, 0.0)); // The w component is 0 for normals, so after transformation it remains 0

//   //     vec4 screenVertex = screenPosition + unitScreenNormal * 0.02;// * uLineWidth; // uLinewidth is almost pixels, but the initial tube thickness is added.

//   //     // Convert back to NDC
//   //     vec4 ndcVertex = inverse(A) * screenVertex;

//   //     // Reconstruct clip space position
//   //     gl_Position = vec4(ndcVertex.xyz * position_clipSpace.w, position_clipSpace.w);
//   //     `
//   //   );

//   // OLD NAIVE THICKNESS ADJUSTMENT
//   // shader.vertexShader = shader.vertexShader.replace(
//   //   `#include <begin_vertex>`,
//   //   `#include <begin_vertex>
//   //   transformed = normal*uLineWidth + transformed
//   //   vHeight = transformed.z`
//   // );

//   // Old Attempt to adjust thickness based on camera distance
//   // `#include <begin_vertex>
//   //   vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // position in clip space
//   //   vec3 ndc = clip.xyz / clip.w; //Normalized Device Coordinates -- this is the perspective divide and the result is the position in NDC space
//   //   vec4 myNormal = transpose(inverse(projectionMatrix * modelViewMatrix)) * vec4(normal,1); // Transform normal to clip space
//   //   vec3 myNDCNormal = myNormal.xyz / myNormal.w; // Normal in NDC space
//   //   vec2 offset = myNDCNormal.xy;
//   //   offset = normalize(offset); // Normal direction in screen space
//   //   ndc.xy += offset * uLineWidth;
//   //   vec4 tempTransformed = inverse(modelViewMatrix) * inverse(projectionMatrix) * vec4(ndc * clip.w, clip.w);
//   //   transformed = tempTransformed.xyz;
//   //   vHeight = transformed.z;`

//   // Another Attempt to adjust thickness based on camera distance
//   // // The normalMatrix is the correct matrix for transforming normals.
//   //       vec3 transformedNormal_viewSpace = normalize(normalMatrix * normal);

//   //       // This is a correction to use the view-space normal for calculating the screen-space offset
//   //       // The offset in view-space is scaled by the perspective projection
//   //       vec2 offset_viewSpace = transformedNormal_viewSpace.xy / -mvPosition.z;

//   //       // The scaling factor for the screen-space offset
//   //       float pixelRatio = uLineWidth / uResolution.x;

//   //       // Apply the screen-space offset in clip space
//   //       gl_Position.xy += offset_viewSpace * gl_Position.w * pixelRatio;

//   // Another Attempt to adjust thickness based on camera distance
//   // #include <project_vertex> // this will define variables used by other chunks in the preprocessing
//   // // Transform the vertex to camera space
//   // vec4 myPosition = modelViewMatrix * vec4(position, 1.0);

//   // // Transform tangent to camera space
//   // vec4 tCam = normalize((modelViewMatrix * vec4(tangent, 0.0)));

//   // // Get 2D screen-space perpendicular direction
//   // vec2 tangentNDC = normalize( (projectionMatrix * tCam).xy );
//   // vec2 perpNDC = vec2(-tangentNDC.y, tangentNDC.x);

//   // // Pixel size → NDC
//   // vec2 scale = vec2(uLineWidth / uResolution.x, uLineWidth / uResolution.y);   // convert pixels to NDC
//   // vec2 offsetNDC = perpNDC * scale;

//   // // Offset original clip-space position
//   // vec4 clipPos = projectionMatrix * myPosition;
//   // clipPos.xy += offsetNDC * clipPos.w;

//   // gl_Position = clipPos;

//   // Use vHeight in fragment shader to adjust opacity
//   shader.fragmentShader = shader.fragmentShader.replace(
//     `#include <common>`,
//     `#include <common>
//      uniform float uStartFadeHeight;
//      uniform float uEndFadeHeight;
//      uniform float uEndOpacity;
//      uniform float uStartOpacity;
//      uniform float uBaseOpacity;
//      varying float vHeight;`
//   );

//   shader.fragmentShader = shader.fragmentShader.replace(
//     `gl_FragColor = vec4( color, material.opacity );`,
//     `
//     float heightFactor = clamp(
//       (vHeight - uStartFadeHeight) / (uEndFadeHeight - uStartFadeHeight),
//       0.0,
//       1.0
//     );
//     float opacityFactor = mix(
//       uStartOpacity,
//       uEndOpacity,
//       heightFactor
//     );
//     //gl_FragColor.a *= opacityFactor * uBaseOpacity;
//     //gl_FragColor = vec4( color, opacityFactor * uBaseOpacity );
//     gl_FragColor = vec4( color, material.opacity );
//     `
//   );

//   // Keep uniforms for later updates
//   material.userData.shader = shader;
// };

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

  const hyperboloidMaterial = new MeshStandardMaterial(
    hyperboloidMaterialParameters
  );

  hyperboloidMaterial.onBeforeCompile = shader => {
    shader.uniforms.uStartFadeHeight = {
      value: SETTINGS.fadePercentage * clippingPlane.constant
    }; // height of start of fade
    shader.uniforms.uEndFadeHeight = { value: clippingPlane.constant }; // height of end of fade
    shader.uniforms.uStartOpacity = { value: SETTINGS.startOpacityFade }; //  opacity at the start of fade
    shader.uniforms.uEndOpacity = { value: SETTINGS.endOpacityFade }; // opacity at the end of fade
    shader.uniforms.uBaseOpacity = { value: 1.0 }; // base line opacity

    // Pass the vertex height to the fragment shader
    shader.vertexShader = shader.vertexShader.replace(
      `#include <common>`,
      `#include <common>
       varying float vHeight;`
    );

    shader.vertexShader = shader.vertexShader.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
       vHeight = transformed.z;`
    );

    // Use vHeight in fragment shader to adjust opacity
    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <common>`,
      `#include <common>
       uniform float uStartFadeHeight;
       uniform float uEndFadeHeight;
       uniform float uEndOpacity;
       uniform float uStartOpacity;
       uniform float uBaseOpacity;
       varying float vHeight;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <dithering_fragment>`,
      `
      float heightFactor = smoothstep(
        0.0,
        1.0,
        (vHeight - uStartFadeHeight) / (uEndFadeHeight - uStartFadeHeight)
      );
      float opacityFactor = mix(
        uStartOpacity,
        uEndOpacity,
        heightFactor
      );
      gl_FragColor.a *= opacityFactor * uBaseOpacity;
      #include <dithering_fragment>
      `
    );

    // Keep uniforms for later updates
    hyperboloidMaterial.userData.shader = shader;
    // console.log("Shader modified");
  };

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
  const coneMaterial = new MeshPhysicalMaterial({
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
      // When these get close to the boundary cone, the

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = r + 0.001; // because z = sqrt(x² + y²)
      out.set(x, y, z);
    },
    120,
    300
  );
  //coneGeometry.translate(0, 0, upper ? 0.001 : -0.001); // try to avoid z-fighting with hyperboloid
  coneMaterial.depthWrite = false; // try to avoid z-fighting with hyperboloid
  const coneMesh = new Mesh(coneGeometry, coneMaterial);

  return coneMesh;
}
