/** @format */

import { Vector3, Matrix4 } from "three";
import AppStore from "@/store";
import { ToolStrategy } from "./ToolStrategy";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { TextBox } from "@/plottables/TextBox";
import { SENodule } from "@/models/SENodule";
const frontPointRadius = SETTINGS.point.temp.radius.front;

export default abstract class SelectionHandler implements ToolStrategy {
  protected readonly X_AXIS = new Vector3(1, 0, 0);
  protected readonly Y_AXIS = new Vector3(0, 1, 0);
  protected readonly Z_AXIS = new Vector3(0, 0, 1);

  protected readonly canvas: Two.Group;
  protected store = AppStore; // Vuex global state
  protected currentSpherePoint: Vector3;
  protected currentScreenPoint: Two.Vector;
  protected hitNodes: SENodule[] = [];
  protected hitPoints: SEPoint[] = [];
  protected hitLines: SELine[] = [];
  protected hitSegments: SESegment[] = [];
  protected hitCircles: SECircle[] = [];
  protected startMarker: Two.Circle;
  protected isOnSphere: boolean;
  protected transformMatrix: Matrix4;
  protected layers: Two.Group[];
  // protected inverseMatrix = new Matrix4();
  // private boundingBox: BoundingClientRect;
  private mouseVector = new Vector3();
  private zoomCenter = new Vector3();
  private tmpMatrix = new Matrix4();
  private infoText = new TextBox("Hello");
  constructor(layers: Two.Group[], transformMatrix: Matrix4) {
    /**
     * @param scene is the sphere canvas where all drawings will render
     * @param transformMatrix is the forward transform that maps the ideal unit
     * sphere to the boundary circle on the canvas. Essentially this matrix maps
     * the (ideal) world to the screen
     */
    this.layers = layers;
    this.canvas = layers[LAYER.midground];
    this.transformMatrix = transformMatrix || null;
    // the bounding rectangle is used for
    // conversion between screen and world coordinates
    // this.boundingBox = scene.getBoundingClientRect();
    this.currentSpherePoint = new Vector3();
    this.currentScreenPoint = new Two.Vector(0, 0);
    this.startMarker = new Two.Circle(0, 0, frontPointRadius);
    this.isOnSphere = false;
  }

  abstract mousePressed(event: MouseEvent): void;
  abstract mouseReleased(event: MouseEvent): void;

  activate(): void {
    window.addEventListener("keypress", this.keyPressed);
  }
  deactivate(): void {
    window.removeEventListener("keypress", this.keyPressed);
  }
  keyPressed(event: KeyboardEvent) {
    console.debug("Keyevent", event);
  }

  /**
   * Map mouse 2D viewport/screen position to 3D local coordinate on the sphere.
   * Multiplication with the inverse of the CSS transform matrix convert the
   * screen coordinate to the world of unit sphere
   *
   * @memberof SelectionHandler
   */
  mouseMoved(event: MouseEvent): void {
    // Using currentTarget is necessary. Otherwise, all the calculations
    // will be based on SVG elements whose bounding rectangle may spill
    // outside of the responsive viewport and produces inaccurate
    // position calculations
    const target = (event.currentTarget || event.target) as HTMLElement;
    const boundingRect = target.getBoundingClientRect();
    // Don't rely on e.offsetX or e.offsetY, they may not be accurate
    const offsetX = event.clientX - boundingRect.left;
    const offsetY = event.clientY - boundingRect.top;
    const mouseX = offsetX - this.canvas.translation.x;
    const mouseY = -(offsetY - this.canvas.translation.y);

    // The last column of the affine transformation matrix
    // is the origin of the zoomed circle
    // ZoomCtr_in_world_ideal_sphere = inverseCSSMat * ZoomCtr_in_screen_space
    // this.zoomCenter.set(
    //   this.transformMatrix.elements[12],
    //   -this.transformMatrix.elements[13], // must flip the Y-coord
    //   this.transformMatrix.elements[14]
    // );
    // ZoomCtr = inv(CSS) * ZoomOrig
    // this.zoomCenter.applyMatrix4(
    //   this.tmpMatrix.getInverse(this.transformMatrix)
    // );

    // Map the mouse screen coordinate to its position within the ideal sphere
    // IdealPos = inv(CSS) * MousePos
    // this.mouseVector.set(mouseX, mouseY, 0);
    // this.mouseVector.applyMatrix4(
    //   this.tmpMatrix.getInverse(this.transformMatrix)
    // );
    // Reposition the mouse position (in ideal sphere) relative
    // to the zoom center
    // IdealPos = IdealPos - ZoomCtr
    //this.mouseVector.sub(this.zoomCenter);

    // Attempted algebraic simplification
    // IdealPos = IdealPos - ZoomCtr
    //          = inv(CSS) * MousePos - inv(CSS) * ZoomOrig
    //          = inv(CSS) * (MousePos - ZoomOrig)

    /*
    Using the algebraic simplification above, the following lines
    of code should work, but they DON'T??? They do now!!
*/
    const mag = this.store.getters.zoomMagnificationFactor;
    const zoomTransVec = this.store.getters.zoomTranslation;
    // Transform the pixel coordinates of the mouse event to *pre* affineTransformation coordinates
    this.mouseVector.set(
      (mouseX - zoomTransVec[0]) / mag,
      (mouseY + zoomTransVec[1]) / mag,
      0
    );
    // Transform the pre affine coordinates to coordinates on the sphere to before the current view transformation
    this.mouseVector.applyMatrix4(
      this.tmpMatrix.getInverse(this.transformMatrix)
    );

    this.currentScreenPoint.set(this.mouseVector.x, this.mouseVector.y);
    /* Rescale to unit circle */
    const len = this.mouseVector
      // .multiplyScalar(1 / SETTINGS.boundaryCircle.radius)
      .length();
    const R = SETTINGS.boundaryCircle.radius;
    if (len < R) {
      const mx = this.mouseVector.x;
      const my = this.mouseVector.y;
      // The cursor is inside the unit circle
      const zCoordinate =
        Math.sqrt(R * R - (mx * mx + my * my)) * (event.shiftKey ? -1 : +1);
      this.currentSpherePoint.set(mx, my, zCoordinate).normalize();
      this.isOnSphere = true;
      // this.currentPoint.copy(this.mouse);
      // console.debug(`Sphere pos: ${this.currentSpherePoint.toFixed(2)}`);
      // FIXME: what if we hit multiple lines or points
      this.hitPoints.forEach((p: SEPoint) => {
        p.ref.normalDisplay();
      });
      this.hitLines.forEach((p: SELine) => {
        p.ref.normalDisplay();
      });
      this.hitSegments.forEach((s: SESegment) => {
        s.ref.normalDisplay();
      });

      this.hitCircles.forEach((c: SECircle) => {
        c.ref.normalDisplay();
      });
      this.hitPoints.clear();
      this.hitLines.clear();
      this.hitSegments.clear();
      this.hitCircles.clear();
      this.hitNodes = this.store.getters.findNearbyObjects(
        this.currentSpherePoint,
        this.currentScreenPoint
      );
      this.infoText.hide();
      // Prioritize to highligh points

      this.hitPoints = this.hitNodes
        .filter((obj: SENodule) => obj instanceof SEPoint)
        .map(obj => obj as SEPoint);
      this.hitPoints.forEach((obj: SEPoint) => {
        obj.ref.glowingDisplay();
      });

      this.hitLines = this.hitNodes
        .filter(obj => obj instanceof SELine)
        .map(obj => obj as SELine);
      this.hitLines.forEach((obj: SELine) => {
        obj.ref.glowingDisplay();
      });

      this.hitSegments = this.hitNodes
        .filter(obj => obj instanceof SESegment)
        .map(obj => obj as SESegment);
      this.hitSegments.forEach((obj: SESegment) => {
        obj.ref.glowingDisplay();
      });

      this.hitCircles = this.hitNodes
        .filter(obj => obj instanceof SECircle)
        .map(obj => obj as SECircle);
      this.hitCircles.forEach((c: SECircle) => {
        c.ref.glowingDisplay();
      });
      if (this.hitPoints.length > 0) {
        this.infoText.showWithDelay(this.layers[LAYER.foregroundText], 300);
        this.infoText.text = this.hitPoints[0].name;
        this.infoText.translation.set(
          this.currentScreenPoint.x,
          -this.currentScreenPoint.y + 16
        );
      } else {
        const hitOthers = this.hitNodes.filter(n => !(n instanceof SEPoint));
        if (hitOthers.length > 0) {
          this.infoText.showWithDelay(this.layers[LAYER.foregroundText], 300);
          this.infoText.text = hitOthers[0].name;
          this.infoText.translation.set(
            this.currentScreenPoint.x,
            -this.currentScreenPoint.y + 16
          );
        }
      }
    } else {
      this.isOnSphere = false;
      this.currentSpherePoint.set(NaN, NaN, NaN);
    }
  }
  mouseLeave(event: MouseEvent): void {
    this.isOnSphere = false;
  }
}
