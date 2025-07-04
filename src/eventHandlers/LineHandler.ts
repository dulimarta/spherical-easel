import { Vector3 } from "three";
import Point from "@/plottables/Point";
import Line from "@/plottables/Line";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddLineCommand } from "@/commands/AddLineCommand";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import SETTINGS from "@/global-settings";
import Highlighter from "./Highlighter";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneOrTwoDimensionalCommand";
import { SEOneOrTwoDimensional, SEIntersectionReturnType } from "@/types";
import { SELabel } from "@/models/SELabel";
import EventBus from "./EventBus";
//import Two from "two.js";
import { Group } from "two.js/src/group";
import { AddIntersectionPointOtherParentsInfo } from "@/commands/AddIntersectionPointOtherParentsInfo";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { SetPointUserCreatedValueCommand } from "@/commands/SetPointUserCreatedValueCommand";

export default class LineHandler extends Highlighter {
  /**
   * The starting vector location of the line
   */
  private startVector = new Vector3();
  /**
   * The plottable object needs only the normal vector to render the line. This is the normalVector of the temporary line
   */
  private normalVector = new Vector3(0, 0, 0);
  /**
   * The starting and ending SEPoints of the line. The possible parent of the startSEPoint
   */
  private startSEPoint: SEPoint | null = null;
  private endSEPoint: SEPoint | null = null;
  private startSEPointOneDimensionalParent: SEOneOrTwoDimensional | null = null;

  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: SEPoint[] = [];

  /** Has the temporary line/tempStartMarker/tempEndMarker been added to the scene?*/
  private isTemporaryLineAdded = false;
  private isTemporaryStartMarkerAdded = false;
  private isTemporaryEndMarkerAdded = false;

  /**
   * As the user moves the pointer around snap the temporary marker to these objects temporarily
   */
  protected snapStartMarkerToTemporaryOneDimensional: SEOneOrTwoDimensional | null =
    null;
  protected snapEndMarkerToTemporaryOneDimensional: SEOneOrTwoDimensional | null =
    null;
  protected snapStartMarkerToTemporaryPoint: SEPoint | null = null;
  protected snapEndMarkerToTemporaryPoint: SEPoint | null = null;
  /**
   * A temporary line to display while the user is creating a new line
   */
  private temporaryLine: Line;

  /**
   * A temporary plottable (TwoJS) points created while the user is making the lines
   */
  protected temporaryStartMarker: Point;
  protected temporaryEndMarker: Point;

  /**
   * If the user starts to make a line and mouse press at a location on the sphere, then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that. Or if the user mouse press outside the canvas and mouse releases
   * on the canvas, nothing should happen.
   */
  private startLocationSelected = false;

  /**
   * A temporary vector to help with normal vector computations
   */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  /**
   * Make a line handler
   * @param layers The TwoGroup array of layer so plottable objects can be put into the correct layers for correct rendering
   */
  constructor(layers: Group[]) {
    super(layers);
    // Create and style the temporary line
    this.temporaryLine = new Line();
    LineHandler.store.addTemporaryNodule(this.temporaryLine);
    this.isTemporaryLineAdded = false;

    // Create and style the temporary points marking the start/end of an object being created
    this.temporaryStartMarker = new Point();
    LineHandler.store.addTemporaryNodule(this.temporaryStartMarker);
    this.temporaryEndMarker = new Point();
    LineHandler.store.addTemporaryNodule(this.temporaryEndMarker);
  }

  mousePressed(event: MouseEvent): void {
    // console.debug(`LineHandler::mousePressed (${event.clientX},${event.clientY})`)
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    super.mouseMoved(event);
    if (this.isOnSphere && !this.startLocationSelected) {
      // The user is making a line
      this.startLocationSelected = true;
      this.updateFilteredPointsList();
      // Decide if the starting location is near an already existing SEPoint or near a oneDimensional SENodule
      if (this.filteredIntersectionPointsList.length > 0) {
        // Use an existing SEPoint to start the line
        const selected = this.filteredIntersectionPointsList[0];
        this.startVector.copy(selected.locationVector);
        this.startSEPoint = this.filteredIntersectionPointsList[0];
        this.temporaryStartMarker.positionVectorAndDisplay =
          selected.locationVector;
        // Glow the selected point and select it so the highlighter.ts doesn't unglow it with the mouseMoved method
        this.startSEPoint.glowing = true;
        this.startSEPoint.selected = true;
      } else if (this.hitSESegments.length > 0) {
        // The start of the line will be a point on a segment
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSESegments[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
        this.startSEPoint = null;
      } else if (this.hitSELines.length > 0) {
        // The start of the line will be a point on a line
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSELines[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
        this.startSEPoint = null;
      } else if (this.hitSECircles.length > 0) {
        // The start of the line will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSECircles[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
        this.startSEPoint = null;
      } else if (this.hitSEEllipses.length > 0) {
        // The start of the line will be a point on a ellipse
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSEEllipses[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
        this.startSEPoint = null;
      } else if (this.hitSEParametrics.length > 0) {
        // The start of the line will be a point on a ellipse
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSEParametrics[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
        this.startSEPoint = null;
      } else if (this.hitSEPolygons.length > 0) {
        // The start of the line will be a point on a ellipse
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSEPolygons[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
        this.startSEPoint = null;
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Record the location in a temporary point (startMarker found in MouseHandler).
        //  Eventually, we will create a new SEPoint and Point
        this.temporaryStartMarker.positionVectorAndDisplay =
          this.currentSphereVector;
        this.startVector.copy(this.currentSphereVector);
        this.startSEPoint = null;
      }
      this.temporaryEndMarker.positionVectorAndDisplay =
        this.currentSphereVector;
    }
  }
  mouseMoved(event: MouseEvent): void {
    // console.debug(`LineHandler::mouseMoved (${event.clientX},${event.clientY})`)
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // Only one object can be interacted with at a given time, so set the first point nearby to glowing
    // The user can create points  on , ellipses, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    // Also set the snap objects
    this.updateFilteredPointsList();
    if (this.filteredIntersectionPointsList.length > 0) {
      this.filteredIntersectionPointsList[0].glowing = true;
      if (!this.startLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint =
          this.filteredIntersectionPointsList[0];
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint =
          this.filteredIntersectionPointsList[0];
      }
    } else if (this.hitSESegments.length > 0) {
      this.hitSESegments[0].glowing = true;
      if (!this.startLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = this.hitSESegments[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSESegments[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else if (this.hitSELines.length > 0) {
      this.hitSELines[0].glowing = true;
      if (!this.startLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = this.hitSELines[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSELines[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else if (this.hitSECircles.length > 0) {
      this.hitSECircles[0].glowing = true;
      if (!this.startLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = this.hitSECircles[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSECircles[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else if (this.hitSEEllipses.length > 0) {
      this.hitSEEllipses[0].glowing = true;
      if (!this.startLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = this.hitSEEllipses[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSEEllipses[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else if (this.hitSEParametrics.length > 0) {
      this.hitSEParametrics[0].glowing = true;
      if (!this.startLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional =
          this.hitSEParametrics[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSEParametrics[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else if (this.hitSEPolygons.length > 0) {
      this.hitSEPolygons[0].glowing = true;
      if (!this.startLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = this.hitSEPolygons[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSEPolygons[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else {
      this.snapStartMarkerToTemporaryOneDimensional = null;
      this.snapEndMarkerToTemporaryOneDimensional = null;
      this.snapStartMarkerToTemporaryPoint = null;
      this.snapEndMarkerToTemporaryPoint = null;
    }
    // Make sure that the event is on the sphere
    if (this.isOnSphere) {
      // if makingALine is true, the user has selected a start location
      if (!this.startLocationSelected) {
        // If the temporary startMarker has *not* been added to the scene do so now
        if (!this.isTemporaryStartMarkerAdded) {
          this.isTemporaryStartMarkerAdded = true;
          this.temporaryStartMarker.addToLayers(this.layers);
        }
        // Remove the temporary startMarker if there is a nearby point which can glowing
        if (this.snapStartMarkerToTemporaryPoint !== null) {
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // glowing when the user select that location and then moves the mouse away - see line 119) we don't
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            this.snapStartMarkerToTemporaryPoint instanceof
              SEIntersectionPoint &&
            !this.snapStartMarkerToTemporaryPoint.isUserCreated
          ) {
            this.temporaryStartMarker.positionVectorAndDisplay =
              this.snapStartMarkerToTemporaryPoint.locationVector;
          } else {
            this.temporaryStartMarker.removeFromLayers();
            this.isTemporaryStartMarkerAdded = false;
          }
        }
        // Set the location of the temporary startMarker by snapping to appropriate object (if any)
        if (this.snapStartMarkerToTemporaryOneDimensional !== null) {
          this.temporaryStartMarker.positionVectorAndDisplay =
            this.snapStartMarkerToTemporaryOneDimensional.closestVector(
              this.currentSphereVector
            );
        } else if (this.snapStartMarkerToTemporaryPoint == null) {
          this.temporaryStartMarker.positionVectorAndDisplay =
            this.currentSphereVector;
        }
      } else {
        // If the temporary startMarker has *not* been added to the scene do so now (it might have
        // been removed due to leaving the sphere in mouse moved, but not triggering a mouse leave event)
        if (!this.isTemporaryStartMarkerAdded && this.startSEPoint === null) {
          this.isTemporaryStartMarkerAdded = true;
          this.temporaryStartMarker.addToLayers(this.layers);
        }
        // If the temporary endMarker has *not* been added to the scene do so now
        if (!this.isTemporaryEndMarkerAdded) {
          this.isTemporaryEndMarkerAdded = true;
          this.temporaryEndMarker.addToLayers(this.layers);
        }
        // Remove the temporary endMarker if there is a nearby point (which is glowing)
        if (this.snapEndMarkerToTemporaryPoint !== null) {
          this.temporaryEndMarker.removeFromLayers();
          this.isTemporaryEndMarkerAdded = false;
        }
        // Set the location of the temporary endMarker by snapping to appropriate object (if any)

        this.temporaryEndMarker.positionVectorAndDisplay =
          this.snapEndMarkerToTemporaryOneDimensional !== null
            ? this.snapEndMarkerToTemporaryOneDimensional.closestVector(
                this.currentSphereVector
              )
            : this.currentSphereVector;

        // If the temporary line has *not* been added to the scene do so now (only once)
        if (!this.isTemporaryLineAdded) {
          this.isTemporaryLineAdded = true;
          this.temporaryLine.addToLayers(this.layers);
        }
        // Compute the normal vector from the this.startVector, the (old) normal vector and this.temporaryEndMarker vector
        // Compute a temporary normal from the two points' vectors
        this.tmpVector.crossVectors(
          this.startVector,
          this.snapEndMarkerToTemporaryPoint === null
            ? this.tmpVector
                .copy(this.temporaryEndMarker.positionVector)
                .normalize()
            : // ? this.temporaryEndMarker.positionVector
              this.snapEndMarkerToTemporaryPoint.locationVector
        );

        // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
        // nearly antipodal or in the same direction)
        if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
          if (this.normalVector.length() === 0) {
            // The normal vector is still at its initial value so can't be used to compute the next normal, so set the
            // the normal vector to an arbitrarily chosen vector perpendicular to the start vector
            this.tmpVector.set(1, 0, 0);
            this.tmpVector.crossVectors(this.startVector, this.tmpVector);
            if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
              this.tmpVector.set(0, 1, 0);
              // The cross of startVector and (1,0,0) and (0,1,0) can't *both* be zero
              this.tmpVector.crossVectors(this.startVector, this.tmpVector);
            }
          } else {
            // The start and end vectors align, compute  the next normal vector from the old normal and the start vector
            this.tmpVector.crossVectors(this.startVector, this.normalVector);
            this.tmpVector.crossVectors(this.tmpVector, this.startVector);
          }
        }
        this.normalVector.copy(this.tmpVector).normalize();

        // Set the normal vector to the line in the plottable object, update the display
        this.temporaryLine.normalVector = this.normalVector;
        // this.temporaryLine.updateDisplay();
      }
    } else if (this.isTemporaryStartMarkerAdded) {
      // Remove the temporary objects from the display.
      this.temporaryLine.removeFromLayers();
      this.temporaryStartMarker.removeFromLayers();
      this.temporaryEndMarker.removeFromLayers();
      this.isTemporaryStartMarkerAdded = false;
      this.isTemporaryEndMarkerAdded = false;
      this.isTemporaryLineAdded = false;

      this.snapStartMarkerToTemporaryOneDimensional = null;
      this.snapEndMarkerToTemporaryOneDimensional = null;
      this.snapStartMarkerToTemporaryPoint = null;
      this.snapEndMarkerToTemporaryPoint = null;
    }
  }
  mouseReleased(event: MouseEvent): void {
    // console.debug(`LineHandler::mouseReleased (${event.clientX},${event.clientY})`)
    if (this.isOnSphere) {
      // Make sure the user didn't trigger the mouse leave event and is actually making a line
      if (this.startLocationSelected) {
        if (
          this.startVector.angleTo(this.currentSphereVector) >
          SETTINGS.line.minimumLength
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
        this.temporaryLine.removeFromLayers();
        this.temporaryStartMarker.removeFromLayers();
        this.temporaryEndMarker.removeFromLayers();
        this.isTemporaryLineAdded = false;
        this.isTemporaryStartMarkerAdded = false;
        this.isTemporaryEndMarkerAdded = false;

        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.prepareForNextLine();
  }

  prepareForNextLine(): void {
    this.temporaryLine.removeFromLayers();
    this.temporaryStartMarker.removeFromLayers();
    this.temporaryEndMarker.removeFromLayers();
    this.isTemporaryLineAdded = false;
    this.isTemporaryStartMarkerAdded = false;
    this.isTemporaryEndMarkerAdded = false;

    this.snapStartMarkerToTemporaryOneDimensional = null;
    this.snapEndMarkerToTemporaryOneDimensional = null;
    this.snapStartMarkerToTemporaryPoint = null;
    this.snapEndMarkerToTemporaryPoint = null;

    // Clear old points and values to get ready for creating the next segment.
    if (this.startSEPoint) {
      this.startSEPoint.glowing = false;
      this.startSEPoint.selected = false;
    }
    this.startSEPoint = null;
    this.endSEPoint = null;
    this.startSEPointOneDimensionalParent = null;
    this.normalVector.set(0, 0, 0);
    this.startLocationSelected = false;
    this.tmpVector.set(0, 0, 0);

    // call an unglow all command
    LineHandler.store.unglowAllSENodules();
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

  // Create a new line from the mouse event information
  private makeLine(fromActivate = false): boolean {
    //Create a command group so this can be undone
    const lineGroup = new CommandGroup();
    const newlyCreatedSEPoints: SEPoint[] = [];

    if (this.startSEPoint === null) {
      // We have to create a new SEPointOnOneDimensional or SEPoint and Point

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.startSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          this.startSEPointOneDimensionalParent
        );
        newSELabel = new SELabel("point", vtx);
        // Create and execute the command to create a new point for undo/redo
        lineGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.startSEPointOneDimensionalParent,
            newSELabel
          )
        );
      } else {
        // Starting mouse press landed on an open space
        vtx = new SEPoint();
        newSELabel = new SELabel("point", vtx);
        // Create and execute the command to create a new point for undo/redo
        lineGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      vtx.locationVector = this.startVector;
      /////////////
      // Create the antipode of the new point, vtx
      const antipode = LineHandler.addCreateAntipodeCommand(vtx, lineGroup);
      newlyCreatedSEPoints.push(vtx, antipode);
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
      this.startSEPoint = vtx;
    } else if (
      (this.startSEPoint instanceof SEIntersectionPoint ||
        this.startSEPoint instanceof SEAntipodalPoint) &&
      !this.startSEPoint.isUserCreated
    ) {
      // Mark the intersection/antipodal point as created, the display style is changed and the glowing style is set up
      lineGroup.addCommand(
        new SetPointUserCreatedValueCommand(this.startSEPoint, true)
      );
    }

    // Check to see if the release location is near any points
    if (this.filteredIntersectionPointsList.length > 0 && !fromActivate) {
      this.endSEPoint = this.filteredIntersectionPointsList[0];
      if (
        (this.endSEPoint instanceof SEIntersectionPoint ||
          this.endSEPoint instanceof SEAntipodalPoint) &&
        !this.endSEPoint.isUserCreated
      ) {
        // Mark the intersection point as created, the display style is changed and the glowing style is set up
        lineGroup.addCommand(
          new SetPointUserCreatedValueCommand(this.endSEPoint, true)
        );
      }
    } else if (!fromActivate) {
      // We have to create a new Point for the end
      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.hitSESegments.length > 0) {
        // The end of the line will be a point on a segment
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSESegments[0]);
        // Set the Location
        vtx.locationVector = this.hitSESegments[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);

        lineGroup.addCommand(
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
        vtx.locationVector = this.hitSELines[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);

        lineGroup.addCommand(
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
        vtx.locationVector = this.hitSECircles[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);

        lineGroup.addCommand(
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
        vtx.locationVector = this.hitSEEllipses[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);

        lineGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEEllipses[0],
            newSELabel
          )
        );
      } else if (this.hitSEParametrics.length > 0) {
        // The end of the line will be a point on a parametric
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSEParametrics[0]);
        // Set the Location
        vtx.locationVector = this.hitSEParametrics[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);

        lineGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEParametrics[0],
            newSELabel
          )
        );
      } else if (this.hitSEPolygons.length > 0) {
        // The end of the line will be a point on a parametric
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSEPolygons[0]);
        // Set the Location
        vtx.locationVector = this.hitSEPolygons[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);

        lineGroup.addCommand(
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
        vtx.locationVector = this.currentSphereVector;
        newSELabel = new SELabel("point", vtx);

        lineGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      /////////////
      // Create the antipode of the new point, vtx
      const antipode = LineHandler.addCreateAntipodeCommand(vtx, lineGroup);
      newlyCreatedSEPoints.push(antipode, vtx);
      ///////////
      this.endSEPoint = vtx;
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

    if (this.endSEPoint) {
      // Compute a temporary normal from the two points' vectors
      this.tmpVector.crossVectors(
        this.startSEPoint.locationVector,
        this.endSEPoint.locationVector
      );
      // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
      // nearly antipodal or in the same direction)
      if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
        // The start and end vectors align, compute the next normal vector from the old normal and the start vector
        this.tmpVector.crossVectors(
          this.startSEPoint.locationVector,
          this.normalVector
        );
        this.tmpVector.crossVectors(
          this.tmpVector,
          this.startSEPoint.locationVector
        );
      }
      this.normalVector.copy(this.tmpVector).normalize();

      // if (this.normalVector === undefined) {
      //   console.error(
      //     "The normal vector in line handler was not set properly"
      //   );
      //   return false;
      // } //There are some situations in which the mouse actions (hard to duplicate) lead to an undefined normal vector and I'm hoping this will prevent the program from entering an error state.

      // Set the normal vector to the line in the plottable object this also updates the display
      this.temporaryLine.normalVector = this.normalVector;
      // this.temporaryLine.updateDisplay();

      // check to make sure that this line doesn't already exist by checking that no existing line has normal or -1*normal equal to the new proposed normal
      if (
        LineHandler.store.seLines.some(line =>
          this.tmpVector
            .subVectors(line.normalVector, this.normalVector)
            .isZero()
        )
      ) {
        return false;
      }

      this.tmpVector1.copy(this.normalVector).multiplyScalar(-1); // copy the normal vector and multiply by -1 (avoid changing the normal vector which caused problems for Angle marker)
      if (
        LineHandler.store.seLines.some(line =>
          this.tmpVector.subVectors(line.normalVector, this.tmpVector1).isZero()
        )
      ) {
        return false;
      }

      // Create the new line after the normalVector is set
      const newSELine = new SELine(
        this.startSEPoint,
        this.normalVector,
        this.endSEPoint
      );
      // Create the plottable label
      const newSELabel = new SELabel("line", newSELine);
      this.tmpVector
        .addVectors(
          this.startSEPoint.locationVector,
          this.endSEPoint.locationVector
        )
        .normalize()
        .add(new Vector3(0, SETTINGS.line.initialLabelOffset, 0))
        .normalize();
      newSELabel.locationVector = this.tmpVector;

      lineGroup.addCommand(
        new AddLineCommand(
          newSELine,
          this.startSEPoint,
          this.endSEPoint,
          newSELabel
        )
      );

      // Determine all new intersection points and add their creation to the command so it can be undone

      const intersectionPointsToUpdate: SEIntersectionPoint[] = [];

      LineHandler.store
        .createAllIntersectionsWith(newSELine, newlyCreatedSEPoints)
        .forEach((item: SEIntersectionReturnType) => {
          if (item.existingIntersectionPoint) {
            intersectionPointsToUpdate.push(item.SEIntersectionPoint);
            lineGroup.addCondition(() =>
              item.SEIntersectionPoint.canAddIntersectionOtherParentInfo(item)
            );
            lineGroup.addCommand(
              new AddIntersectionPointOtherParentsInfo(item)
            );
            lineGroup.addEndCondition();
          } else {
            // Create the plottable label
            const newSELabel = item.SEIntersectionPoint.attachLabelWithOffset(
              new Vector3(
                2 * SETTINGS.point.initialLabelOffset,
                SETTINGS.point.initialLabelOffset,
                0
              )
            );

            lineGroup.addCommand(
              new AddIntersectionPointCommand(
                item.SEIntersectionPoint,
                item.parent1,
                item.parent2,
                newSELabel
              )
            );
            item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
            newSELabel.showing = false;

            if (item.createAntipodalPoint) {
              LineHandler.addCreateAntipodeCommand(
                item.SEIntersectionPoint,
                lineGroup
              );
            }
          }
        });
      lineGroup.execute();

      // The newly added line passes through all the
      // intersection points on the intersectionPointsToUpdate list
      // This line might be a new parent to some of them
      // shallowUpdate will check this and change parents as needed
      intersectionPointsToUpdate.forEach(pt => pt.shallowUpdate());
      intersectionPointsToUpdate.splice(0);
    }
    return true;
  }

  activate(): void {
    // If there are exactly two (non-antipodal and not to near each other) SEPoints selected,
    // create a line with the two points
    if (LineHandler.store.selectedSENodules.length == 2) {
      const object1 = LineHandler.store.selectedSENodules[0];
      const object2 = LineHandler.store.selectedSENodules[1];

      if (object1 instanceof SEPoint && object2 instanceof SEPoint) {
        this.tmpVector.crossVectors(
          object1.locationVector,
          object2.locationVector
        );
        // Check to see if the points are antipodal
        if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
          // They are antipodal, create an arbitrary normal vector
          this.tmpVector.set(1, 0, 0);
          this.normalVector.crossVectors(
            object1.locationVector,
            this.tmpVector
          );
          if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
            this.tmpVector.set(0, 1, 0);
            // The cross of object1.locationVector, and (1,0,0) and (0,1,0) can't *both* be zero
            this.normalVector.crossVectors(
              object1.locationVector,
              this.tmpVector
            );
          }
          this.normalVector.normalize();
        }
        this.startSEPoint = object1;
        this.endSEPoint = object2;
        if (!this.makeLine(true)) {
          EventBus.fire("show-alert", {
            key: `handlers.lineCreationAttemptDuplicate`,
            keyOptions: {},
            type: "error"
          });
        }
        this.prepareForNextLine();
      }
      // Unselect the selected objects and clear the selectedObject array
      super.activate();
    }
  }
  deactivate(): void {
    super.deactivate();
  }
}
