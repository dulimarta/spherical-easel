import { Group, Mesh, SphereGeometry, MeshLambertMaterial } from "three";

export default class Vertex extends Group {
  constructor(size?: number, color?: number) {
    super();
    const dot = new Mesh(
      new SphereGeometry(size || 0.02, 20, 20),
      new MeshLambertMaterial({ color: color || 0xff8080 })
    );
    this.add(dot);
  }
}
