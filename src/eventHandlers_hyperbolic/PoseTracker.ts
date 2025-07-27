import { HyperbolicToolStrategy } from "@/eventHandlers/ToolStrategy";
import {
  Scene,
  Vector2,
  Vector3,
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  ArrowHelper,
  CylinderGeometry,
  Matrix4
} from "three";
import { Mouse3D } from "./mouseTypes";
import { HEStoreType } from "@/stores/hyperbolic";
import { HENodule } from "@/models-hyperbolic/HENodule";
import { createPoint } from "@/mesh/MeshFactory";

// const ORIGIN = new Vector3(0, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
export class PoseTracker implements HyperbolicToolStrategy {
  static hyperStore: HEStoreType;

  protected scene: Scene;
  protected first: Mouse3D = {
    normalized2D: new Vector2(),
    position: new Vector3(),
    normal: new Vector3()
  };
  protected second: Mouse3D = {
    normalized2D: new Vector2(),
    position: new Vector3(),
    normal: new Vector3()
  };
  protected isDragging = false;
  private aPoint = createPoint();
  private auxLineCF = new Matrix4();
  private auxRotationAxis = new Vector3();
  private auxLine = new Mesh(
    new CylinderGeometry(0.01, 0.01, 100),
    // auxLineTube,
    new MeshStandardMaterial({ color: "khaki" })
  );
  private secondaryIntersections: Array<Mesh> = [];

  private normalArrow = new ArrowHelper(); // ArrowHelper to show the normal vector of mouse intersection point

  private hitObject: HENodule | null = null;
  // protected mouseCoordNormalized = new Vector2();
  // private rayCaster = new Raycaster();
  // private mousePoint = new Mesh(
  //   new SphereGeometry(0.05),
  //   new MeshStandardMaterial({ color: "white" })
  // );
  constructor(scene: Scene) {
    this.scene = scene;
    // this.canvas = canvas;
    this.normalArrow.setColor(0xffffff);
    this.normalArrow.setLength(1, 0.2, 0.2);
    this.aPoint.add(this.normalArrow);
    this.auxLine.matrixAutoUpdate = false;
    for (let k = 0; k < 3; k++) {
      const p = createPoint(0.06, "red");
      this.secondaryIntersections.push(p);
    }
  }
  mouseMoved(
    event: MouseEvent,
    scrPos: Vector2,
    position: Vector3 | null,
    direction: Vector3 | null
  ): void {
    // console.debug(
    //   "PoseTracker::mouseMoved",
    //   position ? position.toFixed(2) : "N/A",
    //   "dragging",
    //   this.isDragging
    // );
    // console.debug(
    //   "Object intersections: ",
    //   PoseTracker.hyperStore.objectIntersections.length
    // );
    this.hitObject?.normalDisplay();
    this.hitObject = null;
    if (PoseTracker.hyperStore.objectIntersections.length > 0) {
      const firstIntersect = PoseTracker.hyperStore.objectIntersections[0];
      // console.debug("Hit object", firstIntersect.object.name);
      this.hitObject = PoseTracker.hyperStore.getObjectById(
        firstIntersect.object.name
      );
      // console.debug(`Changing color of`, this.hitObject);
      if (this.hitObject) {
        this.scene.remove(this.aPoint);
        this.hitObject.glowingDisplay();
      } else {
        this.scene.add(this.aPoint);
      }
    }
    if (position && this.hitObject === null) {
      this.aPoint.position.copy(position);
      this.scene.add(this.aPoint);
      this.normalArrow.setDirection(direction!);
      this.second.position.copy(position);
      this.secondaryIntersections.forEach(p => this.scene.remove(p));

      if (event.shiftKey) {
        // When shift key is pressed show all the associated points
        // on the sphere and hyperboloid(s)
        const angle = this.second.position.angleTo(Y_AXIS);
        this.auxRotationAxis
          .crossVectors(Y_AXIS, this.second.position)
          .normalize();
        this.auxLineCF.makeRotationAxis(this.auxRotationAxis, angle);
        this.auxLine.matrix.copy(this.auxLineCF);
        this.scene.add(this.auxLine);
        const { x: x1, y: y1, z: z1 } = this.second.position;
        // Always add the antipode
        this.secondaryIntersections[0].position.set(-x1, -y1, -z1);
        this.scene.add(this.secondaryIntersections[0]);
        const pointDistance = this.second.position.length();
        let scaleFactor = 0;
        if (pointDistance > 1) {
          /* Second point on hyperboloid, compute scale factor to project it down to the sphere */
          scaleFactor = 1 / pointDistance;
        } else {
          /* Second point on sphere, compute the scale factor to project it up to the hyperboloid */
          const scaleSquared = -1 / (x1 * x1 + y1 * y1 - z1 * z1);
          if (scaleSquared > 0) scaleFactor = Math.sqrt(scaleSquared);
        }
        if (scaleFactor > 0) {
          // Draw the associated point and its antipode
          this.secondaryIntersections[1].position.set(
            scaleFactor * x1,
            scaleFactor * y1,
            scaleFactor * z1
          );
          this.secondaryIntersections[2].position.set(
            -scaleFactor * x1,
            -scaleFactor * y1,
            -scaleFactor * z1
          );
          this.scene.add(this.secondaryIntersections[1]);
          this.scene.add(this.secondaryIntersections[2]);
        }
      } else {
        this.scene.remove(this.auxLine);
      }
    } else {
      this.scene.remove(this.aPoint);
      this.second.position.set(Number.NaN, Number.NaN, Number.NaN);
    }
    this.second.normalized2D.copy(scrPos);
    if (direction) this.second.normal.copy(direction);
    else this.second.normal.set(Number.NaN, Number.NaN, Number.NaN);
  }

  mousePressed(
    event: MouseEvent,
    pos2D: Vector2,
    pos3D: Vector3 | null,
    n: Vector3 | null
  ): void {
    this.first.normalized2D.copy(pos2D);
    if (pos3D) this.first.position.copy(pos3D);
    else this.first.position.set(Number.NaN, Number.NaN, Number.NaN);
    if (n) this.first.normal.copy(n);
    else this.first.normal.set(Number.NaN, Number.NaN, Number.NaN);
    this.isDragging = true;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseReleased(event: MouseEvent, p: Vector3, d: Vector3): void {
    // console.debug("PoseTracker::mouseReleased");
    this.isDragging = false;
    if (!event.shiftKey) {
      this.scene.remove(this.auxLine);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  activate(): void {
    throw new Error("Method not implemented.");
  }
  deactivate(): void {
    throw new Error("Method not implemented.");
  }
}
