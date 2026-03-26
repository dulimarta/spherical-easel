import { Intersection, Mesh, Scene, Uniform, Vector2, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";
import * as THREE from "three/webgpu";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import {
  createBoundaryCone,
  createPoint,
  createPointAtInfinity,
  createPointAtInfinityTube
} from "@/plottables-hyperbolic/MeshFactory";
import { CustomPointMaterial } from "@/plottables-hyperbolic/MaterialFactory";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { SetPointUserCreatedValueCommand } from "@/commands-hyperbolic/SetPointUserCreatedValueCommand";
import { HEOneOrTwoDimensional } from "@/types";
import { HEAntipodalPoint } from "@/models-hyperbolic/HEAntipodalPoint";
import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";
import { AddPointCommand } from "@/commands-hyperbolic/AddPointCommand";
import { HELabel } from "@/models-hyperbolic/HELabel";
const Z_AXIS = new Vector3(0, 0, 1);

export class PointHandler extends PoseTracker {
  protected tempPointMesh: Mesh;
  protected tempPointMaterial: CustomPointMaterial;
  protected tempPointAtInfinityMesh: Mesh;
  protected tempPointAtInfinityMaterial: CustomPointMaterial;
  protected tempTube: Mesh;
  protected tempTubeMaterial: CustomPointMaterial;
  protected tempUpperCone: Mesh;
  protected tempLowerCone: Mesh;
  private tempPointInScene = false;
  private tempPointAtInfinityInScene = false;
  private tempPointAtInfinityUpperTubeInScene = false;
  private tempPointAtInfinityLowerTubeInScene = false;

  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: HEPoint[] = [];
  /**
   * As the user moves the pointer around snap the temporary marker to this object temporarily
   */
  protected snapToObject = null; //fix when HEOneOrTwoDimensional is implemented
  //: HEOneOrTwoDimensional | null = null;

  constructor(scene: Scene) {
    super(scene);
    this.scene = scene;
    this.tempPointMesh = createPoint({
      name: "pointHandlerTempPoint",
      temporary: true,
      upper: true // this doesn't mater for temporary objects
    });
    this.tempPointMaterial = this.tempPointMesh.material as CustomPointMaterial;
    this.tempPointAtInfinityMesh = createPointAtInfinity({
      name: "pointHandlerTempPointAtInfinity",
      temporary: true,
      upper: true // this doesn't mater for temporary objects
    });
    this.tempPointAtInfinityMaterial = this.tempPointAtInfinityMesh
      .material as CustomPointMaterial;
    this.tempTube = createPointAtInfinityTube();
    this.tempTubeMaterial = this.tempTube.material as CustomPointMaterial;
    this.tempLowerCone = createBoundaryCone({ upper: false });
    this.tempUpperCone = createBoundaryCone({ upper: true });
  }
  mousePressed(event: MouseEvent): void {
    // console.debug("PointHandler::mousePressed()")
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will create a new point at the same location. This is not what we want so
    // we call super.mouseMove
    // super.mouseMoved(event);

    if (this.somethingIsHit) {
      // If this is near any other points do not create a new point, unless the hitSEPoint is an un user-created intersection or antipodal point
      this.updateFilteredPointsList();

      if (this.filteredIntersectionPointsList.length > 0) {
        //Make it user created and turn on the display
        // set the display to visible order

        new SetPointUserCreatedValueCommand(
          this.filteredIntersectionPointsList[0] as
            | HEIntersectionPoint
            | HEAntipodalPoint,
          true
        ).execute();
        return;
        // }
        // EventBus.fire("show-alert", {
        //   key: `handlers.pointCreationAttemptDuplicate`,
        //   keyOptions: {},
        //   type: "error"
        // });
        // return;
      } else {
        const pointCommandGroup = new CommandGroup();
        // create a new Point
        let vtx: /*HEPointOnOneOrTwoDimensional |*/ HEPoint | null = null;
        let newHELabel: HELabel | null = null;

        // if (this.hitSESegments.length > 0) {
        //   // The new point will be a point on a segment
        //   // Create the model object for the new point and link them
        //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSESegments[0]);
        //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
        //   newSELabel = new SELabel("point", vtx);

        //   // Create and execute the command to create a new point for undo/redo
        //   pointCommandGroup.addCommand(
        //     new AddPointOnOneDimensionalCommand(
        //       vtx as SEPointOnOneOrTwoDimensional,
        //       this.hitSESegments[0],
        //       newSELabel
        //     )
        //   );
        // }
        // else if (this.hitSELines.length > 0) {
        //   // The new point will be a point on a line
        //   // Create the model object for the new point and link them
        //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSELines[0]);
        //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
        //   newSELabel = new SELabel("point", vtx);

        //   // Create and execute the command to create a new point for undo/redo
        //   pointCommandGroup.addCommand(
        //     new AddPointOnOneDimensionalCommand(
        //       vtx as SEPointOnOneOrTwoDimensional,
        //       this.hitSELines[0],
        //       newSELabel
        //     )
        //   );
        // } else if (this.hitSECircles.length > 0) {
        //   // The new point will be a point on a circle
        //   // Create the model object for the new point and link them
        //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSECircles[0]);
        //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
        //   newSELabel = new SELabel("point", vtx);

        //   // Create and execute the command to create a new point for undo/redo
        //   pointCommandGroup.addCommand(
        //     new AddPointOnOneDimensionalCommand(
        //       vtx as SEPointOnOneOrTwoDimensional,
        //       this.hitSECircles[0],
        //       newSELabel
        //     )
        //   );
        // } else if (this.hitSEEllipses.length > 0) {
        //   // The new point will be a point on an ellipse
        //   // Create the model object for the new point and link them
        //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSEEllipses[0]);
        //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
        //   newSELabel = new SELabel("point", vtx);

        //   // Create and execute the command to create a new point for undo/redo
        //   pointCommandGroup.addCommand(
        //     new AddPointOnOneDimensionalCommand(
        //       vtx as SEPointOnOneOrTwoDimensional,
        //       this.hitSEEllipses[0],
        //       newSELabel
        //     )
        //   );
        // } else if (this.hitSEParametrics.length > 0) {
        //   // The new point will be a point on an ellipse
        //   // Create the model object for the new point and link them
        //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSEParametrics[0]);
        //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
        //   newSELabel = new SELabel("point", vtx);

        //   // Create and execute the command to create a new point for undo/redo
        //   pointCommandGroup.addCommand(
        //     new AddPointOnOneDimensionalCommand(
        //       vtx as SEPointOnOneOrTwoDimensional,
        //       this.hitSEParametrics[0],
        //       newSELabel
        //     )
        //   );
        // } else if (this.hitSEPolygons.length > 0) {
        //   // The new point will be a point on an ellipse
        //   // Create the model object for the new point and link them
        //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSEPolygons[0]);
        //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
        //   newSELabel = new SELabel("point", vtx);

        //   // Create and execute the command to create a new point for undo/redo
        //   pointCommandGroup.addCommand(
        //     new AddPointOnOneDimensionalCommand(
        //       vtx as SEPointOnOneOrTwoDimensional,
        //       this.hitSEPolygons[0],
        //       newSELabel
        //     )
        //   );
        // }
        // else {
        // mouse press on empty location so create a free point
        // Create the model object for the new point and link them
        // this over either the point at infinity strip or the hyperboloid
        const hitLocation =
          PoseTracker.hyperStore.surfaceIntersections[0].point;
        if (this.hyperboloidFirstHit) {
          vtx = new HEPoint({
            atInfinity: false,
            upper: hitLocation.z > 0,
            posOrAngle: hitLocation
          });
          // vtx.location = hitLocation;
          newHELabel = new HELabel(
            "point",
            vtx,
            hitLocation,
            vtx.name,
            false,
            hitLocation.z > 0
          );
        } else if (this.pointAtInfinityStripFirstHit) {
          vtx = new HEPoint({
            atInfinity: true,
            upper: hitLocation.z > 0,
            posOrAngle: (
              this.tempPointAtInfinityMesh.material as CustomPointMaterial
            ).angle
          });
          // vtx.angle = (
          //   this.tempPointAtInfinityMesh.material as CustomPointMaterial
          // ).angle;
          newHELabel = new HELabel(
            "point",
            vtx,
            (
              this.tempPointAtInfinityMesh.material as CustomPointMaterial
            ).angle,
            vtx.name,
            true,
            hitLocation.z > 0
          );
        }

        if (vtx && newHELabel) {
          pointCommandGroup.addCommand(new AddPointCommand(vtx, newHELabel));
          /////////////
          // Create the antipode of the new point, vtx
          PointHandler.addCreateAntipodeCommand(
            vtx as HEPoint,
            pointCommandGroup
          );
          ///////////

          // Set the initial label location
          // this.tmpVector
          //   .copy(vtx.locationVector)
          //   .add(
          //     new Vector3(
          //       2 * SETTINGS.point.initialLabelOffset,
          //       SETTINGS.point.initialLabelOffset,
          //       0
          //     )
          //   )
          //   .normalize();
          // newSELabel.locationVector = this.tmpVector;
        }
        pointCommandGroup.execute();
        super.mouseLeave(event); // If this line is not here the point handler puts a "dim" point on the sphere and when you trigger the mouseLeave() event the point "brightens".  This fixes that issue so there is no brightening.
      }
    } else {
      // Remove the temporary objects
      this.removeAllTempObjects();
    }
  }
  mouseMoved(event: MouseEvent): void {
    // Process the intersection list into HENodules and set the flags
    super.mouseMoved(event);

    this.updateFilteredPointsList();

    if (this.filteredIntersectionPointsList.length > 0) {
      // console.log(
      //   "point handler filter",
      //   this.filteredIntersectionPointsList[0].name,
      //   this.filteredIntersectionPointsList[0].material.angle,
      //   this.filteredIntersectionPointsList[0].material.position.toFixed(2)
      // );
      this.filteredIntersectionPointsList[0].glowing = true;
      this.snapToObject = null;
    }
    // else if (this.hitHESegments.length > 0) {
    //   this.hitHESegments[0].glowing = true;
    //   this.snapToTemporaryOneDimensional = this.hitHESegments[0];
    // }
    else {
      this.snapToObject = null;
    }

    if (this.somethingIsHit) {
      if (this.snapToObject === null) {
        if (PoseTracker.hyperStore.hyperboloidIsClosestIntersection) {
          if (!this.tempPointInScene) {
            this.tempPointInScene = true;
            this.scene.add(this.tempPointMesh);
          }
          this.tempPointMaterial.position =
            PoseTracker.hyperStore.surfaceIntersections[0].point;
        } else {
          if (this.tempPointInScene) {
            this.tempPointInScene = false;
            this.scene.remove(this.tempPointMesh);
          }
        }

        if (PoseTracker.hyperStore.pointAtInfinityStripIsClosestIntersection) {
          if (!this.tempPointAtInfinityInScene) {
            this.tempPointAtInfinityInScene = true;
            this.scene.add(this.tempTube);
            this.scene.add(this.tempPointAtInfinityMesh);
          }
          const location = PoseTracker.hyperStore.surfaceIntersections[0].point;
          const angle = Math.atan2(location.y, location.x);
          const upper = location.z > 0;
          this.tempPointAtInfinityMaterial.upper = upper ? 1 : 0;
          this.tempPointAtInfinityMaterial.angle = angle;
          this.tempTubeMaterial.upper = upper ? 1 : 0;
          this.tempTubeMaterial.angle = angle;

          if (!this.tempPointAtInfinityLowerTubeInScene && !upper) {
            this.scene.add(this.tempLowerCone);
            this.tempPointAtInfinityLowerTubeInScene = true;
            this.tempPointAtInfinityUpperTubeInScene = false;
            this.scene.remove(this.tempUpperCone);
          }

          if (!this.tempPointAtInfinityUpperTubeInScene && upper) {
            this.scene.add(this.tempUpperCone);
            this.tempPointAtInfinityUpperTubeInScene = true;
            this.tempPointAtInfinityLowerTubeInScene = false;
            this.scene.remove(this.tempLowerCone);
          }
        } else {
          if (this.tempPointAtInfinityInScene) {
            this.tempPointAtInfinityInScene = false;
            this.tempPointAtInfinityUpperTubeInScene = false;
            this.tempPointAtInfinityLowerTubeInScene = false;
            this.scene.remove(this.tempTube);
            this.scene.remove(this.tempPointAtInfinityMesh);
            this.scene.remove(this.tempLowerCone);
            this.scene.remove(this.tempUpperCone);
          }
        }
      } else {
        // snap to an object
        if (!this.tempPointInScene) {
          this.tempPointInScene = true;
          this.scene.add(this.tempPointMesh);
        }
        // this.tempPointMaterial.position = this.snapToObject.closestVector(
        //   PoseTracker.hyperStore.surfaceIntersections[0].point
        // );
      }
      // If there is a nearby (possibly user created or not) point turn off the temporary marker
      if (this.filteredIntersectionPointsList.length > 0) {
        if (this.tempPointInScene) {
          // Remove the temporary point
          this.scene.remove(this.tempPointMesh);
          this.tempPointInScene = false;
          this.snapToObject = null;
        }
      }
    } else {
      // the event is not over the hyperboloid and is not over the point at infinity strip remove all temp objects
      this.removeAllTempObjects();
    }
  }

  mouseReleased(event: MouseEvent): void {
    // throw new Error("Method not implemented.");
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.removeAllTempObjects();
  }

  activate(): void {
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
    this.removeAllTempObjects();
  }

  removeAllTempObjects() {
    this.scene.remove(this.tempPointMesh);
    this.scene.remove(this.tempPointAtInfinityMesh);
    this.scene.remove(this.tempTube);
    this.scene.remove(this.tempUpperCone);
    this.scene.remove(this.tempLowerCone);
    this.tempPointAtInfinityInScene = false;
    this.tempPointAtInfinityLowerTubeInScene = false;
    this.tempPointAtInfinityUpperTubeInScene = false;
    this.tempPointInScene = false;
    this.snapToObject = null;
    this.somethingIsHit = false;
  }

  updateFilteredPointsList(): void {
    this.filteredIntersectionPointsList = this.hitHEPoints.filter(pt => {
      // if (pt instanceof HEIntersectionPoint) {
      //   if (pt.isUserCreated) {
      //     return pt.showing;
      //   } else {
      //     if (pt.principleParent1.showing && pt.principleParent2.showing) {
      //       return true;
      //     } else {
      //       return false;
      //     }
      //   }
      // } else
      // {
      if (pt instanceof HEAntipodalPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          return true;
        }
      }
      return pt.showing;
    });
  }
}
