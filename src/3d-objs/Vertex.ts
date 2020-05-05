import { Mesh, SphereGeometry, MeshPhongMaterial } from "three";

import SETTINGS from "@/global-settings";

export default class Vertex extends Mesh {
  constructor(size?: number, color?: number) {
    super();
    this.geometry = new SphereGeometry(size || SETTINGS.vertex.size, 20, 20);
    this.material = new MeshPhongMaterial({
      color: color || SETTINGS.vertex.color
    });
    this.name = `Vertex-${this.id}`;
    this.layers.enable(SETTINGS.layers.vertex);
  }
}
