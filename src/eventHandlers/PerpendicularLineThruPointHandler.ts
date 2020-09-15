import Two, { Vector } from "two.js";
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
import Point from "@/plottables/Point";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import SETTINGS from "@/global-settings";
import { DisplayStyle } from "@/plottables/Nodule";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneDimensionalCommand";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";

export default class PerpendicularLineThruPointHandler extends Highlighter {
  /**
   * A temporary line to display while the user is creating a new line
   */
  private tempLine: Line;
  private temporaryLineAdded: boolean;
  private temporaryNormal = new Vector3(1, 0, 0); // The normal to the plane of the temporary line

  /**
   * A temporary plottable (TwoJS) point created while the user is making the circles or segments
   */
  protected tempPointMarker: Point;
  private temporaryPointAdded: boolean;

  /**
   * The one dimensional object and the point (to create line perpendicular to the object thru the point)
   */
  private oneDimensional: SEOneDimensional | null = null;
  private sePoint: SEPoint | null = null;
  /**
   * If the sePoint is a point on an oneDimensional parent, the parent is recorded in sePointOneDimensionalParent
   */
  private sePointOneDimensionalParent: SEOneDimensional | null = null;

  /**
   * The vector location of the sePoint, used for the tempLine and to create a new point if the user clicks on nothing
   */
  private sePointVector = new Vector3(0, 0, 0);

  /* temporary vector to help with computation */
  private tmpVector = new Vector3();

  /* A variable to ensure that only one object is selected with each mouse press event*/
  private selectOneObjectAtATime = true;

  constructor(layers: Two.Group[]) {
    super(layers);
    // Create and style the temporary line
    this.tempLine = new Line();
    this.tempLine.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.tempLine);
    this.temporaryLineAdded = false;

    // Create and style the temporary point marking the point on the perpendicular being created
    this.tempPointMarker = new Point();
    this.tempPointMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.tempPointMarker);
    this.temporaryPointAdded = false;
  }

  mousePressed(event: MouseEvent): void {
    //Select the objects to create the perpendicular
    if (this.isOnSphere) {
      // If we don't have selectOneObjectAtATime clicking on a point on a line/segment/circle selects both the point and the line/segment/circle
      this.selectOneObjectAtATime = true;
      // Fill the oneDimensional object first if there is a nearby one-dimensional object
      if (this.oneDimensional === null) {
        if (this.hitSESegments.length > 0) {
          this.oneDimensional = this.hitSESegments[0];
          this.oneDimensional.selected = true;
          this.selectOneObjectAtATime = false;
        } else if (this.hitSELines.length > 0) {
          this.oneDimensional = this.hitSELines[0];
          this.oneDimensional.selected = true;
          this.selectOneObjectAtATime = false;
        } else if (this.hitSECircles.length > 0) {
          this.oneDimensional = this.hitSECircles[0];
          this.oneDimensional.selected = true;
          this.selectOneObjectAtATime = false;
        }
      }
      // Second attempt to fill the point
      if (
        this.sePoint === null &&
        this.sePointOneDimensionalParent === null &&
        this.sePointVector.isZero() &&
        this.selectOneObjectAtATime
      ) {
        // Fill the point object first by the nearby points, then by nearby intersection points,
        // then point on one-dimensional object, then by creating a new point
        if (this.hitSEPoints.length > 0) {
          this.sePoint = this.hitSEPoints[0];
          this.sePoint.selected = true;
          this.sePointVector.copy(this.sePoint.locationVector);
        } else if (this.hitSESegments.length > 0) {
          // The start of the line will be a point on a segment
          //  Eventually, we will create a new SEPointOneDimensional and Point
          this.sePointOneDimensionalParent = this.hitSESegments[0];
          this.sePointVector.copy(
            this.sePointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.tempPointMarker.positionVector = this.sePointVector;
          this.tempPointMarker.addToLayers(this.layers);
          this.temporaryPointAdded = true;
          this.sePoint = null;
        } else if (this.hitSELines.length > 0) {
          // The start of the line will be a point on a line
          //  Eventually, we will create a new SEPointOneDimensional and Point
          this.sePointOneDimensionalParent = this.hitSELines[0];
          this.sePointVector.copy(
            this.sePointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.tempPointMarker.positionVector = this.sePointVector;
          this.tempPointMarker.addToLayers(this.layers);
          this.temporaryPointAdded = true;
          this.sePoint = null;
        } else if (this.hitSECircles.length > 0) {
          // The start of the line will be a point on a circle
          //  Eventually, we will create a new SEPointOneDimensional and Point
          this.sePointOneDimensionalParent = this.hitSECircles[0];
          this.sePointVector.copy(
            this.sePointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.tempPointMarker.positionVector = this.sePointVector;
          this.tempPointMarker.addToLayers(this.layers);
          this.temporaryPointAdded = true;
          this.sePoint = null;
        } else {
          // The mouse press is not near an existing point or one dimensional object.
          //  Record the location in a temporary point (tempPointMarker found in MouseHandler).
          //  Eventually, we will create a new SEPoint and Point
          this.tempPointMarker.positionVector = this.currentSphereVector;
          this.sePointVector.copy(this.currentSphereVector);
          this.tempPointMarker.addToLayers(this.layers);
          this.temporaryPointAdded = true;
          this.sePoint = null;
        }
      }

      // As soon as both oneDimensional and point objects are not null do the perpendicular
      if (
        this.oneDimensional !== null &&
        (this.sePoint !== null ||
          this.sePointOneDimensionalParent !== null ||
          !this.sePointVector.isZero())
      ) {
        this.createPerpendicular(
          this.oneDimensional,
          this.sePointOneDimensionalParent,
          this.sePointVector,
          this.sePoint
        );
        // Reset the oneDimensional and point in preparation for another perpendicular.
        this.oneDimensional.selected = false;
        this.oneDimensional = null;
        this.sePointOneDimensionalParent = null;
        if (this.sePoint !== null) {
          this.sePoint.selected = false;
        }
        this.sePoint = null;
        if (this.temporaryPointAdded) {
          this.tempPointMarker.removeFromLayers();
          this.temporaryPointAdded = false;
        }
        this.tempPointMarker.removeFromLayers();
        this.temporaryPointAdded = false;
        if (this.temporaryLineAdded) {
          this.tempLine.removeFromLayers();
          this.temporaryLineAdded = false;
        }
        this.sePointVector.set(0, 0, 0);
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight all nearby objects and update location vectors
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (
        this.sePoint === null &&
        this.sePointOneDimensionalParent === null &&
        this.sePointVector.isZero() &&
        this.oneDimensional !== null
      ) {
        // add the temporary point to the display and set its location to the currentSphereVector
        if (!this.temporaryPointAdded) {
          this.tempPointMarker.addToLayers(this.layers);
          this.temporaryPointAdded = true;
        }
        this.tempPointMarker.positionVector = this.currentSphereVector;
      }
      if (this.oneDimensional !== null) {
        // add the temporary line to the display and set its position using the oneDimensional and the currentSphereVector  to the position of the pointer
        // Set the normal vector to the line in the plottable object, this setter calls updateDisplay()
        this.temporaryNormal.copy(
          this.oneDimensional.getNormalToLineThru(
            this.currentSphereVector,
            this.temporaryNormal
          )
        );
        this.tempLine.normalVector = this.temporaryNormal;
        if (!this.temporaryLineAdded) {
          this.tempLine.addToLayers(this.layers);
          this.temporaryLineAdded = true;
        }
      }
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset all the variables in preparation for another perpendicular
    if (this.oneDimensional !== null) {
      this.oneDimensional.selected = false;
      this.oneDimensional = null;
    }
    if (this.sePoint !== null) {
      this.sePoint.selected = false;
      this.sePoint = null;
    }
    if (this.sePointOneDimensionalParent !== null) {
      this.sePointOneDimensionalParent = null;
    }
    this.tempPointMarker.removeFromLayers();
    this.temporaryPointAdded = false;

    this.tempLine.removeFromLayers();
    this.temporaryLineAdded = false;

    this.sePointVector.set(0, 0, 0);
  }
  createPerpendicular(
    oneDimensional: SEOneDimensional,
    sePointOneDimensionalParent: SEOneDimensional | null,
    sePointVector: Vector3,
    sePoint: SEPoint | null
  ): void {
    // Create a command group to create a new perpendicular line, possibly new point, and to record all the new intersections for undo/redo
    const addPerpendicularLineGroup = new CommandGroup();

    // First create a point if needed. If sePoint is not null, then a point already exists and doesn't need to be created
    if (sePoint === null) {
      // create a
      const newPoint = new Point();
      // Set the display to the default values
      newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      newPoint.adjustSize();
      // Create plottable for the Label
      const newLabel = new Label();
      if (sePointOneDimensionalParent !== null) {
        // create new point on one dimensional object
        // Create the model object for the new point and link them
        this.sePoint = new SEPointOnOneDimensional( // Use  this.sePoint so that this variable points to the parent point, no matter how it is created or picked
          newPoint,
          sePointOneDimensionalParent
        );
        this.sePoint.locationVector = sePointOneDimensionalParent.closestVector(
          sePointVector
        );
        const newSELabel = new SELabel(newLabel, this.sePoint);
        // Set the initial label location
        this.tmpVector
          .copy(this.sePoint.locationVector)
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
          new AddPointOnOneDimensionalCommand(
            this.sePoint,
            sePointOneDimensionalParent,
            newSELabel
          )
        );
      } else {
        // Create a new point at the blank place where the user clicked
        this.sePoint = new SEPoint(newPoint);
        this.sePoint.locationVector = sePointVector;
        const newSELabel = new SELabel(newLabel, this.sePoint);
        // Set the initial label location
        this.tmpVector
          .copy(this.sePoint.locationVector)
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
          new AddPointCommand(this.sePoint, newSELabel)
        );
      }
    } else {
      // sePoint is not null so either sePoint is an existing point (in which case nothing needs to be created)
      // or an intersection point that need to be converted to isUserCreated
      if (
        sePoint instanceof SEIntersectionPoint &&
        !(sePoint as SEIntersectionPoint).isUserCreated
      ) {
        //Make it user created and turn on the display
        addPerpendicularLineGroup.addCommand(
          new ConvertInterPtToUserCreatedCommand(sePoint as SEIntersectionPoint)
        );
      }
      this.sePoint = sePoint;
    }

    // For each type of oneDimensional compute the normal vector
    if (
      oneDimensional instanceof SELine ||
      oneDimensional instanceof SESegment
    ) {
      // Line/segment point perpendicular
      this.tmpVector.crossVectors(sePointVector, oneDimensional.normalVector);
      // Check to see if the tmpVector is zero (i.e the normal vector to the line and given point are parallel -- ether
      // nearly antipodal or in the same direction)
      if (this.tmpVector.isZero()) {
        // In this case any line containing the sePoint will be perpendicular to the line/segment, so choose the one thru the start point of the line
        this.tmpVector.crossVectors(
          sePointVector,
          oneDimensional.startSEPoint.locationVector
        );
      }
    }

    if (oneDimensional instanceof SECircle) {
      // Circle point perpendicular
      this.tmpVector.crossVectors(
        sePointVector,
        oneDimensional.centerSEPoint.locationVector
      );
      // Check to see if the tmpVector is zero (i.e the center vector and given point are parallel -- ether
      // nearly antipodal or in the same direction)
      if (this.tmpVector.isZero()) {
        // In this case any line containing the sePoint will be perpendicular to the circle, so choose the one thru the circle point of the circle
        this.tmpVector.crossVectors(
          sePointVector,
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
    endSEPoint.locationVector.crossVectors(sePointVector, this.tmpVector);

    // Create a plottable line to display for this perpendicular
    const plottableLine = new Line();
    // Stylize the new Line
    plottableLine.stylize(DisplayStyle.ApplyCurrentVariables);
    plottableLine.adjustSize();

    // Create the model(SE) perpendicular line for the new point and link them
    const newPerpLine = new SEPerpendicularLineThruPoint(
      plottableLine,
      oneDimensional,
      this.sePoint,
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

    addPerpendicularLineGroup.addCommand(
      new AddPerpendicularLineThruPointCommand(
        newPerpLine,
        this.sePoint,
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
          null,
          (object2 as SEPoint).locationVector,
          object2 as SEPoint
        );
      }

      if (object2.isOneDimensional() && object1.isPoint()) {
        this.createPerpendicular(
          object2 as SEOneDimensional,
          null,
          (object1 as SEPoint).locationVector,
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
