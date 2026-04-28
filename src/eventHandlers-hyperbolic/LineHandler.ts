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

export class LineHandler extends PoseTracker {
  /**
   *  Mode is a number between 0 and 7, inclusive. The binary expansion of this number is three bits, the most significant tells whether the portion of the line before the start point is drawn, the second most significant bit tells whether the portion of the line between the start and end points is drawn, and the least significant bit tells whether the portion of the line after the end point is drawn. So 7 = 111 in binary means draw all portions of the line and 6 = 110 in binary means draw only the portion of the line before the start point and between the start and end points, but not after the end point, etc.
   */
  private _mode;

  protected _normalVector = new Vector3();
  /**
   * The starting and ending SEPoints of the line. The possible parent of the startSEPoint
   */
  private _startHEPoint: HEPoint | null = null;
  private _endHEPoint: HEPoint | null = null;
  private _startHEPointOneDimensionalParent: HEOneOrTwoDimensional | null =
    null;

  /**
   * The starting vector location of the line
   */
  private _startVector = new Vector4();

  /** The temporary objects for this tool */
  private _tempLine: HELine;
  private _tempStartPoint: HEPoint; //Can move between upper and lower
  private _tempEndPoint: HEPoint; //Can move between upper and lower
  private _tempTube: Mesh; //Can move between upper and lower and be directed to start or end
  private _tempTubeMaterial: CustomPointMaterial;
  private _tempUpperCone: Mesh;
  private _tempLowerCone: Mesh;

  /** Has the ??? temporary object been added to the scene or group?*/
  private _tempLineInScene = false;
  private _tempTubeInScene = false;
  private _tempUpperConeInScene = false; //
  private _tempLowerConeInScene = false;

  // Filter the hitSEPoints appropriately for this handler
  private filteredIntersectionPointsList: HEPoint[] = [];

  /**
   * As the user moves the pointer around snap these objects to existing ones
   */
  private _snapStartPointToExistingOneDimensional: HEOneOrTwoDimensional | null =
    null;
  private _snapEndPointToExistingOneDimensional: HEOneOrTwoDimensional | null =
    null;
  private _snapStartPointToExistingPoint: HEPoint | null = null;
  private _snapEndPointToExistingPoint: HEPoint | null = null;

  /**
   * If the user starts to make a line and mouse press at a location on the hyperboloid, then moves
   * off the canvas, then back inside the hyperboloid and mouse releases, we should get nothing. This
   * variable is to help with that. Or if the user mouse press outside the canvas and mouse releases
   * on the canvas, nothing should happen.
   */
  private _startLocationSelected = false;

  private tmpVector4 = new Vector4();
  private tmpVector3 = new Vector3();

  constructor(scene: Scene, mode: number) {
    super(scene);

    this._tempStartPoint = new HEPoint(
      new THREE.Vector4(0, 0, 1, 1),
      false,
      true
    );
    PoseTracker.hyperStore.addTempObject(this._tempStartPoint);
    this._tempStartPoint.addGroupToScene(this.scene); // Adds the group that contains(or not depending on the state of the handler) the three types of mesh to the scene
    this._tempStartPoint.removeAllMeshesFromGroup();

    this._tempEndPoint = new HEPoint(
      new THREE.Vector4(0, 0, 1, 1),
      false,
      true
    );
    PoseTracker.hyperStore.addTempObject(this._tempEndPoint);
    this._tempEndPoint.addGroupToScene(this.scene); // Adds the group that contains(or not depending on the state of the handler) the three types of mesh to the scene
    this._tempEndPoint.removeAllMeshesFromGroup();

    this._tempLine = new HELine(
      this._tempStartPoint,
      this._tempEndPoint,
      mode,
      false,
      true
    );
    PoseTracker.hyperStore.addTempObject(this._tempLine);

    this._tempTube = createIdealPointTube(true);
    this._tempTubeMaterial = this._tempTube.material as CustomPointMaterial;
    this._tempLowerCone = createBoundaryCone(false);
    this._tempUpperCone = createBoundaryCone(true);
    this._mode = mode;
  }

  mousePressed(event: MouseEvent): void {
    // console.debug(`LineHandler::mousePressed (${event.clientX},${event.clientY})`)
    // Do the mouse moved event of the Highlighter so that a new hitHEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    super.mouseMoved(event);
    if (this.aSurfaceIsIntersected && !this._startLocationSelected) {
      this._startLocationSelected = true;
      this.updateFilteredPointsList();
      // Decide if the starting location is near an already existing HEPoint or near a oneDimensional HENodule
      if (this.filteredIntersectionPointsList.length > 0) {
        // Use an existing HEPoint to start the line
        const selected = this.filteredIntersectionPointsList[0];
        this._startVector.copy(selected.position);
        this._startHEPoint = this.filteredIntersectionPointsList[0];
        this._tempStartPoint.position = selected.position;

        // Glow the selected point and select it so the highlighter.ts doesn't unglow it with the mouseMoved method
        this._startHEPoint.glowing = true;
        this._startHEPoint.selected = true;
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
        // The mouse press is not near an existing point or one dimensional object.
        //  Eventually, we will create a new HEPoint
        this._tempStartPoint.position = PoseTracker.vec3ToVec4(
          PoseTracker.hyperStore.surfaceIntersections[0].point,
          this.getWCoordinate()
        );
        this._startVector.copy(this._tempStartPoint.position);
        this._startHEPoint = null;
      }
    }
  }
  mouseMoved(event: MouseEvent): void {
    // console.debug(`LineHandler::mouseMoved (${event.clientX},${event.clientY})`)
    // Find all the nearby (hitHE... objects) and update location vectors
    super.mouseMoved(event);
    this.updateFilteredPointsList();
    // Set the snap objects, if any
    this._snapStartPointToExistingOneDimensional = null;
    this._snapEndPointToExistingOneDimensional = null;
    this._snapStartPointToExistingPoint = null;
    this._snapEndPointToExistingPoint = null;
    if (this.filteredIntersectionPointsList.length > 0) {
      // Only one object can be interacted with at a given time, so set the first point nearby to glowing
      // The user can create points  on , ellipses, segments, and lines, etc so
      // highlight those as well (but only one) if they are nearby also
      // Also set the snap objects
      this.filteredIntersectionPointsList[0].glowing = true;
      if (this._startLocationSelected) {
        this._snapEndPointToExistingPoint =
          this.filteredIntersectionPointsList[0];
      } else {
        this._snapStartPointToExistingPoint =
          this.filteredIntersectionPointsList[0];
      }
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
      const possibleLocation = this.updateTempObjects(); // compute the location and adds the cone/tube to the scene as warranted
      if (!this._startLocationSelected) {
        // Remove the temporary startPoint if there is a nearby point which can glow
        if (this._snapStartPointToExistingPoint !== null) {
          // if the user is over a non-user created intersection or antipodal point (which can't be set to glowing so will not remain
          // glowing when the user select that location and then moves the mouse away)
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            (this._snapStartPointToExistingPoint instanceof
              HEIntersectionPoint ||
              this._snapStartPointToExistingPoint instanceof
                HEAntipodalPoint) &&
            !this._snapStartPointToExistingPoint.isUserCreated
          ) {
            this._tempStartPoint.position =
              this._snapStartPointToExistingPoint.position;
          } else {
            // the snap point is glowing so remove all other start temp objects
            this.removeAllTempStartObjects();
          }
        } else if (this._snapStartPointToExistingOneDimensional !== null) {
          // Set the location of the temporary startPoint by snapping to appropriate object (if any)
          // NOT IMPLEMENTED YET
          // this._tempStartPoint.position =
          //   this.snapStartPointToExistingOneDimensional.closestVector(
          //     PoseTracker.hyperStore.surfaceIntersections[0].point
          //   );
        } else {
          this._tempStartPoint.position = possibleLocation;
          this._tempStartPoint.updateOrAddToGroup(); // this must be called after setting the position of the point because the position is used to determine which of the three meshes (hyperboloid, ideal strip, or ultra strip) should be added to the group and displayed as the temporary point.
        }
      } else {
        this._tempStartPoint.updateOrAddToGroup(); // display the start objects as needed because the user may have selected a start location and then mouse off all surfaces (causing all temp objects to disappear) and then mouse back onto a surface

        this._tempEndPoint.position = possibleLocation;
        this._tempEndPoint.updateOrAddToGroup(); // set the location and display of the end objects

        // To make a line the start and end vector must have same upper and lower values
        if (possibleLocation.z * this._startVector.z > 0) {
          // Remove the temporary endPoint if there is a nearby point (which is glowing)
          if (this._snapEndPointToExistingPoint !== null) {
            this.removeAllTempEndObjects();
          }
          // Set the location of the temporary endMarker by snapping to appropriate object (if any)
          else if (this._snapEndPointToExistingOneDimensional !== null) {
            //NOT IMPLEMENTED YET
            // this._tempEndPoint.position =this.snapEndPointToExistingOneDimensional.closestVector(
            //       possibleLocation
            // )
          }
          this._tempLine.setNewStartAndEndVectors(
            this._startVector,
            possibleLocation
          );
          if (!this._tempLineInScene) {
            this._tempLineInScene = true;
            this.scene.add(this._tempLine.mesh);
          }
        } else {
          // the user is not over the same upper or lower sheet as the start and the endpoint markers should be removed.
          this.removeAllTempEndObjects();
        }
      }
    } else {
      this.removeAllTempObjects();
    }
  }

  mouseReleased(event: MouseEvent): void {
    // console.debug(`LineHandler::mouseReleased (${event.clientX},${event.clientY})`)
    if (this.aSurfaceIsIntersected) {
      if (this._startLocationSelected) {
        const possibleLocation = PoseTracker.vec3ToVec4(
          PoseTracker.hyperStore.surfaceIntersections[0].point,
          this.hyperboloidIsFirstSurfaceHit ? 1 : 0
        );
        const bothIdeal = possibleLocation.w == 0 && this._startVector.w == 0;
        const idealAngularMinimumMet = bothIdeal
          ? Math.abs(
              Math.atan2(possibleLocation.y, possibleLocation.x) -
                Math.atan2(this._startVector.y, this._startVector.x)
            ) > 0.1
          : false;

        const distanceMinimumMet =
          new Vector3(
            possibleLocation.x,
            possibleLocation.y,
            possibleLocation.z
          ).angleTo(
            new Vector3(
              this._startVector.x,
              this._startVector.y,
              this._startVector.z
            )
          ) > 0.1;

        if (
          possibleLocation.z * this._startVector.z > 0 && // To make a line the start and end vector must be on the same sheet
          ((bothIdeal && idealAngularMinimumMet) || distanceMinimumMet) // One is ideal and the other is not.
        ) {
          if (!this.makeLine()) {
            EventBus.fire("show-alert", {
              key: `handlers.lineCreationAttemptDuplicate`,
              keyOptions: {},
              type: "error"
            });
          }
          // Get ready for the next line
          this.mouseLeave(event);
        } else if (possibleLocation.z * this._startVector.z < 0) {
          EventBus.fire("show-alert", {
            key: `handlers.lineCreationBetweenDifferentSheets`,
            keyOptions: {},
            type: "error"
          });
        }
      } else {
        this.removeAllTempObjects();
        this._snapStartPointToExistingOneDimensional = null;
        this._snapEndPointToExistingOneDimensional = null;
        this._snapStartPointToExistingPoint = null;
        this._snapEndPointToExistingPoint = null;
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.prepareForNextLine();
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

  removeAllTempObjects(): void {
    if (this._tempLineInScene) {
      this.scene.remove(this._tempLine.mesh);
      this._tempLineInScene = false;
    }
    this.removeAllTempStartObjects();
    this.removeAllTempEndObjects();
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

  private updateTempObjects(): Vector4 {
    let wCoordinate: number;
    let returnVector: Vector4;
    switch (true) {
      case this.hyperboloidIsFirstSurfaceHit:
        wCoordinate = 1;
        //remove the tube and cone if they are in the scene
        this.removeTubeAndConeFromScene();
        break;
      case this.idealStripIsFirstSurfaceHit:
        wCoordinate = 0;
        // add the tube and cone for the ideal points
        this.addTubeAndConeToScene();
        break;
      case this.ultraStripIsFirstSurfaceHit:
        wCoordinate = -1;
        //remove the tube and cone if they are in the scene
        this.removeTubeAndConeFromScene();
        break;
      default:
        wCoordinate = 1; // default to the hyperboloid if something goes wrong
    }
    returnVector = PoseTracker.vec3ToVec4(
      PoseTracker.hyperStore.surfaceIntersections[0].point,
      wCoordinate
    );
    // if (start) {
    //   this._tempStartPoint.position = returnVector;
    //   this._tempStartPoint.updateOrAddToGroup(); // this must be called after setting the position of the point because the position is used to determine which of the three meshes (hyperboloid, ideal strip, or ultra strip) should be added to the group and displayed as the temporary point.
    // } else {
    //   this._tempEndPoint.position = returnVector;
    //   this._tempEndPoint.updateOrAddToGroup();
    // }
    return returnVector;
  }

  removeAllTempStartObjects(): void {
    this._tempStartPoint.removeAllMeshesFromGroup();
    this.removeTubeAndConeFromScene();
  }

  removeAllTempEndObjects(): void {
    this._tempEndPoint.removeAllMeshesFromGroup();
    this.removeTubeAndConeFromScene();
  }

  prepareForNextLine(): void {
    this.removeAllTempObjects();

    this._snapStartPointToExistingOneDimensional = null;
    this._snapEndPointToExistingOneDimensional = null;
    this._snapStartPointToExistingPoint = null;
    this._snapEndPointToExistingPoint = null;

    // Clear old points and values to get ready for creating the next line.
    if (this._startHEPoint) {
      this._startHEPoint.glowing = false;
      this._startHEPoint.selected = false;
    }
    this._startHEPoint = null;
    this._endHEPoint = null;
    this._startHEPointOneDimensionalParent = null;
    this._normalVector.set(0, 0, 0);
    this._startVector.set(0, 0, 0, 0);
    this._startLocationSelected = false;

    // call an unglow all command
    //LineHandler.hstore.unglowAllSENodules();
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
  }

  // Create a new line from the mouse event information
  private makeLine(fromActivate = false): boolean {
    const lineCommandGroup = new CommandGroup();
    const newlyCreatedHEPoints: HEPoint[] = [];

    const endLocation = PoseTracker.vec3ToVec4(
      PoseTracker.hyperStore.surfaceIntersections[0].point,
      this.getWCoordinate()
    );

    if (this._startHEPoint === null) {
      // We have to create a new HEPointOnOneDimensional or HEPoint
      let newStartPoint: HEPoint | null = null; // | HEPointOnOneOrTwoDimensional | null = null; // Not implemented yet
      let newStartLabel: HELabel | null = null;
      if (this._startHEPointOneDimensionalParent) {
        // // Starting mouse press landed near a oneDimensional
        // // Create the model object for the new point and link them
        // newStartPoint = new SEPointOnOneOrTwoDimensional(
        //   this._startHEPointOneDimensionalParent
        // );
        // newStartLabel = new HELabel(
        //   "point",
        //   vtx,
        //   vtx.position,
        //   vtx.name,
        //   vtx.upper
        // );
        // newStartPoint.setLabel(newStartLabel)
        // // Create and execute the command to create a new point for undo/redo
        // lineGroup.addCommand(
        //   new AddPointOnOneDimensionalCommand(
        //     vtx as HEPointOnOneOrTwoDimensional,
        //     this._startHEPointOneDimensionalParent,
        //     newHELabel
        //   )
        // );
      } else {
        // Starting mouse press landed on an open space
        newStartPoint = new HEPoint(this._startVector);
        newStartLabel = new HELabel(
          "point",
          newStartPoint,
          this._startVector,
          newStartPoint.name
        );
        newStartPoint.setLabel(newStartLabel);
        lineCommandGroup.addCommand(
          new AddPointCommand(newStartPoint, newStartLabel)
        );
      }
      /////////////
      if (newStartPoint) {
        // Create the antipode of the new point, vtx
        const antipode = LineHandler.addCreateAntipodeCommand(
          newStartPoint,
          lineCommandGroup
        );
        newlyCreatedHEPoints.push(newStartPoint, antipode);
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
        // newHELabel.locationVector = this.tmpVector;
        this._startHEPoint = newStartPoint;
      }
    } else if (
      (this._startHEPoint instanceof HEIntersectionPoint ||
        this._startHEPoint instanceof HEAntipodalPoint) &&
      !this._startHEPoint.isUserCreated
    ) {
      // Mark the intersection/antipodal point as created, the display style is changed and the glowing style is set up
      lineCommandGroup.addCommand(
        new SetPointUserCreatedValueCommand(this._startHEPoint, true)
      );
    }

    // Check to see if the release location is near any points
    if (this.filteredIntersectionPointsList.length > 0 && !fromActivate) {
      this._endHEPoint = this.filteredIntersectionPointsList[0];
      if (
        (this._endHEPoint instanceof HEIntersectionPoint ||
          this._endHEPoint instanceof HEAntipodalPoint) &&
        !this._endHEPoint.isUserCreated
      ) {
        // Mark the intersection point as created, the display style is changed and the glowing style is set up
        lineCommandGroup.addCommand(
          new SetPointUserCreatedValueCommand(this._endHEPoint, true)
        );
      }
    } else if (!fromActivate) {
      // We have to create a new Point for the end
      let newEndPoint: HEPoint | null = null; // | HEPointOnOneOrTwoDimensional | null = null;
      let newEndLabel: HELabel | null = null;
      // if (this.hitSESegments.length > 0) {
      //   // The end of the line will be a point on a segment
      //   // Create the model object for the new point and link them
      //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSESegments[0]);
      //   // Set the Location
      //   vtx.locationVector = this.hitSESegments[0].closestVector(
      //     this.currentSphereVector
      //   );
      //   newSELabel = new SELabel("point", vtx);

      //   lineCommandGroup.addCommand(
      //     new AddPointOnOneDimensionalCommand(
      //       vtx as SEPointOnOneOrTwoDimensional,
      //       this.hitSESegments[0],
      //       newSELabel
      //     )
      //   );
      // } else if (this.hitSELines.length > 0) {
      //   // The end of the line will be a point on a line
      //   // Create the model object for the new point and link them
      //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSELines[0]);
      //   // Set the Location
      //   vtx.locationVector = this.hitSELines[0].closestVector(
      //     this.currentSphereVector
      //   );
      //   newSELabel = new SELabel("point", vtx);

      //   lineCommandGroup.addCommand(
      //     new AddPointOnOneDimensionalCommand(
      //       vtx as SEPointOnOneOrTwoDimensional,
      //       this.hitSELines[0],
      //       newSELabel
      //     )
      //   );
      // } else if (this.hitSECircles.length > 0) {
      //   // The end of the line will be a point on a circle
      //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSECircles[0]);
      //   // Set the Location
      //   vtx.locationVector = this.hitSECircles[0].closestVector(
      //     this.currentSphereVector
      //   );
      //   newSELabel = new SELabel("point", vtx);

      //   lineCommandGroup.addCommand(
      //     new AddPointOnOneDimensionalCommand(
      //       vtx as SEPointOnOneOrTwoDimensional,
      //       this.hitSECircles[0],
      //       newSELabel
      //     )
      //   );
      // } else if (this.hitSEEllipses.length > 0) {
      //   // The end of the line will be a point on a ellipse
      //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSEEllipses[0]);
      //   // Set the Location
      //   vtx.locationVector = this.hitSEEllipses[0].closestVector(
      //     this.currentSphereVector
      //   );
      //   newSELabel = new SELabel("point", vtx);

      //   lineCommandGroup.addCommand(
      //     new AddPointOnOneDimensionalCommand(
      //       vtx as SEPointOnOneOrTwoDimensional,
      //       this.hitSEEllipses[0],
      //       newSELabel
      //     )
      //   );
      // } else if (this.hitSEParametrics.length > 0) {
      //   // The end of the line will be a point on a parametric
      //   vtx = new SEPointOnOneOrTwoDimensional(this.hitSEParametrics[0]);
      //   // Set the Location
      //   vtx.locationVector = this.hitSEParametrics[0].closestVector(
      //     this.currentSphereVector
      //   );
      //   newSELabel = new SELabel("point", vtx);

      //   lineCommandGroup.addCommand(
      //     new AddPointOnOneDimensionalCommand(
      //       vtx as SEPointOnOneOrTwoDimensional,
      //       this.hitSEParametrics[0],
      //       newSELabel
      //     )
      //   );
      // } else if (this.hitSEPolygons.length > 0) {
      // The end of the line will be a point on a parametric
      // vtx = new SEPointOnOneOrTwoDimensional(this.hitSEPolygons[0]);
      // // Set the Location
      // vtx.locationVector = this.hitSEPolygons[0].closestVector(
      //   this.currentSphereVector
      // );
      // newSELabel = new SELabel("point", vtx);

      // lineCommandGroup.addCommand(
      //   new AddPointOnOneDimensionalCommand(
      //     vtx as SEPointOnOneOrTwoDimensional,
      //     this.hitSEPolygons[0],
      //     newSELabel
      //   )
      // );
      // } else {
      // The ending mouse release landed on an open space
      newEndPoint = new HEPoint(endLocation);
      newEndLabel = new HELabel(
        "point",
        newEndPoint,
        endLocation,
        newEndPoint.name
      );
      newEndPoint.setLabel(newEndLabel);
      lineCommandGroup.addCommand(
        new AddPointCommand(newEndPoint, newEndLabel)
      );

      // }
      /////////////
      // Create the antipode of the new point, vtx
      const antipode = LineHandler.addCreateAntipodeCommand(
        newEndPoint,
        lineCommandGroup
      );
      newlyCreatedHEPoints.push(antipode, newEndPoint);
      ///////////
      this._endHEPoint = newEndPoint;
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

    if (this._endHEPoint && this._startHEPoint) {
      // // Compute a temporary normal from the two points' vectors
      // this.tmpVector.crossVectors(
      //   this._startHEPoint.locationVector,
      //   this._endHEPoint.locationVector
      // );
      // // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
      // // nearly antipodal or in the same direction)
      // if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
      //   // The start and end vectors align, compute the next normal vector from the old normal and the start vector
      //   this.tmpVector.crossVectors(
      //     this._startHEPoint.locationVector,
      //     this.normalVector
      //   );
      //   this.tmpVector.crossVectors(
      //     this.tmpVector,
      //     this._startHEPoint.locationVector
      //   );
      // }
      // this.normalVector.copy(this.tmpVector).normalize();

      // if (this.normalVector === undefined) {
      //   console.error(
      //     "The normal vector in line handler was not set properly"
      //   );
      //   return false;
      // } //There are some situations in which the mouse actions (hard to duplicate) lead to an undefined normal vector and I'm hoping this will prevent the program from entering an error state.

      // Set the points for the line so that the display matches the line to be created
      this._tempLine.setNewStartAndEndVectors(
        this._startHEPoint.position,
        this._endHEPoint.position
      );
      this._tempLine.unitNormalVector
        .crossVectors(
          new Vector3(
            this._startHEPoint.position.x,
            this._startHEPoint.position.y,
            this._startHEPoint.position.z
          ),
          new Vector3(
            this._endHEPoint.position.x,
            this._endHEPoint.position.y,
            this._endHEPoint.position.z
          )
        )
        .normalize();

      // check to make sure that this line doesn't already exist by checking that no existing line has normal or -1*normal equal to the new proposed normal
      let lineIsNotNew = false;

      LineHandler.hyperStore.linesMap.forEach(line => {
        if (
          (this.tmpVector3
            .subVectors(line.unitNormalVector, this._tempLine.unitNormalVector)
            .isZero() ||
            this.tmpVector3
              .copy(this._tempLine.unitNormalVector)
              .addScaledVector(line.unitNormalVector, -1)
              .isZero()) &&
          line.upper == this._tempLine.upper &&
          line.mode == this._tempLine.mode
        ) {
          lineIsNotNew = true;
        }
      });

      if (lineIsNotNew) {
        return false;
      }

      const newLine = new HELine(
        this._startHEPoint,
        this._endHEPoint,
        this._mode
      );

      // compute the label location
      this.tmpVector4
        .addVectors(this._startHEPoint.position, this._endHEPoint.position)
        .multiplyScalar(0.5);
      const zCoord = Math.sqrt(
        this.tmpVector4.x * this.tmpVector4.x +
          this.tmpVector4.y * this.tmpVector4.y +
          1
      );
      this.tmpVector4.z = zCoord * (this._startHEPoint.upper ? 1 : -1);
      this.tmpVector4.w = 1; // labels for lines are always not ideal

      // Create the label
      const newLineLabel = new HELabel(
        "line",
        newLine,
        this.tmpVector4,
        newLine.name
      );
      newLine.setLabel(newLineLabel);

      lineCommandGroup.addCommand(
        new AddLineCommand(
          newLine,
          this._startHEPoint,
          this._endHEPoint,
          newLineLabel
        )
      );

      // Determine all new intersection points and add their creation to the command so it can be undone

      const intersectionPointsToUpdate: HEIntersectionPoint[] = [];

      // LineHandler.hyperStore
      //   .createAllIntersectionsWith(newHELine, newlyCreatedHEPoints)
      //   .forEach((item: HEIntersectionReturnType) => {
      //     if (item.existingIntersectionPoint) {
      //       intersectionPointsToUpdate.push(item.SEIntersectionPoint);
      //       lineCommandGroup.addCondition(() =>
      //         item.SEIntersectionPoint.canAddIntersectionOtherParentInfo(item)
      //       );
      //       lineCommandGroup.addCommand(
      //         new AddIntersectionPointOtherParentsInfo(item)
      //       );
      //       lineCommandGroup.addEndCondition();
      //     } else {
      //       // Create the plottable label
      //       const newSELabel = item.SEIntersectionPoint.attachLabelWithOffset(
      //         new Vector3(
      //           2 * SETTINGS.point.initialLabelOffset,
      //           SETTINGS.point.initialLabelOffset,
      //           0
      //         )
      //       );

      //       lineCommandGroup.addCommand(
      //         new AddIntersectionPointCommand(
      //           item.SEIntersectionPoint,
      //           item.parent1,
      //           item.parent2,
      //           newSELabel
      //         )
      //       );
      //       item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
      //       newSELabel.showing = false;

      //       if (item.createAntipodalPoint) {
      //         LineHandler.addCreateAntipodeCommand(
      //           item.SEIntersectionPoint,
      //           lineCommandGroup
      //         );
      //       }
      //     }
      //   });
      lineCommandGroup.execute();

      // The newly added line passes through all the
      // intersection points on the intersectionPointsToUpdate list
      // This line might be a new parent to some of them
      // shallowUpdate will check this and change parents as needed
      // intersectionPointsToUpdate.forEach(pt => pt.shallowUpdate());
      // intersectionPointsToUpdate.splice(0);
    }
    return true;
  }

  activate(): void {
    // // If there are exactly two (non-antipodal and not to near each other) SEPoints selected,
    // // create a line with the two points
    // if (LineHandler.store.selectedSENodules.length == 2) {
    //   const object1 = LineHandler.store.selectedSENodules[0];
    //   const object2 = LineHandler.store.selectedSENodules[1];
    //   if (object1 instanceof SEPoint && object2 instanceof SEPoint) {
    //     this.tmpVector.crossVectors(
    //       object1.locationVector,
    //       object2.locationVector
    //     );
    //     // Check to see if the points are antipodal
    //     if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
    //       // They are antipodal, create an arbitrary normal vector
    //       this.tmpVector.set(1, 0, 0);
    //       this.normalVector.crossVectors(
    //         object1.locationVector,
    //         this.tmpVector
    //       );
    //       if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
    //         this.tmpVector.set(0, 1, 0);
    //         // The cross of object1.locationVector, and (1,0,0) and (0,1,0) can't *both* be zero
    //         this.normalVector.crossVectors(
    //           object1.locationVector,
    //           this.tmpVector
    //         );
    //       }
    //       this.normalVector.normalize();
    //     }
    //     this._startHEPoint = object1;
    //     this._endHEPoint = object2;
    //     if (!this.makeLine(true)) {
    //       EventBus.fire("show-alert", {
    //         key: `handlers.lineCreationAttemptDuplicate`,
    //         keyOptions: {},
    //         type: "error"
    //       });
    //     }
    //     this.prepareForNextLine();
    //   }
    //   // Unselect the selected objects and clear the selectedObject array
    //   super.activate();
    // }
  }
  deactivate(): void {
    super.deactivate();
  }

  set mode(newMode: number) {
    console.log("set mode in Line Handler");
    if (newMode != this._mode) {
      this._mode = newMode;
      this._tempLine.mode = newMode;
    }
  }
}
