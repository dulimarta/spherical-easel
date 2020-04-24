import { CylinderGeometry, Group, Mesh, MeshLambertMaterial } from "three";

// Create Arrow shape along the Y-axis
export default class Arrow extends Group {
  constructor(size: number, color: number) {
    super();
    const cone = new Mesh(
      new CylinderGeometry(0, 0.1 * size, 0.3 * size, 20, 3),
      new MeshLambertMaterial({ color: color | 0x808080 })
    );
    const cyl = new Mesh(
      new CylinderGeometry(0.05 * size, 0.05 * size, 0.7 * size, 20, 3),
      new MeshLambertMaterial({ color: color | 0x808080 })
    );
    cyl.translateY(0.35 * size);
    cone.translateY(0.7 * size);
    this.add(cone);
    this.add(cyl);
  }
}
