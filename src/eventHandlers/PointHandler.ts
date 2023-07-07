import { SEPoint } from "@/models/SEPoint";
import Point from "@/plottables/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneOrTwoDimensionalCommand";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import EventBus from "./EventBus";
import { SEOneOrTwoDimensional } from "@/types";
import Two from "two.js";
// import { Group } from "two.js/src/group";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetPointUserCreatedValueCommand } from "@/commands/SetPointUserCreatedValueCommand";

export default class PointHandler extends Highlighter {
  // The temporary point displayed as the user moves the pointer
  private isTemporaryPointAdded = false;
  /**
   * As the user moves the pointer around snap the temporary marker to this object temporarily
   */
  protected snapToTemporaryOneDimensional: SEOneOrTwoDimensional | null = null;
  /**
   * A temporary plottable (TwoJS) point created while the user is making a point
   */
  protected startMarker: Point;
  /* temporary vector to help with computation */
  private tmpVector = new Vector3();

  constructor(layers: Two.Group[]) {
    super(layers);
    // Create and style the temporary points marking the object being created
    this.startMarker = new Point();
    PointHandler.store.addTemporaryNodule(this.startMarker);
  }

  mousePressed(event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will create a new point at the same location. This is not what we want so
    // we call super.mouseMove
    super.mouseMoved(event);

    if (this.isOnSphere) {
      // If this is near any other points do not create a new point, unless the hitSEPoint is an uncreated intersection or antipodeal point
      if (this.hitSEPoints.length > 0) {
        if (
          (this.hitSEPoints[0] instanceof SEIntersectionPoint &&
            !this.hitSEPoints[0].isUserCreated) ||
          (this.hitSEPoints[0] instanceof SEAntipodalPoint &&
            !this.hitSEPoints[0].isUserCreated)
        ) {
          //Make it user created and turn on the display
          // set the display to visible order
          const antipodalCommandGroup = new CommandGroup();
          antipodalCommandGroup.addCommand(
            new SetPointUserCreatedValueCommand(
              this.hitSEPoints[0] as SEIntersectionPoint,
              true
            )
          );
          antipodalCommandGroup.execute();
          return;
        }
        EventBus.fire("show-alert", {
          key: `handlers.pointCreationAttemptDuplicate`,
          keyOptions: {},
          type: "error"
        });
        return;
      } else {
        //#region linkNoduleSENodule
        const pointCommandGroup = new CommandGroup();
        // create a new Point
        let vtx: SEPointOnOneOrTwoDimensional | SEPoint | null = null;
        let newSELabel: SELabel | null = null;

        if (this.hitSESegments.length > 0) {
          // The new point will be a point on a segment
          // Create the model object for the new point and link them
          vtx = new SEPointOnOneOrTwoDimensional(this.hitSESegments[0]);
          vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
          newSELabel = new SELabel("point", vtx);

          // Create and execute the command to create a new point for undo/redo
          pointCommandGroup.addCommand(
            new AddPointOnOneDimensionalCommand(
              vtx as SEPointOnOneOrTwoDimensional,
              this.hitSESegments[0],
              newSELabel
            )
          );
          //#endregion linkNoduleSENodule
        } else if (this.hitSELines.length > 0) {
          // The new point will be a point on a line
          // Create the model object for the new point and link them
          vtx = new SEPointOnOneOrTwoDimensional(this.hitSELines[0]);
          vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
          newSELabel = new SELabel("point", vtx);

          // Create and execute the command to create a new point for undo/redo
          pointCommandGroup.addCommand(
            new AddPointOnOneDimensionalCommand(
              vtx as SEPointOnOneOrTwoDimensional,
              this.hitSELines[0],
              newSELabel
            )
          );
        } else if (this.hitSECircles.length > 0) {
          // The new point will be a point on a circle
          // Create the model object for the new point and link them
          vtx = new SEPointOnOneOrTwoDimensional(this.hitSECircles[0]);
          vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
          newSELabel = new SELabel("point", vtx);

          // Create and execute the command to create a new point for undo/redo
          pointCommandGroup.addCommand(
            new AddPointOnOneDimensionalCommand(
              vtx as SEPointOnOneOrTwoDimensional,
              this.hitSECircles[0],
              newSELabel
            )
          );
        } else if (this.hitSEEllipses.length > 0) {
          // The new point will be a point on an ellipse
          // Create the model object for the new point and link them
          vtx = new SEPointOnOneOrTwoDimensional(this.hitSEEllipses[0]);
          vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
          newSELabel = new SELabel("point", vtx);

          // Create and execute the command to create a new point for undo/redo
          pointCommandGroup.addCommand(
            new AddPointOnOneDimensionalCommand(
              vtx as SEPointOnOneOrTwoDimensional,
              this.hitSEEllipses[0],
              newSELabel
            )
          );
        } else if (this.hitSEParametrics.length > 0) {
          // The new point will be a point on an ellipse
          // Create the model object for the new point and link them
          vtx = new SEPointOnOneOrTwoDimensional(this.hitSEParametrics[0]);
          vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
          newSELabel = new SELabel("point", vtx);

          // Create and execute the command to create a new point for undo/redo
          pointCommandGroup.addCommand(
            new AddPointOnOneDimensionalCommand(
              vtx as SEPointOnOneOrTwoDimensional,
              this.hitSEParametrics[0],
              newSELabel
            )
          );
        } else if (this.hitSEPolygons.length > 0) {
          // The new point will be a point on an ellipse
          // Create the model object for the new point and link them
          vtx = new SEPointOnOneOrTwoDimensional(this.hitSEPolygons[0]);
          vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
          newSELabel = new SELabel("point", vtx);

          // Create and execute the command to create a new point for undo/redo
          pointCommandGroup.addCommand(
            new AddPointOnOneDimensionalCommand(
              vtx as SEPointOnOneOrTwoDimensional,
              this.hitSEPolygons[0],
              newSELabel
            )
          );
        } else {
          // mouse press on empty location so create a free point
          // Create the model object for the new point and link them
          vtx = new SEPoint();
          vtx.locationVector = this.currentSphereVector;
          newSELabel = new SELabel("point", vtx);

          // Create and execute the command to create a new point for undo/redo
          pointCommandGroup.addCommand(new AddPointCommand(vtx, newSELabel));
        }

        /////////////
        // Create the antipode of the new point, vtx
        PointHandler.addCreateAntipodeCommand(vtx, pointCommandGroup);
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
        pointCommandGroup.execute();
      }
    } else if (this.isTemporaryPointAdded) {
      // Remove the temporary object
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // glow/highlight all the nearby objects that a point might be put on
    // Only one point can be processed at a time, so set the first point that is not user created nearby to glowing
    // The user can create points on ellipse, circles, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    if (this.hitSEPoints.length > 0) {
      const filteredIntersections = this.hitSEPoints.filter(
        p =>
          (p instanceof SEIntersectionPoint && !p.isUserCreated) ||
          (p instanceof SEAntipodalPoint && !p.isUserCreated)
      );
      if (filteredIntersections.length > 0) {
        filteredIntersections[0].glowing = true;
        this.snapToTemporaryOneDimensional = null;
      }
    } else if (this.hitSESegments.length > 0) {
      this.hitSESegments[0].glowing = true;
      this.snapToTemporaryOneDimensional = this.hitSESegments[0];
    } else if (this.hitSELines.length > 0) {
      this.hitSELines[0].glowing = true;
      this.snapToTemporaryOneDimensional = this.hitSELines[0];
    } else if (this.hitSECircles.length > 0) {
      this.hitSECircles[0].glowing = true;
      this.snapToTemporaryOneDimensional = this.hitSECircles[0];
    } else if (this.hitSEEllipses.length > 0) {
      this.hitSEEllipses[0].glowing = true;
      this.snapToTemporaryOneDimensional = this.hitSEEllipses[0];
    } else if (this.hitSEParametrics.length > 0) {
      this.hitSEParametrics[0].glowing = true;
      this.snapToTemporaryOneDimensional = this.hitSEParametrics[0];
    } else if (this.hitSEPolygons.length > 0) {
      this.hitSEPolygons[0].glowing = true;
      this.snapToTemporaryOneDimensional = this.hitSEPolygons[0];
    } else {
      this.snapToTemporaryOneDimensional = null;
    }
    if (this.isOnSphere) {
      if (!this.isTemporaryPointAdded) {
        this.isTemporaryPointAdded = true;
        // Add the temporary point to the appropriate layers
        this.startMarker.addToLayers(this.layers);
      }
      // Move the temporary point to the location of the mouse event, and update the display, snap to a nearby one dimensional object (if there is one)
      if (this.snapToTemporaryOneDimensional === null) {
        this.startMarker.positionVector = this.currentSphereVector;
      } else {
        this.startMarker.positionVector =
          this.snapToTemporaryOneDimensional.closestVector(
            this.currentSphereVector
          );
      }

      // If there is a nearby (possibly user created or not) point turn off the temporary marker
      if (this.hitSEPoints.length > 0) {
        if (this.isTemporaryPointAdded) {
          // Remove the temporary object
          this.startMarker.removeFromLayers();
          this.isTemporaryPointAdded = false;
          this.snapToTemporaryOneDimensional = null;
        }
      }
    } else if (this.isTemporaryPointAdded) {
      //if not on the sphere and the temporary segment has been added remove the temporary objects
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
      this.snapToTemporaryOneDimensional = null;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {
    /* None */
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);

    if (this.isTemporaryPointAdded) {
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
    }
    this.snapToTemporaryOneDimensional = null;
  }
  activate(): void {
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
