/** @format */

import { Vector3, Matrix4 } from "three";
import Point from "@/plottables/Point";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import SETTINGS from "@/global-settings";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneOrTwoDimensionalCommand";
import { SEOneOrTwoDimensional, SEIntersectionReturnType } from "@/types";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import EventBus from "./EventBus";
import NonFreeCircle from "@/plottables/NonFreeCircle";
import ThreePointCircleCenter from "@/plottables/ThreePointCircleCenter";
import { SEThreePointCircleCenter } from "@/models/SEThreePointCircleCenter";
import { SECircle } from "@/models/SECircle";
import { AddThreePointCircleCenterCommand } from "@/commands/AddThreePointCircleCenterCommand";
import { AddCircleCommand } from "@/commands/AddCircleCommand";
import { AddIntersectionPointParent } from "@/commands/AddIntersectionPointParent";
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();

export default class ThreePointCircleHandler extends Highlighter {
  /**
   * vectors determining the center of the circle
   */
  private point1Vector: Vector3;
  private point2Vector: Vector3;

  /**  The temporary plottable circle and point center displayed as the user moves the mouse or drags after selection two points */
  private temporaryThreePointCircleCenter: ThreePointCircleCenter;
  private temporaryThreePointCircle: NonFreeCircle;

  /**  The model object points that determine thee center (if any) */
  private point1SEPoint: SEPoint | null = null;
  private point2SEPoint: SEPoint | null = null;
  private point3SEPoint: SEPoint | null = null;

  /** The possible parent of the point(1|2|3)SEPoint*/
  private point1SEPointOneDimensionalParent: SEOneOrTwoDimensional | null =
    null;
  private point2SEPointOneDimensionalParent: SEOneOrTwoDimensional | null =
    null;

  /** Depending on where the user is in selecting the point, we know what to temporary objects to add to the scene */
  private point1LocationSelected = false;
  private point2LocationSelected = false;

  /**
   * A temporary plottable (TwoJS) points created while the user is making the ellipse. These can't be the same because the user
   * might select two new points (leaving the Focus Markers behind) and then the ellipse Point maker is displayed at the currentLocation
   */
  protected temporaryPoint1Marker: Point;
  protected temporaryPoint2Marker: Point;
  protected temporaryPoint3Marker: Point;

  /* temporary vector and matrix to help with computations */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpMatrix = new Matrix4();

  /** Has the temporary point(1|2|3)Marker/tempThreePoint(Circle|Center) marker been added to the scene?*/
  private temporaryThreePointCircleAndCenterAdded = false;
  private temporaryPoint1MarkerAdded = false;
  private temporaryPoint2MarkerAdded = false;
  private temporaryPoint3MarkerAdded = false;

  /**
   * As the user moves the pointer around snap the temporary marker to these objects temporarily
   */
  protected snapTemporaryPointMarkerToOneDimensional: SEOneOrTwoDimensional | null =
    null;
  protected snapTemporaryPointMarkerToPoint: SEPoint | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
    this.point1Vector = new Vector3();
    this.point2Vector = new Vector3();

    // Set the style using the temporary defaults
    this.temporaryThreePointCircle = new NonFreeCircle();
    ThreePointCircleHandler.store.addTemporaryNodule(
      this.temporaryThreePointCircle
    );

    // Set the style using the temporary defaults
    this.temporaryThreePointCircleCenter = new ThreePointCircleCenter();
    ThreePointCircleHandler.store.addTemporaryNodule(
      this.temporaryThreePointCircleCenter
    );

    // Create and style the temporary points marking object being created
    this.temporaryPoint1Marker = new Point();
    ThreePointCircleHandler.store.addTemporaryNodule(
      this.temporaryPoint1Marker
    );

    this.temporaryPoint2Marker = new Point();
    ThreePointCircleHandler.store.addTemporaryNodule(
      this.temporaryPoint2Marker
    );

    this.temporaryPoint3Marker = new Point();
    ThreePointCircleHandler.store.addTemporaryNodule(
      this.temporaryPoint3Marker
    );
  }

  mousePressed(event: MouseEvent): void {
    // First decide if the location of the event is on the sphere
    if (this.isOnSphere && !this.point2LocationSelected) {
      // Check to see if the current location is near any points
      if (this.hitSEPoints.length > 0) {
        // Pick the top most selected point
        const selected = this.hitSEPoints[0];
        if (!this.point1LocationSelected) {
          // Record the vector of the point so it can be past to the non-temporary three point circle center
          this.point1Vector.copy(selected.locationVector);
          // Record the model object one point of the three circle center
          this.point1SEPoint = selected;
          // Move the startMarker to the current selected point
          this.temporaryPoint1Marker.positionVector = selected.locationVector;
          // Set the first vector in the three point circle center
          this.temporaryThreePointCircleCenter.vector1 =
            selected.locationVector;
          // Glow the selected point and select it so the highlighter.ts doesn't unglow it with the mouseMoved method
          this.point1SEPoint.glowing = true;
          this.point1SEPoint.selected = true;
          this.point1LocationSelected = true;
        } else {
          // disallow a second point that is equal to the first (it can be antipodal to the first)
          if (
            !this.tmpVector
              .subVectors(selected.locationVector, this.point1Vector)
              .isZero()
          ) {
            // Record the vector so it can be past to the non-temporary three point circle center
            this.point2Vector.copy(selected.locationVector);
            // Record the model object the second of three points in the three circle center
            this.point2SEPoint = selected;
            // Move the startMarker to the current selected point
            this.temporaryPoint2Marker.positionVector = selected.locationVector;
            // Set the second vector in the three point circle center
            this.temporaryThreePointCircleCenter.vector2 =
              selected.locationVector;
            // Glow the selected point and select it so the highlighter.ts doesn't unglow it with the mouseMoved method
            this.point2SEPoint.glowing = true;
            this.point2SEPoint.selected = true;
            this.point2LocationSelected = true;
            // trigger this so that three point center's location is set and
            //that will prevent a mouse release at the same location as point 2 from creating the three point center
            this.mouseMoved(event);
          } else {
            EventBus.fire("show-alert", {
              key: `handlers.threePointCircleRepeatPointSelected`,
              keyOptions: {},
              type: "info"
            });
          }
        }
      } else if (this.hitSESegments.length > 0) {
        // one of the points of the three point circle will be a point on a segment
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.point1LocationSelected) {
          this.point1SEPointOneDimensionalParent = this.hitSESegments[0];
          this.point1Vector.copy(
            this.point1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector1 = this.point1Vector;
          this.temporaryPoint1Marker.positionVector = this.point1Vector;
          this.point1SEPoint = null;
          this.point1LocationSelected = true;
        } else {
          this.point2SEPointOneDimensionalParent = this.hitSESegments[0];
          this.point2Vector.copy(
            this.point2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector2 = this.point2Vector;
          this.temporaryPoint2Marker.positionVector = this.point2Vector;
          this.point2SEPoint = null;
          this.point2LocationSelected = true;
          // trigger this so
          //that will prevent a mouse release at the same location as vector 2 from creating the three point circle center
          this.mouseMoved(event);
        }
      } else if (this.hitSELines.length > 0) {
        // one of the points of the three point circle will be a point on a line
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.point1LocationSelected) {
          this.point1SEPointOneDimensionalParent = this.hitSELines[0];
          this.point1Vector.copy(
            this.point1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector1 = this.point1Vector;
          this.temporaryPoint1Marker.positionVector = this.point1Vector;
          this.point1SEPoint = null;
          this.point1LocationSelected = true;
        } else {
          this.point2SEPointOneDimensionalParent = this.hitSELines[0];
          this.point2Vector.copy(
            this.point2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector2 = this.point2Vector;
          this.temporaryPoint2Marker.positionVector = this.point2Vector;
          this.point2SEPoint = null;
          this.point2LocationSelected = true;
          // trigger this so
          //that will prevent a mouse release at the same location as vector 2 from creating the three point circle center
          this.mouseMoved(event);
        }
      } else if (this.hitSECircles.length > 0) {
        // one of the points of the three point circle will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.point1LocationSelected) {
          this.point1SEPointOneDimensionalParent = this.hitSECircles[0];
          this.point1Vector.copy(
            this.point1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector1 = this.point1Vector;
          this.temporaryPoint1Marker.positionVector = this.point1Vector;
          this.point1SEPoint = null;
          this.point1LocationSelected = true;
        } else {
          this.point2SEPointOneDimensionalParent = this.hitSECircles[0];
          this.point2Vector.copy(
            this.point2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector2 = this.point2Vector;
          this.temporaryPoint2Marker.positionVector = this.point2Vector;
          this.point2SEPoint = null;
          this.point2LocationSelected = true;
          // trigger this so
          //that will prevent a mouse release at the same location as vector 2 from creating the three point circle center
          this.mouseMoved(event);
        }
      } else if (this.hitSEEllipses.length > 0) {
        // one of the points of the three point circle will be a point on a ellise
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.point1LocationSelected) {
          this.point1SEPointOneDimensionalParent = this.hitSEEllipses[0];
          this.point1Vector.copy(
            this.point1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector1 = this.point1Vector;
          this.temporaryPoint1Marker.positionVector = this.point1Vector;
          this.point1SEPoint = null;
          this.point1LocationSelected = true;
        } else {
          this.point2SEPointOneDimensionalParent = this.hitSEEllipses[0];
          this.point2Vector.copy(
            this.point2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector2 = this.point2Vector;
          this.temporaryPoint2Marker.positionVector = this.point2Vector;
          this.point2SEPoint = null;
          this.point2LocationSelected = true;
          // trigger this so
          //that will prevent a mouse release at the same location as vector 2 from creating the three point circle center
          this.mouseMoved(event);
        }
      } else if (this.hitSEParametrics.length > 0) {
        // one of the points of the three point circle will be a point on a parametric
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.point1LocationSelected) {
          this.point1SEPointOneDimensionalParent = this.hitSEParametrics[0];
          this.point1Vector.copy(
            this.point1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector1 = this.point1Vector;
          this.temporaryPoint1Marker.positionVector = this.point1Vector;
          this.point1SEPoint = null;
          this.point1LocationSelected = true;
        } else {
          this.point2SEPointOneDimensionalParent = this.hitSEParametrics[0];
          this.point2Vector.copy(
            this.point2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector2 = this.point2Vector;
          this.temporaryPoint2Marker.positionVector = this.point2Vector;
          this.point2SEPoint = null;
          this.point2LocationSelected = true;
          // trigger this so
          //that will prevent a mouse release at the same location as vector 2 from creating the three point circle center
          this.mouseMoved(event);
        }
      } else if (this.hitSEPolygons.length > 0) {
        // one of the points of the three point circle will be a point on a polygon
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.point1LocationSelected) {
          this.point1SEPointOneDimensionalParent = this.hitSEPolygons[0];
          this.point1Vector.copy(
            this.point1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector1 = this.point1Vector;
          this.temporaryPoint1Marker.positionVector = this.point1Vector;
          this.point1SEPoint = null;
          this.point1LocationSelected = true;
        } else {
          this.point2SEPointOneDimensionalParent = this.hitSEPolygons[0];
          this.point2Vector.copy(
            this.point2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryThreePointCircleCenter.vector2 = this.point2Vector;
          this.temporaryPoint2Marker.positionVector = this.point2Vector;
          this.point2SEPoint = null;
          this.point2LocationSelected = true;
          // trigger this so
          //that will prevent a mouse release at the same location as vector 2 from creating the three point circle center
          this.mouseMoved(event);
        }
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Eventually, we will create a new SEPoint and Point
        if (!this.point1LocationSelected) {
          // Set the first vector in the plottable object
          this.temporaryThreePointCircleCenter.vector1 =
            this.currentSphereVector;
          // Move the startMarker to the current mouse location
          this.temporaryPoint1Marker.positionVector = this.currentSphereVector;
          // Record the first vector so it can be past to the non-temporary three point circle center
          this.point1Vector.copy(this.currentSphereVector);
          // Set the first SEPoint to null so it can be created later
          this.point1SEPoint = null;
          this.point1LocationSelected = true;
          // console.log(
          //   "vector 1",
          //   this.point1Vector.x,
          //   this.point1Vector.y,
          //   this.point1Vector.z
          // );
        } else {
          // Set the second vector in the plottable object
          this.temporaryThreePointCircleCenter.vector2 =
            this.currentSphereVector;
          // Move the startMarker to the current mouse location
          this.temporaryPoint2Marker.positionVector = this.currentSphereVector;
          // Record the second vector so it can be past to the non-temporary three point circle center
          this.point2Vector.copy(this.currentSphereVector);
          // Set the second SEPoint to null so it can be created later
          this.point2SEPoint = null;
          this.point2LocationSelected = true;
          // trigger this so
          //that will prevent a mouse release at the same location as vector 2 from creating the three point circle center
          this.mouseMoved(event);
        }
      }
      if (this.point1LocationSelected && !this.point2LocationSelected) {
        this.temporaryPoint2Marker.positionVector = this.currentSphereVector;
        EventBus.fire("show-alert", {
          key: `handlers.threePointCircleFirstPointSelected`,
          keyOptions: {},
          type: "info"
        });
      } else {
        this.temporaryPoint3Marker.positionVector = this.currentSphereVector;
        EventBus.fire("show-alert", {
          key: `handlers.threePointCircleSecondPointSelected`,
          keyOptions: {},
          type: "info"
        });
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors, turn off the glow of un-selected objects
    super.mouseMoved(event);
    // Only object can be interacted with at a given time, so set the first point nearby to glowing
    // The user can create points on ellipses, circles, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    // Also set the snap objects
    let possiblyGlowing: SEPoint | SEOneOrTwoDimensional | null = null;
    if (this.hitSEPoints.length > 0) {
      possiblyGlowing = this.hitSEPoints[0];
    } else if (this.hitSESegments.length > 0) {
      possiblyGlowing = this.hitSESegments[0];
    } else if (this.hitSELines.length > 0) {
      possiblyGlowing = this.hitSELines[0];
    } else if (this.hitSECircles.length > 0) {
      possiblyGlowing = this.hitSECircles[0];
    } else if (this.hitSEEllipses.length > 0) {
      possiblyGlowing = this.hitSEEllipses[0];
    } else if (this.hitSEParametrics.length > 0) {
      possiblyGlowing = this.hitSEParametrics[0];
    } else if (this.hitSEPolygons.length > 0) {
      possiblyGlowing = this.hitSEPolygons[0];
    } else {
      this.snapTemporaryPointMarkerToOneDimensional = null;
      this.snapTemporaryPointMarkerToPoint = null;
    }

    if (possiblyGlowing !== null) {
      if (possiblyGlowing instanceof SEPoint) {
        if (!this.point1LocationSelected) {
          possiblyGlowing.glowing = true;
          this.snapTemporaryPointMarkerToOneDimensional = null;
          this.snapTemporaryPointMarkerToPoint = possiblyGlowing;
        } else if (
          !this.point2LocationSelected &&
          // disallow the second point to be equal to the first
          !this.tmpVector
            .subVectors(possiblyGlowing.locationVector, this.point1Vector)
            .isZero()
        ) {
          possiblyGlowing.glowing = true;
          this.snapTemporaryPointMarkerToOneDimensional = null;
          this.snapTemporaryPointMarkerToPoint = possiblyGlowing;
        } else if (
          // disallow the third point to be either of the first two
          !this.tmpVector
            .subVectors(possiblyGlowing.locationVector, this.point1Vector)
            .isZero() &&
          !this.tmpVector
            .subVectors(possiblyGlowing.locationVector, this.point2Vector)
            .isZero()
        ) {
          possiblyGlowing.glowing = true;
          this.snapTemporaryPointMarkerToOneDimensional = null;
          this.snapTemporaryPointMarkerToPoint = possiblyGlowing;
        }
      }
      // possiblyGlowing is a oneDimensional Object
      else {
        possiblyGlowing.glowing = true;
        this.snapTemporaryPointMarkerToOneDimensional = possiblyGlowing;
        this.snapTemporaryPointMarkerToPoint = null;
      }
    }
    // Make sure that the event is on the sphere
    if (this.isOnSphere) {
      if (!this.point1LocationSelected) {
        // If the temporary point1Marker has *not* been added to the scene do so now
        if (!this.temporaryPoint1MarkerAdded) {
          this.temporaryPoint1MarkerAdded = true;
          this.temporaryPoint1Marker.addToLayers(this.layers);
        }
        // Remove the temporary point1Marker if there is a nearby point which can glowing
        if (this.snapTemporaryPointMarkerToPoint !== null) {
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // glowing when the user select that location and then moves the mouse away - see line 128) we don't
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            this.snapTemporaryPointMarkerToPoint instanceof
              SEIntersectionPoint &&
            !this.snapTemporaryPointMarkerToPoint.isUserCreated
          ) {
            this.temporaryPoint1Marker.positionVector =
              this.snapTemporaryPointMarkerToPoint.locationVector;
          } else {
            this.temporaryPoint1Marker.removeFromLayers();
            this.temporaryPoint1MarkerAdded = false;
          }
        }
        // Set the location of the temporary point1Marker by snapping to appropriate object (if any)
        if (this.snapTemporaryPointMarkerToOneDimensional !== null) {
          this.temporaryPoint1Marker.positionVector =
            this.snapTemporaryPointMarkerToOneDimensional.closestVector(
              this.currentSphereVector
            );
        }
        // otherwise move the point1marker to the current sphere vector (again in the case that there is no point to glow at that location)
        else if (this.snapTemporaryPointMarkerToPoint == null) {
          this.temporaryPoint1Marker.positionVector = this.currentSphereVector;
        }
      } else if (!this.point2LocationSelected) {
        // If the temporary point2Marker has *not* been added to the scene do so now
        if (!this.temporaryPoint2MarkerAdded) {
          this.temporaryPoint2MarkerAdded = true;
          this.temporaryPoint2Marker.addToLayers(this.layers);
        }
        // Remove the temporary point2Marker if there is a nearby point which can glowing
        if (this.snapTemporaryPointMarkerToPoint !== null) {
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // glowing when the user select that location and then moves the mouse away - see line 128) we don't
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            this.snapTemporaryPointMarkerToPoint instanceof
              SEIntersectionPoint &&
            !this.snapTemporaryPointMarkerToPoint.isUserCreated
          ) {
            this.temporaryPoint2Marker.positionVector =
              this.snapTemporaryPointMarkerToPoint.locationVector;
          } else {
            this.temporaryPoint2Marker.removeFromLayers();
            this.temporaryPoint2MarkerAdded = false;
          }
        }
        // Set the location of the temporary point2Marker by snapping to appropriate object (if any)
        if (this.snapTemporaryPointMarkerToOneDimensional !== null) {
          this.temporaryPoint2Marker.positionVector =
            this.snapTemporaryPointMarkerToOneDimensional.closestVector(
              this.currentSphereVector
            );
        }
        // otherwise move the point2marker to the current sphere vector (again in the case that there is no point to glow at that location)
        else if (this.snapTemporaryPointMarkerToPoint == null) {
          this.temporaryPoint2Marker.positionVector = this.currentSphereVector;
        }
      } else {
        // If the temporary Point3Marker has *not* been added to the scene do so now
        if (!this.temporaryPoint3MarkerAdded) {
          this.temporaryPoint3MarkerAdded = true;
          this.temporaryPoint3Marker.addToLayers(this.layers);
        }
        // Remove the temporary Point3Marker if there is a nearby point which can glowing
        if (this.snapTemporaryPointMarkerToPoint !== null) {
          // Even if this temporary point marker is removed, set the location of the temporary marker so that the sum of angles to foci
          // can be found using this.temporaryPoint3Marker.positionVector
          this.temporaryPoint3Marker.positionVector =
            this.snapTemporaryPointMarkerToPoint.locationVector;
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // glowing when the user select that location and then moves the mouse away - see line 128) we don't
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            !(
              this.snapTemporaryPointMarkerToPoint instanceof
              SEIntersectionPoint
            ) ||
            this.snapTemporaryPointMarkerToPoint.isUserCreated
          ) {
            this.temporaryPoint3Marker.removeFromLayers();
            this.temporaryPoint3MarkerAdded = false;
          }
        }
        // Set the location of the temporary point 3 Marker by snapping to appropriate object (if any)
        if (this.snapTemporaryPointMarkerToOneDimensional !== null) {
          this.temporaryPoint3Marker.positionVector =
            this.snapTemporaryPointMarkerToOneDimensional.closestVector(
              this.currentSphereVector
            );
        }
        // otherwise move the Point3Marker to the current sphere vector (again in the case that there is no point to glow at that location)
        else if (this.snapTemporaryPointMarkerToPoint == null) {
          this.temporaryPoint3Marker.positionVector = this.currentSphereVector;
        }

        // If the temporary three point circle and center has *not* been added to the scene do so now (only once)
        if (!this.temporaryThreePointCircleAndCenterAdded) {
          this.temporaryThreePointCircleAndCenterAdded = true;
          this.temporaryThreePointCircle.addToLayers(this.layers);
          this.temporaryThreePointCircleCenter.addToLayers(this.layers);
        }
        // console.log(
        //   "temppoint3marker to vector2 ssss",
        //   this.tmpVector
        //     .subVectors(
        //       this.tmpVector1
        //         .copy(this.temporaryPoint3Marker.positionVector)
        //         .normalize(),
        //       this.point2Vector
        //     )
        //     .length()
        // );
        // console.log(
        //   "temppoint3marker to vector1 ssss",
        //   this.tmpVector
        //     .subVectors(
        //       this.tmpVector1
        //         .copy(this.temporaryPoint3Marker.positionVector)
        //         .normalize(),
        //       this.point1Vector
        //     )
        //     .length()
        // );
        //Remove the temporary three point circle (center and circle)from the scene if
        // the third point one of the two existing points on the three point circle
        if (
          // disallow the third point to be either of the first two
          this.tmpVector
            .subVectors(
              // The temporary point vector (this.temporaryPoint3Marker.positionVector) is on the *scaled* sphere and not the unit sphere
              this.tmpVector1
                .copy(this.temporaryPoint3Marker.positionVector)
                .normalize(),
              this.point1Vector
            )
            .isZero() ||
          this.tmpVector
            .subVectors(
              // The temporary point vector (this.temporaryPoint3Marker.positionVector) is on the *scaled* sphere and not the unit sphere
              this.tmpVector1
                .copy(this.temporaryPoint3Marker.positionVector)
                .normalize(),
              this.point2Vector
            )
            .isZero()
        ) {
          this.temporaryThreePointCircle.removeFromLayers();
          this.temporaryThreePointCircleCenter.removeFromLayers();
          this.temporaryThreePointCircleAndCenterAdded = false;
        } else {
          // Set the third vector of the temporary three point circle center (the first two vectors were set in MousePress)
          this.temporaryThreePointCircleCenter.vector3 =
            this.temporaryPoint3Marker.positionVector;
          // console.log(
          //   "vector 1aa",
          //   this.temporaryThreePointCircleCenter.vector1.x,
          //   this.temporaryThreePointCircleCenter.vector1.y,
          //   this.temporaryThreePointCircleCenter.vector1.z
          // );
          // console.log(
          //   "vector 2aa",
          //   this.temporaryThreePointCircleCenter.vector2.x,
          //   this.temporaryThreePointCircleCenter.vector2.y,
          //   this.temporaryThreePointCircleCenter.vector2.z
          // );
          // console.log(
          //   "vector 3aa",
          //   this.temporaryThreePointCircleCenter.vector3.x,
          //   this.temporaryThreePointCircleCenter.vector3.y,
          //   this.temporaryThreePointCircleCenter.vector3.z
          // );

          //update the display of the center so that the location vector of the center is computed
          this.temporaryThreePointCircleCenter.updateDisplay();
          // Set the center point and radius of the temporary three point circle
          this.temporaryThreePointCircle.centerVector =
            this.temporaryThreePointCircleCenter._locationVector;
          this.temporaryThreePointCircle.circleRadius =
            this.temporaryThreePointCircleCenter._locationVector.angleTo(
              this.temporaryPoint3Marker.positionVector
            );
          //update the display of the circle
          this.temporaryThreePointCircle.updateDisplay();
        }
      }
    }
    // Remove the temporary objects from the display, but do so in a way that doesn't undo any of the user's work to this point unless they leave the sphere canvas
    // Remove the temporary objects from the display.
    else {
      if (!this.point1LocationSelected) {
        this.temporaryPoint1Marker.removeFromLayers();
        this.temporaryPoint1MarkerAdded = false;
      } else if (!this.point2LocationSelected) {
        this.temporaryPoint2Marker.removeFromLayers();
        this.temporaryPoint2MarkerAdded = false;
      } else {
        this.temporaryPoint3Marker.removeFromLayers();
        this.temporaryPoint3MarkerAdded = false;
        this.temporaryThreePointCircleCenter.removeFromLayers();
        this.temporaryThreePointCircle.removeFromLayers();
        this.temporaryThreePointCircleAndCenterAdded = false;
      }
      this.snapTemporaryPointMarkerToOneDimensional = null;
      this.snapTemporaryPointMarkerToPoint = null;
    }
  }

  mouseReleased(event: MouseEvent): void {
    if (this.isOnSphere && this.point2LocationSelected) {
      // make sure the release point is not on the previous two vectors
      if (
        !this.tmpVector
          .subVectors(
            // The temporary point vector (this.temporaryPoint3Marker.positionVector) is on the *scaled* sphere and not the unit sphere
            this.tmpVector1
              .copy(this.temporaryPoint3Marker.positionVector)
              .normalize(),
            this.point1Vector
          )
          .isZero(SETTINGS.circle.minimumRadius) &&
        !this.tmpVector
          .subVectors(
            // The temporary point vector (this.temporaryPoint3Marker.positionVector) is on the *scaled* sphere and not the unit sphere
            this.tmpVector1
              .copy(this.temporaryPoint3Marker.positionVector)
              .normalize(),
            this.point2Vector
          )
          .isZero(SETTINGS.circle.minimumRadius)
      ) {
        if (!this.makeThreePointCircleAndCenter()) {
          EventBus.fire("show-alert", {
            key: `handlers.threePointCircleCreationAttemptDuplicate`,
            keyOptions: {},
            type: "error"
          });
        }
        // reset to get ready to make a new ellipse
        this.mouseLeave(event);
      } else {
        EventBus.fire("show-alert", {
          key: `handlers.threePointCircleRepeatPointSelected`,
          keyOptions: {},
          type: "info"
        });
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);

    // Remove the temporary objects from the scene and mark the temporary object
    //  not added to the scene clear snap objects
    this.temporaryThreePointCircleCenter.removeFromLayers();
    this.temporaryThreePointCircle.removeFromLayers();
    this.temporaryPoint1Marker.removeFromLayers();
    this.temporaryPoint2Marker.removeFromLayers();
    this.temporaryPoint3Marker.removeFromLayers();
    this.temporaryPoint1MarkerAdded = false;
    this.temporaryPoint2MarkerAdded = false;
    this.temporaryPoint3MarkerAdded = false;
    this.temporaryThreePointCircleAndCenterAdded = false;

    this.snapTemporaryPointMarkerToOneDimensional = null;
    this.snapTemporaryPointMarkerToPoint = null;

    // Clear old points and values to get ready for creating the next circle.
    if (this.point1SEPoint) {
      this.point1SEPoint.glowing = false;
      this.point1SEPoint.selected = false;
    }
    if (this.point2SEPoint) {
      this.point2SEPoint.glowing = false;
      this.point2SEPoint.selected = false;
    }
    this.point1SEPoint = null;
    this.point2SEPoint = null;
    this.point1LocationSelected = false;
    this.point2LocationSelected = false;

    this.point1SEPointOneDimensionalParent = null;
    this.point2SEPointOneDimensionalParent = null;

    this.point3SEPoint = null;

    // call an unglow all command
    ThreePointCircleHandler.store.unglowAllSENodules();
  }
  /**
   * Add a new three point circle if it hasn't already been added
   */
  makeThreePointCircleAndCenter(): boolean {
    // Create a command group to add the points defining the three point circle and the three point to the store
    // This way a single undo click will undo all (potentially five) operations.
    const threePointCircleCommandGroup = new CommandGroup();

    // Create (if necessary) and handle the first vector location
    if (this.point1SEPoint === null) {
      // vector 1 point landed on an open space
      // we have to create a new point and it to the group/store
      const newFirstPoint = new Point();
      // Set the display to the default values
      newFirstPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the size of the point to the current zoom magnification factor
      newFirstPoint.adjustSize();

      // Create the plottable label
      const newLabel = new Label();
      let newSELabel: SELabel | null = null;

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      if (this.point1SEPointOneDimensionalParent) {
        // Vector 1 mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newFirstPoint,
          this.point1SEPointOneDimensionalParent
        );

        newSELabel = new SELabel(newLabel, vtx);

        threePointCircleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.point1SEPointOneDimensionalParent,
            newSELabel
          )
        );
      } else {
        // vector 1 mouse press landed on an open space
        // Create the model object for the new point and link them
        vtx = new SEPoint(newFirstPoint);
        newSELabel = new SELabel(newLabel, vtx);
        threePointCircleCommandGroup.addCommand(
          new AddPointCommand(vtx, newSELabel)
        );
      }
      vtx.locationVector = this.point1Vector;
      // Set the initial label location
      this.tmpVector
        .copy(vtx.locationVector)
        .add(
          new Vector3(
            2 * SETTINGS.point.initialLabelOffset,
            SETTINGS.point.initialLabelOffset,
            0
          )
        )
        .normalize();
      newSELabel.locationVector = this.tmpVector;
      this.point1SEPoint = vtx;
    } else if (
      this.point1SEPoint instanceof SEIntersectionPoint &&
      !this.point1SEPoint.isUserCreated
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      threePointCircleCommandGroup.addCommand(
        new ConvertInterPtToUserCreatedCommand(this.point1SEPoint)
      );
    }

    // Create (if necessary) and handle the second vector location
    if (this.point2SEPoint === null) {
      // Vector 2 point landed on an open space
      // we have to create a new point and it to the group/store
      const newSecondPoint = new Point();
      // Set the display to the default values
      newSecondPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the size of the point to the current zoom magnification factor
      newSecondPoint.adjustSize();

      // Create the plottable label
      const newLabel = new Label();
      let newSELabel: SELabel | null = null;

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      if (this.point2SEPointOneDimensionalParent) {
        // Focus 1 mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newSecondPoint,
          this.point2SEPointOneDimensionalParent
        );

        newSELabel = new SELabel(newLabel, vtx);

        threePointCircleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.point2SEPointOneDimensionalParent,
            newSELabel
          )
        );
      } else {
        // vector 2 mouse press landed on an open space
        // Create the model object for the new point and link them
        vtx = new SEPoint(newSecondPoint);
        newSELabel = new SELabel(newLabel, vtx);
        threePointCircleCommandGroup.addCommand(
          new AddPointCommand(vtx, newSELabel)
        );
      }
      vtx.locationVector = this.point2Vector;
      // Set the initial label location
      this.tmpVector
        .copy(vtx.locationVector)
        .add(
          new Vector3(
            2 * SETTINGS.point.initialLabelOffset,
            SETTINGS.point.initialLabelOffset,
            0
          )
        )
        .normalize();
      newSELabel.locationVector = this.tmpVector;
      this.point2SEPoint = vtx;
    } else if (
      this.point2SEPoint instanceof SEIntersectionPoint &&
      !this.point2SEPoint.isUserCreated
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      threePointCircleCommandGroup.addCommand(
        new ConvertInterPtToUserCreatedCommand(this.point2SEPoint)
      );
    }

    // Create (if necessary) and handle the third vector release location
    // this.temporaryPoint3Marker.positionVector is the location of the third point and it is a valid location one because we already check that
    // the this.temporaryPoint3Marker.positionVector is not either of the previous two vectors.

    // Check to see if the release location is near any points
    if (this.hitSEPoints.length > 0) {
      this.point3SEPoint = this.hitSEPoints[0];

      if (
        this.point3SEPoint instanceof SEIntersectionPoint &&
        !this.point3SEPoint.isUserCreated
      ) {
        // Mark the intersection point as created, the display style is changed and the glowing style is set up
        threePointCircleCommandGroup.addCommand(
          new ConvertInterPtToUserCreatedCommand(this.point3SEPoint)
        );
      }
    } else {
      // We have to create a new Point for the third point/vector
      const newThirdPoint = new Point();
      // Set the display to the default values
      newThirdPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the size of the point to the current zoom magnification factor
      newThirdPoint.adjustSize();
      // Create the plottable label
      const newLabel = new Label();

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.hitSESegments.length > 0) {
        // The third point will be on a segment
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newThirdPoint,
          this.hitSESegments[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryPoint3Marker.positionVector;

        newSELabel = new SELabel(newLabel, vtx);

        threePointCircleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSESegments[0],
            newSELabel
          )
        );
      } else if (this.hitSELines.length > 0) {
        // The third point will be a point on a line
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newThirdPoint,
          this.hitSELines[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryPoint3Marker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        threePointCircleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSELines[0],
            newSELabel
          )
        );
      } else if (this.hitSECircles.length > 0) {
        // The third point will be a point on a circle
        vtx = new SEPointOnOneOrTwoDimensional(
          newThirdPoint,
          this.hitSECircles[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryPoint3Marker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        threePointCircleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSECircles[0],
            newSELabel
          )
        );
      } else if (this.hitSEEllipses.length > 0) {
        // The third point will be a point on a ellipse
        vtx = new SEPointOnOneOrTwoDimensional(
          newThirdPoint,
          this.hitSEEllipses[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryPoint3Marker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        threePointCircleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEEllipses[0],
            newSELabel
          )
        );
      } else if (this.hitSEParametrics.length > 0) {
        // The third point will be a point on a ellipse
        vtx = new SEPointOnOneOrTwoDimensional(
          newThirdPoint,
          this.hitSEParametrics[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryPoint3Marker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        threePointCircleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEParametrics[0],
            newSELabel
          )
        );
      } else if (this.hitSEPolygons.length > 0) {
        // The third point will be a point on a ellipse
        vtx = new SEPointOnOneOrTwoDimensional(
          newThirdPoint,
          this.hitSEPolygons[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryPoint3Marker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        threePointCircleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEPolygons[0],
            newSELabel
          )
        );
      } else {
        // The third point mouse release landed on an open space
        vtx = new SEPoint(newThirdPoint);
        // Set the Location
        vtx.locationVector = this.temporaryPoint3Marker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        threePointCircleCommandGroup.addCommand(
          new AddPointCommand(vtx, newSELabel)
        );
      }
      this.point3SEPoint = vtx;
      // Set the initial label location
      this.tmpVector
        .copy(vtx.locationVector)
        .add(
          new Vector3(
            2 * SETTINGS.point.initialLabelOffset,
            SETTINGS.point.initialLabelOffset,
            0
          )
        )
        .normalize();
      newSELabel.locationVector = this.tmpVector;
    }

    // check to make sure that this three point circle center doesn't already exist
    if (
      ThreePointCircleHandler.store.sePoints.some(pt =>
        this.tmpVector
          .subVectors(
            pt.locationVector,
            this.tmpVector1
              .copy(this.temporaryThreePointCircleCenter._locationVector)
              .normalize()
          )
          .isZero()
      )
    ) {
      return false;
    }

    // Clone the current three point circle center
    const newThreePointCircleCenter =
      this.temporaryThreePointCircleCenter.clone();
    // Set the display to the default values
    newThreePointCircleCenter.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the stroke width to the current zoom magnification factor
    newThreePointCircleCenter.adjustSize();
    newThreePointCircleCenter.updateDisplay();

    // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
    const newSEThreePointCircleCenter = new SEThreePointCircleCenter(
      newThreePointCircleCenter,
      this.point1SEPoint,
      this.point2SEPoint,
      this.point3SEPoint
    );
    // Create the plottable and model label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newSEThreePointCircleCenter);
    // Set the initial label location

    this.tmpVector
      .copy(newSEThreePointCircleCenter.locationVector)
      .add(new Vector3(0, SETTINGS.point.initialLabelOffset, 0))
      .normalize();
    newSELabel.locationVector = this.tmpVector;

    // Add this new point to the store
    threePointCircleCommandGroup.addCommand(
      new AddThreePointCircleCenterCommand(
        newSEThreePointCircleCenter,
        this.point1SEPoint,
        this.point2SEPoint,
        this.point3SEPoint,
        newSELabel
      )
    );
    newSEThreePointCircleCenter.update();

    // Clone the current three point circle
    // const newNonFreeCircle = this.temporaryThreePointCircle.clone();
    const newNonFreeCircle = new NonFreeCircle();
    newNonFreeCircle.centerVector = this.temporaryThreePointCircle.centerVector;
    newNonFreeCircle.circleRadius = this.temporaryThreePointCircle.circleRadius;

    // Set the display to the default values
    newNonFreeCircle.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the stroke width to the current zoom magnification factor
    newNonFreeCircle.adjustSize();
    newNonFreeCircle.updateDisplay();

    //Should I make a new SEThreePointCircle class? What would be different from SECircle? No
    const newSECircle = new SECircle(
      newNonFreeCircle,
      newSEThreePointCircleCenter,
      this.point1SEPoint
    );
    // Create the plottable and model label
    const newLabel1 = new Label();
    const newSELabel1 = new SELabel(newLabel1, newSECircle);
    // Set the initial label location
    this.tmpVector
      .copy(this.point1SEPoint.locationVector)
      .add(new Vector3(0, SETTINGS.circle.initialLabelOffset, 0))
      .normalize();
    newSELabel1.locationVector = this.tmpVector;

    threePointCircleCommandGroup.addCommand(
      new AddCircleCommand(
        newSECircle,
        newSEThreePointCircleCenter,
        this.point1SEPoint,
        newSELabel1
      )
    );

    // Generate new intersection points. These points must be computed and created
    // in the store. Add the new created points to the ellipse command so they can be undone.
    ThreePointCircleHandler.store
      .createAllIntersectionsWithCircle(newSECircle)
      .forEach((item: SEIntersectionReturnType) => {
        if (item.existingIntersectionPoint) {
          // check to see if this circle is already a parent of the existing intersection point, if not add it as a parent of the intersection point
          if (
            !item.SEIntersectionPoint.parents.some(
              parent => parent.name === newSECircle.name
            )
          ) {
            threePointCircleCommandGroup.addCommand(
              new AddIntersectionPointParent(
                item.SEIntersectionPoint,
                newSECircle
              )
            );
          }
        } else {
          // Create the plottable and model label
          const newLabel = new Label();
          const newSELabel = new SELabel(newLabel, item.SEIntersectionPoint);

          // Set the initial label location
          this.tmpVector
            .copy(item.SEIntersectionPoint.locationVector)
            .add(
              new Vector3(
                2 * SETTINGS.point.initialLabelOffset,
                SETTINGS.point.initialLabelOffset,
                0
              )
            )
            .normalize();
          newSELabel.locationVector = this.tmpVector;

          threePointCircleCommandGroup.addCommand(
            new AddIntersectionPointCommand(
              item.SEIntersectionPoint,
              item.parent1,
              item.parent2,
              newSELabel
            )
          );
          item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points or label
          newSELabel.showing = false;
        }
      });

    threePointCircleCommandGroup.execute();
    return true;
  }

  activate(): void {
    // If there are exactly three SEPoints selected, create a three point circle from them
    if (ThreePointCircleHandler.store.selectedSENodules.length == 3) {
      const object1 = ThreePointCircleHandler.store.selectedSENodules[0];
      const object2 = ThreePointCircleHandler.store.selectedSENodules[1];
      const object3 = ThreePointCircleHandler.store.selectedSENodules[2];
      if (
        object1 instanceof SEPoint &&
        object2 instanceof SEPoint &&
        object3 instanceof SEPoint &&
        !(
          tmpVector1
            .subVectors(object1.locationVector, object2.locationVector)
            .isZero() &&
          tmpVector2
            .subVectors(object1.locationVector, object3.locationVector)
            .isZero()
        ) // if the points all the same do nothing
      ) {
        const threePointCircleCommandGroup = new CommandGroup();
        // Clone the current three point circle center
        const newThreePointCircleCenter = new ThreePointCircleCenter();
        newThreePointCircleCenter.vector1 = object1.locationVector;
        newThreePointCircleCenter.vector2 = object2.locationVector;
        newThreePointCircleCenter.vector3 = object3.locationVector;
        // once the three vectors are set, update the display so that the location is computed
        newThreePointCircleCenter.updateDisplay();
        // Set the display to the default values
        newThreePointCircleCenter.stylize(DisplayStyle.ApplyCurrentVariables);
        // Adjust the stroke width to the current zoom magnification factor
        newThreePointCircleCenter.adjustSize();

        // check to make sure that this three point circle center doesn't already exist
        if (
          ThreePointCircleHandler.store.sePoints.some(pt =>
            this.tmpVector
              .subVectors(
                pt.locationVector,
                newThreePointCircleCenter._locationVector
              )
              .isZero()
          )
        ) {
          EventBus.fire("show-alert", {
            key: `handlers.threePointCircleCreationAttemptDuplicate`,
            keyOptions: {},
            type: "error"
          });
          return;
        }

        // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
        const newSEThreePointCircleCenter = new SEThreePointCircleCenter(
          newThreePointCircleCenter,
          object1,
          object2,
          object3
        );
        // Create the plottable and model label
        const newLabel = new Label();
        const newSELabel = new SELabel(newLabel, newSEThreePointCircleCenter);
        // Set the initial label location

        this.tmpVector
          .copy(newSEThreePointCircleCenter.locationVector)
          .add(new Vector3(0, SETTINGS.point.initialLabelOffset, 0))
          .normalize();
        newSELabel.locationVector = this.tmpVector;

        // Add this new point to the store
        threePointCircleCommandGroup.addCommand(
          new AddThreePointCircleCenterCommand(
            newSEThreePointCircleCenter,
            object1,
            object2,
            object3,
            newSELabel
          )
        );

        // a new  circle
        const newNonFreeCircle = new NonFreeCircle();

        // Set the display to the default values
        newNonFreeCircle.stylize(DisplayStyle.ApplyCurrentVariables);

        newNonFreeCircle.circleRadius =
          newThreePointCircleCenter._locationVector.angleTo(
            object1.locationVector
          );
        newNonFreeCircle.centerVector =
          newThreePointCircleCenter._locationVector;
        // Adjust the stroke width to the current zoom magnification factor
        newNonFreeCircle.adjustSize();
        newNonFreeCircle.updateDisplay();

        //Should I make a new SEThreePointCircle class? What would be different from SECircle? No
        const newSECircle = new SECircle(
          newNonFreeCircle,
          newSEThreePointCircleCenter,
          object1
        );
        // Create the plottable and model label
        const newLabel1 = new Label();
        const newSELabel1 = new SELabel(newLabel1, newSECircle);
        // Set the initial label location
        this.tmpVector
          .copy(object1.locationVector)
          .add(new Vector3(0, SETTINGS.circle.initialLabelOffset, 0))
          .normalize();
        newSELabel1.locationVector = this.tmpVector;

        threePointCircleCommandGroup.addCommand(
          new AddCircleCommand(
            newSECircle,
            newSEThreePointCircleCenter,
            object1,
            newSELabel1
          )
        );
        newSECircle.update();

        // Generate new intersection points. These points must be computed and created
        // in the store. Add the new created points to the ellipse command so they can be undone.
        ThreePointCircleHandler.store
          .createAllIntersectionsWithCircle(newSECircle)
          .forEach((item: SEIntersectionReturnType) => {
            if (item.existingIntersectionPoint) {
              // check to see if this circle is already a parent of the existing intersection point, if not add it as a parent of the intersection point
              if (
                !item.SEIntersectionPoint.parents.some(
                  parent => parent.name === newSECircle.name
                )
              ) {
                threePointCircleCommandGroup.addCommand(
                  new AddIntersectionPointParent(
                    item.SEIntersectionPoint,
                    newSECircle
                  )
                );
              }
            } else {
              // Create the plottable and model label
              const newLabel = new Label();
              const newSELabel = new SELabel(
                newLabel,
                item.SEIntersectionPoint
              );

              // Set the initial label location
              this.tmpVector
                .copy(item.SEIntersectionPoint.locationVector)
                .add(
                  new Vector3(
                    2 * SETTINGS.point.initialLabelOffset,
                    SETTINGS.point.initialLabelOffset,
                    0
                  )
                )
                .normalize();
              newSELabel.locationVector = this.tmpVector;

              threePointCircleCommandGroup.addCommand(
                new AddIntersectionPointCommand(
                  item.SEIntersectionPoint,
                  item.parent1,
                  item.parent2,
                  newSELabel
                )
              );
              item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points or label
              newSELabel.showing = false;
            }
          });

        threePointCircleCommandGroup.execute();
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
