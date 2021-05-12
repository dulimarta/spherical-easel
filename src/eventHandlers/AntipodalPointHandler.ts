import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import NonFreePoint from "@/plottables/NonFreePoint";
import { AddAntipodalPointCommand } from "@/commands/AddAntipodalPointCommand";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { UpdateMode, OneDimensional, SEOneDimensional } from "@/types";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import Point from "@/plottables/Point";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneDimensionalCommand";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { SENodule } from "@/models/SENodule";

export default class AntipodalPointHandler extends Highlighter {
  /**
   * The parent of this point
   */
  private parentPoint: SEPoint | null = null;

  /**
   * If the user clicks on a one dimensional, create a point on that one dimensional *and* create the antipode of that point
   */
  private oneDimensionalContainingParentPoint: SEOneDimensional | null = null;

  /**
   * The location of the parentPoint, if the uer clicks on empty space, then create a new point at this location *and* the antipode of that new point
   */

  private parentPointVector = new Vector3(0, 0, 0);

  /* temporary vector to help with computation */
  private tmpVector = new Vector3();

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select the point object to create the antipode of
    if (this.isOnSphere) {
      if (this.hitSEPoints.length > 0) {
        // The user selected an existing point
        this.parentPoint = this.hitSEPoints[0];
        this.parentPointVector.copy(this.parentPoint.locationVector);
        this.oneDimensionalContainingParentPoint = null;
      } else if (this.hitSESegments.length > 0) {
        // The user selected a segment and we will create a point on it
        this.oneDimensionalContainingParentPoint = this.hitSESegments[0];
        this.parentPointVector.copy(
          this.oneDimensionalContainingParentPoint.closestVector(
            this.currentSphereVector
          )
        );
        this.parentPoint = null;
      } else if (this.hitSELines.length > 0) {
        // The user selected a line and we will create a point on it
        this.oneDimensionalContainingParentPoint = this.hitSELines[0];
        this.parentPointVector.copy(
          this.oneDimensionalContainingParentPoint.closestVector(
            this.currentSphereVector
          )
        );
        this.parentPoint = null;
      } else if (this.hitSECircles.length > 0) {
        // The user selected a circle and we will create a point on it
        this.oneDimensionalContainingParentPoint = this.hitSECircles[0];
        this.parentPointVector.copy(
          this.oneDimensionalContainingParentPoint.closestVector(
            this.currentSphereVector
          )
        );
        this.parentPoint = null;
      } else {
        // The user selected an empty location and we will create a point there
        this.parentPointVector.copy(this.currentSphereVector);
        this.parentPoint = null;
        this.oneDimensionalContainingParentPoint = null;
      }

      if (!this.parentPointVector.isZero()) {
        const antipodalCommandGroup = new CommandGroup();
        if (this.parentPoint !== null) {
          if (
            this.parentPoint instanceof SEIntersectionPoint &&
            !(this.parentPoint as SEIntersectionPoint).isUserCreated
          ) {
            //Make it user created and turn on the display
            antipodalCommandGroup.addCommand(
              new ConvertInterPtToUserCreatedCommand(
                this.parentPoint as SEIntersectionPoint
              )
            );
          }
        } else if (this.oneDimensionalContainingParentPoint !== null) {
          // create a new point on the object that the user clicked on
          const newPoint = new Point();
          // Set the display to the default values
          newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
          newPoint.adjustSize();
          // Create plottable for the Label
          const newLabel = new Label();

          // Create the model object for the new point and link them
          this.parentPoint = new SEPointOnOneDimensional(
            newPoint,
            this.oneDimensionalContainingParentPoint
          );
          this.parentPoint.locationVector = this.parentPointVector;
          const newSELabel = new SELabel(newLabel, this.parentPoint);
          // Set the initial label location
          this.tmpVector
            .copy(this.parentPoint.locationVector)
            .add(
              new Vector3(
                2 * SETTINGS.point.initialLabelOffset,
                SETTINGS.point.initialLabelOffset,
                0
              )
            )
            .normalize();
          newSELabel.locationVector = this.tmpVector;
          // Create and execute the command to create a new point for undo/redo
          //new AddPointCommand(vtx, newSELabel).execute();
          antipodalCommandGroup.addCommand(
            new AddPointOnOneDimensionalCommand(
              this.parentPoint,
              this.oneDimensionalContainingParentPoint,
              newSELabel
            )
          );
        } else {
          // Create a new point at the blank place where the user clicked
          const newPoint = new Point();
          // Set the display to the default values
          newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
          newPoint.adjustSize();
          // Create plottable for the Label
          const newLabel = new Label();

          this.parentPoint = new SEPoint(newPoint);
          this.parentPoint.locationVector = this.parentPointVector;
          const newSELabel = new SELabel(newLabel, this.parentPoint);
          // Set the initial label location
          this.tmpVector
            .copy(this.parentPoint.locationVector)
            .add(
              new Vector3(
                2 * SETTINGS.point.initialLabelOffset,
                SETTINGS.point.initialLabelOffset,
                0
              )
            )
            .normalize();
          newSELabel.locationVector = this.tmpVector;

          antipodalCommandGroup.addCommand(
            new AddPointCommand(this.parentPoint, newSELabel)
          );
        }

        const newPoint = new NonFreePoint();
        // Set the display to the default values
        newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
        newPoint.adjustSize();

        // Create the model object for the new point and link them
        const vtx = new SEAntipodalPoint(newPoint, this.parentPoint);

        // Create the plottable label
        const newLabel = new Label();
        const newSELabel = new SELabel(newLabel, vtx);

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

        // Create and execute the command to create a new point for undo/redo
        antipodalCommandGroup
          .addCommand(
            new AddAntipodalPointCommand(vtx, this.parentPoint, newSELabel)
          )
          .execute();
        // Update the display of the antipodal point
        vtx.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });

        // reset in prep for next antipodal point
        this.parentPoint = null;
        this.oneDimensionalContainingParentPoint = null;
        this.parentPointVector.set(0, 0, 0);
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // Only one point can be processed at a time, so set the first point nearby to glowing
    // The user can create points (with the antipode) on circles, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    if (this.hitSEPoints.length > 0) {
      this.hitSEPoints[0].glowing = true;
    } else if (this.hitSESegments.length > 0) {
      this.hitSESegments[0].glowing = true;
    } else if (this.hitSELines.length > 0) {
      this.hitSELines[0].glowing = true;
    } else if (this.hitSECircles.length > 0) {
      this.hitSECircles[0].glowing = true;
    }
  }
  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the parent point in preparation for another antipodal points.
    this.parentPoint = null;
    this.oneDimensionalContainingParentPoint = null;
    this.parentPointVector.set(0, 0, 0);
  }
  activate(): void {
    // If there is exactly one point selected, create its anitpode
    if (this.store.getters.selectedSENodules().length == 1) {
      const object = this.store.getters.selectedSENodules()[0];
      if (object instanceof SEPoint) {
        const newPoint = new NonFreePoint();
        // Set the display to the default values
        newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
        newPoint.adjustSize();

        // Create the model object for the new point and link them
        const vtx = new SEAntipodalPoint(newPoint, object);

        // Create the plottable label
        const newLabel = new Label();
        const newSELabel = new SELabel(newLabel, vtx);

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

        // Create and execute the command to create a new point for undo/redo
        new AddAntipodalPointCommand(vtx, object, newSELabel).execute();
        // Update the display of the antipodal point
        vtx.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
