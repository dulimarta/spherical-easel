import {
  Scene,
  Vector4,
  Vector3,
  Mesh,
  ArrowHelper,
  Matrix4,
  Group,
  Intersection
} from "three";
import { HEStoreType } from "@/stores/hyperbolic";
import { HENodule } from "@/models-hyperbolic/HENodule";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import { HyperbolicToolStrategy } from "./ToolStrategy";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { HEAntipodalPoint } from "@/models-hyperbolic/HEAntipodalPoint";
import { CustomPointMaterial } from "@/plottables-hyperbolic/MaterialFactory";
import { AddAntipodalPointCommand } from "@/commands-hyperbolic/AddAntipodalPointCommand";
import { parseJsonText } from "typescript";
import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";
import { HELabel } from "@/models-hyperbolic/HELabel";
import { a } from "vitest/dist/chunks/suite.d.FvehnV49.js";
import { HELine } from "@/models-hyperbolic/HELine";

export class PoseTracker implements HyperbolicToolStrategy {
  static hyperStore: HEStoreType;
  protected scene: Scene;

  //flags
  protected somethingIsHit = false;
  protected hyperboloidIsFirstSurfaceHit = false;
  protected hyperboloidFirstHitOverall = false;
  protected idealStripFirstHitOverall = false;
  protected idealStripIsFirstSurfaceHit = false;
  protected ultraStripFirstHitOverall = false;
  protected ultraStripIsFirstSurfaceHit = false;
  protected aSurfaceIsIntersected = false;

  /**
   * Arrays of nodules near the mouse event location
   */
  protected hitHENodules: HENodule[] = [];
  protected hitHEPoints: HEPoint[] = [];
  protected hitHELabels: HELabel[] = [];
  protected hitHELines: HELine[] = [];
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseMoved(event: MouseEvent): void {
    // Set the display to normal for all previously nearby non-selected objects
    this.hitHENodules.forEach((n: HENodule) => {
      if (!n.selected) n.glowing = false;
    });

    // clear previous hit arrays
    this.clearAllHitArrays();

    // update the flags
    this.somethingIsHit =
      PoseTracker.hyperStore.objectIntersections.length > 0 ||
      PoseTracker.hyperStore.surfaceIntersections.length > 0;
    this.aSurfaceIsIntersected =
      PoseTracker.hyperStore.surfaceIntersections.length > 0;
    this.hyperboloidIsFirstSurfaceHit = this.aSurfaceIsIntersected
      ? PoseTracker.hyperStore.surfaceIntersections[0].object.name.match(
          /(Sheet)/
        ) !== null
      : false; // THIS SHOULD ONLY BE USED WHERE WE KNOW this.aSurfaceIsIntersected IS TRUE
    this.idealStripIsFirstSurfaceHit = this.aSurfaceIsIntersected
      ? PoseTracker.hyperStore.surfaceIntersections[0].object.name.match(
          /(Ideal)/
        ) !== null
      : false; // THIS SHOULD ONLY BE USED WHERE WE KNOW this.aSurfaceIsIntersected IS TRUE
    this.ultraStripIsFirstSurfaceHit = this.aSurfaceIsIntersected
      ? PoseTracker.hyperStore.surfaceIntersections[0].object.name.match(
          /(Ultra)/
        ) !== null
      : false; // THIS SHOULD ONLY BE USED WHERE WE KNOW this.aSurfaceIsIntersected IS TRUE

    this.hyperboloidFirstHitOverall =
      PoseTracker.hyperStore.hyperboloidIsClosestIntersection;
    this.idealStripFirstHitOverall =
      PoseTracker.hyperStore.idealStripIsClosestIntersection;
    this.ultraStripFirstHitOverall =
      PoseTracker.hyperStore.ultraStripIsClosestIntersection;

    // control the normal arrow
    // if (
    //   PoseTracker.hyperStore.closestIntersectionIsSurface &&
    //   PoseTracker.hyperStore.surfaceIntersections.length > 0
    // ) {
    //   this.scene.add(this.normalArrow);
    //   // this.normalArrow.visible = true;
    //   this.normalArrow.position.copy(
    //     PoseTracker.hyperStore.surfaceIntersections[0].point
    //   );
    //   this.normalArrow.setDirection(
    //     PoseTracker.hyperStore.surfaceIntersections[0].normal!
    //   );
    // } else {
    //   // this.normalArrow.visible = false;
    //   this.scene.remove(this.normalArrow);
    // }

    // update the hit arrays as necessary
    if (PoseTracker.hyperStore.objectIntersections.length === 0) {
      return;
    }
    // console.log(
    //   "# intersections",
    //   PoseTracker.hyperStore.objectIntersections.length
    // );
    this.hitHENodules = PoseTracker.hyperStore.objectIntersections
      .map(intersect => {
        return PoseTracker.hyperStore.getObjectById(intersect.object.name); // returns null for surfaces
      })
      .filter((obj): obj is HENodule => obj !== null)
      .filter((n: HENodule) => {
        if (n instanceof HEIntersectionPoint || n instanceof HEAntipodalPoint) {
          if (!n.isUserCreated) {
            return n.exists; //You always hit automatically created intersection points if it exists
          } else {
            return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
          }
        } else {
          return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
        }
      });
    // console.log("# hit HENodules", this.hitHENodules.length);

    this.hitHEPoints = this.hitHENodules
      .filter(obj => obj.name.startsWith("P"))
      .map(obj => obj as HEPoint);
    // console.log("# hit HEPoints", this.hitHEPoints.length);

    this.hitHELabels = this.hitHENodules
      .filter(obj => obj.name.startsWith("La"))
      .map(obj => obj as HELabel);
    // console.log(
    //   "# hit HELabels",
    //   this.hitHELabels.length,
    //   this.hitHELabels[0] ? this.hitHELabels[0].name : ""
    // );
    this.hitHELines = this.hitHENodules
      .filter(obj => obj.name.startsWith("Li"))
      .map(obj => obj as HELine);
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
    this.scene.remove(this.normalArrow);
  }

  activate(): void {
    // throw new Error("Method not implemented.");
  }

  deactivate(): void {
    this.clearAllHitArrays();
    this.scene.remove(this.normalArrow);
  }

  clearAllHitArrays(): void {
    this.hitHENodules.splice(0);
    this.hitHEPoints.splice(0);
    this.hitHELabels.splice(0);
    this.hitHELines.splice(0);
  }

  static addCreateAntipodeCommand(
    parentPoint: HEPoint,
    commandGroup: CommandGroup
  ): HEAntipodalPoint {
    // Create the antipode of the new parent point
    const antipodalVtx = new HEAntipodalPoint(parentPoint, false);

    // Create a plottable label
    // Create an HELabel and link it to the plottable object

    // const location = new Vector3();
    // antipodalVtx.location = location
    //   .copy(parentPoint.location)
    //   .multiplyScalar(-1);
    // Set the initial label location
    // const newHEAntipodalLabel = antipodalVtx.attachLabelWithOffset(
    //   new Vector3(
    //     2 * SETTINGS.point.initialLabelOffset,
    //     SETTINGS.point.initialLabelOffset,
    //     0
    //   )
    // );
    const newHEAntipodalLabel = new HELabel(
      "point",
      antipodalVtx,
      antipodalVtx.position,
      antipodalVtx.name
    );
    newHEAntipodalLabel.showing = false; // automatically created labels are not shown
    antipodalVtx.setLabel(newHEAntipodalLabel); // link the label to the point
    commandGroup.addCommand(
      new AddAntipodalPointCommand(
        antipodalVtx,
        parentPoint,
        newHEAntipodalLabel
      )
    );

    return antipodalVtx;
  }

  static vec3ToVec4(vec3: Vector3, w: number): Vector4 {
    return new Vector4(vec3.x, vec3.y, vec3.z, w);
  }
}
