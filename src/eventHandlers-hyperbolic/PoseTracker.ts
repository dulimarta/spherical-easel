import { Scene, Vector3 } from "three/webgpu";
import { HEStoreType } from "@/stores/hyperbolic";
// import { HENodule } from "@/models-hyperbolic/HENodule";
import { HyperbolicTool } from "./ToolStrategy";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { HEAntipodalPoint } from "@/models-hyperbolic/HEAntipodalPoint";
import { AddAntipodalPointCommand } from "@/commands-hyperbolic/AddAntipodalPointCommand";
// import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";
import { HELabel } from "@/models-hyperbolic/HELabel";
import { HELine } from "@/models-hyperbolic/HELine";
// import { useHyperbolicStore } from "@/stores/hyperbolic";
import { CKNodule } from "@/models/CKNodule";
import { CKPoint } from "@/models/CKPoint";
import { GeometryStoreType, useGeometryStore } from "@/stores/geometry";
import { SURFACE_TYPES } from "@/global-settings-hyperbolic";
// let _store: HEStoreType | null = null;
// let _geometryStore: GeometryStoreType | null = null;
export class PoseTracker implements HyperbolicTool {
  // get hyperStore(): HEStoreType {
  //   if (!_store) {
  //     _store = useHyperbolicStore();
  //   }
  //   return _store;
  // }
  // get geoStore(): GeometryStoreType {
  //   if (!_geometryStore) {
  //     _geometryStore = useGeometryStore();
  //   }
  //   return _geometryStore;
  // }
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
  // protected hitHENodules: CKNodule[] = [];
  // protected hitCKPoints: CKPoint[] = [];
  // protected hitHELabels: HELabel[] = [];
  // protected hitHELines: HELine[] = [];
  // protected hitHESegments: HESegment[] = [];
  // protected hitHECircles: HECircle[] = [];
  // protected hitHEEllipses: HEEllipse[] = [];
  // protected hitHELabels: HELabel[] = [];
  // protected hitHEAngleMarkers: HEAngleMarker[] = [];
  // protected hitHEParametrics: HEParametric[] = [];
  // protected hitHEPolygons: HEPolygon[] = [];
  // protected hitHETexts: HEText[] = [];

  // private normalArrow = new ArrowHelper(); // ArrowHelper to show the normal vector of mouse intersection point

  constructor(scene: Scene) {
    this.scene = scene;
    // this.scene.add(this.normalArrow);
    // this.normalArrow.setColor(0xffffff);
    // this.normalArrow.setLength(1, 0.2, 0.2);
  }
  mouseReleased(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | string>
  ): void {
    // throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // mousePressed(
  //   event: MouseEvent,
  //   position: Vector3,
  //   onSurface: SURFACE_TYPES,
  //   hitObject: Array<CKNodule | string>
  // ): void {
  //   //Not implemented
  // }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | string>
  ): void {
    console.debug("PoseTracker::mouseMoved", position);
    // this.prepareForNextEvent();
    // Set the display to normal for all previously nearby non-selected objects
    hitObjects
      .filter(obj => obj instanceof CKNodule)
      .forEach((n: CKNodule) => {
        n.setHighlight(false);
        // if (!n.selected) n.glowing = false;
      });
    const surfPos = hitObjects.findIndex(z => typeof z === "string");
    if (surfPos >= 0) {
      this.aSurfaceIsIntersected = true;
      this.hyperboloidIsFirstSurfaceHit =
        (hitObjects[surfPos] as string).match(/Sheet/) !== null;
      this.idealStripIsFirstSurfaceHit =
        (hitObjects[surfPos] as string).match(/Ideal/) !== null;
      this.ultraStripIsFirstSurfaceHit =
        (hitObjects[surfPos] as string).match(/Ultra/) !== null;
      this.hyperboloidFirstHitOverall =
        this.hyperboloidFirstHitOverall && surfPos === 0;
      this.idealStripFirstHitOverall =
        this.idealStripIsFirstSurfaceHit && surfPos === 0;
      this.ultraStripFirstHitOverall =
        this.ultraStripIsFirstSurfaceHit && surfPos === 0;
    }

    // update the hit arrays as necessary
    if (hitObjects.length === 0) {
      return;
    }

    this.somethingIsHit = true;
    // this.hitHENodules = hitObjects
    // .map(intersect => {
    //   // console.debug(
    //   //   `Checking intersection with object ${intersect.object.name}`
    //   // );
    //   return this.geoStore.getObjectById(intersect.object.name); // returns null for surfaces
    // })
    // .filter(obj => typeof obj !== "string");
    // .filter((n: CKNodule) => {
    //   console.debug(`Checking if ${n.name} is hit`);
    //   if (n instanceof HEIntersectionPoint || n instanceof HEAntipodalPoint) {
    //     if (!n.isUserCreated) {
    //       return n.exists; //You always hit automatically created intersection points if it exists
    //     } else {
    //       return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
    //     }
    //   } else {
    //     return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
    //   }
    // });

    // console.debug(
    //   "Hit HENodule:",
    //   this.hitHENodules.map(p => p.name)
    // );

    // this.hitCKPoints = this.hitHENodules
    //   .filter(obj => obj.name.startsWith("P"))
    //   .map(obj => obj as CKPoint);

    // console.debug(
    //   "Hit points:",
    //   this.hitCKPoints.map(p => p.name)
    // );
    // this.hitHELabels = this.hitHENodules
    //   .filter(obj => obj.name.startsWith("La"))
    //   .map(obj => obj as HELabel);

    // this.hitHELines = this.hitHENodules
    //   .filter(
    //     obj => obj.name.startsWith("Li") && this.hyperboloidIsFirstSurfaceHit
    //   )
    //   .map(obj => obj as HELine);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // mouseReleased(event: MouseEvent): void {
  //Not implemented
  // }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // mouseLeave(event: MouseEvent): void {
  // this.prepareForNextEvent();
  // }

  activate(): void {
    // throw new Error("Method not implemented.");
  }

  deactivate(): void {
    this.prepareForNextEvent();
  }

  prepareForNextEvent(): void {
    // clear previous hit arrays
    // this.hitHENodules.splice(0);
    // this.hitCKPoints.splice(0);
    // this.hitHELabels.splice(0);
    // this.hitHELines.splice(0);
    // update the flags
  }
  static addCreateAntipodeCommand(
    parentPoint: HEPoint,
    commandGroup: CommandGroup
  ): HEAntipodalPoint {
    // Create the antipode of the new parent point
    const antipodalVtx = new HEAntipodalPoint(parentPoint, false);
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
}
