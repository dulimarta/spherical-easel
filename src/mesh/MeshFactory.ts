import {
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TubeGeometry
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

// export function create2DCircle(radius: number = 1, width = 0.05, color: string = "white") {
//   const geo = new TubeGeometry()

// }
