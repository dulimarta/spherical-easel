import {
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TubeGeometry,
  CurvePath,
  CubicBezierCurve3,
  Vector3,
  DoubleSide
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

export function createGridCircle(
  radius: number,
  zPosition: number,
  numPoints = 50,
  tubeRadius = 0.02,
  center: { x: number; y: number } = { x: 0, y: 0 }
): Mesh {
  const curvePath = new CurvePath<Vector3>();

  // Use the standard approximation for a circle with four cubic Beziers.
  // d is the distance of the control points from the endpoints along the tangents.
  const k = (4 / 3) * (Math.sqrt(2) - 1);
  const d = radius * k;

  const { x, y } = center;

  // Define the start and control points for each quadrant
  const points = [
    // First Quadrant (90 to 0 degrees)
    new Vector3(x, y + radius, zPosition), // Start Point
    new Vector3(x + d, y + radius, zPosition), // Control Point 1
    new Vector3(x + radius, y + d, zPosition), // Control Point 2
    new Vector3(x + radius, y, zPosition), // End Point

    // Fourth Quadrant (0 to -90 degrees)
    new Vector3(x + radius, y, zPosition), // Start Point
    new Vector3(x + radius, y - d, zPosition), // Control Point 1
    new Vector3(x + d, y - radius, zPosition), // Control Point 2
    new Vector3(x, y - radius, zPosition), // End Point

    // Third Quadrant (-90 to -180 degrees)
    new Vector3(x, y - radius, zPosition), // Start Point
    new Vector3(x - d, y - radius, zPosition), // Control Point 1
    new Vector3(x - radius, y - d, zPosition), // Control Point 2
    new Vector3(x - radius, y, zPosition), // End Point

    // Second Quadrant (-180 to -270 degrees)
    new Vector3(x - radius, y, zPosition), // Start Point
    new Vector3(x - radius, y + d, zPosition), // Control Point 1
    new Vector3(x - d, y + radius, zPosition), // Control Point 2
    new Vector3(x, y + radius, zPosition) // End Point
  ];

  // Add four CubicBezierCurve3 segments to the path
  curvePath.add(
    new CubicBezierCurve3(points[0], points[1], points[2], points[3])
  );
  curvePath.add(
    new CubicBezierCurve3(points[4], points[5], points[6], points[7])
  );
  curvePath.add(
    new CubicBezierCurve3(points[8], points[9], points[10], points[11])
  );
  curvePath.add(
    new CubicBezierCurve3(points[12], points[13], points[14], points[15])
  );

  // Use the CurvePath to generate geometry points
  // const curvePoints = curvePath.getPoints(numPoints);

  // const geometry = new BufferGeometry().setFromPoints(curvePoints);
  // const material = new LineBasicMaterial({ color: 0x000000 });

  // const circleEdge = new Line(geometry, material);

  const radialSegments = 8; // Number of segments around the tube's circumference
  const closed = true; // Whether the tube is closed or open

  const geometry = new TubeGeometry(
    curvePath,
    numPoints,
    tubeRadius,
    radialSegments,
    closed
  );
  const meshMaterial = new MeshStandardMaterial({
    color: "black",
    // side: DoubleSide,
    roughness: 0.3
  });
  const circleEdge = new Mesh(geometry, meshMaterial);
  return circleEdge;
}

// export function create2DCircle(radius: number = 1, width = 0.05, color: string = "white") {
//   const geo = new TubeGeometry()

// }
