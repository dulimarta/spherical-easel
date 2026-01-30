import {
  Scene,
  Vector2,
  Vector3,
  Mesh,
  ArrowHelper,
  Matrix4,
  Group,
  Intersection
} from "three";
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
  protected hitObjects: HENodule[] = []; //these are the object the tool could potentially interact with (sorted by distance from the camera, closest first)
  protected hitSurfaces: Mesh[] = []; // these are the actual mesh surfaces intersected by the mouse ray (sorted by distance from the camera, closest first)

  private normalArrow = new ArrowHelper(); // ArrowHelper to show the normal vector of mouse intersection point

  constructor(scene: Scene) {
    this.scene = scene;
    // this.scene.add(this.normalArrow);
    this.normalArrow.setColor(0xffffff);
    this.normalArrow.setLength(1, 0.2, 0.2);
  }

  // add normal arrow to scene if mouse over a location on the hyperboloid
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseMoved(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection[]
  ): void {
    // clear previous highlights and flags
    this.hitObjects.forEach(heNodule => heNodule.normalDisplay());
    this.hitObjects.splice(0);
    this.hitSurfaces.splice(0);

    if (intersectionList.length === 0) {
      return;
    }

    this.hitObjects = PoseTracker.hyperStore.objectIntersections
      .map(intersect => {
        return PoseTracker.hyperStore.getObjectById(intersect.object.name); // returns null for surfaces
      })
      .filter((obj): obj is HENodule => obj !== null);

    if (PoseTracker.hyperStore.closestIntersectionIsSurface) {
      this.scene.add(this.normalArrow);
      // this.normalArrow.visible = true;
      this.normalArrow.position.copy(
        PoseTracker.hyperStore.surfaceIntersections[0].point
      );
      this.normalArrow.setDirection(
        PoseTracker.hyperStore.surfaceIntersections[0].normal!
      );
    } else {
      // this.normalArrow.visible = false;
      this.scene.remove(this.normalArrow);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mousePressed(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection[]
  ): void {
    //Not implemented
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseReleased(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection[]
  ): void {
    //Not implemented
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseLeave(event: MouseEvent): void {
    // clear previous highlights and flags
    this.hitObjects.forEach(heNodule => heNodule.normalDisplay());
    this.hitObjects.splice(0);
    this.hitSurfaces.splice(0);
    // this.normalArrow.visible = false;
    this.scene.remove(this.normalArrow);
  }

  activate(): void {
    // throw new Error("Method not implemented.");
  }

  deactivate(): void {
    // clear previous highlights and flags
    this.hitObjects.forEach(heNodule => heNodule.normalDisplay());
    this.hitObjects.splice(0);
    this.hitSurfaces.splice(0);
    // this.normalArrow.visible = false;
    this.scene.remove(this.normalArrow);
  }
}
