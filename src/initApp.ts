/** @format */

import { AddPointCommand } from "@/commands/AddPointCommand";
import Two from "two.js";
import SETTINGS from "@/global-settings";
export function setupScene(width: number, height: number) {
  const two = new Two({
    width,
    height,
    autostart: true,
    ratio: window.devicePixelRatio
  });
  const sphereCanvas = two.makeGroup();
  sphereCanvas.translation.set(two.width / 2, two.height / 2);

  // Flip Y-coordinate so positive Y-axis is up (north)
  (sphereCanvas as any).scale = new Two.Vector(1, -1);
  const circleRadius = Math.min(
    (0.8 * width) / 2, // 80% of the viewport
    (0.8 * height) / 2, // 80% of the viewport
    SETTINGS.sphere.boundaryCircleRadius
  );
  const mainCircle = new Two.Circle(0, 0, circleRadius);
  mainCircle.noFill();
  mainCircle.linewidth = SETTINGS.sphere.boundaryCircleLineWidth;
  sphereCanvas.add(mainCircle);
  const welcome = new Two.Text(
    `Device Pixel Ratio = ${window.devicePixelRatio}`,
    -circleRadius + 10,
    -circleRadius,
    {
      stroke: "green",
      size: 24,
      alignment: "left"
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
