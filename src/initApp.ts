import {
  Mesh,
  Scene,
  MeshBasicMaterial,
  SphereGeometry,
  PointLight
} from "three";
import Axes from "@/3d-objs/Axes";
import Vertex from "@/3d-objs/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import SETTINGS from "@/global-settings";
export function setupScene() {
  const scene = new Scene();
  const sphereGeometry = new SphereGeometry(SETTINGS.sphere.radius, 30, 60);

  const sphere = new Mesh(
    sphereGeometry,
    new MeshBasicMaterial({
      color: SETTINGS.sphere.color,
      transparent: true,
      opacity: SETTINGS.sphere.opacity
    })
  );

  sphere.name = "MainSphere";
  sphere.layers.enable(SETTINGS.layers.sphere);
  scene.add(sphere);
  const pointLight = new PointLight(0xffffff, 1, 100);
  pointLight.position.set(0, 5, 10);
  scene.add(pointLight);

  if (process.env.NODE_ENV === "development") {
    sphere.add(new Axes(1.5, 0.05));

    // Add random vertices (for development only)

    for (let k = 0; k < 3; k++) {
      const v = new Vertex(SETTINGS.point.size);
      v.position.set(Math.random(), Math.random(), Math.random());
      v.position.normalize();
      v.position.multiplyScalar(SETTINGS.sphere.radius);
      new AddPointCommand(v).execute();
    }
  }

  return { scene, sphere };
}
