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
  LineCurve3
} from "three";

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

//OLD
// export function createPolarGridCircle({
//   radius,
//   zPosition,
//   numPoints = 50,
//   thickness = 0.02,
//   center = { x: 0, y: 0 },
//   clippingPlanes = []
// }: {
//   radius: number;
//   zPosition: number;
//   numPoints?: number;
//   thickness?: number;
//   center?: { x: number; y: number };
//   clippingPlanes?: Array<Plane>;
// }): Mesh {
//   const curvePath = new CurvePath<Vector3>();

//   // Use the standard approximation for a circle with four cubic Bezier curves.
//   // d is the distance of the control points from the endpoints along the tangents.
//   const k = (4 / 3) * (Math.sqrt(2) - 1);
//   const d = radius * k;

//   const { x, y } = center;

//   // Define the start and control points for each quadrant
//   const points = [
//     // First Quadrant (90 to 0 degrees)
//     new Vector3(x, y + radius, zPosition), // Start Point
//     new Vector3(x + d, y + radius, zPosition), // Control Point 1
//     new Vector3(x + radius, y + d, zPosition), // Control Point 2
//     new Vector3(x + radius, y, zPosition), // End Point

//     // Fourth Quadrant (0 to -90 degrees)
//     new Vector3(x + radius, y, zPosition), // Start Point
//     new Vector3(x + radius, y - d, zPosition), // Control Point 1
//     new Vector3(x + d, y - radius, zPosition), // Control Point 2
//     new Vector3(x, y - radius, zPosition), // End Point

//     // Third Quadrant (-90 to -180 degrees)
//     new Vector3(x, y - radius, zPosition), // Start Point
//     new Vector3(x - d, y - radius, zPosition), // Control Point 1
//     new Vector3(x - radius, y - d, zPosition), // Control Point 2
//     new Vector3(x - radius, y, zPosition), // End Point

//     // Second Quadrant (-180 to -270 degrees)
//     new Vector3(x - radius, y, zPosition), // Start Point
//     new Vector3(x - radius, y + d, zPosition), // Control Point 1
//     new Vector3(x - d, y + radius, zPosition), // Control Point 2
//     new Vector3(x, y + radius, zPosition) // End Point
//   ];

//   // Add four CubicBezierCurve3 segments to the path
//   curvePath.add(
//     new CubicBezierCurve3(points[0], points[1], points[2], points[3])
//   );
//   curvePath.add(
//     new CubicBezierCurve3(points[4], points[5], points[6], points[7])
//   );
//   curvePath.add(
//     new CubicBezierCurve3(points[8], points[9], points[10], points[11])
//   );
//   curvePath.add(
//     new CubicBezierCurve3(points[12], points[13], points[14], points[15])
//   );

//   const radialSegments = 8; // Number of segments around the tube's circumference
//   const closed = true; // Whether the tube is closed or open

//   const geometry = new TubeGeometry(
//     curvePath,
//     numPoints,
//     thickness,
//     radialSegments,
//     closed
//   );
//   const meshMaterial = new MeshStandardMaterial({
//     color: "gray",
//     // side: DoubleSide,
//     roughness: 0.3,
//     clippingPlanes: clippingPlanes
//   });
//   const circleEdge = new Mesh(geometry, meshMaterial);
//   return circleEdge;
// }

export function createPolarGridCircle({
  zRadius,
  zPosition,
  numPoints = 50,
  thickness = 0.02,
  center = { x: 0, y: 0 },
  clippingPlanes = [],
  upper = true
}: {
  zRadius: number;
  zPosition: number;
  numPoints?: number;
  thickness?: number;
  center?: { x: number; y: number };
  clippingPlanes?: Array<Plane>;
  upper?: boolean;
}): Mesh {
  const curvePath = new CurvePath<Vector3>();

  const k = (4 / 3) * (Math.sqrt(2) - 1);
  const d = zRadius * k;
  const { x, y } = center;

  zPosition = upper ? zPosition : -zPosition;
  // Define control points for four cubic Bezier segments approximating a circle
  const points = [
    new Vector3(x, y + zRadius, zPosition),
    new Vector3(x + d, y + zRadius, zPosition),
    new Vector3(x + zRadius, y + d, zPosition),
    new Vector3(x + zRadius, y, zPosition),

    new Vector3(x + zRadius, y, zPosition),
    new Vector3(x + zRadius, y - d, zPosition),
    new Vector3(x + d, y - zRadius, zPosition),
    new Vector3(x, y - zRadius, zPosition),

    new Vector3(x, y - zRadius, zPosition),
    new Vector3(x - d, y - zRadius, zPosition),
    new Vector3(x - zRadius, y - d, zPosition),
    new Vector3(x - zRadius, y, zPosition),

    new Vector3(x - zRadius, y, zPosition),
    new Vector3(x - zRadius, y + d, zPosition),
    new Vector3(x - d, y + zRadius, zPosition),
    new Vector3(x, y + zRadius, zPosition)
  ];

  // Build the path
  for (let i = 0; i < 16; i += 4) {
    curvePath.add(
      new CubicBezierCurve3(
        points[i],
        points[i + 1],
        points[i + 2],
        points[i + 3]
      )
    );
  }

  const radialSegments = 16;
  const closed = true;

  const geometry = new TubeGeometry(
    curvePath,
    numPoints,
    thickness,
    radialSegments,
    closed
  );

  // === Shader Material with radius + opacity control ===
  // const material = new ShaderMaterial({
  //   uniforms: {
  //     uOpacity: { value: 1.0 }
  //   },
  //   vertexShader: `
  //   varying vec3 vNormal;
  //   void main() {
  //     vNormal = normal;
  //     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  //   } `,
  //   fragmentShader: `
  //   uniform float uOpacity;
  //   varying vec3 vNormal;
  //   void main() {
  //     vec3 baseColor = vec3(0.6);
  //     gl_FragColor = vec4(baseColor, uOpacity);
  //   } `,
  //   transparent: true,
  //   clipping: true // clipping planes don't seem to work with ShaderMaterial? even when enabled
  // });
  // material.clippingPlanes = clippingPlanes;

  const material = new MeshStandardMaterial({
    color: "gray",
    roughness: 0.3,
    clippingPlanes: clippingPlanes
  });
  const mesh = new Mesh(geometry, material);
  //mesh.name = `PolarGridCircle(zr=${zRadius.toFixed(2)},zp=${zPosition.toFixed(2)})`;
  // === Helper API for easy runtime control ===
  // (mesh.material as ShaderMaterial).userData = {
  //   setOpacity: (o: number) => {
  //     (mesh.material as ShaderMaterial).uniforms.uOpacity.value = o;
  //   }
  // };
  return mesh;
}

export function createPolarGridRadialLine({
  radianAngle,
  zMax,
  numPoints = 50,
  thickness = 0.02,
  clippingPlanes = [],
  upper = true
}: {
  radianAngle: number;
  zMax: number;
  numPoints?: number;
  thickness?: number;
  clippingPlanes?: Array<Plane>;
  upper?: boolean;
}): Mesh {
  const curvePath = new CurvePath<Vector3>();
  const points: Vector3[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * Math.acosh(zMax);
    points.push(
      new Vector3(
        Math.sinh(t) * Math.cos(radianAngle),
        Math.sinh(t) * Math.sin(radianAngle),
        upper ? Math.cosh(t) : -Math.cosh(t)
      )
    );
  }

  for (let i = 0; i < points.length - 1; i++) {
    curvePath.add(new LineCurve3(points[i], points[i + 1]));
  }

  const radialSegments = 16;
  const closed = false;

  const geometry = new TubeGeometry(
    curvePath,
    numPoints,
    thickness,
    radialSegments,
    closed
  );
  const material = new MeshStandardMaterial({
    color: "gray",
    roughness: 0.3,
    clippingPlanes: clippingPlanes
  });

  // === Shader Material with radius + opacity control ===
  // const material = new ShaderMaterial({
  //   uniforms: {
  //     uOpacity: { value: 1.0 }
  //   },
  //   vertexShader: `
  //   varying vec3 vNormal;
  //   void main() {
  //     vNormal = normal;
  //     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  //   } `,
  //   fragmentShader: `
  //   uniform float uOpacity;
  //   varying vec3 vNormal;
  //   void main() {
  //     vec3 baseColor = vec3(0.6);
  //     gl_FragColor = vec4(baseColor, uOpacity);
  //   } `,
  //   transparent: true,
  //   clipping: true,
  //   clippingPlanes
  // });

  const mesh = new Mesh(geometry, material);
  //mesh.name = `PolarGridCircle(zr=${zRadius.toFixed(2)},zp=${zPosition.toFixed(2)})`;
  // === Helper API for easy runtime control ===
  // (mesh.material as ShaderMaterial).userData = {
  //   setOpacity: (o: number) => {
  //     (mesh.material as ShaderMaterial).uniforms.uOpacity.value = o;
  //   }
  // };
  return mesh;
}
