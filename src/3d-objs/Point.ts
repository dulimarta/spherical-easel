import { Mesh, SphereGeometry, MeshPhongMaterial } from "three";

import SETTINGS from "@/global-settings";

export default class Point extends Mesh {
  constructor(size?: number, color?: number) {
    super();
    this.geometry = new SphereGeometry(size || SETTINGS.point.size, 20, 20);
    this.material = new MeshPhongMaterial({
      color: color || SETTINGS.point.color
    });
    this.name = `Point-${this.id}`;
    this.layers.enable(SETTINGS.layers.point);
  }
}
