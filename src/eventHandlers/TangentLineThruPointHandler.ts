import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { AddTangentLineThruPointCommand } from "@/commands/AddTangentLineThruPointCommand";
import { SECircle } from "@/models/SECircle";
import { SELabel } from "@/models/SELabel";
import {
  SEOneDimensionalNotStraight,
  SEOneOrTwoDimensional,
  SEIntersectionReturnType
} from "@/types";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEPoint } from "@/models/SEPoint";
import { Vector3 } from "three";
import NonFreePoint from "@/plottables/NonFreePoint";
import Line from "@/plottables/Line";
import Label from "@/plottables/Label";
import Point from "@/plottables/Point";
import { SETangentLineThruPoint } from "@/models/SETangentLineThruPoint";
import SETTINGS from "@/global-settings";
import { DisplayStyle } from "@/plottables/Nodule";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneOrTwoDimensionalCommand";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import EventBus from "./EventBus";
import { SEEllipse } from "@/models/SEEllipse";

// const MAXNUMBEROFTANGENTS = 10; // maximum number of tangents to a one dimensional through a point across all objects
import { SEStore } from "@/store";
import { SEParametric } from "@/models/SEParametric";
import NonFreeLine from "@/plottables/NonFreeLine";

type TemporaryLine = {
  line: Line;
  exist: boolean;
  tmpNormal: Vector3;
};
export default class TangentLineThruPointHandler extends Highlighter {
  /**
   * A temporary lines to display while the user is creating a new line -- there needs to be as many temporary lines as there are possible normal lines
   */
  private tempLines: TemporaryLine[] = [];
  // private temporaryLinesAdded: boolean[] = [];
  // private temporaryNormals: Vector3[] = []; // The normal to the plane of the temporary line

  /**
   * A temporary plottable (TwoJS) point created while the user is making the tangent
   */
  protected temporaryPointMarker: Point;
  private temporaryPointAdded: boolean;

  /**
   * As the user moves the pointer around snap the temporary point marker to this object temporarily
   */
  protected snapToTemporaryOneDimensional: SEOneOrTwoDimensional | null = null;
  protected snapToTemporaryPoint: SEPoint | null = null;

  /**
   * The one dimensional object and the point (to create line tangent to the object thru the point)
   */
  private oneDimensional: SEOneDimensionalNotStraight | null = null;
  private sePoint: SEPoint | null = null;
  /**
   * If the sePoint is a point on an oneDimensional parent, the parent is recorded in sePointOneDimensionalParent
   */
  private sePointOneDimensionalParent: SEOneOrTwoDimensional | null = null;

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

  /**
   * Different objects have a different maximum number of tangents
   *
   */
  private numberOfTangents = 1;

  constructor(layers: Two.Group[]) {
    super(layers);

    // Create and style the temporary lines (initially allocate one)
    this.tempLines.push({
      line: new Line(),
      exist: false,
      tmpNormal: new Vector3()
    });
    this.tempLines[0].line.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.tempLines[0].line);

    // Create and style the temporary point marking the point on the tangent being created
    this.temporaryPointMarker = new Point();
    this.temporaryPointMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryPointMarker);
    this.temporaryPointAdded = false;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  mousePressed(event: MouseEvent): void {
    //Select the objects to create the tangent
    if (this.isOnSphere) {
      // If we don't have selectOneObjectAtATime clicking on a point on a line/segment/circle/ellipse selects both the point and the line/segment/circle/ellipse
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
        } else if (this.hitSEEllipses.length > 0) {
          // The start of the line will be a point on a Ellipse
          //  Eventually, we will create a new SEPointOneDimensional and Point
          this.sePointOneDimensionalParent = this.hitSEEllipses[0];
          this.sePointVector.copy(
            this.sePointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryPointMarker.positionVector = this.sePointVector;
          this.temporaryPointMarker.addToLayers(this.layers);
          this.temporaryPointAdded = true;
          this.sePoint = null;
        } else if (this.hitSEParametrics.length > 0) {
          // The start of the line will be a point on a Parametric
          //  Eventually, we will create a new SEPointOneDimensional and Point
          this.sePointOneDimensionalParent = this.hitSEParametrics[0];
          this.sePointVector.copy(
            this.sePointOneDimensionalParent.closestVector(
              this.currentSphereVector
            )
          );
          this.temporaryPointMarker.positionVector = this.sePointVector;
          this.temporaryPointMarker.addToLayers(this.layers);
          this.temporaryPointAdded = true;
          this.sePoint = null;
        } else if (this.hitSEPolygons.length > 0) {
          // The start of the line will be a point on a Polygon
          //  Eventually, we will create a new SEPointOneDimensional and Point
          this.sePointOneDimensionalParent = this.hitSEPolygons[0];
          this.sePointVector.copy(this.currentSphereVector);
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
            key: `handlers.lineThruPointPointSelected`,
            keyOptions: {},
            type: "info"
          });
        }
        this.selectOneObjectAtATime = false;
      }

      // Fill the oneDimensional object if there is a nearby one-dimensional object
      if (this.oneDimensional === null && this.selectOneObjectAtATime) {
        if (this.hitSECircles.length > 0) {
          this.oneDimensional = this.hitSECircles[0];
          this.oneDimensional.selected = true;
          if (
            this.sePoint === null &&
            this.sePointOneDimensionalParent === null &&
            this.sePointVector.isZero()
          ) {
            EventBus.fire("show-alert", {
              key: `handlers.lineThruPointCircleSelected`,
              keyOptions: {
                name: `${this.oneDimensional.label?.ref.shortUserName}`
              },
              type: "info"
            });
          }
        } else if (this.hitSEEllipses.length > 0) {
          this.oneDimensional = this.hitSEEllipses[0];
          this.oneDimensional.selected = true;
          if (
            this.sePoint === null &&
            this.sePointOneDimensionalParent === null &&
            this.sePointVector.isZero()
          ) {
            EventBus.fire("show-alert", {
              key: `handlers.lineThruPointEllipseSelected`,
              keyOptions: {
                name: `${this.oneDimensional.label?.ref.shortUserName}`
              },
              type: "info"
            });
          }
        } else if (this.hitSEParametrics.length > 0) {
          this.oneDimensional = this.hitSEParametrics[0];
          this.oneDimensional.selected = true;
          if (
            this.sePoint === null &&
            this.sePointOneDimensionalParent === null &&
            this.sePointVector.isZero()
          ) {
            EventBus.fire("show-alert", {
              key: `handlers.lineThruPointParametricSelected`,
              keyOptions: {
                name: `${this.oneDimensional.label?.ref.shortUserName}`
              },
              type: "info"
            });
          }
        }
      }

      // As soon as both oneDimensional and point objects are not null do the tangent
      if (
        this.oneDimensional !== null &&
        (this.sePoint !== null ||
          this.sePointOneDimensionalParent !== null ||
          !this.sePointVector.isZero())
      ) {
        this.createTangent(
          this.oneDimensional,
          this.sePointOneDimensionalParent,
          this.sePointVector,
          this.sePoint
        );
        // Reset the oneDimensional and point in preparation for another tangent.
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

        this.tempLines.forEach((z: TemporaryLine) => {
          z.line.removeFromLayers();
          z.exist = false;
        });

        this.sePointVector.set(0, 0, 0);
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // Only object can be interacted with at a given time, so set the first point nearby to glowing
    // The user can create points  on circles, segments, and lines ellipses, parametrics, polygons, so
    // highlight those as well (but only one) if they are nearby also
    // Also set the snap objects
    if (
      this.sePoint === null &&
      this.sePointOneDimensionalParent === null &&
      this.sePointVector.isZero()
    ) {
      // glow the one-dimensional when point is not set
      if (this.hitSEPoints.length > 0) {
        this.hitSEPoints[0].glowing = true;
        this.snapToTemporaryPoint = this.hitSEPoints[0];
        this.snapToTemporaryOneDimensional = null;
      }
      // else if (this.hitSESegments.length > 0) {
      //   this.hitSESegments[0].glowing = true;
      //   this.snapToTemporaryOneDimensional = this.hitSESegments[0];
      //   this.snapToTemporaryPoint = null;
      // } else if (this.hitSELines.length > 0) {
      //   this.hitSELines[0].glowing = true;
      //   this.snapToTemporaryOneDimensional = this.hitSELines[0];
      //   this.snapToTemporaryPoint = null;
      // }
      else if (this.hitSECircles.length > 0) {
        this.hitSECircles[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSECircles[0];
        this.snapToTemporaryPoint = null;
      } else if (this.hitSEEllipses.length > 0) {
        this.hitSEEllipses[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSEEllipses[0];
        this.snapToTemporaryPoint = null;
      } else if (this.hitSEParametrics.length > 0) {
        this.hitSEParametrics[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSEParametrics[0];
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
      if (this.hitSECircles.length > 0) {
        this.hitSECircles[0].glowing = true;
        this.snapToTemporaryOneDimensional = null;
        this.snapToTemporaryPoint = null;
      } else if (this.hitSEEllipses.length > 0) {
        this.hitSEEllipses[0].glowing = true;
        this.snapToTemporaryOneDimensional = null;
        this.snapToTemporaryPoint = null;
      } else if (this.hitSEParametrics.length > 0) {
        this.hitSEParametrics[0].glowing = true;
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
        // add the temporary line to the display and set its position using the oneDimensional and the currentSphereVector to the position of the pointer
        // Set the normal vector to the line in the plottable object, this setter calls updateDisplay()

        let vectorLocation: Vector3;

        if (this.snapToTemporaryPoint !== null) {
          vectorLocation = this.snapToTemporaryPoint.locationVector;
        } else if (this.snapToTemporaryOneDimensional !== null) {
          vectorLocation = this.snapToTemporaryOneDimensional.closestVector(
            this.currentSphereVector
          );
        } else {
          vectorLocation = this.currentSphereVector;
        }
        const normalList = this.oneDimensional.getNormalsToTangentLinesThru(
          vectorLocation
        );

        // Add more temporary line as needed
        while (this.tempLines.length < normalList.length) {
          const newLine = new Line();
          this.tempLines.push({
            line: newLine,
            exist: false,
            tmpNormal: new Vector3()
          });
          newLine.stylize(DisplayStyle.ApplyTemporaryVariables);
          SEStore.addTemporaryNodule(newLine);
        }

        //set the display of the normals and the vectors
        this.tempLines.forEach((z: TemporaryLine, ind: number) => {
          if (ind < normalList.length) {
            z.exist = true;
            z.tmpNormal.copy(normalList[ind]);
            z.line.normalVector = z.tmpNormal;
            z.line.addToLayers(this.layers);
          } else {
            z.exist = false;
            z.line.removeFromLayers();
          }
        });
      }
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset all the variables in preparation for another tangent
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

    this.tempLines.forEach((z: TemporaryLine) => {
      z.exist = false;
      z.line.removeFromLayers();
    });

    this.sePointVector.set(0, 0, 0);

    this.snapToTemporaryOneDimensional = null;
    this.snapToTemporaryPoint = null;
  }

  private createTangent(
    oneDimensional: SEOneDimensionalNotStraight,
    sePointOneDimensionalParent: SEOneOrTwoDimensional | null,
    sePointVector: Vector3,
    sePoint: SEPoint | null
  ): void {
    // Create a command group to create a new tangent line, possibly new point, and to record all the new intersections for undo/redo
    const addTangentLineGroup = new CommandGroup();

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
        this.sePoint = new SEPointOnOneOrTwoDimensional( // Use  this.sePoint so that this variable points to the parent point, no matter how it is created or picked
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

        addTangentLineGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            this.sePoint as SEPointOnOneOrTwoDimensional,
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

        addTangentLineGroup.addCommand(
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
        addTangentLineGroup.addCommand(
          new ConvertInterPtToUserCreatedCommand(sePoint as SEIntersectionPoint)
        );
      }
      this.sePoint = sePoint;
    }

    // For each type of oneDimensional compute the normal vectors and copy them into normalVectors
    let normalVectors: Vector3[] = [];

    if (
      oneDimensional instanceof SECircle ||
      oneDimensional instanceof SEEllipse
    ) {
      // There are only two tangent
      this.numberOfTangents = 2;
    } else if (oneDimensional instanceof SEParametric) {
      // There are upto N tangents, determine the actual count from the temporary lines used so far
      this.numberOfTangents = this.tempLines.filter(
        (z: TemporaryLine) => z.exist
      ).length;
    }
    normalVectors = oneDimensional
      .getNormalsToTangentLinesThru(sePointVector)
      .map(vec => vec.normalize());
    // normals is the array of normal vector to the plane containing the line tangent to the one Dimensional through the point
    // create a number of such lines (not the number of normals in normalVector because if the user creates the tangent when there
    // are only two tangents, then moves the point to a place where there are four, the other two tangents are not created)
    for (let index = 0; index < this.numberOfTangents; index++) {
      // set the tangent vector
      let vec: Vector3;
      if (normalVectors[index] !== undefined) {
        vec = normalVectors[index];
      } else {
        vec = new Vector3(0, 0, 1); // use the north pole vector and make sure that the tangent doesn't exist
      }

      // Create the endSEPoint for the line
      // First we have to create a plottable point because we can't create a SEPoint with out a plottable one
      const plottableEndPoint = new NonFreePoint();
      // The endSEPoint is never shown and can never be selected (so it is never added to the store via Command.store.commit.addPoint).
      // The endSEPoint is also never added to the object tree structure (via un/registrerChild) because it is
      // updated when the the new SETangentLineThruPoint is updated.
      const endSEPoint = new SEPoint(plottableEndPoint);
      endSEPoint.showing = false; // this never changes
      endSEPoint.exists = true; // this never changes

      endSEPoint.locationVector.crossVectors(sePointVector, vec);

      // Create a plottable line to display for this tangent
      const plottableLine = new NonFreeLine();
      // Stylize the new Line
      plottableLine.stylize(DisplayStyle.ApplyCurrentVariables);
      plottableLine.adjustSize();

      // Create the model(SE) tangent line for the new point and link them
      const newPerpLine = new SETangentLineThruPoint(
        plottableLine,
        oneDimensional,
        this.sePoint! /* start point */,
        vec /* normal vector */,
        endSEPoint /* end point */,
        index /*The index of the tangent*/
      );
      // turn off the display of perps that don't exist
      if (Math.abs(vec.z - 1) < SETTINGS.tolerance) {
        newPerpLine.exists = false;
      }
      // Update the display of the tangent line
      newPerpLine.markKidsOutOfDate();
      newPerpLine.update();

      // Create the plottable label
      const newLabel = new Label();
      const newSELabel = new SELabel(newLabel, newPerpLine);

      // Set the initial label location
      this.tmpVector1
        .copy(endSEPoint.locationVector)
        .add(
          new Vector3(
            2 * SETTINGS.point.initialLabelOffset,
            SETTINGS.point.initialLabelOffset,
            0
          )
        )
        .normalize();
      newSELabel.locationVector = this.tmpVector1;

      addTangentLineGroup.addCommand(
        new AddTangentLineThruPointCommand(
          newPerpLine,
          this.sePoint!,
          oneDimensional,
          newSELabel
        )
      );

      // Determine all new intersection points and add their creation to the command so it can be undone
      SEStore.createAllIntersectionsWithLine(newPerpLine).forEach(
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

          addTangentLineGroup.addCommand(
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
    }
    addTangentLineGroup.execute();
  }
  activate(): void {
    if (SEStore.selectedSENodules.length == 2) {
      const object1 = SEStore.selectedSENodules[0];
      const object2 = SEStore.selectedSENodules[1];

      if (object1.isOneDimensional() && object2.isPoint()) {
        if (
          !(object2 instanceof SEIntersectionPoint) ||
          (object2 as SEIntersectionPoint).isUserCreated
        ) {
          if (
            object1 instanceof SECircle ||
            object1 instanceof SEEllipse ||
            object1 instanceof SEParametric
          ) {
            this.createTangent(
              object1 as SEOneDimensionalNotStraight,
              null,
              (object2 as SEPoint).locationVector,
              object2 as SEPoint
            );
          }
        }
      }

      if (object2.isOneDimensional() && object1.isPoint()) {
        if (
          !(object1 instanceof SEIntersectionPoint) ||
          (object1 as SEIntersectionPoint).isUserCreated
        ) {
          if (
            object2 instanceof SECircle ||
            object2 instanceof SEEllipse ||
            object2 instanceof SEParametric
          ) {
            this.createTangent(
              object2 as SEOneDimensionalNotStraight,
              null,
              (object1 as SEPoint).locationVector,
              object1 as SEPoint
            );
          }
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
