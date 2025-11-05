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
  MeshStandardMaterialParameters
} from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";

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

export function createPointsAtInfinityStrip({
  zRadius,
  zPosition,
  numPoints = 50,
  thickness = 0.02,
  center = { x: 0, y: 0 },
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
  const pointsAtInfinityMaterial: MeshStandardMaterialParameters = {
    color: "darkgray",
    side: DoubleSide,
    roughness: 0.2,
    transparent: false,
    opacity: 1.0
  };

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

  const upperPointsAtInfinityGeometry = new TubeGeometry(
    curvePath,
    numPoints,
    thickness,
    radialSegments,
    closed
  );
  // const upperPointsAtInfinityGeometry = new ParametricGeometry(
  //   pointsAtInfinity,
  //   120,
  //   300
  // );

  // function pointsAtInfinity(u: number, v: number, pt: Vector3) {
  //   u = (u - 1 / 2) * width + zPosition;
  //   const theta = v * 2 * Math.PI;
  //   // Set the strip to be on the hyperboloid
  //   // const x = Math.sinh(u) * Math.cos(theta);
  //   // const y = Math.sinh(u) * Math.sin(theta);
  //   // const z = Math.sign(zPosition) * Math.cosh(u);

  //   // Set the strip to be on the boundary cone
  //   const x = Math.cosh(u) * Math.cos(theta);
  //   const y = Math.cosh(u) * Math.sin(theta);
  //   const z = Math.sign(zPosition) * Math.cosh(u);
  //   pt.set(x, y, z);
  // }
  const mesh = new Mesh(
    upperPointsAtInfinityGeometry,
    //customShaderMaterial
    new MeshStandardMaterial(pointsAtInfinityMaterial)
  );
  mesh.name = upper ? `UpperPointsAtInfinity` : `LowerPointsAtInfinity`;
  return mesh;
}

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
