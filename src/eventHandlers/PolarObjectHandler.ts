import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import NonFreePoint from "@/plottables/NonFreePoint";
import { AddAntipodalPointCommand } from "@/commands/AddAntipodalPointCommand";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { SEOneOrTwoDimensional, SEIntersectionReturnType } from "@/types";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import Point from "@/plottables/Point";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneOrTwoDimensionalCommand";
import { AddPointCommand } from "@/commands/AddPointCommand";
import EventBus from "./EventBus";
import { SEStore } from "@/store";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SEEllipse } from "@/models/SEEllipse";
import { SECircle } from "@/models/SECircle";
import Line from "@/plottables/Line";
import i18n from "../i18n";
import { SEPolarPoint } from "@/models/SEPolarPoint";
import { AddPolarPointCommand } from "@/commands/AddPolarPointCommand";
import NonFreeLine from "@/plottables/NonFreeLine";
import { SEPolarLine } from "@/models/SEPolarLine";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { AddPolarLineCommand } from "@/commands/AddPolarLineCommand";
import { SEParametric } from "@/models/SEParametric";
import { SEPolygon } from "@/models/SEPolygon";

enum Create {
  NONE,
  POLARPOINTS,
  POLARLINE
}

export default class PolarObjectHandler extends Highlighter {
  /**
   * The parent of the polar point or polar line that will be created
   */
  private parentPoint: SEPoint | null = null;
  private parentLineOrSegment: SESegment | SELine | null = null;

  /**
   * If the user clicks on a circle or ellipse, create a point on that one dimensional *and* create the polar line of that point
   */
  private oneDimensionalContainingParentPoint: SEOneOrTwoDimensional | null = null;

  /**
   * As the user moves the pointer around snap the temporary marker to this object temporarily
   */
  protected snapToTemporaryCircleOrEllipseOrParametricOrPolygon:
    | SECircle
    | SEEllipse
    | SEParametric
    | SEPolygon
    | null = null;
  protected temporaryParentLineOrSegment: SESegment | SELine | null = null;
  protected snapToTemporaryPoint: SEPoint | null = null;

  /**
   * The location of the parentPoint, if the uer clicks on empty space, then create a new point at this location *and* the polar line of that point
   */
  private parentPointVector = new Vector3(0, 0, 0);

  /* temporary vector to help with computation */
  private tmpVector = new Vector3();

  /**
   * A temporary plottable (TwoJS) points and lines created while the user is making the polar object
   */
  protected temporaryPolarLineMarker: NonFreeLine; // indicates to the user where the polar line will be created
  protected temporaryPolarPointMarker1: Point; // indicates to the user where a new polar point will be created
  protected temporaryPolarPointMarker2: Point; // indicates to the user where a new polar point will be created
  protected temporaryPoint: Point; // indicates to the user where a point will be created along with its polar line

  /** This is what the programs best guess as to what the user wants to create.*/
  private creating = Create.NONE;

  /** Has the temporary line or points been added to the scene?*/
  private temporaryPolarLineAdded = false;
  private temporaryPolarPointMarkersAdded = false;
  private temporaryPointAdded = false;

  constructor(layers: Two.Group[]) {
    super(layers);
    // Create and style the temporary antipode/point marking the antipode/point being created
    this.temporaryPolarLineMarker = new NonFreeLine();
    this.temporaryPolarLineMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryPolarLineMarker);
    this.temporaryPolarPointMarker1 = new NonFreePoint();
    this.temporaryPolarPointMarker1.stylize(
      DisplayStyle.ApplyTemporaryVariables
    );
    SEStore.addTemporaryNodule(this.temporaryPolarPointMarker1);
    this.temporaryPolarPointMarker2 = new NonFreePoint();
    this.temporaryPolarPointMarker2.stylize(
      DisplayStyle.ApplyTemporaryVariables
    );
    SEStore.addTemporaryNodule(this.temporaryPolarPointMarker2);

    this.temporaryPoint = new Point();
    this.temporaryPoint.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryPoint);
  }

  mousePressed(event: MouseEvent): void {
    super.mouseMoved(event);
    //Select the point object to create the antipode of
    if (this.isOnSphere) {
      if (this.hitSEPoints.length > 0) {
        // The user selected an existing point

        // check to see if this polar line has already been created
        const alreadyExists = SEStore.seLines.some(seLine => {
          return this.tmpVector
            .crossVectors(
              seLine.normalVector,
              this.hitSEPoints[0].locationVector
            )
            .isZero(SETTINGS.nearlyAntipodalIdeal);
        });
        if (!alreadyExists) {
          // we will create the polar line to this point
          this.parentPoint = this.hitSEPoints[0];
          this.parentPointVector.copy(this.parentPoint.locationVector);
          this.oneDimensionalContainingParentPoint = null;
          this.parentLineOrSegment = null;
        } else {
          EventBus.fire("show-alert", {
            key: `handlers.polarLineDuplicate`,
            keyOptions: {},
            type: "error"
          });
        }
      } else if (this.hitSESegments.length > 0 || this.hitSELines.length > 0) {
        // The user selected a segment or a line and we will create the polar points to it
        // check to see if the polar points have already been created
        const alreadyExists = SEStore.sePoints.some(sePoint => {
          return this.tmpVector
            .subVectors(
              sePoint.locationVector,
              this.hitSESegments[0]
                ? this.hitSESegments[0].normalVector
                : this.hitSELines[0].normalVector
            )
            .isZero(SETTINGS.nearlyAntipodalIdeal);
        });
        if (!alreadyExists) {
          this.parentLineOrSegment = this.hitSESegments[0]
            ? this.hitSESegments[0]
            : this.hitSELines[0];
          this.parentPointVector.set(0, 0, 0);
          this.oneDimensionalContainingParentPoint = null;
          this.parentPoint = null;
        } else {
          const object = i18n.tc(`objects.lines`, 3);
          EventBus.fire("show-alert", {
            key: `handlers.polarPointDuplicate`,
            keyOptions: { object },
            type: "error"
          });
        }
      } else if (this.hitSECircles.length > 0) {
        // The user selected a circle and we will create a point on it and the polar line of that point
        this.oneDimensionalContainingParentPoint = this.hitSECircles[0];
        this.parentPointVector.copy(
          this.oneDimensionalContainingParentPoint.closestVector(
            this.currentSphereVector
          )
        );
        this.parentPoint = null;
        this.parentLineOrSegment = null;
      } else if (this.hitSEEllipses.length > 0) {
        // The user selected an ellipse and we will create a point on it and the polar line of that point
        this.oneDimensionalContainingParentPoint = this.hitSEEllipses[0];
        this.parentPointVector.copy(
          this.oneDimensionalContainingParentPoint.closestVector(
            this.currentSphereVector
          )
        );
        this.parentPoint = null;
        this.parentLineOrSegment = null;
      } else if (this.hitSEParametrics.length > 0) {
        // The user selected an parametric and we will create a point on it and the polar line of that point
        this.oneDimensionalContainingParentPoint = this.hitSEParametrics[0];
        this.parentPointVector.copy(
          this.oneDimensionalContainingParentPoint.closestVector(
            this.currentSphereVector
          )
        );
        this.parentPoint = null;
        this.parentLineOrSegment = null;
      } else if (this.hitSEPolygons.length > 0) {
        // The user selected an parametric and we will create a point on it and the polar line of that point
        this.oneDimensionalContainingParentPoint = this.hitSEPolygons[0];
        this.parentPointVector.copy(
          this.oneDimensionalContainingParentPoint.closestVector(
            this.currentSphereVector
          )
        );
        this.parentPoint = null;
        this.parentLineOrSegment = null;
      } else {
        // The user selected an empty location and we will create a point there
        this.parentPointVector.copy(this.currentSphereVector);
        this.parentPoint = null;
        this.oneDimensionalContainingParentPoint = null;
        this.parentLineOrSegment = null;
      }

      if (this.parentLineOrSegment !== null) {
        // the user selected a line or a segment, create the polar points
        this.createPolarPoints(this.parentLineOrSegment);
      } else {
        // The user is creating a polar line
        this.createPolarLine();
      }
      // reset in prep for next antipodal point
      this.mouseLeave(event);
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // Only one point can be processed at a time, so set the first point nearby to glowing
    // The user can create points (with the antipode) on ellipses, circles, segments, and lines, so
    // highlight those as well (but only one) if they are the only nearby objects
    if (this.hitSEPoints.length > 0) {
      const alreadyExists = SEStore.seLines.some(seLine => {
        return this.tmpVector
          .crossVectors(seLine.normalVector, this.hitSEPoints[0].locationVector)
          .isZero(SETTINGS.nearlyAntipodalIdeal);
      });
      if (!alreadyExists) {
        this.hitSEPoints[0].glowing = true;
        this.snapToTemporaryPoint = this.hitSEPoints[0];
        this.snapToTemporaryCircleOrEllipseOrParametricOrPolygon = null;
        this.creating = Create.POLARLINE;
        this.temporaryParentLineOrSegment = null;
      } else {
        this.creating = Create.POLARPOINTS;
      }
    } else if (this.hitSESegments.length > 0 || this.hitSELines.length > 0) {
      this.temporaryParentLineOrSegment = this.hitSESegments[0]
        ? this.hitSESegments[0]
        : this.hitSELines[0];

      const alreadyExists = SEStore.sePoints.some(sePoint => {
        return this.tmpVector
          .subVectors(
            sePoint.locationVector,
            this.temporaryParentLineOrSegment!.normalVector
          )
          .isZero(SETTINGS.nearlyAntipodalIdeal);
      });
      if (!alreadyExists) {
        this.hitSESegments[0]
          ? (this.hitSESegments[0].glowing = true)
          : (this.hitSELines[0].glowing = true);
        this.snapToTemporaryCircleOrEllipseOrParametricOrPolygon = null;
        this.creating = Create.POLARPOINTS;
        this.snapToTemporaryPoint = null;
      } else {
        this.creating = Create.POLARLINE;
      }
    } else if (this.hitSECircles.length > 0) {
      this.hitSECircles[0].glowing = true;
      this.snapToTemporaryCircleOrEllipseOrParametricOrPolygon = this.hitSECircles[0];
      this.snapToTemporaryPoint = null;
      this.creating = Create.POLARLINE;
      this.temporaryParentLineOrSegment = null;
    } else if (this.hitSEEllipses.length > 0) {
      this.hitSEEllipses[0].glowing = true;
      this.snapToTemporaryCircleOrEllipseOrParametricOrPolygon = this.hitSEEllipses[0];
      this.snapToTemporaryPoint = null;
      this.creating = Create.POLARLINE;
      this.temporaryParentLineOrSegment = null;
    } else if (this.hitSEParametrics.length > 0) {
      this.hitSEParametrics[0].glowing = true;
      this.snapToTemporaryCircleOrEllipseOrParametricOrPolygon = this.hitSEParametrics[0];
      this.snapToTemporaryPoint = null;
      this.creating = Create.POLARLINE;
      this.temporaryParentLineOrSegment = null;
    } else if (this.hitSEPolygons.length > 0) {
      this.hitSEPolygons[0].glowing = true;
      this.snapToTemporaryCircleOrEllipseOrParametricOrPolygon = this.hitSEPolygons[0];
      this.snapToTemporaryPoint = null;
      this.creating = Create.POLARLINE;
      this.temporaryParentLineOrSegment = null;
    } else {
      this.snapToTemporaryCircleOrEllipseOrParametricOrPolygon = null;
      this.snapToTemporaryPoint = null;
      this.creating = Create.POLARLINE;
      this.temporaryParentLineOrSegment = null;
    }

    if (this.isOnSphere) {
      // Decide if the user is going to add a polar line or a polar point
      if (this.creating === Create.POLARLINE) {
        // remove the pair of temporary polar points if added
        if (this.temporaryPolarPointMarkersAdded) {
          // Remove the temporary objects from the display.
          this.temporaryPolarPointMarker1.removeFromLayers();
          this.temporaryPolarPointMarker2.removeFromLayers();
          this.temporaryPolarPointMarkersAdded = false;
        }

        // add the temporary point if it hasn't be added already
        if (!this.temporaryPointAdded) {
          this.temporaryPoint.addToLayers(this.layers);
          this.temporaryPointAdded = true;
        }
        //remove the point if there is a snap to point
        if (this.snapToTemporaryPoint !== null) {
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // ????glowing when the user select that location and then moves the mouse away ) we don't
          // remove the temporary point from the scene, instead we move it to the location of the intersection point
          if (
            this.snapToTemporaryPoint instanceof SEIntersectionPoint &&
            !this.snapToTemporaryPoint.isUserCreated
          ) {
            this.temporaryPoint.positionVector = this.snapToTemporaryPoint.locationVector;
          } else {
            this.temporaryPoint.removeFromLayers();
            this.temporaryPointAdded = false;
          }
        }
        // the user is possibly adding polar line with the point on an object
        else if (
          this.snapToTemporaryCircleOrEllipseOrParametricOrPolygon !== null
        ) {
          this.temporaryPoint.positionVector = this.snapToTemporaryCircleOrEllipseOrParametricOrPolygon.closestVector(
            this.currentSphereVector
          );
        }
        // the user is not near anything
        else {
          this.temporaryPoint.positionVector = this.currentSphereVector;
        }

        // add the temporary line if it hasn't already been added
        if (!this.temporaryPolarLineAdded) {
          this.temporaryPolarLineMarker.addToLayers(this.layers);
          this.temporaryPolarLineAdded = true;
        }
        // Set the normal vector to the line in the plottable object, this setter calls updateDisplay()
        this.temporaryPolarLineMarker.normalVector = this.temporaryPoint._locationVector;

        //update the display
        this.temporaryPolarLineMarker.updateDisplay();
      }
      // The user is adding a pair of polar points
      else if (this.creating === Create.POLARPOINTS) {
        //remove the temporary polar line if added
        if (this.temporaryPolarLineAdded) {
          this.temporaryPolarLineMarker.removeFromLayers();
          this.temporaryPolarLineAdded = false;
        }
        // remove the temporary point if it has been added
        if (this.temporaryPointAdded) {
          this.temporaryPoint.removeFromLayers();
          this.temporaryPointAdded = false;
        }

        // Add the pair of temporary polar points
        if (!this.temporaryPolarPointMarkersAdded) {
          // Remove the temporary objects from the display.
          this.temporaryPolarPointMarker1.addToLayers(this.layers);
          this.temporaryPolarPointMarker2.addToLayers(this.layers);
          this.temporaryPolarPointMarkersAdded = true;
        }
        let normal: Vector3;
        if (this.temporaryParentLineOrSegment !== null) {
          normal = this.temporaryParentLineOrSegment.normalVector;
        } else {
          normal = this.tmpVector.set(0, 0, 0); // should never execute
        }
        this.temporaryPolarPointMarker1.positionVector = normal;
        this.tmpVector.copy(normal).multiplyScalar(-1);
        this.temporaryPolarPointMarker2.positionVector = this.tmpVector;
      }
    }
    // else {
    //   if (this.temporaryPointAdded) {
    //     this.temporaryPoint.removeFromLayers();
    //     this.temporaryPointAdded = false;
    //   }
    //   if (this.temporaryPolarLineAdded) {
    //     // Remove the temporary objects from the display.
    //     this.temporaryPolarLineMarker.removeFromLayers();
    //     this.temporaryPolarLineAdded = false;
    //   }
    //   if (this.temporaryPolarPointMarkersAdded) {
    //     // Remove the temporary objects from the display.
    //     this.temporaryPolarPointMarker1.removeFromLayers();
    //     this.temporaryPolarPointMarker2.removeFromLayers();
    //     this.temporaryPolarPointMarkersAdded = false;
    //   }
    //   this.snapToTemporaryCircleOrEllipse = null;
    //   this.snapToTemporaryPoint = null;
    // }
  }
  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the parent point in preparation for another antipodal points.
    this.parentPoint = null;
    this.oneDimensionalContainingParentPoint = null;
    this.parentPointVector.set(0, 0, 0);
    this.parentLineOrSegment = null;

    if (this.temporaryPolarLineAdded) {
      // Remove the temporary objects from the display.
      this.temporaryPolarLineMarker.removeFromLayers();
    }
    this.temporaryPolarLineAdded = false;

    if (this.temporaryPolarPointMarkersAdded) {
      // Remove the temporary objects from the display.
      this.temporaryPolarPointMarker1.removeFromLayers();
      this.temporaryPolarPointMarker2.removeFromLayers();
    }
    this.temporaryPolarPointMarkersAdded = false;

    if (this.temporaryPointAdded) {
      this.temporaryPoint.removeFromLayers();
    }
    this.temporaryPointAdded = false;

    this.snapToTemporaryCircleOrEllipseOrParametricOrPolygon = null;
    this.snapToTemporaryPoint = null;
  }
  activate(): void {
    // If there is exactly one point selected, create its polar line
    if (SEStore.selectedSENodules.length == 1) {
      const object = SEStore.selectedSENodules[0];
      if (object instanceof SEPoint) {
        this.parentPoint = object;
        this.createPolarLine();
      } else if (object instanceof SELine || object instanceof SESegment) {
        this.createPolarPoints(object);
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }

  createPolarPoints(parentLineOrSegment: SELine | SESegment): void {
    const polarPointsCommandGroup = new CommandGroup();
    // Create the first polar point
    const newPoint1 = new NonFreePoint();
    // Set the display to the default values
    newPoint1.stylize(DisplayStyle.ApplyCurrentVariables);
    newPoint1.adjustSize();

    // Create the model object for the new point and link them
    const polarPoint1 = new SEPolarPoint(newPoint1, parentLineOrSegment, 0);
    polarPoint1.locationVector = parentLineOrSegment.normalVector;

    // Create plottable for the Label
    const newLabel1 = new Label();
    const newSELabel1 = new SELabel(newLabel1, polarPoint1);
    // Set the initial label location
    this.tmpVector
      .copy(polarPoint1.locationVector)
      .add(
        new Vector3(
          2 * SETTINGS.point.initialLabelOffset,
          SETTINGS.point.initialLabelOffset,
          0
        )
      )
      .normalize();
    newSELabel1.locationVector = this.tmpVector;

    polarPointsCommandGroup.addCommand(
      new AddPolarPointCommand(polarPoint1, 0, parentLineOrSegment, newSELabel1)
    );

    // Create the second polar point
    const newPoint2 = new NonFreePoint();
    // Set the display to the default values
    newPoint2.stylize(DisplayStyle.ApplyCurrentVariables);
    newPoint2.adjustSize();

    // Create the model object for the new point and link them
    const polarPoint2 = new SEPolarPoint(newPoint2, parentLineOrSegment, 1);
    polarPoint2.locationVector = parentLineOrSegment.normalVector.multiplyScalar(
      -1
    );

    // Create plottable for the Label
    const newLabel2 = new Label();
    const newSELabel2 = new SELabel(newLabel2, polarPoint2);
    // Set the initial label location
    this.tmpVector
      .copy(polarPoint2.locationVector)
      .add(
        new Vector3(
          2 * SETTINGS.point.initialLabelOffset,
          SETTINGS.point.initialLabelOffset,
          0
        )
      )
      .normalize();
    newSELabel2.locationVector = this.tmpVector;

    polarPointsCommandGroup.addCommand(
      new AddPolarPointCommand(polarPoint2, 1, parentLineOrSegment, newSELabel2)
    );
    polarPointsCommandGroup.execute();
    polarPoint1.markKidsOutOfDate();
    polarPoint1.update();
    polarPoint2.markKidsOutOfDate();
    polarPoint2.update();
  }
  createPolarLine(): void {
    const polarLineCommandGroup = new CommandGroup();
    if (this.parentPoint !== null) {
      if (
        this.parentPoint instanceof SEIntersectionPoint &&
        !(this.parentPoint as SEIntersectionPoint).isUserCreated
      ) {
        //Make it user created and turn on the display
        polarLineCommandGroup.addCommand(
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
      this.parentPoint = new SEPointOnOneOrTwoDimensional(
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
      // Create the command to create a new point for undo/redo
      //new AddPointCommand(vtx, newSELabel).execute();
      polarLineCommandGroup.addCommand(
        new AddPointOnOneDimensionalCommand(
          this.parentPoint as SEPointOnOneOrTwoDimensional,
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

      polarLineCommandGroup.addCommand(
        new AddPointCommand(this.parentPoint, newSELabel)
      );
    }

    const newLine = this.temporaryPolarLineMarker.clone();
    // Set the display to the default values
    newLine.stylize(DisplayStyle.ApplyCurrentVariables);
    newLine.adjustSize();
    // Create the start and end points of the line, these will never be displayed

    // The (end|start)SEPoint is never shown and can never be selected (so it is never added to the store via Command.store.commit.addPoint).
    // The (end|start)SEPoint is also never added to the object tree structure (via un/registrerChild) because it is
    // updated when the the new SEPolarLine is updated.
    const endSEPoint = new SEPoint(new NonFreePoint());
    endSEPoint.showing = false; // this never changes
    endSEPoint.exists = true; // this never changes
    // form an orthonormal frame using the polar point parent vector
    const frame = this.createVectorsToDefineLine(
      this.parentPoint.locationVector
    );
    endSEPoint.locationVector = frame[1];

    const plottableStartPoint = new NonFreePoint();
    const startSEPoint = new SEPoint(plottableStartPoint);
    startSEPoint.showing = false; // this never changes
    startSEPoint.exists = true; // this never changes
    startSEPoint.locationVector = frame[0];

    // Create the model object for the new point and link them
    const newPolarLine = new SEPolarLine(
      newLine,
      startSEPoint,
      endSEPoint,
      this.parentPoint
    );

    // Create the plottable label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newPolarLine);

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

    // Create the command to create a new point for undo/redo
    polarLineCommandGroup.addCommand(
      new AddPolarLineCommand(newPolarLine, this.parentPoint, newSELabel)
    );
    // Update the display of the polar line
    newPolarLine.markKidsOutOfDate();
    newPolarLine.update();

    // Determine all new intersection points and add their creation to the command so it can be undone
    SEStore.createAllIntersectionsWithLine(newPolarLine).forEach(
      (item: SEIntersectionReturnType) => {
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

        polarLineCommandGroup.addCommand(
          new AddIntersectionPointCommand(
            item.SEIntersectionPoint,
            item.parent1,
            item.parent2,
            newSELabel
          )
        );
        item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
        newSELabel.showing = false;
      }
    );
    polarLineCommandGroup.execute();
  }

  /**
   * Returns vectors [startVec,endVec] for the start and end SEPoints to define the line. startVec,endVec and polarVec form an orthonormal basis
   * @param polarVec Given perpendicular to the line
   */
  createVectorsToDefineLine(polarVec: Vector3): Vector3[] {
    const endVec = new Vector3();
    endVec.set(-polarVec.y, polarVec.x, 0);
    // check to see if this vector is zero, if so choose a different way of being perpendicular to the polar point parent
    if (endVec.isZero(SETTINGS.nearlyAntipodalIdeal)) {
      endVec.set(0, -polarVec.z, polarVec.y);
    }
    const startVec = new Vector3();
    startVec.crossVectors(polarVec, endVec);
    return [startVec.normalize(), endVec.normalize()];
  }
}
