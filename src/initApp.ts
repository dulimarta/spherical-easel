// import Axes from "@/3d-objs/Axes";
import Point from "@/3d-objs/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import Two from "two.js"
import SETTINGS from "@/global-settings";
export function setupScene() {
  const two = new Two({
    width: SETTINGS.viewport.width,
    height: SETTINGS.viewport.height,
    autostart: true
  });

  // Translate the origin from the upper-left corner to the center
  // of the viewport
  two.scene.translation.set(two.width / 2, two.height / 2);
  const mainCircle = two.makeCircle(0, 0, SETTINGS.sphere.radius);
  mainCircle.linewidth = SETTINGS.line.thickness;
  if (process.env.NODE_ENV === "development") {
    // sphere.add(new Axes(1.5, 0.05));

    // Add random vertices (for development only)

    for (let k = 0; k < 3; k++) {
      // const v = new Point(SETTINGS.point.size);
      // v.position.set(Math.random(), Math.random(), Math.random());
      // v.position.normalize();
      // v.position.multiplyScalar(SETTINGS.sphere.radius);
      // new AddPointCommand(v).execute();
    }
  }

  return two;
}
