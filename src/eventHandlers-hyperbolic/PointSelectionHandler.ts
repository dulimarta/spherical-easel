import { Mesh, Scene, Vector3, Vector4 } from "three";
import { PoseTracker } from "./PoseTracker";
import * as THREE from "three/webgpu";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { HEOneOrTwoDimensional } from "@/types";
import { CustomPointMaterial } from "@/plottables-hyperbolic/MaterialFactory";
import {
  createBoundaryCone,
  createIdealPointTube
} from "@/plottables-hyperbolic/MeshFactory";
import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";
import { HEAntipodalPoint } from "@/models-hyperbolic/HEAntipodalPoint";
import { vec3ToVec4, vec4ToVec3 } from "@/utils/helpingHEFunctions";
import EventBus from "@/eventHandlers-spherical/EventBus";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { SetPointUserCreatedValueCommand } from "@/commands-hyperbolic/SetPointUserCreatedValueCommand";
import { HEPointOnOneOrTwoDimensional } from "@/models-hyperbolic/HEPointOnOneOrTwoDimensional";
import { HELabel } from "@/models-hyperbolic/HELabel";
import { AddPointCommand } from "@/commands-hyperbolic/AddPointCommand";

type selectedPointInformation = {
  oneOrTwoDimParent: HEOneOrTwoDimensional | null;
  HEPoint: HEPoint | null;
  locationVector: Vector4;
};
type tempPointInformation = {
  tempHEPoint: HEPoint;
  snapPoint: HEPoint | null;
  snapOneOrTwoDim: HEOneOrTwoDimensional | null;
};

export class PointSelectionHandler extends PoseTracker {
  /** The temporary objects for this tool */
  protected _tempPointArray: tempPointInformation[] = [];
  private _tempTube: Mesh;
  private _tempTubeMaterial: CustomPointMaterial;
  private _tempUpperCone: Mesh;
  private _tempLowerCone: Mesh;

  // Filter the hitSEPoints appropriately for this handler
  private filteredIntersectionPointsList: HEPoint[] = [];

  protected _selectedPoints: selectedPointInformation[] = [];
  protected _N: number; // the number of points to be selected,must be at least one
  protected _indexOfPointCurrentlyBeingSelected = 0;
  protected _allPointsSelected = false;

  private tempVector = new Vector3();

  constructor(scene: Scene, N: number) {
    super(scene);
    for (let i = 0; i < N; i += 1) {
      const tempPoint = new HEPoint(new THREE.Vector4(0, 0, 1, 1), false, true);
      this._tempPointArray.push({
        tempHEPoint: tempPoint,
        snapPoint: null,
        snapOneOrTwoDim: null
      });
      this.hyperStore.addTempObject(tempPoint);
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
    if (
      this.aSurfaceIsIntersected &&
      this._indexOfPointCurrentlyBeingSelected < this._N - 1
    ) {
      this._indexOfPointCurrentlyBeingSelected += this.addSelectedPoint(
        this._indexOfPointCurrentlyBeingSelected
      )
        ? 1
        : 0;
    }
  }
  mouseMoved(event: MouseEvent): void {
    // Find all the nearby objects and update location vectors
    super.mouseMoved(event);

    if (this.aSurfaceIsIntersected) {
      // Filter the hitHEPoints
      this.updateFilteredPointsList();
      const activeTempPointInfo =
        this._tempPointArray[this._indexOfPointCurrentlyBeingSelected];
      // Clear, then set the snap objects, if any
      activeTempPointInfo.snapOneOrTwoDim = null;
      activeTempPointInfo.snapPoint = null;

      // Set the snap objects
      console.debug(
        `PSH: mouseMoved: ${this.hitCKPoints.length} nearby points`
      );
      if (this.hitCKPoints.length > 0) {
        this.hitCKPoints[0].setHighlight(true);
      }
      if (this.filteredIntersectionPointsList.length > 0) {
        // Only one object can be interacted with at a given time, so set the first point nearby to glowing
        // The user can create points  on , ellipses, segments, and lines, etc so
        // highlight those as well (but only one) if they are nearby also
        const nearByPoint = this.filteredIntersectionPointsList[0];
        nearByPoint.glowing = true;
        activeTempPointInfo.snapPoint = nearByPoint;
      } else if (this.hitHELines.length > 0) {
        this.hitHELines[0].glowing = true;
        activeTempPointInfo.snapOneOrTwoDim = this.hitHELines[0];
        // } else if (this.hitSECircles.length > 0) {
        //   this.hitSECircles[0].glowing = true;
        //   activeTempPointInfo.snapOneOrTwoDim = this.hitSECircles[0];
        // } else if (this.hitSEEllipses.length > 0) {
        //   this.hitSEEllipses[0].glowing = true;
        //   activeTempPointInfo.snapOneOrTwoDim = this.hitSEEllipses[0];
        // } else if (this.hitSEParametrics.length > 0) {
        //   this.hitSEParametrics[0].glowing = true;
        //   activeTempPointInfo.snapOneOrTwoDim = this.hitSEParametrics[0];
        // } else if (this.hitSEPolygons.length > 0) {
        //   this.hitSEPolygons[0].glowing = true;
        //   activeTempPointInfo.snapOneOrTwoDim = this.hitSEPolygons[0];
      }

      const possibleLocation = this.getLocationAndSetTempObjects(); // computes the location and adds the cone/tube to the scene as warranted

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
          this.removeTubeAndConeFromScene();
        }
      } else if (activeTempPointInfo.snapOneOrTwoDim) {
        // Set the location of the temporary point by snapping to appropriate object (if any)
        const nearBy =
          activeTempPointInfo.snapOneOrTwoDim.closestVector(possibleLocation);
        if (nearBy) {
          activeTempPointInfo.tempHEPoint.position = nearBy;
          activeTempPointInfo.tempHEPoint.updateOrAddToGroup(); // this must be called after setting the position of the point because the position is used to determine which of the three meshes (hyperboloid, ideal strip, or ultra strip) should be added to the group and displayed as the temporary point.
        }
      } else {
        activeTempPointInfo.tempHEPoint.position = possibleLocation;
        activeTempPointInfo.tempHEPoint.updateOrAddToGroup();
      }
      this.displayAllTempPointObjects();
    } else {
      this.removeAllTempPointObjects();
    }
  }

  mouseReleased(event: MouseEvent): void {
    // the final point is created when the mouse is released over a surface
    if (this.aSurfaceIsIntersected) {
      if (this._indexOfPointCurrentlyBeingSelected === this._N - 1) {
        this._allPointsSelected = this.addSelectedPoint(this._N - 1);
      }
    } else {
      this.removeAllTempPointObjects();
    }
  }

  isLocationAlreadySelected(location: Vector4, currentIndex: number): boolean {
    for (let i = 0; i < currentIndex; i++) {
      if (
        this.tempVector
          .crossVectors(
            vec4ToVec3(this._selectedPoints[i].locationVector),
            vec4ToVec3(location)
          )
          .isZero() &&
        this._selectedPoints[i].locationVector.w == location.w
      ) {
        return true;
      }
    }
    return false;
  }
  /**
   *
   * @param index
   * @returns true if the point is successfully added at the given index
   */
  addSelectedPoint(index: number): boolean {
    this.updateFilteredPointsList();
    const activeTempPointInfo = this._tempPointArray[index];
    const activeSelectedPointInfo = this._selectedPoints[index];
    // Decide if the starting location is near an already existing HEPoint or near a oneDimensional HENodule
    if (this.filteredIntersectionPointsList.length > 0) {
      // Use an existing HEPoint for this pick
      const selected = this.filteredIntersectionPointsList[0];
      //make sure this point is not selected already
      if (this.isLocationAlreadySelected(selected.position, index)) {
        return false;
      }

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
    } else {
      const location = vec3ToVec4(
        this.hyperStore.surfaceIntersections[0].point,
        this.getWCoordinate()
      );
      if (this.hitHELines.length > 0) {
        const nearBy = this.hitHELines[0].closestVector(location);
        if (nearBy) {
          const possibleLocation = new Vector4().copy(nearBy);
          if (this.isLocationAlreadySelected(possibleLocation, index)) {
            return false;
          }
          // The selected point will be  on a line
          //  Eventually, we will create a new HEPointOnOneOrTwoDimensional
          activeSelectedPointInfo.oneOrTwoDimParent = this.hitHELines[0];
          activeSelectedPointInfo.locationVector.copy(possibleLocation);

          activeTempPointInfo.tempHEPoint.position = possibleLocation;
        }
        // }
        //else if (this.hitSECircles.length > 0) {
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

        if (this.isLocationAlreadySelected(location, index)) {
          return false;
        }
        activeTempPointInfo.tempHEPoint.position = location;
        activeSelectedPointInfo.locationVector.copy(location);
      }
    }
    return true;
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

  addTubeAndConeToScene() {
    this.scene.add(this._tempTube);
    const location = this.hyperStore.surfaceIntersections[0].point;
    const upper = location.z > 0;
    this._tempTubeMaterial.position = new THREE.Vector4(
      0,
      0,
      upper ? 1 : -1,
      0
    ); // x,y,w are not used for the tube
    this._tempTubeMaterial.tubeAngle = Math.atan2(location.y, location.x);
    if (!upper) {
      this.scene.add(this._tempLowerCone);
      this.scene.remove(this._tempUpperCone);
    }

    if (upper) {
      this.scene.add(this._tempUpperCone);
      this.scene.remove(this._tempLowerCone);
    }
  }

  getLocationAndSetTempObjects(): Vector4 {
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
    return vec3ToVec4(
      this.hyperStore.surfaceIntersections[0].point,
      this.getWCoordinate()
    );
  }

  removeTubeAndConeFromScene() {
    this.scene.remove(this._tempTube);
    this.scene.remove(this._tempLowerCone);
    this.scene.remove(this._tempUpperCone);
  }

  displayAllTempPointObjects() {
    for (let i = 0; i < this._indexOfPointCurrentlyBeingSelected; i++) {
      this._tempPointArray[i].tempHEPoint.updateOrAddToGroup(); // display the previously selected objects as needed because the user may have selected a previous location and then mouse off all surfaces (causing all temp objects to disappear) and then mouse back onto a surface without triggering a mouse leave event
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

  prepareForNextPointSelections(event: MouseEvent): void {
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
    // Do the mouse moved event of the Hyperbolic frame so that a new hitHEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point (it will create multiple points at the same location). This is not what we want so we call mouseMove in Hyperbolic Frame so that ray casting is redone and the newly created point is on the hitHEPoints array.
    this.prepareForNextEvent();
    // EventBus.fire("raycast-mouse-move", {
    //   event: event
    // });
  }

  updateFilteredPointsList(): void {
    // this.filteredIntersectionPointsList = this.hitHEPoints.filter(pt => {
    //   if (pt instanceof HEIntersectionPoint) {
    //     if (pt.isUserCreated) {
    //       return pt.showing;
    //     } else {
    //       if (pt.principleParent1.showing && pt.principleParent2.showing) {
    //         return true;
    //       } else {
    //         return false;
    //       }
    //     }
    //   } else if (pt instanceof HEAntipodalPoint) {
    //     if (pt.isUserCreated) {
    //       return pt.showing;
    //     } else {
    //       return true;
    //     }
    //   }
    //   return pt.showing;
    // });
    // this.filteredIntersectionPointsList =
    //   this.filteredIntersectionPointsList.filter(
    //     pt =>
    //       pt.position.w === this.getWCoordinate() && //make sure that only points in the first hit surface are returned
    //       !this.hyperStore.closestIntersectionIsSurface // if the closest intersection is a surface then there are no points to interact with
    //   );
  }

  createNewPointsAsNeeded(
    commandGroup: CommandGroup,
    newPoints: HEPoint[]
  ): void {
    for (let i = 0; i < this._N; i++) {
      const selectedPoint = this._selectedPoints[i].HEPoint;
      if (selectedPoint) {
        if (
          (selectedPoint instanceof HEAntipodalPoint ||
            selectedPoint instanceof HEIntersectionPoint) &&
          !selectedPoint.isUserCreated
        ) {
          commandGroup.addCommand(
            new SetPointUserCreatedValueCommand(
              selectedPoint as HEIntersectionPoint | HEAntipodalPoint,
              true
            )
          );
        }
      } else {
        let vtx: HEPointOnOneOrTwoDimensional | HEPoint | null = null;
        let newHELabel: HELabel | null = null;
        const location = this._selectedPoints[i].locationVector;
        const possibleParent = this._selectedPoints[i].oneOrTwoDimParent;
        if (possibleParent) {
          // selected a location over a one or two dimensional object
          const closestLocation = possibleParent.closestVector(location);
          vtx = new HEPointOnOneOrTwoDimensional(
            possibleParent,
            closestLocation!
          );
          newHELabel = new HELabel("point", vtx, closestLocation!, vtx.name);
          vtx.setLabel(newHELabel);
        } else {
          // Selected an empty location
          vtx = new HEPoint(location);
          newHELabel = new HELabel("point", vtx, location, vtx.name);
          vtx.setLabel(newHELabel);
        }

        commandGroup.addCommand(new AddPointCommand(vtx, newHELabel));
        // Create the antipode of the new point, vtx
        const antipodalVtx = PoseTracker.addCreateAntipodeCommand(
          vtx as HEPoint,
          commandGroup
        );
        newPoints.push(vtx);
        newPoints.push(antipodalVtx);
        this._selectedPoints[i].HEPoint = vtx;
      }
    }
  }

  activate(): void {
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
