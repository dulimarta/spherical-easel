import { Group, Mesh, SphereGeometry, MeshLambertMaterial } from "three";

import SETTINGS from "@/global-settings";

let sequenceNumber = 0;
export default class Vertex extends Group {
  constructor(size?: number, color?: number) {
    super();
    const dot = new Mesh(
      new SphereGeometry(size || 0.02, 20, 20),
      new MeshLambertMaterial({ color: color || 0xff8080 })
    );
    dot.name = `Vertex-${sequenceNumber}`;
    dot.layers.enable(SETTINGS.layers.vertex);
    console.debug("A new vertex", dot.name, dot.layers.mask);
    sequenceNumber++;
    this.add(dot);
  }
}
