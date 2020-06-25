/** @format */

import Two from "two.js";
import Coordinates from "@/plottables/Coordinates";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Selectable } from "@/types";

class SphereFrame {
  /* sphereCanvas holds the Two object that contains groups (which contain plotable objects) */
  public sphereCanvas: Two;
  /* coords is the object that holds the current view (i.e. the element of SO(3) that transforms
    the abstract unit sphere (where all the points, line, circles, spherical ellipses live) to 
    the orientation on the screen. This can then be displayed on the screen using the affine
    transformation that maps to the screen space
     */
  public coords: Coordinates;

  /* The boundary circle displayed on the sphereCanvas as the only object in the midground */
  private boundaryCircle: Two.Path;
  private radius = 150; //the radius of the boundary sphere in pixels

  //Arrays containing the various types of elements that are on the sphereCanvas
  private plotables: SENodule[] = [];
  /* private moveables:SENodule[];
  private selectables:SENodule[]; */

  constructor() {
    this.sphereCanvas = new Two({ width: 300, height: 300 });
    //Create the groups and insert them into canvas in the right order so they are rendered correctly

    //angle markers glow in the background are drawn first
    // this group cooresponds to SETTINGS.layers.backgroundAngleMarkersGlow (0)
    const backgroundAngleMarkersGlow = this.sphereCanvas.makeGroup();

    //angle markers in the background are drawn first
    // this group cooresponds to SETTINGS.layers.backgroundAngleMarkers 1
    const backgroundAngleMarkers = this.sphereCanvas.makeGroup();

    // glowing background lines, circles, ellipses are drawn next
    // this group cooresponds to SETTINGS.layers.backgroundGlow (2)
    const backgroundGlow = this.sphereCanvas.makeGroup();

    // background line, circles, ellipses are drawn next
    // this group cooresponds to SETTINGS.layers.background (3)
    const background = this.sphereCanvas.makeGroup();

    // the glowing points in the background are rendered next
    // this group cooresponds to SETTINGS.layers.backgroundPointGlow (4)
    const backgroundPointsGlow = this.sphereCanvas.makeGroup();

    // the points in the background are rendered next
    // this group cooresponds to SETTINGS.layers.backgroundPoints (5)
    const backgroundPoints = this.sphereCanvas.makeGroup();

    // the glowing text of the background is rendered next
    // this group cooresponds to SETTINGS.layers.backgroundTextGlow (6)
    const backgroundTextGlow = this.sphereCanvas.makeGroup();

    // the text of the background is rendered next
    // this group cooresponds to SETTINGS.layers.backgroundText (7)
    const backgroundText = this.sphereCanvas.makeGroup();

    // the midground containing only the boundary circle of the background is rendered next
    // this group cooresponds to SETTINGS.layers.midground (8)
    const midground = this.sphereCanvas.makeGroup();

    // this group cooresponds to SETTINGS.layers.foregroundAngleMarkersGlow (9)
    // contains only glowing angle markers that are selected
    const foregroundAngleMarkersGlow = this.sphereCanvas.makeGroup();

    // this group cooresponds to SETTINGS.layers.foregroundAngleMarkers (10)
    // contains only angle markers
    const foregroundAngleMarkers = this.sphereCanvas.makeGroup();

    // the foreground is rendered next contains glowing lines, circles and ellipses
    // this group cooresponds to SETTINGS.layers.foregroundGlow (11)
    const foregroundGlow = this.sphereCanvas.makeGroup();

    // the foreground is rendered next contains lines, circles and ellipses
    // this group cooresponds to SETTINGS.layers.foreground (12)
    const foreground = this.sphereCanvas.makeGroup();

    // foreground points are next
    // this group cooresponds to SETTINGS.layers.foregroundPointsGlow (13)
    const foregroundPointsGlow = this.sphereCanvas.makeGroup();

    // foreground points are next
    // this group cooresponds to SETTINGS.layers.foregroundPoints (14)
    const foregroundPoints = this.sphereCanvas.makeGroup();

    // the foreground glowing text is rendered next
    // this group cooresponds to SETTINGS.layers.foregroundTextGlow (15)
    const foregroundTextGlow = this.sphereCanvas.makeGroup();

    // the foreground text is rendered last
    // this group cooresponds to SETTINGS.layers.foregroundText (16)
    const foregroundText = this.sphereCanvas.makeGroup();

    //Create the *initial* boundary circle with center [150,150] and radius 150 to fit in the
    // initial canvas size of 300x300;
    const vertices: Two.Vector[] = [];
    // Generate 2D vector point coordinates of a circle
    for (let k = 0; k < SETTINGS.boundaryCircle.numPoints; k++) {
      const angle = (k * 2 * Math.PI) / SETTINGS.boundaryCircle.numPoints;
      const px = 150 * Math.cos(angle) + 150;
      const py = 150 * Math.sin(angle) + 150;
      vertices.push(new Two.Vector(px, py));
    }

    this.boundaryCircle = new Two.Path(
      vertices,
      /* closed */ true,
      /* curve */ true
    );
    this.boundaryCircle.linewidth = SETTINGS.boundaryCircle.linewidth;
    this.boundaryCircle.stroke = SETTINGS.boundaryCircle.color;
    this.boundaryCircle.opacity = SETTINGS.boundaryCircle.opacity;
    this.boundaryCircle.noFill();

    /*  add the new boundary circle to the midground. This
    should always be the only object in the midground */
    midground.add(this.boundaryCircle);

    /* Set up the coordinates */
    this.coords = new Coordinates();
    this.coords.setUpCoords(150, 150, 150);
  }

  /* Update the boundary circle with the new center and radius */
  updateBoundaryCircle(center: number[], radius: number) {
    this.radius = radius;
    this.boundaryCircle.vertices.forEach((v, index) => {
      const angle = (index * 2 * Math.PI) / SETTINGS.boundaryCircle.numPoints;
      v.x = radius * Math.cos(angle) + center[0];
      v.y = radius * Math.sin(angle) + center[1];
    });
  }

  /* Update an object in the sphereCanvas directly     
    The vertices of the path are the image under the affineMatrx using homogenous coordinates
    TODO: In the future implement options like fillcolor, stroke, linewidth, opacity
  */
  updateTwoObject(affineMatrix: number[][], path: Two.Path) {
    path.vertices.forEach((v, index) => {
      const newVector = Coordinates.matrixTimesVector(affineMatrix, [
        v.x,
        v.y,
        1
      ]);
      //only the first two coordinates matter in homogeneous coordinates
      v.x = newVector[0];
      v.y = newVector[1];
    });
  }

  public addPlotable(p: SENodule) {
    this.plotables.push(p);
  }
  getCoords() {
    return this.coords;
  }

  getSphereCanvas() {
    return this.sphereCanvas;
  }

  //For a given pixel coordinate and mouse event, determine which SENodules were near it
  hitNodes(px: number, py: number, me: MouseEvent) {
    const hitObjects: SENodule[] = [];
    this.plotables.forEach((item: SENodule) => {
      if ("hit" in item === true) {
        // I want to make sure the item implements the Selectable interface, but can't do that directly
        if (((item as unknown) as Selectable).hit(px, py, this.coords, me)) {
          hitObjects.push(item);
        }
      }
    });
    return hitObjects;
  }

  /* This should update the canvas on the screen by modifying the Two scene directly 
  and then should update the canvas*/
  update() {
    //update all of the plotables in scene
    this.plotables.forEach((item: SENodule) => {
      // item.updateScene(this);
    });
    //console.log("Sphere Frame Update Exceuted the number of plotables times");
    //console.log("Radius", this.radius);
    //finally repaint scene <-- this is where the scene is rendered to the screen!
    this.sphereCanvas.update();
  }
}
