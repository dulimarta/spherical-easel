/** @format */

import { AddPointCommand } from "@/commands/AddPointCommand";
import Two from "two.js";
import SETTINGS from "@/global-settings";
export function setupScene() {
  const two = new Two({
    width: SETTINGS.viewport.width,
    height: SETTINGS.viewport.height,
    autostart: true
  });
  const sphereCanvas = two.makeGroup();
  sphereCanvas.translation.set(two.width / 2, two.height / 2);

  // Flip Y-coordinate positive Y-axis is up (north)
  (sphereCanvas as any).scale = new Two.Vector(1, -1);
  const mainCircle = new Two.Circle(0, 0, SETTINGS.sphere.boundaryCircleRadius);
  mainCircle.noFill();
  mainCircle.linewidth = SETTINGS.sphere.boundaryCircleLineWidth;
  sphereCanvas.add(mainCircle);
  const welcome = new Two.Text(
    "Just a text",
    -SETTINGS.sphere.boundaryCircleRadius,
    -SETTINGS.sphere.boundaryCircleRadius,
    {
      stroke: "green",
      size: 24
    }
  );

  // DO NOT flip the Y-coordinate on the text layer
  const foreground = two.makeGroup();
  foreground.translation.set(two.width / 2, two.height / 2);
  foreground.add(welcome);
  // Translate the origin from the upper-left corner to the center
  // of the viewport
  if (process.env.NODE_ENV === "development") {
    // sphere.add(new Axes(1.5, 0.05));

    // Add random vertices (for development only)

    for (let k = 0; k < 3; k++) {
      // const v = new Point(SETTINGS.point.size);
      // v.position.set(Math.random(), Math.random(), Math.random());
      // v.position.normalize();
      // v.position.multiplyScalar(SETTINGS.sphere.boundaryCircleRadius);
      // new AddPointCommand(v).execute();
    }
  }

  return { two, canvas: sphereCanvas };
}
