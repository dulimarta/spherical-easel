/** @format */

import { Vector3, Matrix4 } from "three";
import Point from "@/plottables-spherical/Point";
import Ellipse from "@/plottables-spherical/Ellipse";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { AddPointCommand } from "@/commands-spherical/AddPointCommand";
import { SEPoint } from "@/models-spherical/SEPoint";
import SETTINGS from "@/global-settings-spherical";
import { SEIntersectionPoint } from "@/models-spherical/SEIntersectionPoint";
import Highlighter from "./Highlighter";
import { SEPointOnOneOrTwoDimensional } from "@/models-spherical/SEPointOnOneOrTwoDimensional";
import { AddIntersectionPointCommand } from "@/commands-spherical/AddIntersectionPointCommand";
import { AddPointOnOneDimensionalCommand } from "@/commands-spherical/AddPointOnOneOrTwoDimensionalCommand";
import { SEOneOrTwoDimensional, SEIntersectionReturnType } from "@/types";

import { SELabel } from "@/models-spherical/SELabel";
import EventBus from "./EventBus";
import { SEEllipse } from "@/models-spherical/SEEllipse";
import { AddEllipseCommand } from "@/commands-spherical/AddEllipseCommand";
//import Two from "two.js";
import { Group } from "two.js/src/group";
import { AddIntersectionPointOtherParentsInfo } from "@/commands-spherical/AddIntersectionPointOtherParentsInfo";
import { SEAntipodalPoint } from "@/models-spherical/SEAntipodalPoint";
import { SetPointUserCreatedValueCommand } from "@/commands-spherical/SetPointUserCreatedValueCommand";
const tmpVector = new Vector3();

export default class EllipseHandler extends Highlighter {
  /**
   * foci vectors of the created ellipse
   */
  private focus1Vector: Vector3;
  private focus2Vector: Vector3;

  /**  The temporary plottable TwoJS Ellipse displayed as the user moves the mouse or drags after selection two points */
  private temporaryEllipse: Ellipse;
  /**  The model object points that are the foci of the ellipse (if any) */
  private focus1SEPoint: SEPoint | null = null;
  private focus2SEPoint: SEPoint | null = null;
  /** The model object point that is a point on the ellipse (if any) */
  private ellipseSEPoint: SEPoint | null = null;
  /** The possible parent of the foci(1|2)SEPoint*/
  private focus1SEPointOneDimensionalParent: SEOneOrTwoDimensional | null =
    null;
  private focus2SEPointOneDimensionalParent: SEOneOrTwoDimensional | null =
    null;

  /** Depending on where the user is in selecting the point, we know what to temporary objects to add to the scene */
  private focus1LocationSelected = false;
  private focus2LocationSelected = false;

  /** The a and b (semi major and semi minor axes length) values of the temporary ellipse (along the surface of the sphere) */
  private a = 0;
  private b = 0;
  /**
   * A temporary plottable (TwoJS) points created while the user is making the ellipse. These can't be the same because the user
   * might select two new points (leaving the Focus Markers behind) and then the ellipse Point maker is displayed at the currentLocation
   */
  protected temporaryFocus1Marker: Point;
  protected temporaryFocus2Marker: Point;
  protected temporaryEllipsePointMarker: Point;

  /* temporary vector and matrix to help with computations */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpMatrix = new Matrix4();

  /** Has the temporary ellipse/tempfoci(1|2)Marker/tempEllipsePointMarker been added to the scene?*/
  private temporaryEllipseAdded = false;
  private temporaryFocus1MarkerAdded = false;
  private temporaryFocus2MarkerAdded = false;
  private temporaryEllipsePointMarkerAdded = false;

  /**
   * As the user moves the pointer around snap the temporary marker to these objects temporarily
   */
  protected snapTemporaryPointMarkerToOneDimensional: SEOneOrTwoDimensional | null =
    null;
  protected snapTemporaryPointMarkerToPoint: SEPoint | null = null;

  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: SEPoint[] = [];

  constructor(layers: Group[]) {
    super(layers);
    this.focus1Vector = new Vector3();
    this.focus2Vector = new Vector3();
    this.temporaryEllipse = new Ellipse();
    // Set the style using the temporary defaults
    EllipseHandler.store.addTemporaryNodule(this.temporaryEllipse);
    // Create and style the temporary points marking the start/end of an object being created
    this.temporaryFocus1Marker = new Point();
    EllipseHandler.store.addTemporaryNodule(this.temporaryFocus1Marker);

    this.temporaryFocus2Marker = new Point();
    EllipseHandler.store.addTemporaryNodule(this.temporaryFocus2Marker);

    this.temporaryEllipsePointMarker = new Point();
    EllipseHandler.store.addTemporaryNodule(this.temporaryEllipsePointMarker);
  }

  mousePressed(event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    //super.mouseMoved(event);
    // First decide if the location of the event is on the sphere
    this.updateFilteredPointsList();
    if (this.isOnSphere && !this.focus2LocationSelected) {
      // Check to see if the current location is near any points
      if (this.filteredIntersectionPointsList.length > 0) {
        // Pick the top most selected point
        const selected = this.filteredIntersectionPointsList[0];
        if (!this.focus1LocationSelected) {
          // Record the foci1 vector of the ellipse so it can be past to the non-temporary ellipse
          this.focus1Vector.copy(selected.locationVector);
          // Record the model object as the center of the ellipse
          this.focus1SEPoint = selected;
          // Move the startMarker to the current selected point
          this.temporaryFocus1Marker.positionVectorAndDisplay =
            selected.locationVector;
          // Set the focus 1 of the ellipse in the plottable object
          this.temporaryEllipse.focus1Vector = selected.locationVector;
          // Glow the selected point and select it so the highlighter.ts doesn't unglow it with the mouseMoved method
          this.focus1SEPoint.glowing = true;
          this.focus1SEPoint.selected = true;
          this.focus1LocationSelected = true;
        } else {
          // disallow a second focus that is antipodal or equal to the first
          if (
            !this.tmpVector
              .crossVectors(selected.locationVector, this.focus1Vector)
              .isZero(SETTINGS.nearlyAntipodalIdeal)
          ) {
            // Record the foci2 vector of the ellipse so it can be past to the non-temporary ellipse
            this.focus2Vector.copy(selected.locationVector);
            // Record the model object as the center of the ellipse
            this.focus2SEPoint = selected;
            // Move the startMarker to the current selected point
            this.temporaryFocus2Marker.positionVectorAndDisplay =
              selected.locationVector;
            // Set the focus 2 of the ellipse in the plottable object
            this.temporaryEllipse.focus2Vector = selected.locationVector;
            // Glow the selected point and select it so the highlighter.ts doesn't unglow it with the mouseMoved method
            this.focus2SEPoint.glowing = true;
            this.focus2SEPoint.selected = true;
            this.focus2LocationSelected = true;
            // trigger this so that temporaryEllipsePoint's location is set and
            //that will prevent a mouse release at the same location as focus 2 from creating the ellipse
            this.mouseMoved(event);
          } else {
            EventBus.fire("show-alert", {
              key: `ellipseAntipodalSelected`,
              keyOptions: {},
              type: "info"
            });
          }
        }
      } else if (this.hitSESegments.length > 0) {
        // one of the foci of the ellipse will be a point on a segment
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.focus1LocationSelected) {
          this.focus1SEPointOneDimensionalParent = this.hitSESegments[0];
          this.focus1Vector.copy(
            this.focus1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus1Vector = this.focus1Vector;
          this.temporaryFocus1Marker.positionVectorAndDisplay =
            this.focus1Vector;
          this.focus1SEPoint = null;
          this.focus1LocationSelected = true;
        } else {
          this.focus2SEPointOneDimensionalParent = this.hitSESegments[0];
          this.focus2Vector.copy(
            this.focus2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus2Vector = this.focus2Vector;
          this.temporaryFocus2Marker.positionVectorAndDisplay =
            this.focus2Vector;
          this.focus2SEPoint = null;
          this.focus2LocationSelected = true;
          // trigger this so that temporaryEllipsePoint's location is set and
          //that will prevent a mouse release at the same location as focus 2 from creating the ellipse
          this.mouseMoved(event);
        }
      } else if (this.hitSELines.length > 0) {
        // one of the foci of the ellipse will be a point on a line
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.focus1LocationSelected) {
          this.focus1SEPointOneDimensionalParent = this.hitSELines[0];
          this.focus1Vector.copy(
            this.focus1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus1Vector = this.focus1Vector;
          this.temporaryFocus1Marker.positionVectorAndDisplay =
            this.focus1Vector;
          this.focus1SEPoint = null;
          this.focus1LocationSelected = true;
        } else {
          this.focus2SEPointOneDimensionalParent = this.hitSELines[0];
          this.focus2Vector.copy(
            this.focus2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus2Vector = this.focus2Vector;
          this.temporaryFocus2Marker.positionVectorAndDisplay =
            this.focus2Vector;
          this.focus2SEPoint = null;
          this.focus2LocationSelected = true;
          // trigger this so that temporaryEllipsePoint's location is set and
          //that will prevent a mouse release at the same location as focus 2 from creating the ellipse
          this.mouseMoved(event);
        }
      } else if (this.hitSECircles.length > 0) {
        // One of the foci of the ellipse will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.focus1LocationSelected) {
          this.focus1SEPointOneDimensionalParent = this.hitSECircles[0];
          this.focus1Vector.copy(
            this.focus1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus1Vector = this.focus1Vector;
          this.temporaryFocus1Marker.positionVectorAndDisplay =
            this.focus1Vector;
          this.focus1SEPoint = null;
          this.focus1LocationSelected = true;
        } else {
          this.focus2SEPointOneDimensionalParent = this.hitSECircles[0];
          this.focus2Vector.copy(
            this.focus2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus2Vector = this.focus2Vector;
          this.temporaryFocus2Marker.positionVectorAndDisplay =
            this.focus2Vector;
          this.focus2SEPoint = null;
          this.focus2LocationSelected = true;
          // trigger this so that temporaryEllipsePoint's location is set and
          //that will prevent a mouse release at the same location as focus 2 from creating the ellipse
          this.mouseMoved(event);
        }
      } else if (this.hitSEEllipses.length > 0) {
        // One of the foci of the ellipse will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.focus1LocationSelected) {
          this.focus1SEPointOneDimensionalParent = this.hitSEEllipses[0];
          this.focus1Vector.copy(
            this.focus1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus1Vector = this.focus1Vector;
          this.temporaryFocus1Marker.positionVectorAndDisplay =
            this.focus1Vector;
          this.focus1SEPoint = null;
          this.focus1LocationSelected = true;
        } else {
          this.focus2SEPointOneDimensionalParent = this.hitSEEllipses[0];
          this.focus2Vector.copy(
            this.focus2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus2Vector = this.focus2Vector;
          this.temporaryFocus2Marker.positionVectorAndDisplay =
            this.focus2Vector;
          this.focus2SEPoint = null;
          this.focus2LocationSelected = true;
          // trigger this so that temporaryEllipsePoint's location is set and
          //that will prevent a mouse release at the same location as focus 2 from creating the ellipse
          this.mouseMoved(event);
        }
      } else if (this.hitSEParametrics.length > 0) {
        // One of the foci of the ellipse will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.focus1LocationSelected) {
          this.focus1SEPointOneDimensionalParent = this.hitSEParametrics[0];
          this.focus1Vector.copy(
            this.focus1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus1Vector = this.focus1Vector;
          this.temporaryFocus1Marker.positionVectorAndDisplay =
            this.focus1Vector;
          this.focus1SEPoint = null;
          this.focus1LocationSelected = true;
        } else {
          this.focus2SEPointOneDimensionalParent = this.hitSEParametrics[0];
          this.focus2Vector.copy(
            this.focus2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus2Vector = this.focus2Vector;
          this.temporaryFocus2Marker.positionVectorAndDisplay =
            this.focus2Vector;
          this.focus2SEPoint = null;
          this.focus2LocationSelected = true;
          // trigger this so that temporaryEllipsePoint's location is set and
          //that will prevent a mouse release at the same location as focus 2 from creating the ellipse
          this.mouseMoved(event);
        }
      } else if (this.hitSEPolygons.length > 0) {
        // One of the foci of the ellipse will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        if (!this.focus1LocationSelected) {
          this.focus1SEPointOneDimensionalParent = this.hitSEPolygons[0];
          this.focus1Vector.copy(
            this.focus1SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus1Vector = this.focus1Vector;
          this.temporaryFocus1Marker.positionVectorAndDisplay =
            this.focus1Vector;
          this.focus1SEPoint = null;
          this.focus1LocationSelected = true;
        } else {
          this.focus2SEPointOneDimensionalParent = this.hitSEPolygons[0];
          this.focus2Vector.copy(
            this.focus2SEPointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryEllipse.focus2Vector = this.focus2Vector;
          this.temporaryFocus2Marker.positionVectorAndDisplay =
            this.focus2Vector;
          this.focus2SEPoint = null;
          this.focus2LocationSelected = true;
          // trigger this so that temporaryEllipsePoint's location is set and
          //that will prevent a mouse release at the same location as focus 2 from creating the ellipse
          this.mouseMoved(event);
        }
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Eventually, we will create a new SEPoint and Point
        if (!this.focus1LocationSelected) {
          // Set the center of the ellipse in the plottable object
          this.temporaryEllipse.focus1Vector = this.currentSphereVector;
          // Move the startMarker to the current mouse location
          this.temporaryFocus1Marker.positionVectorAndDisplay =
            this.currentSphereVector;
          // Record the center vector of the circle so it can be past to the non-temporary circle
          this.focus1Vector.copy(this.currentSphereVector);
          // Set the center of the circle to null so it can be created later
          this.focus1SEPoint = null;
          this.focus1LocationSelected = true;
        } else {
          // Set the center of the ellipse in the plottable object
          this.temporaryEllipse.focus2Vector = this.currentSphereVector;
          // Move the startMarker to the current mouse location
          this.temporaryFocus2Marker.positionVectorAndDisplay =
            this.currentSphereVector;
          // Record the center vector of the circle so it can be past to the non-temporary circle
          this.focus2Vector.copy(this.currentSphereVector);
          // Set the center of the circle to null so it can be created later
          this.focus2SEPoint = null;
          this.focus2LocationSelected = true;
          // trigger this so that temporaryEllipsePoint's location is set and
          //that will prevent a mouse release at the same location as focus 2 from creating the ellipse
          this.mouseMoved(event);
        }
      }
      if (this.focus1LocationSelected && !this.focus2LocationSelected) {
        this.temporaryFocus2Marker.positionVectorAndDisplay =
          this.currentSphereVector;
        EventBus.fire("show-alert", {
          key: `ellipseFocus1Selected`,
          keyOptions: {},
          type: "info"
        });
      } else {
        this.temporaryEllipsePointMarker.positionVectorAndDisplay =
          this.currentSphereVector;
        EventBus.fire("show-alert", {
          key: `ellipseFocus2Selected`,
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
    this.updateFilteredPointsList();
    let possiblyGlowing: SEPoint | SEOneOrTwoDimensional | null = null;
    if (this.filteredIntersectionPointsList.length > 0) {
      possiblyGlowing = this.filteredIntersectionPointsList[0];
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
        if (!this.focus1LocationSelected) {
          possiblyGlowing.glowing = true;
          this.snapTemporaryPointMarkerToOneDimensional = null;
          this.snapTemporaryPointMarkerToPoint = possiblyGlowing;
        } else if (
          !this.focus2LocationSelected &&
          // disallow the second focus to be equal to or antipodal to the first
          !this.tmpVector
            .crossVectors(possiblyGlowing.locationVector, this.focus1Vector)
            .isZero(SETTINGS.nearlyAntipodalIdeal)
        ) {
          possiblyGlowing.glowing = true;
          this.snapTemporaryPointMarkerToOneDimensional = null;
          this.snapTemporaryPointMarkerToPoint = possiblyGlowing;
        } else if (
          // disallow the ellipse point to be on the line segment connecting the foci or the antipodes of the foci
          possiblyGlowing.locationVector.angleTo(this.focus1Vector) +
            possiblyGlowing.locationVector.angleTo(this.focus2Vector) -
            this.focus1Vector.angleTo(this.focus2Vector) >
            SETTINGS.ellipse.minimumAngleSumDifference &&
          possiblyGlowing.locationVector.angleTo(this.focus1Vector) +
            possiblyGlowing.locationVector.angleTo(this.focus2Vector) <
            2 * Math.PI -
              this.focus1Vector.angleTo(this.focus2Vector) -
              SETTINGS.ellipse.minimumAngleSumDifference
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
      if (!this.focus1LocationSelected) {
        // If the temporary focus1Marker has *not* been added to the scene do so now
        if (!this.temporaryFocus1MarkerAdded) {
          this.temporaryFocus1MarkerAdded = true;
          this.temporaryFocus1Marker.addToLayers(this.layers);
        }
        // Remove the temporary focus1Marker if there is a nearby point which can glowing
        if (this.snapTemporaryPointMarkerToPoint !== null) {
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // glowing when the user select that location and then moves the mouse away - see line 128) we don't
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            this.snapTemporaryPointMarkerToPoint instanceof
              SEIntersectionPoint &&
            !this.snapTemporaryPointMarkerToPoint.isUserCreated
          ) {
            this.temporaryFocus1Marker.positionVectorAndDisplay =
              this.snapTemporaryPointMarkerToPoint.locationVector;
          } else {
            this.temporaryFocus1Marker.removeFromLayers();
            this.temporaryFocus1MarkerAdded = false;
          }
        }
        // Set the location of the temporary focus1Marker by snapping to appropriate object (if any)
        if (this.snapTemporaryPointMarkerToOneDimensional !== null) {
          this.temporaryFocus1Marker.positionVectorAndDisplay =
            this.snapTemporaryPointMarkerToOneDimensional.closestVector(
              this.currentSphereVector
            );
          // console.debug(
          //   `snap object ${
          //     this.snapTemporaryPointMarkerToOneDimensional.name
          //   } location ${this.temporaryFocus1Marker.positionVector.toFixed(
          //     2
          //   )} from ${this.currentSphereVector.toFixed(2)}`
          // );
        }
        // otherwise move the focus1marker to the current sphere vector (again in the case that there is no point to glow at that location)
        else if (this.snapTemporaryPointMarkerToPoint == null) {
          this.temporaryFocus1Marker.positionVectorAndDisplay =
            this.currentSphereVector;
        }
      } else if (!this.focus2LocationSelected) {
        // If the temporary focus2Marker has *not* been added to the scene do so now
        if (!this.temporaryFocus2MarkerAdded) {
          this.temporaryFocus2MarkerAdded = true;
          this.temporaryFocus2Marker.addToLayers(this.layers);
        }
        // Remove the temporary focus2Marker if there is a nearby point which can glowing
        if (this.snapTemporaryPointMarkerToPoint !== null) {
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // glowing when the user select that location and then moves the mouse away - see line 128) we don't
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            this.snapTemporaryPointMarkerToPoint instanceof
              SEIntersectionPoint &&
            !this.snapTemporaryPointMarkerToPoint.isUserCreated
          ) {
            this.temporaryFocus2Marker.positionVectorAndDisplay =
              this.snapTemporaryPointMarkerToPoint.locationVector;
          } else {
            this.temporaryFocus2Marker.removeFromLayers();
            this.temporaryFocus2MarkerAdded = false;
          }
        }
        // Set the location of the temporary focus2Marker by snapping to appropriate object (if any)
        if (this.snapTemporaryPointMarkerToOneDimensional !== null) {
          this.temporaryFocus2Marker.positionVectorAndDisplay =
            this.snapTemporaryPointMarkerToOneDimensional.closestVector(
              this.currentSphereVector
            );
        }
        // otherwise move the focus2marker to the current sphere vector (again in the case that there is no point to glow at that location)
        else if (this.snapTemporaryPointMarkerToPoint == null) {
          this.temporaryFocus2Marker.positionVectorAndDisplay =
            this.currentSphereVector;
        }
      } else {
        // If the temporary EllipsePointMarker has *not* been added to the scene do so now
        if (!this.temporaryEllipsePointMarkerAdded) {
          this.temporaryEllipsePointMarkerAdded = true;
          this.temporaryEllipsePointMarker.addToLayers(this.layers);
        }
        // Remove the temporary EllipsePointMarker if there is a nearby point which can glowing
        if (this.snapTemporaryPointMarkerToPoint !== null) {
          // Even if this temporary point marker is removed, set the location of the temporary marker so that the sum of angles to foci
          // can be found using this.temporaryEllipsePointMarker.positionVector
          this.temporaryEllipsePointMarker.positionVectorAndDisplay =
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
            this.temporaryEllipsePointMarker.removeFromLayers();
            this.temporaryEllipsePointMarkerAdded = false;
          }
        }
        // Set the location of the temporary ellipse point Marker by snapping to appropriate object (if any)
        if (this.snapTemporaryPointMarkerToOneDimensional !== null) {
          this.temporaryEllipsePointMarker.positionVectorAndDisplay =
            this.snapTemporaryPointMarkerToOneDimensional.closestVector(
              this.currentSphereVector
            );
        }
        // otherwise move the EllipsePointMarker to the current sphere vector (again in the case that there is no point to glow at that location)
        else if (this.snapTemporaryPointMarkerToPoint == null) {
          this.temporaryEllipsePointMarker.positionVectorAndDisplay =
            this.currentSphereVector;
        }

        // If the temporary ellipse has *not* been added to the scene do so now (only once)
        if (!this.temporaryEllipseAdded) {
          this.temporaryEllipseAdded = true;
          this.temporaryEllipse.addToLayers(this.layers);
        }
        //compute the a and b values of the temporary ellipse
        this.a =
          0.5 *
          (this.temporaryEllipse.focus1Vector.angleTo(
            this.temporaryEllipsePointMarker.positionVector
          ) +
            this.temporaryEllipse.focus2Vector.angleTo(
              this.temporaryEllipsePointMarker.positionVector
            ));

        this.b = Math.acos(
          Math.cos(this.a) /
            Math.cos(
              this.temporaryEllipse.focus1Vector.angleTo(
                this.temporaryEllipse.focus2Vector
              ) / 2
            )
        );

        //Remove the temporary ellipse from the scene if
        // the ellipse point is on the line segment connecting the foci or the line segment connecting the antipodes of the foci
        if (
          2 * this.a - this.focus1Vector.angleTo(this.focus2Vector) <
            SETTINGS.ellipse.minimumAngleSumDifference ||
          2 * this.a >
            2 * Math.PI -
              this.focus1Vector.angleTo(this.focus2Vector) -
              SETTINGS.ellipse.minimumAngleSumDifference
        ) {
          this.temporaryEllipse.removeFromLayers();
          this.temporaryEllipseAdded = false;
        } else {
          // Set the a, b values of the temporary ellipse (the focus vectors were set in MousePress)
          this.temporaryEllipse.a = this.a;
          this.temporaryEllipse.b = this.b;
          //update the display
          this.temporaryEllipse.updateDisplay();
        }
      }
    }
    // Remove the temporary objects from the display, but do so in a way that doesn't undo any of the user's work to this point
    // Remove the temporary objects from the display.
    else {
      if (!this.focus1LocationSelected) {
        this.temporaryFocus1Marker.removeFromLayers();
        this.temporaryFocus1MarkerAdded = false;
      } else if (!this.focus2LocationSelected) {
        this.temporaryFocus2Marker.removeFromLayers();
        this.temporaryFocus2MarkerAdded = false;
      } else {
        this.temporaryEllipsePointMarker.removeFromLayers();
        this.temporaryEllipsePointMarkerAdded = false;
        this.temporaryEllipse.removeFromLayers();
        this.temporaryEllipseAdded = false;
      }
      this.snapTemporaryPointMarkerToOneDimensional = null;
      this.snapTemporaryPointMarkerToPoint = null;
    }
  }

  mouseReleased(event: MouseEvent): void {
    this.updateFilteredPointsList();
    if (this.isOnSphere && this.focus2LocationSelected) {
      if (
        this.currentSphereVector.angleTo(this.focus1Vector) >
          SETTINGS.ellipse.minimumCreationDistance && // There is a problem if you mouse press for focus2 location and then move *just* a bit and mouse release, the ellipse doesn't pass through the ellipse point, this helps prevent that
        this.currentSphereVector.angleTo(this.focus2Vector) >
          SETTINGS.ellipse.minimumCreationDistance
      ) {
        const angleSumToEllipsePoint =
          this.temporaryEllipse.focus1Vector.angleTo(
            this.temporaryEllipsePointMarker.positionVector
          ) +
          this.temporaryEllipse.focus2Vector.angleTo(
            this.temporaryEllipsePointMarker.positionVector
          );

        //Do not create an ellipse if the ellipse point on the line segment connecting the foci or the line segment connecting the antipodes of the foci
        if (
          angleSumToEllipsePoint -
            this.focus1Vector.angleTo(this.focus2Vector) >
            SETTINGS.ellipse.minimumAngleSumDifference &&
          angleSumToEllipsePoint <
            2 * Math.PI -
              this.focus1Vector.angleTo(this.focus2Vector) -
              SETTINGS.ellipse.minimumAngleSumDifference
        ) {
          if (!this.makeEllipse()) {
            EventBus.fire("show-alert", {
              key: `ellipseCreationAttemptDuplicate`,
              keyOptions: {},
              type: "error"
            });
          }
          // reset to get ready to make a new ellipse
          this.mouseLeave(event);
        }
      } else {
        EventBus.fire("show-alert", {
          key: `ellipseInitiallyToSmall`,
          keyOptions: {},
          type: "info"
        });
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.prepareForNextEllipse();
  }

  prepareForNextEllipse(): void {
    // Remove the temporary objects from the scene and mark the temporary object
    //  not added to the scene clear snap objects
    this.temporaryEllipse.removeFromLayers();
    this.temporaryFocus1Marker.removeFromLayers();
    this.temporaryFocus2Marker.removeFromLayers();
    this.temporaryEllipsePointMarker.removeFromLayers();
    this.temporaryFocus1MarkerAdded = false;
    this.temporaryFocus2MarkerAdded = false;
    this.temporaryEllipsePointMarkerAdded = false;
    this.temporaryEllipseAdded = false;

    this.snapTemporaryPointMarkerToOneDimensional = null;
    this.snapTemporaryPointMarkerToPoint = null;

    // Clear old points and values to get ready for creating the next circle.
    if (this.focus1SEPoint) {
      this.focus1SEPoint.glowing = false;
      this.focus1SEPoint.selected = false;
    }
    if (this.focus2SEPoint) {
      this.focus2SEPoint.glowing = false;
      this.focus2SEPoint.selected = false;
    }
    this.focus1SEPoint = null;
    this.focus2SEPoint = null;
    this.focus1LocationSelected = false;
    this.focus2LocationSelected = false;

    this.focus1SEPointOneDimensionalParent = null;
    this.focus2SEPointOneDimensionalParent = null;

    this.ellipseSEPoint = null;

    // call an unglow all command
    EllipseHandler.store.unglowAllSENodules();
  }
  /**
   * Add a new circle the user has moved the mouse far enough (but not a radius of PI)
   */
  makeEllipse(fromActivate = false): boolean {
    // Create a command group to add the points defining the ellipse and the ellipse to the store
    // This way a single undo click will undo all (potentially three) operations.
    const ellipseCommandGroup = new CommandGroup();
    const newlyCreatedSEPoints: SEPoint[] = [];

    // Create (if necessary) and handle the first focus location
    if (this.focus1SEPoint === null) {
      // Focus 1 point landed on an open space
      // we have to create a new point and it to the group/store

      let newSELabel: SELabel | null = null;

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      if (this.focus1SEPointOneDimensionalParent) {
        // Focus 1 mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          this.focus1SEPointOneDimensionalParent
        );

        newSELabel = new SELabel("point", vtx);

        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.focus1SEPointOneDimensionalParent,
            newSELabel
          )
        );
      } else {
        // Focus 1 mouse press landed on an open space
        // Create the model object for the new point and link them
        vtx = new SEPoint();
        newSELabel = new SELabel("point", vtx);
        ellipseCommandGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      vtx.locationVector = this.focus1Vector;

      /////////////
      // Create the antipode of the new point, vtx
      const antipode = EllipseHandler.addCreateAntipodeCommand(
        vtx,
        ellipseCommandGroup
      );
      newlyCreatedSEPoints.push(antipode, vtx);
      ///////////

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
      this.focus1SEPoint = vtx;
    } else if (
      (this.focus1SEPoint instanceof SEIntersectionPoint ||
        this.focus1SEPoint instanceof SEAntipodalPoint) &&
      !this.focus1SEPoint.isUserCreated
    ) {
      // Mark the intersection/antipodal point as created, the display style is changed and the glowing style is set up
      ellipseCommandGroup.addCommand(
        new SetPointUserCreatedValueCommand(this.focus1SEPoint, true)
      );
    }

    // Create (if necessary) and handle the second focus location
    if (this.focus2SEPoint === null) {
      // Focus 1 point landed on an open space
      // we have to create a new point and it to the group/store

      let newSELabel: SELabel | null = null;

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      if (this.focus2SEPointOneDimensionalParent) {
        // Focus 1 mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          this.focus2SEPointOneDimensionalParent
        );

        newSELabel = new SELabel("point", vtx);

        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.focus2SEPointOneDimensionalParent,
            newSELabel
          )
        );
      } else {
        // Focus 1 mouse press landed on an open space
        // Create the model object for the new point and link them
        vtx = new SEPoint();
        newSELabel = new SELabel("point", vtx);
        ellipseCommandGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      vtx.locationVector = this.focus2Vector;

      /////////////
      // Create the antipode of the new point, vtx
      const antipode = EllipseHandler.addCreateAntipodeCommand(
        vtx,
        ellipseCommandGroup
      );
      newlyCreatedSEPoints.push(antipode, vtx);
      ///////////

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
      this.focus2SEPoint = vtx;
    } else if (
      (this.focus2SEPoint instanceof SEIntersectionPoint ||
        this.focus2SEPoint instanceof SEAntipodalPoint) &&
      !this.focus2SEPoint.isUserCreated
    ) {
      // Mark the intersection/antipodal point as created, the display style is changed and the glowing style is set up
      ellipseCommandGroup.addCommand(
        new SetPointUserCreatedValueCommand(this.focus2SEPoint, true)
      );
    }

    // Create (if necessary) and handle the ellipse point release location
    // this.temporaryEllipsePointMarker.positionVector is the location of the ellipse point and it is a good one because we already check that that
    // the this.temporaryEllipsePointMarker.positionVector is not antipodal to the center of the ellipse and is not on the segment connecting
    // the foci.

    // Check to see if the release location is near any points
    if (this.filteredIntersectionPointsList.length > 0 && !fromActivate) {
      this.ellipseSEPoint = this.filteredIntersectionPointsList[0];
      // We shouldn't need this because this has already happened in mouse move
      // //compute the radius of the temporary circle using the hit point
      // this.a = this.temporaryEllipse.centerVector.angleTo(
      //   this.ellipseSEPoint.locationVector
      // );
      // // Set the radius of the temporary circle, the center was set in Mouse Press
      // this.temporaryEllipse.circleRadius = this.a;
      // //update the display
      // this.temporaryEllipse.updateDisplay();

      if (
        (this.ellipseSEPoint instanceof SEIntersectionPoint &&
          !this.ellipseSEPoint.isUserCreated) ||
        (this.ellipseSEPoint instanceof SEAntipodalPoint &&
          !this.ellipseSEPoint.isUserCreated)
      ) {
        // Mark the intersection/antipodal point as created, the display style is changed and the glowing style is set up
        ellipseCommandGroup.addCommand(
          new SetPointUserCreatedValueCommand(this.ellipseSEPoint, true)
        );
      }
    } else if (!fromActivate) {
      // We have to create a new Point for the ellipse point
      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.hitSESegments.length > 0) {
        // The end of the line will be a point on a segment
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSESegments[0]);
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;

        newSELabel = new SELabel("point", vtx);

        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSESegments[0],
            newSELabel
          )
        );
      } else if (this.hitSELines.length > 0) {
        // The end of the line will be a point on a line
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSELines[0]);
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel("point", vtx);
        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSELines[0],
            newSELabel
          )
        );
      } else if (this.hitSECircles.length > 0) {
        // The end of the line will be a point on a circle
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSECircles[0]);
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel("point", vtx);
        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSECircles[0],
            newSELabel
          )
        );
      } else if (this.hitSEEllipses.length > 0) {
        // The end of the line will be a point on a ellipse
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSEEllipses[0]);
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel("point", vtx);
        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEEllipses[0],
            newSELabel
          )
        );
      } else if (this.hitSEParametrics.length > 0) {
        // The end of the line will be a point on a ellipse
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSEParametrics[0]);
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel("point", vtx);
        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEParametrics[0],
            newSELabel
          )
        );
      } else if (this.hitSEPolygons.length > 0) {
        // The end of the line will be a point on a ellipse
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSEPolygons[0]);
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel("point", vtx);
        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEPolygons[0],
            newSELabel
          )
        );
      } else {
        // The ending mouse release landed on an open space
        vtx = new SEPoint();
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel("point", vtx);
        ellipseCommandGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      /////////////
      // Create the antipode of the new point, vtx
      const antipode = EllipseHandler.addCreateAntipodeCommand(
        vtx,
        ellipseCommandGroup
      );
      newlyCreatedSEPoints.push(antipode, vtx);
      ///////////

      this.ellipseSEPoint = vtx;
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
    if (this.ellipseSEPoint) {
      // We shouldn't need this because this has been set in mouse move
      // // Update the display of the ellipse based on a potentially new location of the circleSEPoint
      // // Move the endMarker to the current mouse location
      // this.temporaryEllipsePointMarker.positionVectorAndDisplay = this.ellipseSEPoint.locationVector;
      // //compute the radius of the temporary circle
      // this.a = this.temporaryEllipse.centerVector.angleTo(s
      //   this.ellipseSEPoint.locationVector
      // );
      // // Set the radius of the temporary circle, the center was set in Mouse Press
      // this.temporaryEllipse.circleRadius = this.a;
      // //update the display
      // this.temporaryEllipse.updateDisplay();

      const angleSumToEllipsePoint =
        this.focus1SEPoint.locationVector.angleTo(
          this.ellipseSEPoint.locationVector
        ) +
        this.focus2SEPoint.locationVector.angleTo(
          this.ellipseSEPoint.locationVector
        );

      // check to make sure that this ellipse doesn't already exist
      if (
        EllipseHandler.store.seEllipses.some(
          ell =>
            ((this.tmpVector
              .subVectors(
                ell.focus1SEPoint.locationVector,
                this.focus1SEPoint
                  ? this.focus1SEPoint.locationVector
                  : this.tmpVector
              )
              .isZero() &&
              this.tmpVector
                .subVectors(
                  ell.focus2SEPoint.locationVector,
                  this.focus2SEPoint
                    ? this.focus2SEPoint.locationVector
                    : this.tmpVector
                )
                .isZero()) ||
              (this.tmpVector
                .subVectors(
                  ell.focus1SEPoint.locationVector,
                  this.focus2SEPoint
                    ? this.focus2SEPoint.locationVector
                    : this.tmpVector
                )
                .isZero() &&
                this.tmpVector
                  .subVectors(
                    ell.focus2SEPoint.locationVector,
                    this.focus1SEPoint
                      ? this.focus1SEPoint.locationVector
                      : this.tmpVector
                  )
                  .isZero())) &&
            Math.abs(ell.ellipseAngleSum - angleSumToEllipsePoint) <
              SETTINGS.tolerance
        )
      ) {
        return false;
      }

      // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
      const newSEEllipse = new SEEllipse(
        this.focus1SEPoint,
        this.focus2SEPoint,
        this.ellipseSEPoint,
        false
      );
      // Create the plottable and model label
      const newSELabel = new SELabel("ellipse", newSEEllipse);
      // Set the initial label location
      this.tmpMatrix.makeRotationAxis(
        this.tmpVector1
          .addVectors(
            this.focus1SEPoint.locationVector,
            this.focus2SEPoint.locationVector
          )
          .normalize(),
        Math.PI / 2
      );
      this.tmpVector
        .copy(this.ellipseSEPoint.locationVector)
        .applyMatrix4(this.tmpMatrix)
        .add(new Vector3(0, SETTINGS.ellipse.initialLabelOffset, 0))
        .normalize();
      newSELabel.locationVector = this.tmpVector;
      newSEEllipse.shallowUpdate();

      ellipseCommandGroup.addCommand(
        new AddEllipseCommand(
          newSEEllipse,
          this.focus1SEPoint,
          this.focus2SEPoint,
          this.ellipseSEPoint,
          newSELabel
        )
      );

      // Generate new intersection points. These points must be computed and created
      // in the store. Add the new created points to the ellipse command so they can be undone.

      const intersectionPointsToUpdate: SEIntersectionPoint[] = [];

      EllipseHandler.store
        .createAllIntersectionsWith(newSEEllipse, newlyCreatedSEPoints)
        .forEach((item: SEIntersectionReturnType) => {
          if (item.existingIntersectionPoint) {
            intersectionPointsToUpdate.push(item.SEIntersectionPoint);
            ellipseCommandGroup.addCondition(() =>
              item.SEIntersectionPoint.canAddIntersectionOtherParentInfo(item)
            );
            ellipseCommandGroup.addCommand(
              new AddIntersectionPointOtherParentsInfo(item)
            );
            ellipseCommandGroup.addEndCondition();
          } else {
            // Create the plottable and model label
            const newSELabel = item.SEIntersectionPoint.attachLabelWithOffset(
              new Vector3(
                2 * SETTINGS.point.initialLabelOffset,
                SETTINGS.point.initialLabelOffset,
                0
              )
            );

            ellipseCommandGroup.addCommand(
              new AddIntersectionPointCommand(
                item.SEIntersectionPoint,
                item.parent1,
                item.parent2,
                newSELabel
              )
            );
            item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points or label
            newSELabel.showing = false;
            if (item.createAntipodalPoint) {
              EllipseHandler.addCreateAntipodeCommand(
                item.SEIntersectionPoint,
                ellipseCommandGroup
              );
            }
          }
        });

      ellipseCommandGroup.execute();

      // The newly added ellipse passes through all the
      // intersection points on the intersectionPointsToUpdate list
      // This ellipse might be a new parent to some of them
      // shallowUpdate will check this and change parents as needed
      intersectionPointsToUpdate.forEach(pt => pt.shallowUpdate());
      intersectionPointsToUpdate.splice(0);
    }
    return true;
  }

  updateFilteredPointsList(): void {
    this.filteredIntersectionPointsList = this.hitSEPoints.filter(pt => {
      if (pt instanceof SEIntersectionPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          if (pt.principleParent1.showing && pt.principleParent2.showing) {
            return true;
          } else {
            return false;
          }
        }
      } else if (pt instanceof SEAntipodalPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          return true;
        }
      }
      return pt.showing;
    });
  }
  activate(): void {
    // If there are exactly two SEPoints selected, create a circle with the first as the center
    // and the second as the circle point
    if (EllipseHandler.store.selectedSENodules.length === 3) {
      const object1 = EllipseHandler.store.selectedSENodules[0];
      const object2 = EllipseHandler.store.selectedSENodules[1];
      const object3 = EllipseHandler.store.selectedSENodules[2];
      if (
        object1 instanceof SEPoint &&
        object2 instanceof SEPoint &&
        object3 instanceof SEPoint &&
        !tmpVector
          .crossVectors(object1.locationVector, object2.locationVector)
          .isZero(SETTINGS.nearlyAntipodalIdeal) // if the points are antipodal do nothing
      ) {
        this.focus1SEPoint = object1;
        this.focus2SEPoint = object2;
        this.ellipseSEPoint = object3;
        if (!this.makeEllipse(true)) {
          EventBus.fire("show-alert", {
            key: `ellipseCreationAttemptDuplicate`,
            keyOptions: {},
            type: "error"
          });
        }
        this.prepareForNextEllipse();
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
