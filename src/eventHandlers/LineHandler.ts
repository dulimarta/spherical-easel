/** @format */

import { Vector3 } from "three";
import Point from "@/plottables/Point";
import Line from "@/plottables/Line";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddLineCommand } from "@/commands/AddLineCommand";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";
import SETTINGS from "@/global-settings";
import Highlighter from "./Highlighter";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneDimensionalCommand";
import { SEOneDimensional, SEIntersectionReturnType } from "@/types";
import { UpdateMode } from "@/types";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";

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
  private startSEPointOneDimensionalParent: SEOneDimensional | null = null;

  /** Has the temporary line/tempStartMarker/tempEndMarker been added to the scene?*/
  private isTemporaryLineAdded = false;
  private isTemporaryStartMarkerAdded = false;
  private isTemporaryEndMarkerAdded = false;

  /**
   * As the user moves the pointer around snap the temporary marker to these objects temporarily
   */
  protected snapStartMarkerToTemporaryOneDimensional: SEOneDimensional | null = null;
  protected snapEndMarkerToTemporaryOneDimensional: SEOneDimensional | null = null;
  protected snapStartMarkerToTemporaryPoint: SEPoint | null = null;
  protected snapEndMarkerToTemporaryPoint: SEPoint | null = null;
  /**
   * A temporary line to display while the user is creating a new line
   */
  private temporaryLine: Line;

  /**
   * A temporary plottable (TwoJS) point created while the user is making the circles or segments
   */
  protected temporaryStartMarker: Point;
  /**
   * A temporary plottable (TwoJS) point created while the user is making the circles or segments
   */
  protected temporaryEndMarker: Point;
  /**
   * If the user starts to make a line and mouse press at a location on the sphere, then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that. Or if the user mouse press outside the canvas and mouse releases
   * on the canvas, nothing should happen.
   */
  private makingALine = false;

  /**
   * A temporary vector to help with normal vector computations
   */
  private tmpVector = new Vector3();

  /**
   * Make a line handler
   * @param layers The TwoGroup array of layer so plottable objects can be put into the correct layers for correct rendering
   */
  constructor(layers: Two.Group[]) {
    super(layers);
    // Create and style the temporary line
    this.temporaryLine = new Line();
    this.temporaryLine.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.temporaryLine);
    this.isTemporaryLineAdded = false;

    // Create and style the temporary points marking the start/end of an object being created
    this.temporaryStartMarker = new Point();
    this.temporaryStartMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.temporaryStartMarker);
    this.temporaryEndMarker = new Point();
    this.temporaryEndMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.temporaryEndMarker);
  }
  //eslint-disable-next-line
  mousePressed(event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    super.mouseMoved(event);
    if (this.isOnSphere && !this.makingALine) {
      // The user is making a line
      this.makingALine = true;

      // Decide if the starting location is near an already existing SEPoint or near a oneDimensional SENodule
      if (this.hitSEPoints.length > 0) {
        // Use an existing SEPoint to start the line
        const selected = this.hitSEPoints[0];
        this.startVector.copy(selected.locationVector);
        this.startSEPoint = this.hitSEPoints[0];
        this.temporaryStartMarker.positionVector = selected.locationVector;
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
        this.temporaryStartMarker.positionVector = this.startVector;
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
        this.temporaryStartMarker.positionVector = this.startVector;
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
        this.temporaryStartMarker.positionVector = this.startVector;
        this.startSEPoint = null;
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Record the location in a temporary point (startMarker found in MouseHandler).
        //  Eventually, we will create a new SEPoint and Point
        this.temporaryStartMarker.positionVector = this.currentSphereVector;
        this.startVector.copy(this.currentSphereVector);
        this.startSEPoint = null;
      }
      this.temporaryEndMarker.positionVector = this.currentSphereVector;
    }
  }
  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // Only one object can be interacted with at a given time, so set the first point nearby to glowing
    // The user can create points  on circles, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    // Also set the snap objects
    if (this.hitSEPoints.length > 0) {
      this.hitSEPoints[0].glowing = true;
      if (!this.makingALine) {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = this.hitSEPoints[0];
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = this.hitSEPoints[0];
      }
    } else if (this.hitSESegments.length > 0) {
      this.hitSESegments[0].glowing = true;
      if (!this.makingALine) {
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
      if (!this.makingALine) {
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
      if (!this.makingALine) {
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
    } else {
      this.snapStartMarkerToTemporaryOneDimensional = null;
      this.snapEndMarkerToTemporaryOneDimensional = null;
      this.snapStartMarkerToTemporaryPoint = null;
      this.snapEndMarkerToTemporaryPoint = null;
    }
    // Make sure that the event is on the sphere
    if (this.isOnSphere) {
      // if makingALine is true, the user has selected a center point
      if (!this.makingALine) {
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
            this.temporaryStartMarker.positionVector = this.snapStartMarkerToTemporaryPoint.locationVector;
          } else {
            this.temporaryStartMarker.removeFromLayers();
            this.isTemporaryStartMarkerAdded = false;
          }
        }
        // Set the location of the temporary startMarker by snapping to appropriate object (if any)
        if (this.snapStartMarkerToTemporaryOneDimensional !== null) {
          this.temporaryStartMarker.positionVector = this.snapStartMarkerToTemporaryOneDimensional.closestVector(
            this.currentSphereVector
          );
        } else if (this.snapStartMarkerToTemporaryPoint == null) {
          this.temporaryStartMarker.positionVector = this.currentSphereVector;
        }
      } else {
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
        if (this.snapEndMarkerToTemporaryOneDimensional !== null) {
          this.temporaryEndMarker.positionVector = this.snapEndMarkerToTemporaryOneDimensional.closestVector(
            this.currentSphereVector
          );
        } else {
          this.temporaryEndMarker.positionVector = this.currentSphereVector;
        }

        // If the temporary line has *not* been added to the scene do so now (only once)
        if (!this.isTemporaryLineAdded) {
          this.isTemporaryLineAdded = true;
          this.temporaryLine.addToLayers(this.layers);
        }
        // Compute the normal vector from the this.startVector, the (old) normal vector and this.temporaryEndMarker vector
        // Compute a temporary normal from the two points' vectors
        if (this.snapEndMarkerToTemporaryPoint === null) {
          this.tmpVector.crossVectors(
            this.startVector,
            this.temporaryEndMarker.positionVector
          );
        } else {
          this.tmpVector.crossVectors(
            this.startVector,
            this.snapEndMarkerToTemporaryPoint.locationVector
          );
        }
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

        // Set the normal vector to the line in the plottable object, this setter calls updateDisplay()
        this.temporaryLine.normalVector = this.normalVector;

        //update the display
        this.temporaryLine.updateDisplay();
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
    if (this.isOnSphere) {
      // Make sure the user didn't trigger the mouse leave event and is actually making a line
      if (this.makingALine) {
        if (
          this.startVector.angleTo(this.currentSphereVector) >
          SETTINGS.line.minimumLength
        ) {
          this.makeLine();
          // Get ready for the next line
          this.makingALine = false;
          if (this.startSEPoint) {
            this.startSEPoint.glowing = false;
            this.startSEPoint.selected = false;
          }
          this.startSEPoint = null;
          this.endSEPoint = null;
          this.startSEPointOneDimensionalParent = null;

          // Remove the temporary line and markers
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
          // call an unglow all command
          Highlighter.store.commit.unglowAllSENodules();
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
    this.makingALine = false;

    // call an unglow all command
    Highlighter.store.commit.unglowAllSENodules();
  }

  // Create a new line from the mouse event information
  private makeLine(): void {
    //Create a command group so this can be undone
    const lineGroup = new CommandGroup();

    if (this.startSEPoint === null) {
      // We have to create a new SEPointOnOneDimensional or SEPoint and Point
      const newStartPoint = new Point();
      // Set the display and size to the default values
      newStartPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      newStartPoint.adjustSize();
      // Create the plottable label
      const newLabel = new Label();

      let vtx: SEPoint | SEPointOnOneDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.startSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(
          newStartPoint,
          this.startSEPointOneDimensionalParent
        );
        newSELabel = new SELabel(newLabel, vtx);
        // Create and execute the command to create a new point for undo/redo
        lineGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.startSEPointOneDimensionalParent,
            newSELabel
          )
        );
      } else {
        // Starting mouse press landed on an open space
        vtx = new SEPoint(newStartPoint);
        newSELabel = new SELabel(newLabel, vtx);
        // Create and execute the command to create a new point for undo/redo
        lineGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      vtx.locationVector = this.startVector;
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
      this.startSEPoint instanceof SEIntersectionPoint &&
      !this.startSEPoint.isUserCreated
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      lineGroup.addCommand(
        new ConvertInterPtToUserCreatedCommand(this.startSEPoint)
      );
    }

    // Check to see if the release location is near any points
    if (this.hitSEPoints.length > 0) {
      this.endSEPoint = this.hitSEPoints[0];
      if (
        this.endSEPoint instanceof SEIntersectionPoint &&
        !this.endSEPoint.isUserCreated
      ) {
        // Mark the intersection point as created, the display style is changed and the glowing style is set up
        lineGroup.addCommand(
          new ConvertInterPtToUserCreatedCommand(this.endSEPoint)
        );
      }
    } else {
      // We have to create a new Point for the end
      const newEndPoint = new Point();
      // Set the display and size to the default values
      newEndPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      newEndPoint.adjustSize();
      // Create the plottable label
      const newLabel = new Label();

      let vtx: SEPoint | SEPointOnOneDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.hitSESegments.length > 0) {
        // The end of the line will be a point on a segment
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(newEndPoint, this.hitSESegments[0]);
        // Set the Location
        vtx.locationVector = this.hitSESegments[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);

        lineGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.hitSESegments[0],
            newSELabel
          )
        );
      } else if (this.hitSELines.length > 0) {
        // The end of the line will be a point on a line
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(newEndPoint, this.hitSELines[0]);
        // Set the Location
        vtx.locationVector = this.hitSELines[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);

        lineGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.hitSELines[0],
            newSELabel
          )
        );
      } else if (this.hitSECircles.length > 0) {
        // The end of the line will be a point on a circle
        vtx = new SEPointOnOneDimensional(newEndPoint, this.hitSECircles[0]);
        // Set the Location
        vtx.locationVector = this.hitSECircles[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);

        lineGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.hitSECircles[0],
            newSELabel
          )
        );
      } else {
        // The ending mouse release landed on an open space
        vtx = new SEPoint(newEndPoint);
        // Set the Location
        vtx.locationVector = this.currentSphereVector;
        newSELabel = new SELabel(newLabel, vtx);

        lineGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
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

    // Set the normal vector to the line in the plottable object, this setter calls updateDisplay()
    this.temporaryLine.normalVector = this.normalVector;

    // Create the new line after the normalVector is set
    const newLine = this.temporaryLine.clone();
    // Stylize the new Line
    newLine.stylize(DisplayStyle.ApplyCurrentVariables);
    newLine.adjustSize();

    const newSELine = new SELine(
      newLine,
      this.startSEPoint,
      this.normalVector,
      this.endSEPoint
    );
    // Create the plottable label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newSELine);
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
    this.store.getters
      .createAllIntersectionsWithLine(newSELine)
      .forEach((item: SEIntersectionReturnType) => {
        // Create the plottable label
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
      });
    lineGroup.execute();
  }

  activate(): void {
    // If there are exactly two (non-antipodal and not to near each other) SEPoints selected,
    // create a line with the two points
    if (this.store.state.selectedSENodules.length == 2) {
      const object1 = this.store.state.selectedSENodules[0];
      const object2 = this.store.state.selectedSENodules[1];

      if (object1 instanceof SEPoint && object2 instanceof SEPoint) {
        // Create a new plottable Line
        const newLine = new Line();
        // Set the display to the default values
        newLine.stylize(DisplayStyle.ApplyCurrentVariables);
        newLine.adjustSize();
        const newLabel = new Label();

        this.tmpVector.crossVectors(
          object1.locationVector,
          object2.locationVector
        );
        // Check to see if the points are antipodal
        if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
          // They are antipodal, create an arbitrary normal vector
          this.tmpVector.set(1, 0, 0);
          this.tmpVector.crossVectors(object1.locationVector, this.tmpVector);
          if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
            this.tmpVector.set(0, 1, 0);
            // The cross of object1.locationVector, and (1,0,0) and (0,1,0) can't *both* be zero
            this.tmpVector.crossVectors(object1.locationVector, this.tmpVector);
          }
        }

        // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
        const newSELine = new SELine(
          newLine,
          object1,
          this.tmpVector.normalize(),
          object2
        );
        // Update the newSECircle so the display is correct when the command group is executed
        newSELine.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });

        const newSELabel = new SELabel(newLabel, newSELine);
        this.tmpVector
          .addVectors(object1.locationVector, object2.locationVector)
          .normalize()
          .add(new Vector3(0, SETTINGS.line.initialLabelOffset, 0))
          .normalize();
        newSELabel.locationVector = this.tmpVector;

        const lineCommandGroup = new CommandGroup();
        lineCommandGroup.addCommand(
          new AddLineCommand(newSELine, object1, object2, newSELabel)
        );

        // Generate new intersection points. These points must be computed and created
        // in the store. Add the new created points to the circle command so they can be undone.
        this.store.getters
          .createAllIntersectionsWithLine(newSELine)
          .forEach((item: SEIntersectionReturnType) => {
            // Create the plottable label
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

            lineCommandGroup.addCommand(
              new AddIntersectionPointCommand(
                item.SEIntersectionPoint,
                item.parent1,
                item.parent2,
                newSELabel
              )
            );
            item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
            newSELabel.showing = false;
          });

        lineCommandGroup.execute();
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
