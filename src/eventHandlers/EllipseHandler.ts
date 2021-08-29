/** @format */

import { Vector3, Matrix4 } from "three";
import Point from "@/plottables/Point";
import Ellipse from "@/plottables/Ellipse";
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
import { SEEllipse } from "@/models/SEEllipse";
import { AddEllipseCommand } from "@/commands/AddEllipseCommand";
import { SEStore } from "@/store";
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
  private focus1SEPointOneDimensionalParent: SEOneOrTwoDimensional | null = null;
  private focus2SEPointOneDimensionalParent: SEOneOrTwoDimensional | null = null;

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
  protected snapTemporaryPointMarkerToOneDimensional: SEOneOrTwoDimensional | null = null;
  protected snapTemporaryPointMarkerToPoint: SEPoint | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
    this.focus1Vector = new Vector3();
    this.focus2Vector = new Vector3();
    this.temporaryEllipse = new Ellipse();
    // Set the style using the temporary defaults
    this.temporaryEllipse.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryEllipse);
    // Create and style the temporary points marking the start/end of an object being created
    this.temporaryFocus1Marker = new Point();
    this.temporaryFocus1Marker.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryFocus1Marker);

    this.temporaryFocus2Marker = new Point();
    this.temporaryFocus2Marker.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryFocus2Marker);

    this.temporaryEllipsePointMarker = new Point();
    this.temporaryEllipsePointMarker.stylize(
      DisplayStyle.ApplyTemporaryVariables
    );
    SEStore.addTemporaryNodule(this.temporaryEllipsePointMarker);
  }

  mousePressed(event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    //super.mouseMoved(event);
    // First decide if the location of the event is on the sphere
    if (this.isOnSphere && !this.focus2LocationSelected) {
      // Check to see if the current location is near any points
      if (this.hitSEPoints.length > 0) {
        // Pick the top most selected point
        const selected = this.hitSEPoints[0];
        if (!this.focus1LocationSelected) {
          // Record the foci1 vector of the ellipse so it can be past to the non-temporary ellipse
          this.focus1Vector.copy(selected.locationVector);
          // Record the model object as the center of the ellipse
          this.focus1SEPoint = selected;
          // Move the startMarker to the current selected point
          this.temporaryFocus1Marker.positionVector = selected.locationVector;
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
            this.temporaryFocus2Marker.positionVector = selected.locationVector;
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
              key: `handlers.ellipseAntipodalSelected`,
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
          this.temporaryFocus1Marker.positionVector = this.focus1Vector;
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
          this.temporaryFocus2Marker.positionVector = this.focus2Vector;
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
          this.temporaryFocus1Marker.positionVector = this.focus1Vector;
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
          this.temporaryFocus2Marker.positionVector = this.focus2Vector;
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
          this.temporaryFocus1Marker.positionVector = this.focus1Vector;
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
          this.temporaryFocus2Marker.positionVector = this.focus2Vector;
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
          this.temporaryFocus1Marker.positionVector = this.focus1Vector;
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
          this.temporaryFocus2Marker.positionVector = this.focus2Vector;
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
          this.temporaryFocus1Marker.positionVector = this.focus1Vector;
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
          this.temporaryFocus2Marker.positionVector = this.focus2Vector;
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
          this.temporaryFocus1Marker.positionVector = this.focus1Vector;
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
          this.temporaryFocus2Marker.positionVector = this.focus2Vector;
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
          this.temporaryFocus1Marker.positionVector = this.currentSphereVector;
          // Record the center vector of the circle so it can be past to the non-temporary circle
          this.focus1Vector.copy(this.currentSphereVector);
          // Set the center of the circle to null so it can be created later
          this.focus1SEPoint = null;
          this.focus1LocationSelected = true;
        } else {
          // Set the center of the ellipse in the plottable object
          this.temporaryEllipse.focus2Vector = this.currentSphereVector;
          // Move the startMarker to the current mouse location
          this.temporaryFocus2Marker.positionVector = this.currentSphereVector;
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
        this.temporaryFocus2Marker.positionVector = this.currentSphereVector;
        EventBus.fire("show-alert", {
          key: `handlers.ellipseFocus1Selected`,
          keyOptions: {},
          type: "info"
        });
      } else {
        this.temporaryEllipsePointMarker.positionVector = this.currentSphereVector;
        EventBus.fire("show-alert", {
          key: `handlers.ellipseFocus2Selected`,
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
            this.temporaryFocus1Marker.positionVector = this.snapTemporaryPointMarkerToPoint.locationVector;
          } else {
            this.temporaryFocus1Marker.removeFromLayers();
            this.temporaryFocus1MarkerAdded = false;
          }
        }
        // Set the location of the temporary focus1Marker by snapping to appropriate object (if any)
        if (this.snapTemporaryPointMarkerToOneDimensional !== null) {
          this.temporaryFocus1Marker.positionVector = this.snapTemporaryPointMarkerToOneDimensional.closestVector(
            this.currentSphereVector
          );
        }
        // otherwise move the focus1marker to the current sphere vector (again in the case that there is no point to glow at that location)
        else if (this.snapTemporaryPointMarkerToPoint == null) {
          this.temporaryFocus1Marker.positionVector = this.currentSphereVector;
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
            this.temporaryFocus2Marker.positionVector = this.snapTemporaryPointMarkerToPoint.locationVector;
          } else {
            this.temporaryFocus2Marker.removeFromLayers();
            this.temporaryFocus2MarkerAdded = false;
          }
        }
        // Set the location of the temporary focus2Marker by snapping to appropriate object (if any)
        if (this.snapTemporaryPointMarkerToOneDimensional !== null) {
          this.temporaryFocus2Marker.positionVector = this.snapTemporaryPointMarkerToOneDimensional.closestVector(
            this.currentSphereVector
          );
        }
        // otherwise move the focus2marker to the current sphere vector (again in the case that there is no point to glow at that location)
        else if (this.snapTemporaryPointMarkerToPoint == null) {
          this.temporaryFocus2Marker.positionVector = this.currentSphereVector;
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
          this.temporaryEllipsePointMarker.positionVector = this.snapTemporaryPointMarkerToPoint.locationVector;
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
          this.temporaryEllipsePointMarker.positionVector = this.snapTemporaryPointMarkerToOneDimensional.closestVector(
            this.currentSphereVector
          );
        }
        // otherwise move the EllipsePointMarker to the current sphere vector (again in the case that there is no point to glow at that location)
        else if (this.snapTemporaryPointMarkerToPoint == null) {
          this.temporaryEllipsePointMarker.positionVector = this.currentSphereVector;
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
    if (this.isOnSphere) {
      // if (this.focus1LocationSelected) {
      if (this.focus2LocationSelected) {
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
                key: `handlers.ellipseCreationAttemptDuplicate`,
                keyOptions: {},
                type: "error"
              });
            }
            // reset to get ready to make a new ellipse
            this.mouseLeave(event);
          }
        } else {
          EventBus.fire("show-alert", {
            key: `handlers.ellipseInitiallyToSmall`,
            keyOptions: {},
            type: "info"
          });
        }
      }
    }
    // else {
    //   // Remove the temporary objects from the scene and mark the temporary object
    //   //  not added to the scene clear snap objects
    //   this.temporaryEllipse.removeFromLayers();
    //   this.temporaryEllipseAdded = false;

    //   this.temporaryFocus1Marker.removeFromLayers();
    //   this.temporaryFocus1MarkerAdded = false;
    //   this.snapFocus1MarkerToTemporaryOneDimensional = null;
    //   this.snapFocus1MarkerToTemporaryPoint = null;

    //   this.temporaryFocus2Marker.removeFromLayers();
    //   this.temporaryFocus2MarkerAdded = false;
    //   this.snapFocus2MarkerToTemporaryOneDimensional = null;
    //   this.snapFocus2MarkerToTemporaryPoint = null;

    //   this.temporaryEllipsePointMarker.removeFromLayers();
    //   this.temporaryEllipsePointMarkerAdded = false;
    //   this.snapEllipsePointMarkerToTemporaryOneDimensional = null;
    //   this.snapEllipsePointMarkerToTemporaryPoint = null;
    // }
    // }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);

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
    SEStore.unglowAllSENodules();
  }
  /**
   * Add a new circle the user has moved the mouse far enough (but not a radius of PI)
   */
  makeEllipse(): boolean {
    // Create a command group to add the points defining the ellipse and the ellipse to the store
    // This way a single undo click will undo all (potentially three) operations.
    const ellipseCommandGroup = new CommandGroup();

    // Create (if necessary) and handle the first focus location
    if (this.focus1SEPoint === null) {
      // Focus 1 point landed on an open space
      // we have to create a new point and it to the group/store
      const newCenterPoint = new Point();
      // Set the display to the default values
      newCenterPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the size of the point to the current zoom magnification factor
      newCenterPoint.adjustSize();

      // Create the plottable label
      const newLabel = new Label();
      let newSELabel: SELabel | null = null;

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      if (this.focus1SEPointOneDimensionalParent) {
        // Focus 1 mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newCenterPoint,
          this.focus1SEPointOneDimensionalParent
        );

        newSELabel = new SELabel(newLabel, vtx);

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
        vtx = new SEPoint(newCenterPoint);
        newSELabel = new SELabel(newLabel, vtx);
        ellipseCommandGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      vtx.locationVector = this.focus1Vector;
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
      this.focus1SEPoint instanceof SEIntersectionPoint &&
      !this.focus1SEPoint.isUserCreated
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      ellipseCommandGroup.addCommand(
        new ConvertInterPtToUserCreatedCommand(this.focus1SEPoint)
      );
    }

    // Create (if necessary) and handle the second focus location
    if (this.focus2SEPoint === null) {
      // Focus 1 point landed on an open space
      // we have to create a new point and it to the group/store
      const newCenterPoint = new Point();
      // Set the display to the default values
      newCenterPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the size of the point to the current zoom magnification factor
      newCenterPoint.adjustSize();

      // Create the plottable label
      const newLabel = new Label();
      let newSELabel: SELabel | null = null;

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      if (this.focus2SEPointOneDimensionalParent) {
        // Focus 1 mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newCenterPoint,
          this.focus2SEPointOneDimensionalParent
        );

        newSELabel = new SELabel(newLabel, vtx);

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
        vtx = new SEPoint(newCenterPoint);
        newSELabel = new SELabel(newLabel, vtx);
        ellipseCommandGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      vtx.locationVector = this.focus2Vector;
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
      this.focus2SEPoint instanceof SEIntersectionPoint &&
      !this.focus2SEPoint.isUserCreated
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      ellipseCommandGroup.addCommand(
        new ConvertInterPtToUserCreatedCommand(this.focus2SEPoint)
      );
    }

    // Create (if necessary) and handle the ellipse point release location
    // this.temporaryEllipsePointMarker.positionVector is the location of the ellipse point and it is a good one because we already check that that
    // the this.temporaryEllipsePointMarker.positionVector is not antipodal to the center of the ellipse and is not on the segment connecting
    // the foci.

    // Check to see if the release location is near any points
    if (this.hitSEPoints.length > 0) {
      this.ellipseSEPoint = this.hitSEPoints[0];
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
        this.ellipseSEPoint instanceof SEIntersectionPoint &&
        !this.ellipseSEPoint.isUserCreated
      ) {
        // Mark the intersection point as created, the display style is changed and the glowing style is set up
        ellipseCommandGroup.addCommand(
          new ConvertInterPtToUserCreatedCommand(this.ellipseSEPoint)
        );
      }
    } else {
      // We have to create a new Point for the ellipse point
      const newEllipsePoint = new Point();
      // Set the display to the default values
      newEllipsePoint.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the size of the point to the current zoom magnification factor
      newEllipsePoint.adjustSize();
      // Create the plottable label
      const newLabel = new Label();

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.hitSESegments.length > 0) {
        // The end of the line will be a point on a segment
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newEllipsePoint,
          this.hitSESegments[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;

        newSELabel = new SELabel(newLabel, vtx);

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
        vtx = new SEPointOnOneOrTwoDimensional(
          newEllipsePoint,
          this.hitSELines[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSELines[0],
            newSELabel
          )
        );
      } else if (this.hitSECircles.length > 0) {
        // The end of the line will be a point on a circle
        vtx = new SEPointOnOneOrTwoDimensional(
          newEllipsePoint,
          this.hitSECircles[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSECircles[0],
            newSELabel
          )
        );
      } else if (this.hitSEEllipses.length > 0) {
        // The end of the line will be a point on a ellipse
        vtx = new SEPointOnOneOrTwoDimensional(
          newEllipsePoint,
          this.hitSEEllipses[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEEllipses[0],
            newSELabel
          )
        );
      } else if (this.hitSEParametrics.length > 0) {
        // The end of the line will be a point on a ellipse
        vtx = new SEPointOnOneOrTwoDimensional(
          newEllipsePoint,
          this.hitSEParametrics[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEParametrics[0],
            newSELabel
          )
        );
      } else if (this.hitSEPolygons.length > 0) {
        // The end of the line will be a point on a ellipse
        vtx = new SEPointOnOneOrTwoDimensional(
          newEllipsePoint,
          this.hitSEPolygons[0]
        );
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        ellipseCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEPolygons[0],
            newSELabel
          )
        );
      } else {
        // The ending mouse release landed on an open space
        vtx = new SEPoint(newEllipsePoint);
        // Set the Location
        vtx.locationVector = this.temporaryEllipsePointMarker.positionVector;
        newSELabel = new SELabel(newLabel, vtx);
        ellipseCommandGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
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
    // We shouldn't need this because this has been set in mouse move
    // // Update the display of the ellipse based on a potentially new location of the circleSEPoint
    // // Move the endMarker to the current mouse location
    // this.temporaryEllipsePointMarker.positionVector = this.ellipseSEPoint.locationVector;
    // //compute the radius of the temporary circle
    // this.a = this.temporaryEllipse.centerVector.angleTo(
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
      SEStore.seEllipses.some(
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
    // Clone the current circle after the circlePoint is set
    const newEllipse = this.temporaryEllipse.clone();
    // Set the display to the default values
    newEllipse.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the stroke width to the current zoom magnification factor
    newEllipse.adjustSize();

    // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
    const newSEEllipse = new SEEllipse(
      newEllipse,
      this.focus1SEPoint,
      this.focus2SEPoint,
      this.ellipseSEPoint
    );
    // Create the plottable and model label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newSEEllipse);
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
    SEStore.createAllIntersectionsWithEllipse(newSEEllipse).forEach(
      (item: SEIntersectionReturnType) => {
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
      }
    );

    ellipseCommandGroup.execute();
    return true;
  }

  activate(): void {
    // If there are exactly two SEPoints selected, create a circle with the first as the center
    // and the second as the circle point
    if (SEStore.selectedSENodules.length == 3) {
      const object1 = SEStore.selectedSENodules[0];
      const object2 = SEStore.selectedSENodules[1];
      const object3 = SEStore.selectedSENodules[2];
      if (
        object1 instanceof SEPoint &&
        object2 instanceof SEPoint &&
        object3 instanceof SEPoint &&
        !tmpVector
          .crossVectors(object1.locationVector, object2.locationVector)
          .isZero(SETTINGS.nearlyAntipodalIdeal) // if the points are antipodal do nothing
      ) {
        // Create a new plottable ellipse
        const newEllipse = new Ellipse();
        // Set the display to the default values
        newEllipse.stylize(DisplayStyle.ApplyCurrentVariables);
        // Set the stroke width to the current width given the zoom level
        newEllipse.adjustSize();
        const newLabel = new Label();

        // Add the last command to the group and then execute it (i.e. add the potentially three points and the ellipse to the store.)
        const newSEEllipse = new SEEllipse(
          newEllipse,
          object1,
          object2,
          object3
        );
        // Update the newSEEllipse so the display is correct when the command group is executed
        newSEEllipse.markKidsOutOfDate();
        newSEEllipse.update();
        const newSELabel = new SELabel(newLabel, newSEEllipse);
        // Set the initial label location
        this.tmpMatrix.makeRotationAxis(object3.locationVector, Math.PI / 2);
        this.tmpVector
          .copy(object2.locationVector)
          .applyMatrix4(this.tmpMatrix)
          .add(new Vector3(0, SETTINGS.circle.initialLabelOffset, 0))
          .normalize();

        const ellipseCommandGroup = new CommandGroup();
        ellipseCommandGroup.addCommand(
          new AddEllipseCommand(
            newSEEllipse,
            object1,
            object2,
            object3,
            newSELabel
          )
        );

        // Generate new intersection points. These points must be computed and created
        // in the store. Add the new created points to the circle command so they can be undone.
        // this.store.getters
        //   .createAllIntersectionsWithCircle(newSECircle)
        //   .forEach((item: SEIntersectionReturnType) => {
        //     const newLabel = new Label();
        //     const newSELabel = new SELabel(newLabel, item.SEIntersectionPoint);

        //     // Set the initial label location
        //     this.tmpVector
        //       .copy(item.SEIntersectionPoint.locationVector)
        //       .add(
        //         new Vector3(
        //           2 * SETTINGS.point.initialLabelOffset,
        //           SETTINGS.point.initialLabelOffset,
        //           0
        //         )
        //       )
        //       .normalize();
        //     newSELabel.locationVector = this.tmpVector;
        //     circleCommandGroup.addCommand(
        //       new AddIntersectionPointCommand(
        //         item.SEIntersectionPoint,
        //         item.parent1,
        //         item.parent2,
        //         newSELabel
        //       )
        //     );
        //     item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
        //     newSELabel.showing = false;
        //   });

        ellipseCommandGroup.execute();
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
