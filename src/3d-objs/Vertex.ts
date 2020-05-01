import { Mesh, SphereGeometry, MeshLambertMaterial } from "three";

import SETTINGS from "@/global-settings";

let sequenceNumber = 0;
export default class Vertex extends Mesh {
  constructor(size?: number, color?: number) {
    super();
    this.geometry = new SphereGeometry(size || SETTINGS.vertex.size, 20, 20);
    this.material = new MeshLambertMaterial({
      color: color || SETTINGS.vertex.color
    });
    this.name = `Vertex-${sequenceNumber}`;
    this.layers.enable(SETTINGS.layers.vertex);
    // console.debug("A new vertex", this.name, this.layers.mask);
    sequenceNumber++;
  }
}
