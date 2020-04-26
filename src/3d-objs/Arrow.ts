import { CylinderGeometry, Group, Mesh, MeshLambertMaterial } from "three";

// Create Arrow shape along the Y-axis
export default class Arrow extends Group {
  constructor(length: number, radius: number, color: number) {
    super();
    const tipLength = 2 * radius;
    const bodyLength = length - tipLength;
    const head = new Mesh(
      new CylinderGeometry(0, radius, tipLength, 20, 3),
      new MeshLambertMaterial({ color: color | 0x808080 })
    );
    const body = new Mesh(
      new CylinderGeometry(0.6 * radius, 0.6 * radius, bodyLength, 20, 3),
      new MeshLambertMaterial({ color: color | 0x808080 })
    );
    body.translateY(0.5 * bodyLength);
    head.translateY(bodyLength + radius);
    this.add(head);
    this.add(body);
  }
}
