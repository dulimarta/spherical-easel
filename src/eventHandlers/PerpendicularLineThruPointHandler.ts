import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { AddPerpendicularLineThruPointCommand } from "@/commands/AddPerpendicularLineThruPointCommand";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SELabel } from "@/models/SELabel";
import {
  IntersectionReturnType,
  SEOneDimensional,
  UpdateMode,
  SEIntersectionReturnType
} from "@/types";
import store from "@/store";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEPoint } from "@/models/SEPoint";
import { Vector3 } from "three";
import NonFreePoint from "@/plottables/NonFreePoint";
import Line from "@/plottables/Line";
import Label from "@/plottables/Label";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import SETTINGS from "@/global-settings";
import { DisplayStyle } from "@/plottables/Nodule";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";

export default class PerpendicularLineThruPointHandler extends Highlighter {
  /**
   * The one dimensional object and the point (to create line perpendicular to the object thru the point)
   */
  private oneDimensional: SEOneDimensional | null = null;
  private sePoint: SEPoint | null = null;

  /* temporary vector to help with computation */
  private tmpVector = new Vector3();

  /* A varible to ensure that only one object is selected with each mousepress event*/
  private selectOneObjectAtATime = true;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select the objects to intersect
    if (this.isOnSphere) {
      // If we don't have selectOneObjectAtATime clicking on a point on a line/segment/circle selects both the point and the line/segment/circle
      this.selectOneObjectAtATime = true;
      // Fill the point first, prioritize points over the one-dimensional
      if (this.sePoint === null && this.selectOneObjectAtATime) {
        // Fill the point object first by the nearby points, ????then by nearby intersection points,
        // ????then point on one-dimensional object, ????then by creating a new point
        if (this.hitSEPoints.length > 0) {
          this.sePoint = this.hitSEPoints[0];
          this.sePoint.selected = true;
          this.selectOneObjectAtATime = false;
        }
      }

      // Fill the oneDimensional object second
      if (this.oneDimensional === null && this.selectOneObjectAtATime) {
        if (this.hitSESegments.length > 0) {
          this.oneDimensional = this.hitSESegments[0];
          this.oneDimensional.selected = true;
        } else if (this.hitSELines.length > 0) {
          this.oneDimensional = this.hitSELines[0];
          this.oneDimensional.selected = true;
        } else if (this.hitSECircles.length > 0) {
          this.oneDimensional = this.hitSECircles[0];
          this.oneDimensional.selected = true;
        }
      }

      // As soon as both oneDimensional and point objects are not null do the perpendicular
      if (this.oneDimensional != null && this.sePoint != null) {
        this.createPerpendicular(this.oneDimensional, this.sePoint);
        // Reset the oneDimensional and point in preparation for another perpendicular.
        this.oneDimensional.selected = false;
        this.oneDimensional = null;
        this.sePoint.selected = false;
        this.sePoint = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight all nearby objects and update location vectors
    super.mouseMoved(event);
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the oneDimensional in preparation for another perpendicular
    if (this.oneDimensional !== null) {
      this.oneDimensional.selected = false;
      this.oneDimensional = null;
    }
    if (this.sePoint !== null) {
      this.sePoint.selected = false;
      this.sePoint = null;
    }
  }
  createPerpendicular(
    oneDimensional: SEOneDimensional,
    sePoint: SEPoint
  ): void {
    // For each type of oneDimensional compute the normal vector
    if (
      oneDimensional instanceof SELine ||
      oneDimensional instanceof SESegment
    ) {
      // Line/segment point perpendicular
      this.tmpVector.crossVectors(
        sePoint.locationVector,
        oneDimensional.normalVector
      );
      // Check to see if the tmpVector is zero (i.e the normal vector to the line and given point are parallel -- ether
      // nearly antipodal or in the same direction)
      if (this.tmpVector.isZero()) {
        // In this case any line containing the sePoint will be perpendicular to the line/segment, so choose the one thru the start point of the line
        this.tmpVector.crossVectors(
          sePoint.locationVector,
          oneDimensional.startSEPoint.locationVector
        );
      }
    }

    if (oneDimensional instanceof SECircle) {
      // Circle point perpendicular
      this.tmpVector.crossVectors(
        sePoint.locationVector,
        oneDimensional.centerSEPoint.locationVector
      );
      // Check to see if the tmpVector is zero (i.e the center vector and given point are parallel -- ether
      // nearly antipodal or in the same direction)
      if (this.tmpVector.isZero()) {
        // In this case any line containing the sePoint will be perpendicular to the circle, so choose the one thru the circle point of the circle
        this.tmpVector.crossVectors(
          sePoint.locationVector,
          oneDimensional.circleSEPoint.locationVector
        );
      }
    }
    // this.tmpVector is the normal vector to the plane containing the line perpendicular to the one Dimensional through the point
    this.tmpVector.normalize();

    // Create the endSEPoint for the line
    // First we have to create a plottable point because we can't create a SEPoint with out a plottable one
    const plottableEndPoint = new NonFreePoint();
    // The endSEPoint is never shown and can never be selected (so it is never added to the store via Command.store.commit.addPoint).
    // The endSEPoint is also never added to the object tree structure (via un/registrerChild) because it is
    // updated when the the new SEPerpendicularLineThruPoint is updated.
    const endSEPoint = new SEPoint(plottableEndPoint);
    endSEPoint.showing = false;
    endSEPoint.locationVector.crossVectors(
      sePoint.locationVector,
      this.tmpVector
    );

    // Create a plottable line to display for this perpendicular
    const plottableLine = new Line();
    // Stylize the new Line
    plottableLine.stylize(DisplayStyle.ApplyCurrentVariables);
    plottableLine.adjustSize();

    // Create the model(SE) perpendicular line for the new point and link them
    const newPerpLine = new SEPerpendicularLineThruPoint(
      plottableLine,
      oneDimensional,
      sePoint,
      this.tmpVector,
      endSEPoint
    );
    // Update the display of the perpendicular line
    newPerpLine.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });

    // Create the plottable label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newPerpLine);

    // Set the initial label location
    this.tmpVector
      .copy(endSEPoint.locationVector)
      .add(
        new Vector3(
          2 * SETTINGS.point.initialLabelOffset,
          SETTINGS.point.initialLabelOffset,
          0
        )
      )
      .normalize();
    newSELabel.locationVector = this.tmpVector;

    // Create a command group to create a new perpendicular line and record all the new intersections for undo/redo
    const addPerpendicularLineGroup = new CommandGroup();
    addPerpendicularLineGroup.addCommand(
      new AddPerpendicularLineThruPointCommand(
        newPerpLine,
        sePoint,
        oneDimensional,
        newSELabel
      )
    );

    // Determine all new intersection points and add their creation to the command so it can be undone
    this.store.getters
      .createAllIntersectionsWithLine(newPerpLine)
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

        addPerpendicularLineGroup.addCommand(
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
    addPerpendicularLineGroup.execute();
  }
  activate(): void {
    if (this.store.getters.selectedSENodules().length == 2) {
      const object1 = this.store.getters.selectedSENodules()[0];
      const object2 = this.store.getters.selectedSENodules()[1];

      if (object1.isOneDimensional() && object2.isPoint()) {
        this.createPerpendicular(
          object1 as SEOneDimensional,
          object2 as SEPoint
        );
      }

      if (object2.isOneDimensional() && object1.isPoint()) {
        this.createPerpendicular(
          object2 as SEOneDimensional,
          object1 as SEPoint
        );
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }

  deactivate(): void {
    super.deactivate();
  }
}
