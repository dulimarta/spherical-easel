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
import { HEPoint } from "@/models-hyperbolic/HEPoint";

// const ORIGIN = new Vector3(0, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const Z_MINUS1 = new Vector3(0, 0, -1);
const TMP_MAT4 = new Matrix4();
export class PoseTracker implements HyperbolicToolStrategy {
  static hyperStore: HEStoreType;

  protected hyperboloidFirstHit = false;
  protected pointAtInfinityStripFirstHit = false;

  protected scene: Scene;
  //protected hitSurfaces: Mesh[] = []; // these are the actual mesh surfaces intersected by the mouse ray (sorted by distance from the camera, closest first)
  /**
   * Arrays of nodules near the mouse event location
   */
  protected hitHENodules: HENodule[] = [];
  protected hitHEPoints: HEPoint[] = [];
  // protected hitHELines: HELine[] = [];
  // protected hitHESegments: HESegment[] = [];
  // protected hitHECircles: HECircle[] = [];
  // protected hitHEEllipses: HEEllipse[] = [];
  // protected hitHELabels: HELabel[] = [];
  // protected hitHEAngleMarkers: HEAngleMarker[] = [];
  // protected hitHEParametrics: HEParametric[] = [];
  // protected hitHEPolygons: HEPolygon[] = [];
  // protected hitHETexts: HEText[] = [];

  private normalArrow = new ArrowHelper(); // ArrowHelper to show the normal vector of mouse intersection point

  constructor(scene: Scene) {
    this.scene = scene;
    // this.scene.add(this.normalArrow);
    this.normalArrow.setColor(0xffffff);
    this.normalArrow.setLength(1, 0.2, 0.2);
  }

  // add normal arrow to scene if mouse over a location on the hyperboloid
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseMoved(event: MouseEvent): void {
    // Set the display to normal for all previously nearby non-selected objects
    this.hitHENodules.forEach((n: HENodule) => {
      if (!n.selected) n.glowing = false;
    });

    // clear previous highlights and flags
    this.clearAllHitArrays();

    if (PoseTracker.hyperStore.objectIntersections.length === 0) {
      return;
    }
    //
    this.hitHENodules = PoseTracker.hyperStore.objectIntersections
      .map(intersect => {
        return PoseTracker.hyperStore.getObjectById(intersect.object.name); // returns null for surfaces
      })
      .filter((obj): obj is HENodule => obj !== null)
      .filter((n: HENodule) => {
        // if (n instanceof HEIntersectionPoint || n instanceof HEAntipodalPoint) {
        //   if (!n.isUserCreated) {
        //     return n.exists; //You always hit automatically created intersection points if it exists
        //   } else {
        //     return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
        //   }
        // } else {
        return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
        // }
      });

    this.hitHEPoints = this.hitHENodules
      .filter(obj => obj.name.startsWith("P"))
      .map(obj => obj as HEPoint);

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
  mousePressed(event: MouseEvent): void {
    //Not implemented
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseReleased(event: MouseEvent): void {
    //Not implemented
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseLeave(event: MouseEvent): void {
    this.clearAllHitArrays();
    // this.normalArrow.visible = false;
    this.scene.remove(this.normalArrow);
  }

  activate(): void {
    // throw new Error("Method not implemented.");
  }

  deactivate(): void {
    this.clearAllHitArrays();
    // this.normalArrow.visible = false;
    this.scene.remove(this.normalArrow);
  }

  clearAllHitArrays(): void {
    // clear previous highlights and flags
    this.hitHENodules.splice(0);
    // this.hitSurfaces.splice(0);
    this.hitHEPoints.splice(0);
    // this.normalArrow.visible = false;
    this.scene.remove(this.normalArrow);
  }
}
