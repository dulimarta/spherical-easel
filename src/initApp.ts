import Two from "two.js";
import { Mesh, Scene, MeshBasicMaterial, SphereGeometry } from "three";
// import Axes from "@/3d-objs/Axes";
import Point from "@/3d-objs/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import SETTINGS from "@/global-settings";
export function setupScene() {
  const sphereCanvas = new Two({ width: 300, height: 300 });
  const background = sphereCanvas.makeGroup(); //Put into canvas first so it is drawn first
  const midground = sphereCanvas.makeGroup(); // second to be drawn
  const foreground = sphereCanvas.makeGroup(); // third to be drawn

  //this boundary circle is the only object in the midground (and should always be the only one)
  const boundaryCircle = new Two.Ellipse(150, 150, 150, 150);
  boundaryCircle.linewidth = SETTINGS.boundaryCircle.linewidth;
  boundaryCircle.stroke = SETTINGS.boundaryCircle.color;
  boundaryCircle.opacity = SETTINGS.boundaryCircle.opacity;
  boundaryCircle.noFill();

  // Add the boundary circel to the misground
  midground.add(boundaryCircle);

  /* 
  if (process.env.NODE_ENV === "development") {
    
  } */

  return { foreground, midground, background, sphereCanvas };
}
