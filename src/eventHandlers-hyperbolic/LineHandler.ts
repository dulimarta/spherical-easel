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

  private normalVector = new Vector3();
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
  private startVector = new Vector4();

  /** The temporary objects for this tool */
  private _tempLine: HELine;
  private _tempStartPoint: HEPoint; //Can move between upper and lower
  private _tempStartIdealPoint: HEPoint; //Can move between upper and lower
  private _tempEndPoint: HEPoint; //Can move between upper and lower
  private _tempEndIdealPoint: HEPoint; //Can move between upper and lower
  private _tempTube: Mesh; //Can move between upper and lower and be directed to start or end
  private _tempTubeMaterial: CustomPointMaterial;
  private _tempUpperCone: Mesh;
  private _tempLowerCone: Mesh;

  /** Has the ??? temporary object been added to the scene?*/
  private _tempLineInScene = false;
  private _tempStartPointInScene = false;
  private _tempStartIdealPointInScene = false; // includes tube
  private _tempEndPointInScene = false;
  private _tempEndIdealPointInScene = false; // includes tube
  private _tempUpperConeInScene = false; //
  private _tempLowerConeInScene = false;

  // Filter the hitSEPoints appropriately for this handler
  private filteredIntersectionPointsList: HEPoint[] = [];

  /**
   * As the user moves the pointer around snap these objects to existing ones
   */
  private snapStartPointToExistingOneDimensional: HEOneOrTwoDimensional | null =
    null;
  private snapEndPointToExistingOneDimensional: HEOneOrTwoDimensional | null =
    null;
  private snapStartPointToExistingPoint: HEPoint | null = null;
  private snapEndPointToExistingPoint: HEPoint | null = null;

  /**
   * If the user starts to make a line and mouse press at a location on the hyperboloid, then moves
   * off the canvas, then back inside the hyperboloid and mouse releases, we should get nothing. This
   * variable is to help with that. Or if the user mouse press outside the canvas and mouse releases
   * on the canvas, nothing should happen.
   */
  private startLocationSelected = false;

  /**
   * A temporary vector to help with normal vector computations
   */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();

  constructor(scene: Scene, mode: number) {
    super(scene);
    this.scene = scene;
    this._tempStartPoint = new HEPoint(
      new THREE.Vector4(0, 0, 1, 1),
      false,
      true
    );

    this._tempStartIdealPoint = new HEPoint(
      new THREE.Vector4(1, 0, 0, 0),
      false,
      true
    );
    this._tempEndPoint = new HEPoint(
      new THREE.Vector4(0, 0, 1, 1),
      false,
      true
    );

    this._tempEndIdealPoint = new HEPoint(
      new THREE.Vector4(1, 0, 0, 0),
      false,
      true
    );
    this._tempLine = new HELine(
      this._tempStartPoint,
      this._tempEndPoint,
      this._mode,
      false,
      true
    );
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
    if (this.surfaceIsIntersected && !this.startLocationSelected) {
      this.startLocationSelected = true;
      this.updateFilteredPointsList();
      // Decide if the starting location is near an already existing HEPoint or near a oneDimensional HENodule
      if (this.filteredIntersectionPointsList.length > 0) {
        // Use an existing HEPoint to start the line
        const selected = this.filteredIntersectionPointsList[0];
        this.startVector.copy(selected.position);
        this._startHEPoint = this.filteredIntersectionPointsList[0];
        if (selected.position.w == 0) {
          this._tempStartIdealPoint.position = selected.position;
        } else {
          this._tempStartPoint.position = selected.position;
        }
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
        if (this.hyperboloidIsFirstSurfaceHit) {
          this._tempStartPoint.position = PoseTracker.vec3ToVec4(
            PoseTracker.hyperStore.surfaceIntersections[0].point,
            1
          );
          this.startVector.copy(this._tempStartPoint.position);
        } else {
          // since surface was hit is true and hyperboloid is first hit is false, it must the case that the ideal strip was hit
          this._tempStartIdealPoint.position = PoseTracker.vec3ToVec4(
            PoseTracker.hyperStore.surfaceIntersections[0].point,
            0
          );
          this.startVector.copy(this._tempStartIdealPoint.position);
        }
        this._startHEPoint = null;
      }
      // this._tempEndPoint.positionVectorAndDisplay =
      //   this.currentSphereVector;
    }
  }
  mouseMoved(event: MouseEvent): void {
    // console.debug(`LineHandler::mouseMoved (${event.clientX},${event.clientY})`)
    // Find all the nearby (hitHE... objects) and update location vectors
    super.mouseMoved(event);
    // Only one object can be interacted with at a given time, so set the first point nearby to glowing
    // The user can create points  on , ellipses, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    // Also set the snap objects
    this.updateFilteredPointsList();
    if (this.filteredIntersectionPointsList.length > 0) {
      this.filteredIntersectionPointsList[0].glowing = true;
      if (!this.startLocationSelected) {
        this.snapStartPointToExistingOneDimensional = null;
        // this.snapEndPointToExistingOneDimensional = null;
        this.snapStartPointToExistingPoint =
          this.filteredIntersectionPointsList[0];
        // this.snapEndPointToExistingPoint = null;
      } else {
        // this.snapStartPointToExistingOneDimensional = null;
        this.snapEndPointToExistingOneDimensional = null;
        // this.snapStartPointToExistingPoint = null;
        this.snapEndPointToExistingPoint =
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
    } else {
      this.snapStartPointToExistingOneDimensional = null;
      this.snapEndPointToExistingOneDimensional = null;
      this.snapStartPointToExistingPoint = null;
      this.snapEndPointToExistingPoint = null;
    }
    // Make sure that the event is on the hyperboloid
    if (this.surfaceIsIntersected) {
      if (!this.startLocationSelected) {
        // If the temporary startPoint has *not* been added to the scene do so now
        if (this.hyperboloidFirstHitOverall) {
          if (!this._tempStartPointInScene) {
            this._tempStartPointInScene = true;
            this.scene.add(this._tempStartPoint.mesh);
          }
          this._tempStartPoint.position = PoseTracker.vec3ToVec4(
            PoseTracker.hyperStore.surfaceIntersections[0].point,
            1
          );
        } else {
          if (this._tempStartPointInScene) {
            this._tempStartPointInScene = false;
            this.scene.remove(this._tempStartPoint.mesh);
          }
        }

        if (this.idealPointsStripFirstHitOverall) {
          if (!this._tempStartIdealPointInScene) {
            this._tempStartIdealPointInScene = true;
            this.scene.add(this._tempTube);
            this.scene.add(this._tempStartIdealPoint.mesh);
          }
          const location = PoseTracker.hyperStore.surfaceIntersections[0].point;
          const upper = location.z > 0;
          this._tempStartIdealPoint.position = PoseTracker.vec3ToVec4(
            location,
            0
          );
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
          if (this._tempStartIdealPointInScene) {
            this._tempStartIdealPointInScene = false;
            this._tempUpperConeInScene = false;
            this._tempLowerConeInScene = false;
            this.scene.remove(this._tempTube);
            this.scene.remove(this._tempStartIdealPoint.mesh);
            this.scene.remove(this._tempLowerCone);
            this.scene.remove(this._tempUpperCone);
          }
        }
        // Remove the temporary startPoint if there is a nearby point which can glow
        if (this.snapStartPointToExistingPoint !== null) {
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // glowing when the user select that location and then moves the mouse away) we don't
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            (this.snapStartPointToExistingPoint instanceof
              HEIntersectionPoint ||
              this.snapStartPointToExistingPoint instanceof HEAntipodalPoint) &&
            !this.snapStartPointToExistingPoint.isUserCreated
          ) {
            if (this.snapStartPointToExistingPoint.position.w == 0) {
              if (this._tempStartPointInScene) {
                this._tempStartPointInScene = false;
                this.scene.remove(this._tempStartPoint.mesh);
              }
              if (!this._tempStartIdealPointInScene) {
                this._tempStartIdealPointInScene = true;
                this.scene.add(this._tempStartIdealPoint.mesh);
              }
              this._tempStartIdealPoint.position =
                this.snapStartPointToExistingPoint.position;
            } else {
              if (this._tempStartIdealPointInScene) {
                this._tempStartIdealPointInScene = false;
                this.scene.remove(this._tempStartIdealPoint.mesh);
              }
              if (!this._tempStartPointInScene) {
                this._tempStartPointInScene = true;
                this.scene.add(this._tempStartPoint.mesh);
              }
              this._tempStartPoint.position =
                this.snapStartPointToExistingPoint.position;
            }
          } else {
            // the snap point is glowing so remove all other start temp objects
            this.removeAllStartTempObjects();
          }
        }
        // Set the location of the temporary startPoint by snapping to appropriate object (if any)
        if (this.snapStartPointToExistingOneDimensional !== null) {
          // this._tempStartPoint.position =
          //   this.snapStartPointToExistingOneDimensional.closestVector(
          //     PoseTracker.hyperStore.surfaceIntersections[0].point
          //   );
        }
        // else if (this.snapStartPointToExistingPoint == null) {
        //   this._tempStartPoint.position =
        //     this.currentSphereVector;
        //}
      } else {
        // If the temporary startPoint has *not* been added to the scene do so now (it might have
        // been removed due to leaving the hyperboloid in mouse move, but not triggering a mouse leave event)
        if (
          !this._tempStartPointInScene &&
          this._startHEPoint === null &&
          this.startVector.w != 0
        ) {
          this._tempStartPointInScene = true;
          this.scene.add(this._tempStartPoint.mesh);
        }
        if (
          !this._tempStartIdealPointInScene &&
          this._startHEPoint === null &&
          this.startVector.w == 0
        ) {
          this._tempStartIdealPointInScene = true;
          this.scene.add(this._tempStartIdealPoint.mesh);
        }
        // If the temporary endPoint has *not* been added to the scene do so now, but only if the end point upper status matches the selected start point/location
        const possibleLocation = PoseTracker.vec3ToVec4(
          PoseTracker.hyperStore.surfaceIntersections[0].point,
          this.hyperboloidIsFirstSurfaceHit ? 1 : 0
        );

        if (possibleLocation.z * this.startVector.z > 0) {
          if (this.hyperboloidIsFirstSurfaceHit) {
            if (!this._tempEndPointInScene) {
              this._tempEndPointInScene = true;
              this.scene.add(this._tempEndPoint.mesh);
            }
            this._tempEndPoint.position = possibleLocation;
          } else {
            if (this._tempEndPointInScene) {
              this._tempEndPointInScene = false;
              this.scene.remove(this._tempEndPoint.mesh);
            }
          }

          if (!this.hyperboloidIsFirstSurfaceHit) {
            if (!this._tempEndIdealPointInScene) {
              this._tempEndIdealPointInScene = true;
              this.scene.add(this._tempTube);
              this.scene.add(this._tempEndIdealPoint.mesh);
            }
            const upper = possibleLocation.z > 0;
            this._tempEndIdealPoint.position = possibleLocation;
            this._tempTubeMaterial.upper = upper ? 1 : 0;
            this._tempTubeMaterial.tubeAngle = Math.atan2(
              possibleLocation.y,
              possibleLocation.x
            );

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
            if (this._tempEndIdealPointInScene) {
              this._tempEndIdealPointInScene = false;
              this._tempUpperConeInScene = false;
              this._tempLowerConeInScene = false;
              this.scene.remove(this._tempTube);
              this.scene.remove(this._tempStartIdealPoint.mesh);
              this.scene.remove(this._tempLowerCone);
              this.scene.remove(this._tempUpperCone);
            }
          }
          // Remove the temporary endPoint if there is a nearby point (which is glowing)
          if (this.snapEndPointToExistingPoint !== null) {
            this.removeAllEndTempObjects();
          }
          // Set the location of the temporary endMarker by snapping to appropriate object (if any)
          if (this.snapEndPointToExistingOneDimensional !== null) {
            // this._tempEndPoint.positionVectorAndDisplay =this.snapEndPointToExistingOneDimensional.closestVector(
            //       this.currentSphereVector
            // )
          } else {
            // this._tempEndPoint.positionVectorAndDisplay =this.currentSphereVector
          }

          // If the temporary line has *not* been added to the scene do so now (only once)
          if (!this._tempLineInScene) {
            this._tempLineInScene = true;
            this.scene.add(this._tempLine.mesh);
          }
          // Compute the normal vector from the this.startVector, the (old) normal vector and this._tempEndPoint vector
          // Compute a temporary normal from the two points' vectors
          // this.tmpVector.crossVectors(
          //   this.startVector,
          //   this.snapEndPointToExistingPoint === null
          //     ? this.tmpVector
          //         .copy(this._tempEndPoint.positionVector)
          //         .normalize()
          //     : // ? this._tempEndPoint.positionVector
          //       this.snapEndPointToExistingPoint.locationVector
          // );

          // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
          // nearly antipodal or in the same direction)
          // if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
          //   if (this.normalVector.length() === 0) {
          //     // The normal vector is still at its initial value so can't be used to compute the next normal, so set the
          //     // the normal vector to an arbitrarily chosen vector perpendicular to the start vector
          //     this.tmpVector.set(1, 0, 0);
          //     this.tmpVector.crossVectors(this.startVector, this.tmpVector);
          //     if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
          //       this.tmpVector.set(0, 1, 0);
          //       // The cross of startVector and (1,0,0) and (0,1,0) can't *both* be zero
          //       this.tmpVector.crossVectors(this.startVector, this.tmpVector);
          //     }
          //   } else {
          //     // The start and end vectors align, compute  the next normal vector from the old normal and the start vector
          //     this.tmpVector.crossVectors(this.startVector, this.normalVector);
          //     this.tmpVector.crossVectors(this.tmpVector, this.startVector);
          //   }
          // }
          // this.normalVector.copy(this.tmpVector).normalize();

          // Set the normal vector to the line in the plottable object, update the display
          // this.temporaryLine.normalVector = this.normalVector;
          this._tempLine.setNewStartAndEndPoints(
            this._tempStartPoint,
            this._tempEndPoint
          );
        } else {
          // the user is not over the same upper or lower sheet as the start and the endpoint markers should be removed.
          this.removeAllEndTempObjects();
        }
      }
    } /*if (this._tempStartPointInScene)*/ else {
      // Remove the temporary objects from the display.
      this.removeAllTempObjects();

      this.snapStartPointToExistingOneDimensional = null;
      this.snapEndPointToExistingOneDimensional = null;
      this.snapStartPointToExistingPoint = null;
      this.snapEndPointToExistingPoint = null;
    }
  }
  mouseReleased(event: MouseEvent): void {
    // console.debug(`LineHandler::mouseReleased (${event.clientX},${event.clientY})`)
    if (this.surfaceIsIntersected) {
      if (this.startLocationSelected) {
        const possibleLocation = PoseTracker.vec3ToVec4(
          PoseTracker.hyperStore.surfaceIntersections[0].point,
          this.hyperboloidIsFirstSurfaceHit ? 1 : 0
        );

        const bothIdeal = possibleLocation.w == 0 && this.startVector.w == 0;
        const idealAngularMinimumMet = bothIdeal
          ? Math.abs(
              Math.atan2(possibleLocation.y, possibleLocation.x) -
                Math.atan2(this.startVector.y, this.startVector.x)
            ) > 0.1
          : false;

        const bothNotIdeal = possibleLocation.w == 1 && this.startVector.w == 1;
        const angularMinimumMet = bothNotIdeal
          ? new Vector3(
              possibleLocation.x,
              possibleLocation.y,
              possibleLocation.z
            ).angleTo(
              new Vector3(
                this.startVector.x,
                this.startVector.y,
                this.startVector.z
              )
            ) > 0.1
          : false;

        if (
          (bothIdeal && idealAngularMinimumMet) ||
          (bothNotIdeal && angularMinimumMet) ||
          (!bothIdeal && !bothNotIdeal) // One is ideal and the other is not.
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
        }
      } else {
        this.removeAllTempObjects();
        this.snapStartPointToExistingOneDimensional = null;
        this.snapEndPointToExistingOneDimensional = null;
        this.snapStartPointToExistingPoint = null;
        this.snapEndPointToExistingPoint = null;
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.prepareForNextLine();
  }

  removeAllTempObjects(): void {
    this.scene.remove(this._tempLine.mesh);
    this._tempLineInScene = false;
    this.removeAllStartTempObjects();
    this.removeAllEndTempObjects();
  }

  removeAllStartTempObjects(): void {
    this.scene.remove(this._tempStartPoint.mesh);
    this._tempStartPointInScene = false;
    this.scene.remove(this._tempStartIdealPoint.mesh);
    this.scene.remove(this._tempTube);
    this._tempStartIdealPointInScene = false;
    this.scene.remove(this._tempLowerCone);
    this.scene.remove(this._tempUpperCone);
    this._tempUpperConeInScene = false;
    this._tempLowerConeInScene = false;
  }

  removeAllEndTempObjects(): void {
    this.scene.remove(this._tempEndPoint.mesh);
    this._tempEndPointInScene = false;
    this.scene.remove(this._tempEndIdealPoint.mesh);
    this.scene.remove(this._tempTube);
    this._tempEndIdealPointInScene = false;
    this.scene.remove(this._tempLowerCone);
    this.scene.remove(this._tempUpperCone);
    this._tempUpperConeInScene = false;
    this._tempLowerConeInScene = false;
  }

  prepareForNextLine(): void {
    this.removeAllTempObjects();

    this.snapStartPointToExistingOneDimensional = null;
    this.snapEndPointToExistingOneDimensional = null;
    this.snapStartPointToExistingPoint = null;
    this.snapEndPointToExistingPoint = null;

    // Clear old points and values to get ready for creating the next line.
    if (this._startHEPoint) {
      this._startHEPoint.glowing = false;
      this._startHEPoint.selected = false;
    }
    this._startHEPoint = null;
    this._endHEPoint = null;
    this._startHEPointOneDimensionalParent = null;
    this.normalVector.set(0, 0, 0);
    this.startVector.set(0, 0, 0, 0);
    this.startLocationSelected = false;

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
      this.hyperboloidIsFirstSurfaceHit ? 1 : 0
    );

    if (this._startHEPoint === null) {
      // We have to create a new HEPointOnOneDimensional or HEPoint
      let vtx: HEPoint | null = null; // | HEPointOnOneOrTwoDimensional | null = null; // Not implemented yet
      let newHELabel: HELabel | null = null;
      if (this._startHEPointOneDimensionalParent) {
        // // Starting mouse press landed near a oneDimensional
        // // Create the model object for the new point and link them
        // vtx = new SEPointOnOneOrTwoDimensional(
        //   this._startHEPointOneDimensionalParent
        // );
        // newHELabel = new HELabel(
        //   "point",
        //   vtx,
        //   vtx.position,
        //   vtx.name,
        //   vtx.upper
        // );
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
        vtx = new HEPoint(this.startVector);
        newHELabel = new HELabel("point", vtx, this.startVector, vtx.name);
        vtx.setLabel(newHELabel);
        lineCommandGroup.addCommand(new AddPointCommand(vtx, newHELabel));
      }
      /////////////
      if (vtx) {
        /////////////
        // Create the antipode of the new point, vtx
        LineHandler.addCreateAntipodeCommand(vtx as HEPoint, lineCommandGroup);
        // Create the antipode of the new point, vtx
        const antipode = LineHandler.addCreateAntipodeCommand(
          vtx,
          lineCommandGroup
        );
        newlyCreatedHEPoints.push(vtx, antipode);
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
        this._startHEPoint = vtx;
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
      let vtx: HEPoint | null = null; // | HEPointOnOneOrTwoDimensional | null = null;
      let newHELabel: HELabel | null = null;
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
      vtx = new SEPointOnOneOrTwoDimensional(this.hitSEPolygons[0]);
      // Set the Location
      vtx.locationVector = this.hitSEPolygons[0].closestVector(
        this.currentSphereVector
      );
      newSELabel = new SELabel("point", vtx);

      lineCommandGroup.addCommand(
        new AddPointOnOneDimensionalCommand(
          vtx as SEPointOnOneOrTwoDimensional,
          this.hitSEPolygons[0],
          newSELabel
        )
      );
      // } else {
      // The ending mouse release landed on an open space
      vtx = new HEPoint(endLocation);
      newHELabel = new HELabel("point", vtx, endLocation, vtx.name);

      lineCommandGroup.addCommand(new AddPointCommand(vtx, newHELabel));
      // }
      /////////////
      // Create the antipode of the new point, vtx
      const antipode = LineHandler.addCreateAntipodeCommand(
        vtx,
        lineCommandGroup
      );
      newlyCreatedHEPoints.push(antipode, vtx);
      ///////////
      this._endHEPoint = vtx;
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

      // Set the normal vector to the line in the plottable object this also updates the display
      this._tempLine.setNewStartAndEndPoints(
        this._startHEPoint,
        this._endHEPoint
      );
      // this.temporaryLine.updateDisplay();

      // check to make sure that this line doesn't already exist by checking that no existing line has normal or -1*normal equal to the new proposed normal
      let lineIsNotNew = false;
      LineHandler.hyperStore.linesMap.forEach(line => {
        if (
          (this.tmpVector
            .subVectors(line.normalVector, this._tempLine.normalVector)
            .isZero() ||
            this.tmpVector
              .copy(this._tempLine.normalVector)
              .addScaledVector(line.normalVector, -1)
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

      // Create the new line after the normalVector is set
      const newHELine = new HELine(
        this._startHEPoint,
        this._endHEPoint,
        this._mode
      );
      // Create the label
      const newHELabel = new HELabel(
        "line",
        newHELine,
        this._startHEPoint.position,
        newHELine.name
      );
      newHELine.setLabel(newHELabel);
      // this.tmpVector
      //   .addVectors(
      //     this._startHEPoint.locationVector,
      //     this._endHEPoint.locationVector
      //   )
      //   .normalize()
      //   .add(new Vector3(0, SETTINGS.line.initialLabelOffset, 0))
      //   .normalize();
      // newSELabel.locationVector = this.tmpVector;

      lineCommandGroup.addCommand(
        new AddLineCommand(
          newHELine,
          this._startHEPoint,
          this._endHEPoint,
          newHELabel
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
}
