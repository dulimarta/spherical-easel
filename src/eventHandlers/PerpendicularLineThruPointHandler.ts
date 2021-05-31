import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { AddPerpendicularLineThruPointCommand } from "@/commands/AddPerpendicularLineThruPointCommand";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SELabel } from "@/models/SELabel";
import {
  SEOneDimensional,
  UpdateMode,
  SEIntersectionReturnType
} from "@/types";
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
import EventBus from "./EventBus";

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
  protected temporaryPointMarker: Point;
  private temporaryPointAdded: boolean;

  /**
   * As the user moves the pointer around snap the temporary point marker to this object temporarily
   */
  protected snapToTemporaryOneDimensional: SEOneDimensional | null = null;
  protected snapToTemporaryPoint: SEPoint | null = null;

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
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();

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
    this.temporaryPointMarker = new Point();
    this.temporaryPointMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.temporaryPointMarker);
    this.temporaryPointAdded = false;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  mousePressed(event: MouseEvent): void {
    //Select the objects to create the perpendicular
    if (this.isOnSphere) {
      // If we don't have selectOneObjectAtATime clicking on a point on a line/segment/circle selects both the point and the line/segment/circle
      this.selectOneObjectAtATime = true;
      // Attempt to fill the point
      if (
        this.sePoint === null &&
        this.sePointOneDimensionalParent === null &&
        this.sePointVector.isZero() &&
        (this.hitSEPoints.length !== 0 ||
          this.oneDimensional !== null ||
          this.hitSENodules.length === 0)
      ) {
        // Fill the point object first by the nearby points, then by nearby intersection points,
        // then point on one-dimensional object, then by creating a new point
        if (this.hitSEPoints.length > 0) {
          this.sePoint = this.hitSEPoints[0];
          this.sePoint.selected = true;
          this.sePointVector.copy(this.sePoint.locationVector);
          // if the point is an intersection point and is not user created add a temporary marker
          if (
            this.sePoint instanceof SEIntersectionPoint &&
            !this.sePoint.isUserCreated
          ) {
            this.temporaryPointMarker.positionVector = this.sePointVector;
            this.temporaryPointMarker.addToLayers(this.layers);
            this.temporaryPointAdded = true;
          }
        } else if (this.hitSESegments.length > 0) {
          // The start of the line will be a point on a segment
          //  Eventually, we will create a new SEPointOneDimensional and Point
          this.sePointOneDimensionalParent = this.hitSESegments[0];
          this.sePointVector.copy(
            this.sePointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryPointMarker.positionVector = this.sePointVector;
          this.temporaryPointMarker.addToLayers(this.layers);
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
          this.temporaryPointMarker.positionVector = this.sePointVector;
          this.temporaryPointMarker.addToLayers(this.layers);
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
          this.temporaryPointMarker.positionVector = this.sePointVector;
          this.temporaryPointMarker.addToLayers(this.layers);
          this.temporaryPointAdded = true;
          this.sePoint = null;
        } else {
          // The mouse press is not near an existing point or one dimensional object.
          //  Record the location in a temporary point (tempPointMarker found in MouseHandler).
          //  Eventually, we will create a new SEPoint and Point
          this.temporaryPointMarker.positionVector = this.currentSphereVector;
          this.sePointVector.copy(this.currentSphereVector);
          this.temporaryPointMarker.addToLayers(this.layers);
          this.temporaryPointAdded = true;
          this.sePoint = null;
        }
        if (this.oneDimensional === null) {
          EventBus.fire("show-alert", {
            key: `handlers.perpendicularLineThruPointPointSelected`,
            keyOptions: {},
            type: "info"
          });
        }
        this.selectOneObjectAtATime = false;
      }

      // Fill the oneDimensional object if there is a nearby one-dimensional object
      if (this.oneDimensional === null && this.selectOneObjectAtATime) {
        if (this.hitSESegments.length > 0) {
          this.oneDimensional = this.hitSESegments[0];
          this.oneDimensional.selected = true;
          if (
            this.sePoint === null &&
            this.sePointOneDimensionalParent === null &&
            this.sePointVector.isZero()
          ) {
            EventBus.fire("show-alert", {
              key: `handlers.perpendicularLineThruPointSegmentSelected`,
              keyOptions: { name: `${this.oneDimensional.name}` },
              type: "info"
            });
          }
        } else if (this.hitSELines.length > 0) {
          this.oneDimensional = this.hitSELines[0];
          this.oneDimensional.selected = true;
          if (
            this.sePoint === null &&
            this.sePointOneDimensionalParent === null &&
            this.sePointVector.isZero()
          ) {
            EventBus.fire("show-alert", {
              key: `handlers.perpendicularLineThruPointLineSelected`,
              keyOptions: { name: `${this.oneDimensional.name}` },
              type: "info"
            });
          }
        } else if (this.hitSECircles.length > 0) {
          this.oneDimensional = this.hitSECircles[0];
          this.oneDimensional.selected = true;
          if (
            this.sePoint === null &&
            this.sePointOneDimensionalParent === null &&
            this.sePointVector.isZero()
          ) {
            EventBus.fire("show-alert", {
              key: `handlers.perpendicularLineThruPointCircleSelected`,
              keyOptions: { name: `${this.oneDimensional.name}` },
              type: "info"
            });
          }
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
          this.temporaryPointMarker.removeFromLayers();
          this.temporaryPointAdded = false;
        }
        this.temporaryPointMarker.removeFromLayers();
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
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // Only object can be interacted with at a given time, so set the first point nearby to glowing
    // The user can create points  on circles, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    // Also set the snap objects
    if (
      this.sePoint === null &&
      this.sePointOneDimensionalParent === null &&
      this.sePointVector.isZero()
    ) {
      // glow the one-dimensional and points objects when both point is not set
      if (this.hitSEPoints.length > 0) {
        this.hitSEPoints[0].glowing = true;
        this.snapToTemporaryPoint = this.hitSEPoints[0];
        this.snapToTemporaryOneDimensional = null;
      } else if (this.hitSESegments.length > 0) {
        this.hitSESegments[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSESegments[0];
        this.snapToTemporaryPoint = null;
      } else if (this.hitSELines.length > 0) {
        this.hitSELines[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSELines[0];
        this.snapToTemporaryPoint = null;
      } else if (this.hitSECircles.length > 0) {
        this.hitSECircles[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSECircles[0];
        this.snapToTemporaryPoint = null;
      } else {
        this.snapToTemporaryOneDimensional = null;
        this.snapToTemporaryPoint = null;
      }
    } else if (
      !(
        this.sePoint === null &&
        this.sePointOneDimensionalParent === null &&
        this.sePointVector.isZero()
      ) &&
      this.oneDimensional === null
    ) {
      // in this case the point is set and the one-dimensional is not, so only glow the one-dimensional
      // no need to snap
      if (this.hitSESegments.length > 0) {
        this.hitSESegments[0].glowing = true;
        this.snapToTemporaryOneDimensional = null;
        this.snapToTemporaryPoint = null;
      } else if (this.hitSELines.length > 0) {
        this.hitSELines[0].glowing = true;
        this.snapToTemporaryOneDimensional = null;
        this.snapToTemporaryPoint = null;
      } else if (this.hitSECircles.length > 0) {
        this.hitSECircles[0].glowing = true;
        this.snapToTemporaryOneDimensional = null;
        this.snapToTemporaryPoint = null;
      } else {
        this.snapToTemporaryOneDimensional = null;
        this.snapToTemporaryPoint = null;
      }
    }

    if (this.isOnSphere) {
      if (
        this.sePoint === null &&
        this.sePointOneDimensionalParent === null &&
        this.sePointVector.isZero() &&
        this.oneDimensional !== null
      ) {
        // add the temporary point to the display and set its location to the currentSphereVector
        if (!this.temporaryPointAdded) {
          this.temporaryPointMarker.addToLayers(this.layers);
          this.temporaryPointAdded = true;
        }

        // Remove the temporary startMarker if there is a nearby point which can be glowing
        if (this.snapToTemporaryPoint !== null) {
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // ????glowing when the user select that location and then moves the mouse away - see line 119) we don't
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            this.snapToTemporaryPoint instanceof SEIntersectionPoint &&
            !this.snapToTemporaryPoint.isUserCreated
          ) {
            this.temporaryPointMarker.positionVector = this.snapToTemporaryPoint.locationVector;
          } else {
            this.temporaryPointMarker.removeFromLayers();
            this.temporaryPointAdded = false;
          }
        }
        // Set the location of the temporary startMarker by snapping to appropriate object (if any)
        if (this.snapToTemporaryOneDimensional !== null) {
          this.temporaryPointMarker.positionVector = this.snapToTemporaryOneDimensional.closestVector(
            this.currentSphereVector
          );
        } else if (this.snapToTemporaryPoint == null) {
          this.temporaryPointMarker.positionVector = this.currentSphereVector;
        }
      }
      if (this.oneDimensional !== null) {
        // add the temporary line to the display and set its position using the oneDimensional and the currentSphereVector  to the position of the pointer
        // Set the normal vector to the line in the plottable object, this setter calls updateDisplay()
        if (this.snapToTemporaryPoint !== null) {
          this.temporaryNormal.copy(
            this.oneDimensional.getNormalToLineThru(
              this.snapToTemporaryPoint.locationVector,
              this.temporaryNormal
            )
          );
        } else if (this.snapToTemporaryOneDimensional !== null) {
          this.temporaryNormal.copy(
            this.oneDimensional.getNormalToLineThru(
              this.snapToTemporaryOneDimensional.closestVector(
                this.currentSphereVector
              ),
              this.temporaryNormal
            )
          );
        } else {
          this.temporaryNormal.copy(
            this.oneDimensional.getNormalToLineThru(
              this.currentSphereVector,
              this.temporaryNormal
            )
          );
        }
        this.tempLine.normalVector = this.temporaryNormal;
        // add the line exactly once
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
    this.temporaryPointMarker.removeFromLayers();
    this.temporaryPointAdded = false;

    this.tempLine.removeFromLayers();
    this.temporaryLineAdded = false;

    this.sePointVector.set(0, 0, 0);

    this.snapToTemporaryOneDimensional = null;
    this.snapToTemporaryPoint = null;
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
      if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
        //console.log("parallel normal and sePointVector in handler");
        // In this case any line containing the sePoint will be perpendicular to the line/segment,
        // grab the temporary normal vector if it has been added otherwise make the perpendicular pass through the
        // mid point of the start and end vector or if that fails the start vector
        if (this.temporaryLineAdded) {
          this.tmpVector.copy(this.temporaryNormal);
        } else if (
          !this.tmpVector1
            .crossVectors(
              oneDimensional.startSEPoint.locationVector,
              oneDimensional.endSEPoint.locationVector
            )
            .isZero(SETTINGS.nearlyAntipodalIdeal)
        ) {
          this.tmpVector.crossVectors(
            sePointVector,
            this.tmpVector1
              .copy(oneDimensional.startSEPoint.locationVector)
              .add(oneDimensional.endSEPoint.locationVector)
              .normalize()
          );
        } else {
          this.tmpVector.crossVectors(
            sePointVector,
            oneDimensional.startSEPoint.locationVector
          );
        }
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
      if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
        //console.log("parallel normal and sePointVector in handler");
        // In this case any line containing the sePoint will be perpendicular to the line/segment,
        // grab the temporary normal vector if it has been added otherwise make the perpendicular pass through the
        // circle point
        if (this.temporaryLineAdded) {
          this.tmpVector.copy(this.temporaryNormal);
        } else {
          this.tmpVector.crossVectors(
            sePointVector,
            oneDimensional.circleSEPoint.locationVector
          );
        }
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
    endSEPoint.showing = false; // this never changes
    endSEPoint.exists = true; // this never changes
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
      this.sePoint /* start point */,
      this.tmpVector /* normal vector */,
      endSEPoint /* end point */
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
        if (
          !(object2 instanceof SEIntersectionPoint) ||
          (object2 as SEIntersectionPoint).isUserCreated
        ) {
          this.createPerpendicular(
            object1 as SEOneDimensional,
            null,
            (object2 as SEPoint).locationVector,
            object2 as SEPoint
          );
        }
      }

      if (object2.isOneDimensional() && object1.isPoint()) {
        if (
          !(object1 instanceof SEIntersectionPoint) ||
          (object1 as SEIntersectionPoint).isUserCreated
        ) {
          this.createPerpendicular(
            object2 as SEOneDimensional,
            null,
            (object1 as SEPoint).locationVector,
            object1 as SEPoint
          );
        }
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }

  deactivate(): void {
    super.deactivate();
  }
}
