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
import { PointSelectionHandler } from "./PointSelectionHandler";
import SETTINGS from "@/global-settings-hyperbolic";
import EventBus from "@/eventHandlers-spherical/EventBus";

export class PointHandler extends PointSelectionHandler {
  constructor(scene: Scene) {
    super(scene, 1);
    this.scene = scene;
  }

  mousePressed(event: MouseEvent): void {
    super.mousePressed(event);
  }
  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
  }

  mouseReleased(event: MouseEvent): void {
    super.mouseReleased(event);

    if (this.aSurfaceIsIntersected && this._allPointsSelected) {
      console.log("here");
      const selectedPoint = this._selectedPoints[0].HEPoint;
      if (selectedPoint) {
        if (
          (selectedPoint instanceof HEAntipodalPoint ||
            selectedPoint instanceof HEIntersectionPoint) &&
          !selectedPoint.isUserCreated
        ) {
          new SetPointUserCreatedValueCommand(
            selectedPoint as HEIntersectionPoint | HEAntipodalPoint,
            true
          ).execute();
          super.prepareForNextPointSelections();
          return;
        }
        EventBus.fire("show-alert", {
          key: `handlers.pointCreationAttemptDuplicate`,
          keyOptions: {},
          type: "error"
        });
      } else if (this._selectedPoints[0].oneOrTwoDimParent) {
        // create point on this._selectedPoints[0].oneOrTwoDimParent
        // not implemented yet
      } else {
        // Released over empty location
        const pointCommandGroup = new CommandGroup();
        // create a new Point
        let vtx: /*HEPointOnOneOrTwoDimensional |*/ HEPoint | null = null;
        let newHELabel: HELabel | null = null;
        // mouse press on empty location so create a free point
        // Create the model object for the new point and link them
        // this over either the ideal point's strip or the hyperboloid

        const releaseLocation =
          this._selectedPoints[this._N - 1].locationVector;
        vtx = new HEPoint(releaseLocation);
        newHELabel = new HELabel("point", vtx, releaseLocation, vtx.name);
        vtx.setLabel(newHELabel);

        if (vtx && newHELabel) {
          pointCommandGroup.addCommand(new AddPointCommand(vtx, newHELabel));
          // Create the antipode of the new point, vtx
          PointHandler.addCreateAntipodeCommand(
            vtx as HEPoint,
            pointCommandGroup
          );
        }
        pointCommandGroup.execute();
      }
      super.prepareForNextPointSelections();
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
  }

  activate(): void {
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}

// export class PointHandler extends PoseTracker {
//   private _tempPoint: HEPoint;

//   private _tempTube: Mesh;
//   private _tempTubeMaterial: CustomPointMaterial;
//   private _tempUpperCone: Mesh;
//   private _tempLowerCone: Mesh;

//   private _tempTubeInScene = false;
//   private _tempUpperConeInScene = false;
//   private _tempLowerConeInScene = false;

//   // Filter the hitHEPoints appropriately for this handler
//   private _filteredIntersectionPointsList: HEPoint[] = [];
//   /**
//    * As the user moves the pointer around snap the temporary marker to this object temporarily
//    */
//   private _snapToObject: HEOneOrTwoDimensional | null = null;

//   constructor(scene: Scene) {
//     super(scene);
//     this.scene = scene;
//     this._tempPoint = new HEPoint(new THREE.Vector4(0, 0, 1, 1), false, true);
//     PoseTracker.hyperStore.addTempObject(this._tempPoint); // add the temporary point to the store so that it will be updated when the display changes
//     this._tempTube = createIdealPointTube(true);
//     this._tempTubeMaterial = this._tempTube.material as CustomPointMaterial;
//     this._tempLowerCone = createBoundaryCone(false);
//     this._tempUpperCone = createBoundaryCone(true);
//     this._tempPoint.addGroupToScene(this.scene); // Adds the group that contains(or not depending on the state of the handler) the three types of mesh to the scene
//     this._tempPoint.removeAllMeshesFromGroup();
//   }

//   mousePressed(event: MouseEvent): void {
//     // console.debug("PointHandler::mousePressed()")
//     // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
//     // otherwise if the user has finished making an new point, then *without* triggering a mouse move
//     // event, mouse press will create a new point at the same location. This is not what we want so
//     // we call super.mouseMove
//     // super.mouseMoved(event);

//     if (this.aSurfaceIsIntersected) {
//       // If this muse press is near any other points do not create a new point, unless the hitHEPoint is an un user-created intersection or antipodal point
//       this.updateFilteredPointsList();

//       if (this._filteredIntersectionPointsList.length > 0) {
//         //Make the hit point user created and turn on the display
//         // set the display to visible order

//         new SetPointUserCreatedValueCommand(
//           this._filteredIntersectionPointsList[0] as
//             | HEIntersectionPoint
//             | HEAntipodalPoint,
//           true
//         ).execute();
//         return;
//         // }
//         // EventBus.fire("show-alert", {
//         //   key: `handlers.pointCreationAttemptDuplicate`,
//         //   keyOptions: {},
//         //   type: "error"
//         // });
//         // return;
//       } else {
//         const pointCommandGroup = new CommandGroup();
//         // create a new Point
//         let vtx: /*HEPointOnOneOrTwoDimensional |*/ HEPoint | null = null;
//         let newHELabel: HELabel | null = null;

//         // if (this.hitSESegments.length > 0) {
//         //   // The new point will be a point on a segment
//         //   // Create the model object for the new point and link them
//         //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSESegments[0]);
//         //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
//         //   newSELabel = new SELabel("point", vtx);

//         //   // Create and execute the command to create a new point for undo/redo
//         //   pointCommandGroup.addCommand(
//         //     new AddPointOnOneDimensionalCommand(
//         //       vtx as SEPointOnOneOrTwoDimensional,
//         //       this.hitSESegments[0],
//         //       newSELabel
//         //     )
//         //   );
//         // }
//         // else if (this.hitSELines.length > 0) {
//         //   // The new point will be a point on a line
//         //   // Create the model object for the new point and link them
//         //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSELines[0]);
//         //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
//         //   newSELabel = new SELabel("point", vtx);

//         //   // Create and execute the command to create a new point for undo/redo
//         //   pointCommandGroup.addCommand(
//         //     new AddPointOnOneDimensionalCommand(
//         //       vtx as SEPointOnOneOrTwoDimensional,
//         //       this.hitSELines[0],
//         //       newSELabel
//         //     )
//         //   );
//         // } else if (this.hitSECircles.length > 0) {
//         //   // The new point will be a point on a circle
//         //   // Create the model object for the new point and link them
//         //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSECircles[0]);
//         //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
//         //   newSELabel = new SELabel("point", vtx);

//         //   // Create and execute the command to create a new point for undo/redo
//         //   pointCommandGroup.addCommand(
//         //     new AddPointOnOneDimensionalCommand(
//         //       vtx as SEPointOnOneOrTwoDimensional,
//         //       this.hitSECircles[0],
//         //       newSELabel
//         //     )
//         //   );
//         // } else if (this.hitSEEllipses.length > 0) {
//         //   // The new point will be a point on an ellipse
//         //   // Create the model object for the new point and link them
//         //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSEEllipses[0]);
//         //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
//         //   newSELabel = new SELabel("point", vtx);

//         //   // Create and execute the command to create a new point for undo/redo
//         //   pointCommandGroup.addCommand(
//         //     new AddPointOnOneDimensionalCommand(
//         //       vtx as SEPointOnOneOrTwoDimensional,
//         //       this.hitSEEllipses[0],
//         //       newSELabel
//         //     )
//         //   );
//         // } else if (this.hitSEParametrics.length > 0) {
//         //   // The new point will be a point on an ellipse
//         //   // Create the model object for the new point and link them
//         //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSEParametrics[0]);
//         //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
//         //   newSELabel = new SELabel("point", vtx);

//         //   // Create and execute the command to create a new point for undo/redo
//         //   pointCommandGroup.addCommand(
//         //     new AddPointOnOneDimensionalCommand(
//         //       vtx as SEPointOnOneOrTwoDimensional,
//         //       this.hitSEParametrics[0],
//         //       newSELabel
//         //     )
//         //   );
//         // } else if (this.hitSEPolygons.length > 0) {
//         //   // The new point will be a point on an ellipse
//         //   // Create the model object for the new point and link them
//         //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSEPolygons[0]);
//         //   vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
//         //   newSELabel = new SELabel("point", vtx);

//         //   // Create and execute the command to create a new point for undo/redo
//         //   pointCommandGroup.addCommand(
//         //     new AddPointOnOneDimensionalCommand(
//         //       vtx as SEPointOnOneOrTwoDimensional,
//         //       this.hitSEPolygons[0],
//         //       newSELabel
//         //     )
//         //   );
//         // }
//         // else {
//         // mouse press on empty location so create a free point
//         // Create the model object for the new point and link them
//         // this over either the ideal point's strip or the hyperboloid
//         let wCoordinate: number;
//         switch (true) {
//           case this.hyperboloidIsFirstSurfaceHit:
//             wCoordinate = 1;
//             break;
//           case this.idealStripIsFirstSurfaceHit:
//             wCoordinate = 0;
//             break;
//           case this.ultraStripIsFirstSurfaceHit:
//             wCoordinate = -1;
//             break;
//           default:
//             wCoordinate = 1; // default to the hyperboloid if something goes wrong
//         }
//         const hitLocation = PoseTracker.vec3ToVec4(
//           PoseTracker.hyperStore.surfaceIntersections[0].point,
//           wCoordinate
//         );
//         vtx = new HEPoint(hitLocation);
//         newHELabel = new HELabel("point", vtx, hitLocation, vtx.name);
//         vtx.setLabel(newHELabel);

//         if (vtx && newHELabel) {
//           pointCommandGroup.addCommand(new AddPointCommand(vtx, newHELabel));
//           /////////////
//           // Create the antipode of the new point, vtx
//           PointHandler.addCreateAntipodeCommand(
//             vtx as HEPoint,
//             pointCommandGroup
//           );
//           ///////////

//           // Set the initial label location
//           // this.tmpVector
//           //   .copy(vtx.locationVector)
//           //   .add(
//           //     new Vector3(
//           //       2 * SETTINGS.point.initialLabelOffset,
//           //       SETTINGS.point.initialLabelOffset,
//           //       0
//           //     )
//           //   )
//           //   .normalize();
//           // newSELabel.locationVector = this.tmpVector;
//         }
//         pointCommandGroup.execute();
//         //super.mouseLeave(event); // If this line is not here the point handler puts a "dim" point on the sphere and when you trigger the mouseLeave() event the point "brightens".  This fixes that issue so there is no brightening.
//       }
//     } else {
//       // Remove the temporary objects
//       this.removeAllTempObjects();
//     }
//   }
//   mouseMoved(event: MouseEvent): void {
//     // Process the intersection list into HENodules and set the flags
//     super.mouseMoved(event);

//     this.updateFilteredPointsList();

//     this._snapToObject = null; // default to snapping to no object
//     if (this._filteredIntersectionPointsList.length > 0) {
//       // console.log(
//       //   "point handler filter set glowing",
//       //   this._filteredIntersectionPointsList[0].name,
//       //   this._filteredIntersectionPointsList[0].position.toFixed(2)
//       // );
//       this._filteredIntersectionPointsList[0].glowing = true;
//     }
//     // else if (this.hitHESegments.length > 0) {
//     //   this.hitHESegments[0].glowing = true;
//     //   this.snapToTemporaryOneDimensional = this.hitHESegments[0];
//     // }

//     if (this.aSurfaceIsIntersected) {
//       if (this._snapToObject === null) {
//         this.updateTempObjects();
//       } else {
//         // snap to an object
//         // this.tempPointMaterial.position = this.snapToObject.closestVector(
//         //   PoseTracker.hyperStore.surfaceIntersections[0].point
//         // ); // not implemented yet
//       }
//       // If there is a nearby (possibly user created or not) point turn off the temporary markers
//       if (this._filteredIntersectionPointsList.length > 0) {
//         this.removeAllTempObjects();
//       }
//     } else {
//       // the event is not over any surface so remove all temp objects
//       this.removeAllTempObjects();
//     }
//   }

//   mouseReleased(event: MouseEvent): void {
//     // throw new Error("Method not implemented.");
//   }

//   mouseLeave(event: MouseEvent): void {
//     super.mouseLeave(event);
//     this.removeAllTempObjects();
//   }

//   activate(): void {
//     super.activate();
//   }
//   deactivate(): void {
//     super.deactivate();
//     this.removeAllTempObjects();
//   }

//   private addTubeAndConeToScene() {
//     if (!this._tempTubeInScene) {
//       this._tempTubeInScene = true;
//       this.scene.add(this._tempTube);
//     }
//     const location = PoseTracker.hyperStore.surfaceIntersections[0].point;
//     const upper = location.z > 0;
//     this._tempTubeMaterial.position = new THREE.Vector4(
//       0,
//       0,
//       upper ? 1 : -1,
//       0
//     ); // x,y,w are not used for the tube
//     this._tempTubeMaterial.tubeAngle = Math.atan2(location.y, location.x);
//     if (!this._tempLowerConeInScene && !upper) {
//       this.scene.add(this._tempLowerCone);
//       this._tempLowerConeInScene = true;
//       this._tempUpperConeInScene = false;
//       this.scene.remove(this._tempUpperCone);
//     }

//     if (!this._tempUpperConeInScene && upper) {
//       this.scene.add(this._tempUpperCone);
//       this._tempUpperConeInScene = true;
//       this._tempLowerConeInScene = false;
//       this.scene.remove(this._tempLowerCone);
//     }
//   }

//   private removeTubeAndConeFromScene() {
//     if (this._tempTubeInScene) {
//       this.scene.remove(this._tempTube);
//       this._tempTubeInScene = false;
//     }
//     if (this._tempLowerConeInScene) {
//       this.scene.remove(this._tempLowerCone);
//       this._tempLowerConeInScene = false;
//     }
//     if (this._tempUpperConeInScene) {
//       this.scene.remove(this._tempUpperCone);
//       this._tempUpperConeInScene = false;
//     }
//   }

//   private updateTempObjects() {
//     let wCoordinate: number;
//     switch (true) {
//       case this.hyperboloidIsFirstSurfaceHit:
//         wCoordinate = 1;
//         //remove the tube and cone if they are in the scene
//         this.removeTubeAndConeFromScene();
//         break;
//       case this.idealStripIsFirstSurfaceHit:
//         wCoordinate = 0;
//         // add the tube and cone for the ideal points
//         this.addTubeAndConeToScene();
//         break;
//       case this.ultraStripIsFirstSurfaceHit:
//         wCoordinate = -1;
//         //remove the tube and cone if they are in the scene
//         this.removeTubeAndConeFromScene();
//         break;
//       default:
//         wCoordinate = 1; // default to the hyperboloid if something goes wrong
//     }
//     this._tempPoint.position = PoseTracker.vec3ToVec4(
//       PoseTracker.hyperStore.surfaceIntersections[0].point,
//       wCoordinate
//     );
//     this._tempPoint.updateOrAddToGroup(); // this must be called after setting the position of the point because the position is used to determine which of the three meshes (hyperboloid, ideal strip, or ultra strip) should be added to the group and displayed as the temporary point.
//   }

//   removeAllTempObjects() {
//     this._tempPoint.removeAllMeshesFromGroup();
//     if (this._tempTubeInScene) {
//       this.scene.remove(this._tempTube);
//       this._tempTubeInScene = false;
//     }
//     if (this._tempLowerConeInScene) {
//       this.scene.remove(this._tempLowerCone);
//     }
//     this._tempUpperConeInScene = false;
//     if (this._tempUpperConeInScene) {
//       this.scene.remove(this._tempUpperCone);
//       this._tempLowerConeInScene = false;
//     }
//     this._snapToObject = null;
//   }

//   updateFilteredPointsList(): void {
//     this._filteredIntersectionPointsList = this.hitHEPoints.filter(pt => {
//       if (pt instanceof HEIntersectionPoint) {
//         if (pt.isUserCreated) {
//           return pt.showing;
//         } else {
//           if (pt.principleParent1.showing && pt.principleParent2.showing) {
//             return true;
//           } else {
//             return false;
//           }
//         }
//       } else if (pt instanceof HEAntipodalPoint) {
//         if (pt.isUserCreated) {
//           return pt.showing;
//         } else {
//           return true;
//         }
//       }
//       return pt.showing;
//     });
//   }
// }
