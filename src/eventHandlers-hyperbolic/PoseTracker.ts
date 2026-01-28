import {
  Scene,
  Vector2,
  Vector3,
  Mesh,
  ArrowHelper,
  Matrix4,
  Group,
  Intersection,
  Object3D,
  Object3DEventMap
} from "three";
import { Mouse3D } from "./mouseTypes";
import { HEStoreType } from "@/stores/hyperbolic";
import { HENodule } from "@/models-hyperbolic/HENodule";
import { create2DLine, createPoint } from "@/plottables-hyperbolic/MeshFactory";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import { HyperbolicToolStrategy } from "./ToolStrategy";

// const ORIGIN = new Vector3(0, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const Z_MINUS1 = new Vector3(0, 0, -1);
const TMP_MAT4 = new Matrix4();
export class PoseTracker implements HyperbolicToolStrategy {
  static hyperStore: HEStoreType;

  protected scene: Scene;
  protected hitObjects: HENodule[] = []; //these are the object the tool could potentially interact with
  protected hitSurfaces: Mesh[] = []; // these are the actual mesh surfaces intersected by the mouse ray
  protected onHyperboloid = false; // true if the mouse is over the hyperboloid surface
  protected objectHit = false; // true if the mouse is over an object

  private normalArrow = new ArrowHelper(); // ArrowHelper to show the normal vector of mouse intersection point

  constructor(scene: Scene) {
    this.scene = scene;
    this.normalArrow.setColor(0xffffff);
    this.normalArrow.setLength(1, 0.2, 0.2);
  }

  // add normal arrow to scene if mouse over a location on the hyperboloid
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseMoved(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection<Object3D<Object3DEventMap>>[]
  ): void {
    // clear previous highlights and boolean flags
    this.hitObjects.forEach(heNodule => heNodule.normalDisplay());
    this.hitSurfaces.splice(0);
    this.objectHit = false;
    this.onHyperboloid = false;

    this.hitObjects = intersectionList
      .map(intersect => {
        return PoseTracker.hyperStore.getObjectById(intersect.object.name);
      })
      .filter((obj): obj is HENodule => obj !== null);

    if (this.hitObjects.length > 0) {
      this.objectHit = true;
    } else {
      // Check for hyperboloid surface intersections
      intersectionList.forEach(intersect => {
        if (intersect.object.layers.test(HYPERBOLIC_LAYER.upperSheet)) {
          this.hitSurfaces.push(intersect.object as Mesh);
        }
      });
      if (this.hitSurfaces.length > 0) {
        this.onHyperboloid = true;
      }
    }

    this.normalArrow.setDirection(direction!);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mousePressed(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection<Object3D<Object3DEventMap>>[]
  ): void {
    //Not implemented
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseReleased(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection<Object3D<Object3DEventMap>>[]
  ): void {
    //Not implemented
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseLeave(event: MouseEvent): void {
    // clear previous highlights
    this.hitObjects.forEach(heNodule => heNodule.normalDisplay());
    this.hitSurfaces.splice(0);
    this.objectHit = false;
    this.onHyperboloid = false;
  }

  activate(): void {
    // throw new Error("Method not implemented.");
  }

  deactivate(): void {
    // clear previous highlights
    this.hitObjects.forEach(heNodule => heNodule.normalDisplay());
    this.hitSurfaces.splice(0);
    this.objectHit = false;
    this.onHyperboloid = false;
  }
}
