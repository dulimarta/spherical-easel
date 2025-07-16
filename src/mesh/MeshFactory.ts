import { Mesh, MeshStandardMaterial, SphereGeometry } from "three";

export function createPoint(
  size: number = 0.02,
  color: string = "white"
): Mesh {
  return new Mesh(
    new SphereGeometry(size),
    new MeshStandardMaterial({ color })
  );
}
