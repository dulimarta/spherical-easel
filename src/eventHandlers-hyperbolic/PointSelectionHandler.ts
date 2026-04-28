import { Mesh, Scene, Vector3, Vector4 } from "three";
import { PoseTracker } from "./PoseTracker";
import * as THREE from "three/webgpu";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { HEOneOrTwoDimensional } from "@/types";
import { CustomPointMaterial } from "@/plottables-hyperbolic/MaterialFactory";
import { HELine } from "@/models-hyperbolic/HELine";
import {
  createBoundaryCone,
  createIdealPointTube
} from "@/plottables-hyperbolic/MeshFactory";
import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";
import { HEAntipodalPoint } from "@/models-hyperbolic/HEAntipodalPoint";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { HELabel } from "@/models-hyperbolic/HELabel";
import EventBus from "@/eventHandlers-spherical/EventBus";
import { AddPointCommand } from "@/commands-hyperbolic/AddPointCommand";
import { SetPointUserCreatedValueCommand } from "@/commands-hyperbolic/SetPointUserCreatedValueCommand";
import { positionPrevious } from "three/tsl";
import { AddLineCommand } from "@/commands-hyperbolic/AddLineCommand";

type selectedPointInformation = {
  oneOrTwoDimParent: HEOneOrTwoDimensional | null;
  HEPoint: HEPoint | null;
  locationVector: Vector4;
};
type selectedTempPointInformation = {
  tempHEPoint: HEPoint;
  snapPoint: HEPoint | null;
  snapOneOrTwoDim: HEOneOrTwoDimensional | null;
};

export class PointSelectionHandler extends PoseTracker {
  /** The temporary objects for this tool */
  protected _tempPointArray: selectedTempPointInformation[] = [];
  private _tempTube: Mesh;
  private _tempTubeMaterial: CustomPointMaterial;
  private _tempUpperCone: Mesh;
  private _tempLowerCone: Mesh;

  private _tempTubeInScene = false;
  private _tempUpperConeInScene = false; //
  private _tempLowerConeInScene = false;

  // Filter the hitSEPoints appropriately for this handler
  private filteredIntersectionPointsList: HEPoint[] = [];

  protected _selectedPoints: selectedPointInformation[] = [];
  protected _N: number; // the number of points to be selected,must be at least one
  protected _indexOfPointCurrentlyBeingSelected = 0;
  protected _allPointsSelected = false;

  constructor(scene: Scene, N: number) {
    super(scene);
    for (let i = 0; i < N; i += 1) {
      const tempPoint = new HEPoint(new THREE.Vector4(0, 0, 1, 1), false, true);
      this._tempPointArray.push({
        tempHEPoint: tempPoint,
        snapPoint: null,
        snapOneOrTwoDim: null
      });
      PoseTracker.hyperStore.addTempObject(tempPoint);
      tempPoint.addGroupToScene(this.scene); // Adds the group that contains(or not, depending on the state of the handler) the three types of mesh to the scene
      tempPoint.removeAllMeshesFromGroup(); // don't display the temp point

      this._selectedPoints.push({
        oneOrTwoDimParent: null,
        HEPoint: null,
        locationVector: new Vector4()
      });
    }
    this._tempTube = createIdealPointTube(true);
    this._tempTubeMaterial = this._tempTube.material as CustomPointMaterial;
    this._tempLowerCone = createBoundaryCone(false);
    this._tempUpperCone = createBoundaryCone(true);
    this._N = N;
  }

  mousePressed(event: MouseEvent): void {
    // console.debug(`LineHandler::mousePressed (${event.clientX},${event.clientY})`)
    // Do the mouse moved event of the Highlighter so that a new hitHEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    super.mouseMoved(event);
    if (
      this.aSurfaceIsIntersected &&
      this._indexOfPointCurrentlyBeingSelected < this._N - 1
    ) {
      this.addSelectedPoint(this._indexOfPointCurrentlyBeingSelected);
      this._indexOfPointCurrentlyBeingSelected += 1;
    }
  }
  mouseMoved(event: MouseEvent): void {
    // Find all the nearby objects and update location vectors
    super.mouseMoved(event);
    // Filter the hitHEPoints
    this.updateFilteredPointsList();
    const activeTempPointInfo =
      this._tempPointArray[this._indexOfPointCurrentlyBeingSelected];
    // Clear, then set the snap objects, if any
    activeTempPointInfo.snapOneOrTwoDim = null;
    activeTempPointInfo.snapPoint = null;

    // Set the snap objects
    if (this.filteredIntersectionPointsList.length > 0) {
      // Only one object can be interacted with at a given time, so set the first point nearby to glowing
      // The user can create points  on , ellipses, segments, and lines, etc so
      // highlight those as well (but only one) if they are nearby also
      const nearByPoint = this.filteredIntersectionPointsList[0];
      nearByPoint.glowing = true;
      activeTempPointInfo.snapPoint = nearByPoint;

      // } else if (this.hitSESegments.length > 0) {
      //   this.hitSESegments[0].glowing = true;
      //   if (!this.startLocationSelected) {
      //     this.snapStartMarkerToTemporaryOneDimensional = this.hitSESegments[0];
      //     this.snapEndMarkerToTemporaryOneDimensional = null;
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   } else {
      //     this.snapStartMarkerToTemporaryOneDimensional = null;
      //     this.snapEndMarkerToTemporaryOneDimensional = this.hitSESegments[0];
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   }
      // } else if (this.hitSELines.length > 0) {
      //   this.hitSELines[0].glowing = true;
      //   if (!this.startLocationSelected) {
      //     this.snapStartMarkerToTemporaryOneDimensional = this.hitSELines[0];
      //     this.snapEndMarkerToTemporaryOneDimensional = null;
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   } else {
      //     this.snapStartMarkerToTemporaryOneDimensional = null;
      //     this.snapEndMarkerToTemporaryOneDimensional = this.hitSELines[0];
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   }
      // } else if (this.hitSECircles.length > 0) {
      //   this.hitSECircles[0].glowing = true;
      //   if (!this.startLocationSelected) {
      //     this.snapStartMarkerToTemporaryOneDimensional = this.hitSECircles[0];
      //     this.snapEndMarkerToTemporaryOneDimensional = null;
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   } else {
      //     this.snapStartMarkerToTemporaryOneDimensional = null;
      //     this.snapEndMarkerToTemporaryOneDimensional = this.hitSECircles[0];
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   }
      // } else if (this.hitSEEllipses.length > 0) {
      //   this.hitSEEllipses[0].glowing = true;
      //   if (!this.startLocationSelected) {
      //     this.snapStartMarkerToTemporaryOneDimensional = this.hitSEEllipses[0];
      //     this.snapEndMarkerToTemporaryOneDimensional = null;
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   } else {
      //     this.snapStartMarkerToTemporaryOneDimensional = null;
      //     this.snapEndMarkerToTemporaryOneDimensional = this.hitSEEllipses[0];
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   }
      // } else if (this.hitSEParametrics.length > 0) {
      //   this.hitSEParametrics[0].glowing = true;
      //   if (!this.startLocationSelected) {
      //     this.snapStartMarkerToTemporaryOneDimensional =
      //       this.hitSEParametrics[0];
      //     this.snapEndMarkerToTemporaryOneDimensional = null;
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   } else {
      //     this.snapStartMarkerToTemporaryOneDimensional = null;
      //     this.snapEndMarkerToTemporaryOneDimensional = this.hitSEParametrics[0];
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   }
      // } else if (this.hitSEPolygons.length > 0) {
      //   this.hitSEPolygons[0].glowing = true;
      //   if (!this.startLocationSelected) {
      //     this.snapStartMarkerToTemporaryOneDimensional = this.hitSEPolygons[0];
      //     this.snapEndMarkerToTemporaryOneDimensional = null;
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   } else {
      //     this.snapStartMarkerToTemporaryOneDimensional = null;
      //     this.snapEndMarkerToTemporaryOneDimensional = this.hitSEPolygons[0];
      //     this.snapStartMarkerToTemporaryPoint = null;
      //     this.snapEndMarkerToTemporaryPoint = null;
      //   }
    }
    // Make sure that the event is on a surface
    if (this.aSurfaceIsIntersected) {
      const possibleLocation = this.getLocationAndSetTempObjects(); // computes the location and adds the cone/tube to the scene as warranted
      // if (this._indexOfPointCurrentlyBeingSelected < this._N) {
      //Not all points have been selected yet

      // Remove the temporary point if there is a nearby point which can glow
      if (activeTempPointInfo.snapPoint) {
        // if the user is over a non-user created intersection or antipodal point (which can't be set to glowing so will not remain
        // glowing when the user select that location and then moves the mouse away), then move the temp point to the location otherwise
        // remove the temporary point from the scene
        if (
          (activeTempPointInfo.snapPoint instanceof HEIntersectionPoint ||
            activeTempPointInfo.snapPoint instanceof HEAntipodalPoint) &&
          !activeTempPointInfo.snapPoint.isUserCreated
        ) {
          activeTempPointInfo.tempHEPoint.position =
            activeTempPointInfo.snapPoint.position;
        } else {
          // the snap point is glowing so remove all other start temp objects
          this.removeTempPointFromGroup(
            this._indexOfPointCurrentlyBeingSelected
          );
        }
      } else if (activeTempPointInfo.snapOneOrTwoDim) {
        // Set the location of the temporary startPoint by snapping to appropriate object (if any)
        // NOT IMPLEMENTED YET
        // this._tempStartPoint.position =
        //   this.snapStartPointToExistingOneDimensional.closestVector(
        //     PoseTracker.hyperStore.surfaceIntersections[0].point
        //   );
      } else {
        activeTempPointInfo.tempHEPoint.position = possibleLocation;
        activeTempPointInfo.tempHEPoint.updateOrAddToGroup(); // this must be called after setting the position of the point because the position is used to determine which of the three meshes (hyperboloid, ideal strip, or ultra strip) should be added to the group and displayed as the temporary point.
      }
      // } else {
      // N-1 points are selected, and there is one more to select
      for (let i = 0; i < this._indexOfPointCurrentlyBeingSelected; i++) {
        this._tempPointArray[i].tempHEPoint.updateOrAddToGroup(); // display the start objects as needed because the user may have selected a start location and then mouse off all surfaces (causing all temp objects to disappear) and then mouse back onto a surface without triggering a mouse leave event
      }

      // activeTempPointInfo.tempHEPoint.position = possibleLocation;
      // activeTempPointInfo.tempHEPoint.updateOrAddToGroup(); // set the location and display of the end objects
      // }
    } else {
      this.removeAllTempPointObjects();
    }
  }

  mouseReleased(event: MouseEvent): void {
    // the final point is created when the mouse is released
    if (this.aSurfaceIsIntersected) {
      // set the display of the final point and re
      if (this._indexOfPointCurrentlyBeingSelected === this._N - 1) {
        this.addSelectedPoint(this._N - 1);
        this._allPointsSelected = true;
      }
    } else {
      this.removeAllTempPointObjects();
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.prepareForNextPointSelections();
  }

  addSelectedPoint(index: number): void {
    this.updateFilteredPointsList();
    const activeTempPointInfo = this._tempPointArray[index];
    const activeSelectedPointInfo = this._selectedPoints[index];
    // Decide if the starting location is near an already existing HEPoint or near a oneDimensional HENodule
    if (this.filteredIntersectionPointsList.length > 0) {
      // Use an existing HEPoint for this pick
      const selected = this.filteredIntersectionPointsList[0];
      activeSelectedPointInfo.HEPoint = selected;
      activeSelectedPointInfo.locationVector.copy(selected.position);
      activeTempPointInfo.tempHEPoint.position = selected.position;

      // Glow the selected point and select it so the highlighter.ts doesn't unglow it with the mouseMoved method
      selected.glowing = true;
      selected.selected = true;
      // } else if (this.hitSESegments.length > 0) {
      //   // The start of the line will be a point on a segment
      //   //  Eventually, we will create a new SEPointOneDimensional and Point
      //   this._startHEPointOneDimensionalParent = this.hitSESegments[0];
      //   this.startVector.copy(
      //     this._startHEPointOneDimensionalParent.closestVector(
      //       this.currentSphereVector
      //     )
      //   );
      //   this._tempStartPoint.positionVectorAndDisplay = this.startVector;
      //   this._startHEPoint = null;
      // } else if (this.hitSELines.length > 0) {
      //   // The start of the line will be a point on a line
      //   //  Eventually, we will create a new SEPointOneDimensional and Point
      //   this._startHEPointOneDimensionalParent = this.hitSELines[0];
      //   this.startVector.copy(
      //     this._startHEPointOneDimensionalParent.closestVector(
      //       this.currentSphereVector
      //     )
      //   );
      //   this._tempStartPoint.positionVectorAndDisplay = this.startVector;
      //   this._startHEPoint = null;
      // } else if (this.hitSECircles.length > 0) {
      //   // The start of the line will be a point on a circle
      //   //  Eventually, we will create a new SEPointOneDimensional and Point
      //   this._startHEPointOneDimensionalParent = this.hitSECircles[0];
      //   this.startVector.copy(
      //     this._startHEPointOneDimensionalParent.closestVector(
      //       this.currentSphereVector
      //     )
      //   );
      //   this._tempStartPoint.positionVectorAndDisplay = this.startVector;
      //   this._startHEPoint = null;
      // } else if (this.hitSEEllipses.length > 0) {
      //   // The start of the line will be a point on a ellipse
      //   //  Eventually, we will create a new SEPointOneDimensional and Point
      //   this._startHEPointOneDimensionalParent = this.hitSEEllipses[0];
      //   this.startVector.copy(
      //     this._startHEPointOneDimensionalParent.closestVector(
      //       this.currentSphereVector
      //     )
      //   );
      //   this._tempStartPoint.positionVectorAndDisplay = this.startVector;
      //   this._startHEPoint = null;
      // } else if (this.hitSEParametrics.length > 0) {
      //   // The start of the line will be a point on a ellipse
      //   //  Eventually, we will create a new SEPointOneDimensional and Point
      //   this._startHEPointOneDimensionalParent = this.hitSEParametrics[0];
      //   this.startVector.copy(
      //     this._startHEPointOneDimensionalParent.closestVector(
      //       this.currentSphereVector
      //     )
      //   );
      //   this._tempStartPoint.positionVectorAndDisplay = this.startVector;
      //   this._startHEPoint = null;
      // } else if (this.hitSEPolygons.length > 0) {
      //   // The start of the line will be a point on a ellipse
      //   //  Eventually, we will create a new SEPointOneDimensional and Point
      //   this._startHEPointOneDimensionalParent = this.hitSEPolygons[0];
      //   this.startVector.copy(
      //     this._startHEPointOneDimensionalParent.closestVector(
      //       this.currentSphereVector
      //     )
      //   );
      //   this._tempStartPoint.positionVectorAndDisplay = this.startVector;
      //   this._startHEPoint = null;
    } else {
      // The mouse press/release is not near an existing point or one dimensional object.
      //  Eventually, we will create a new HEPoint at the selected location
      const location = PoseTracker.vec3ToVec4(
        PoseTracker.hyperStore.surfaceIntersections[0].point,
        this.getWCoordinate()
      );
      activeTempPointInfo.tempHEPoint.position = location;
      activeSelectedPointInfo.locationVector.copy(location);
    }
  }

  getWCoordinate(): number {
    let wCoordinate: number;
    switch (true) {
      case this.hyperboloidIsFirstSurfaceHit:
        wCoordinate = 1;
        break;
      case this.idealStripIsFirstSurfaceHit:
        wCoordinate = 0;
        break;
      case this.ultraStripIsFirstSurfaceHit:
        wCoordinate = -1;
        break;
      default:
        wCoordinate = 1; // default to the hyperboloid if something goes wrong
    }
    return wCoordinate;
  }

  private addTubeAndConeToScene() {
    if (!this._tempTubeInScene) {
      this._tempTubeInScene = true;
      this.scene.add(this._tempTube);
    }
    const location = PoseTracker.hyperStore.surfaceIntersections[0].point;
    const upper = location.z > 0;
    this._tempTubeMaterial.position = new THREE.Vector4(
      0,
      0,
      upper ? 1 : -1,
      0
    ); // x,y,w are not used for the tube
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
  }

  private getLocationAndSetTempObjects(): Vector4 {
    switch (true) {
      case this.hyperboloidIsFirstSurfaceHit:
        //remove the tube and cone if they are in the scene
        this.removeTubeAndConeFromScene();
        break;
      case this.idealStripIsFirstSurfaceHit:
        // add the tube and cone for the ideal points
        this.addTubeAndConeToScene();
        break;
      case this.ultraStripIsFirstSurfaceHit:
        //remove the tube and cone if they are in the scene
        this.removeTubeAndConeFromScene();
        break;
      default:
        this.removeTubeAndConeFromScene(); // default to remove if something goes wrong
    }
    return PoseTracker.vec3ToVec4(
      PoseTracker.hyperStore.surfaceIntersections[0].point,
      this.getWCoordinate()
    );
  }

  private removeTubeAndConeFromScene() {
    if (this._tempTubeInScene) {
      this.scene.remove(this._tempTube);
      this._tempTubeInScene = false;
    }
    if (this._tempLowerConeInScene) {
      this.scene.remove(this._tempLowerCone);
      this._tempLowerConeInScene = false;
    }
    if (this._tempUpperConeInScene) {
      this.scene.remove(this._tempUpperCone);
      this._tempUpperConeInScene = false;
    }
  }

  removeAllTempPointObjects(): void {
    for (let i = 0; i < this._N; i++) {
      this._tempPointArray[i].tempHEPoint.removeAllMeshesFromGroup();
    }
    this.removeTubeAndConeFromScene();
  }

  removeTempPointFromGroup(index: number): void {
    this._tempPointArray[index].tempHEPoint.removeAllMeshesFromGroup();
    this.removeTubeAndConeFromScene();
  }

  prepareForNextPointSelections(): void {
    for (let i = 0; i < this._N; i++) {
      // reset the temp point array
      this._tempPointArray[i].snapOneOrTwoDim = null;
      this._tempPointArray[i].snapPoint = null;
      this._tempPointArray[i].tempHEPoint.removeAllMeshesFromGroup();

      // reset the selected point array
      const pointInformation = this._selectedPoints[i];
      if (pointInformation.HEPoint) {
        pointInformation.HEPoint.glowing = false;
        pointInformation.HEPoint.selected = false;
        this._selectedPoints[i].HEPoint = null;
      }
      pointInformation.locationVector.set(0, 0, 0, 0);
      pointInformation.oneOrTwoDimParent = null;
    }
    this._indexOfPointCurrentlyBeingSelected = 0;
    this._allPointsSelected = false;
    this.removeTubeAndConeFromScene();
  }

  updateFilteredPointsList(): void {
    this.filteredIntersectionPointsList = this.hitHEPoints.filter(pt => {
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
    this.filteredIntersectionPointsList =
      this.filteredIntersectionPointsList.filter(
        pt =>
          pt.position.w === this.getWCoordinate() && //make sure that only points in the first hit surface are returned
          !PoseTracker.hyperStore.closestIntersectionIsSurface // if the closest intersection is a surface then there are no points to interact with
      );
  }

  activate(): void {
    super.activate();
  }
  deactivate(): void {
    this.prepareForNextPointSelections();
    super.deactivate();
  }
}
