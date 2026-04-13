import { Mesh, Scene, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";
import * as THREE from "three/webgpu";
import {
  createBoundaryCone,
  createIdealPointTube
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

export class PointHandler extends PoseTracker {
  private _tempPoint: HEPoint;
  private _tempIdealPoint: HEPoint;
  private _tempTube: Mesh;
  private _tempTubeMaterial: CustomPointMaterial;
  private _tempUpperCone: Mesh;
  private _tempLowerCone: Mesh;
  private _tempPointInScene = false;
  private _tempIdealPointInScene = false; // includes the temporary tube
  private _tempUpperConeInScene = false;
  private _tempLowerConeInScene = false;

  // Filter the hitHEPoints appropriately for this handler
  private _filteredIntersectionPointsList: HEPoint[] = [];
  /**
   * As the user moves the pointer around snap the temporary marker to this object temporarily
   */
  private _snapToObject: HEOneOrTwoDimensional | null = null;

  constructor(scene: Scene) {
    super(scene);
    this.scene = scene;
    this._tempPoint = new HEPoint(new THREE.Vector4(0, 0, 1, 1), false, true);

    this._tempIdealPoint = new HEPoint(
      new THREE.Vector4(1, 0, 0, 0),
      false,
      true
    );
    // this.tempPointIdealMaterial = this.tempPointIdeal.material as CustomPointMaterial;
    this._tempTube = createIdealPointTube(true);
    this._tempTubeMaterial = this._tempTube.material as CustomPointMaterial;
    this._tempLowerCone = createBoundaryCone(false);
    this._tempUpperCone = createBoundaryCone(true);
  }

  mousePressed(event: MouseEvent): void {
    // console.debug("PointHandler::mousePressed()")
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will create a new point at the same location. This is not what we want so
    // we call super.mouseMove
    // super.mouseMoved(event);

    if (this.surfaceIsIntersected) {
      // If this is near any other points do not create a new point, unless the hitSEPoint is an un user-created intersection or antipodal point
      this.updateFilteredPointsList();

      if (this._filteredIntersectionPointsList.length > 0) {
        //Make it user created and turn on the display
        // set the display to visible order

        new SetPointUserCreatedValueCommand(
          this._filteredIntersectionPointsList[0] as
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
        // this over either the ideal point's strip or the hyperboloid
        const hitLocation = PoseTracker.vec3ToVec4(
          PoseTracker.hyperStore.surfaceIntersections[0].point,
          this.hyperboloidIsFirstSurfaceHit ? 1 : 0
        );
        vtx = new HEPoint(hitLocation);
        newHELabel = new HELabel("point", vtx, hitLocation, vtx.name);
        vtx.setLabel(newHELabel);

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

    if (this._filteredIntersectionPointsList.length > 0) {
      // console.log(
      //   "point handler filter set glowing",
      //   this._filteredIntersectionPointsList[0].name,
      //   this._filteredIntersectionPointsList[0].position.toFixed(2)
      // );
      this._filteredIntersectionPointsList[0].glowing = true;
      this._snapToObject = null;
    }
    // else if (this.hitHESegments.length > 0) {
    //   this.hitHESegments[0].glowing = true;
    //   this.snapToTemporaryOneDimensional = this.hitHESegments[0];
    // }
    else {
      this._snapToObject = null;
    }

    if (this.surfaceIsIntersected) {
      if (this._snapToObject === null) {
        if (this.hyperboloidIsFirstSurfaceHit) {
          if (!this._tempPointInScene) {
            this._tempPointInScene = true;
            this.scene.add(this._tempPoint.mesh);
          }
          this._tempPoint.position = PoseTracker.vec3ToVec4(
            PoseTracker.hyperStore.surfaceIntersections[0].point,
            1
          );
        } else {
          if (this._tempPointInScene) {
            this._tempPointInScene = false;
            this.scene.remove(this._tempPoint.mesh);
          }
        }

        if (!this.hyperboloidIsFirstSurfaceHit) {
          if (!this._tempIdealPointInScene) {
            this._tempIdealPointInScene = true;
            this.scene.add(this._tempTube);
            this.scene.add(this._tempIdealPoint.mesh);
          }
          const location = PoseTracker.hyperStore.surfaceIntersections[0].point;
          const upper = location.z > 0;
          this._tempIdealPoint.position = PoseTracker.vec3ToVec4(location, 0);
          this._tempTubeMaterial.upper = upper ? 1 : 0;
          this._tempTubeMaterial.tubeAngle = Math.atan2(location.y, location.x);

          if (!this._tempLowerConeInScene && !upper) {
            this.scene.add(this._tempLowerCone);
            this._tempLowerConeInScene = true;
            this._tempUpperConeInScene = false;
            this.scene.remove(this._tempUpperCone);
          }

          if (!this._tempUpperConeInScene && upper) {
            this.scene.add(this._tempUpperCone);
            this._tempUpperConeInScene = true;
            this._tempLowerConeInScene = false;
            this.scene.remove(this._tempLowerCone);
          }
        } else {
          if (this._tempIdealPointInScene) {
            this._tempIdealPointInScene = false;
            this._tempUpperConeInScene = false;
            this._tempLowerConeInScene = false;
            this.scene.remove(this._tempTube);
            this.scene.remove(this._tempIdealPoint.mesh);
            this.scene.remove(this._tempLowerCone);
            this.scene.remove(this._tempUpperCone);
          }
        }
      } else {
        // snap to an object
        if (!this._tempPointInScene) {
          this._tempPointInScene = true;
          this.scene.add(this._tempPoint.mesh);
        }
        // this.tempPointMaterial.position = this.snapToObject.closestVector(
        //   PoseTracker.hyperStore.surfaceIntersections[0].point
        // );
      }
      // If there is a nearby (possibly user created or not) point turn off the temporary marker
      if (this._filteredIntersectionPointsList.length > 0) {
        if (this._tempPointInScene) {
          // Remove the temporary point
          this.scene.remove(this._tempPoint.mesh);
          this._tempPointInScene = false;
          this._snapToObject = null;
        }
        if (this._tempIdealPointInScene) {
          // Remove the temporary ideal point
          this._tempIdealPointInScene = false;
          this._tempUpperConeInScene = false;
          this._tempLowerConeInScene = false;
          this.scene.remove(this._tempTube);
          this.scene.remove(this._tempIdealPoint.mesh);
          this.scene.remove(this._tempLowerCone);
          this.scene.remove(this._tempUpperCone);
          this._snapToObject = null;
        }
      }
    } else {
      // the event is not over the hyperboloid and is not over the ideal point's strip remove all temp objects
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
    this.scene.remove(this._tempPoint.mesh);
    this.scene.remove(this._tempIdealPoint.mesh);
    this.scene.remove(this._tempTube);
    this.scene.remove(this._tempUpperCone);
    this.scene.remove(this._tempLowerCone);
    this._tempIdealPointInScene = false;
    this._tempLowerConeInScene = false;
    this._tempUpperConeInScene = false;
    this._tempPointInScene = false;
    this._snapToObject = null;
  }

  updateFilteredPointsList(): void {
    this._filteredIntersectionPointsList = this.hitHEPoints.filter(pt => {
      if (pt instanceof HEIntersectionPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          if (pt.principleParent1.showing && pt.principleParent2.showing) {
            return true;
          } else {
            return false;
          }
        }
      } else if (pt instanceof HEAntipodalPoint) {
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
