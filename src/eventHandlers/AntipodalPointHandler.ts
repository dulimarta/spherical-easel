import { SEPoint } from "@/models/SEPoint";
import { AddAntipodalPointCommand } from "@/commands/AddAntipodalPointCommand";
import Highlighter from "./Highlighter";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { SEOneOrTwoDimensional } from "@/types";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import Point from "@/plottables/Point";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneOrTwoDimensionalCommand";
import { AddPointCommand } from "@/commands/AddPointCommand";
import EventBus from "./EventBus";
import Two from "two.js";
//import { Group } from "two.js/src/group";
import { ConvertIntersectionPointToAntipodalMode } from "@/commands/ConvertIntersectionPointToAntipodalMode";
import { SetPointUserCreatedValueCommand } from "@/commands/SetPointUserCreatedValueCommand";
export default class AntipodalPointHandler extends Highlighter {
  /**
   * The parent of this point
   */
  private parentPoint: SEPoint | null = null;

  /**
   * If the user clicks on a one dimensional, create a point on that one dimensional *and* create the antipode of that point
   */
  private oneDimensionalContainingParentPoint: SEOneOrTwoDimensional | null =
    null;

  /**
   * As the user moves the pointer around snap the temporary marker to this object temporarily
   */
  protected snapToTemporaryOneDimensional: SEOneOrTwoDimensional | null = null;
  protected snapToTemporaryPoint: SEPoint | null = null;

  /**
   * The location of the parentPoint, if the uer clicks on empty space, then create a new point at this location *and* the antipode of that new point
   */
  private parentPointVector = new Vector3(0, 0, 0);

  /* temporary vector to help with computation */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();

  /**
   * A temporary plottable (TwoJS) point created while the user is making the antipode
   */
  protected temporaryAntipodeMarker: Point; // indicates to the user where the antipode will be created
  protected temporaryPointMarker: Point; // indicates to the user where a new point (if any) will be created

  /** Has the temporary antipode/point been added to the scene?*/
  private isTemporaryAntipodeAdded = false;
  private isTemporaryPointAdded = false;

  constructor(layers: Two.Group[]) {
    super(layers);
    // Create and style the temporary antipode/point marking the antipode/point being created
    this.temporaryAntipodeMarker = new Point();
    AntipodalPointHandler.store.addTemporaryNodule(
      this.temporaryAntipodeMarker
    );
    this.temporaryPointMarker = new Point();
    AntipodalPointHandler.store.addTemporaryNodule(this.temporaryPointMarker);
  }

  mousePressed(event: MouseEvent): void {
    super.mouseMoved(event);
    //Select the point object to create the antipode of
    if (this.isOnSphere) {
      if (this.hitSEPoints.length > 0) {
        // The user selected an existing point
        this.parentPoint = this.hitSEPoints[0];

        // check to see if the antipode is already displayed
        // first find the index
        if (this.parentPoint) {
          this.tmpVector1 // holds the location of the antipode
            .copy(this.parentPoint.locationVector)
            .multiplyScalar(-1);
        }
        const antipodeIndex = AntipodalPointHandler.store.sePoints.findIndex(
          pt => {
            if (
              this.tmpVector
                .subVectors(this.tmpVector1, pt.locationVector)
                .isZero()
            ) {
              return true;
            } else {
              return false;
            }
          }
        );
        let possibleAntipode: SEPoint | null = null;
        if (antipodeIndex === -1) {
          throw new Error(
            `AntipodePointHandler: The point ${this.parentPoint.name} doesn't have an antipode!`
          );
        } else {
          possibleAntipode =
            AntipodalPointHandler.store.sePoints[antipodeIndex];
        }
        this.revealAntipode(possibleAntipode, this.parentPoint);
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
      } else if (this.hitSEEllipses.length > 0) {
        // The user selected an ellipse and we will create a point on it
        this.oneDimensionalContainingParentPoint = this.hitSEEllipses[0];
        this.parentPointVector.copy(
          this.oneDimensionalContainingParentPoint.closestVector(
            this.currentSphereVector
          )
        );
        this.parentPoint = null;
      } else if (this.hitSEPolygons.length > 0) {
        // The user selected an ellipse and we will create a point on it
        this.oneDimensionalContainingParentPoint = this.hitSEPolygons[0];
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

        if (this.oneDimensionalContainingParentPoint !== null) {
          // create a new point on the object that the user clicked on

          // Create the model object for the new point and link them
          this.parentPoint = new SEPointOnOneOrTwoDimensional(
            this.oneDimensionalContainingParentPoint
          );
          this.parentPoint.locationVector = this.parentPointVector;
          // Create plottable for the Label
          const newSELabel = new SELabel("point", this.parentPoint);
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

          antipodalCommandGroup.addCommand(
            new AddPointOnOneDimensionalCommand(
              this.parentPoint as SEPointOnOneOrTwoDimensional,
              this.oneDimensionalContainingParentPoint,
              newSELabel
            )
          );
        } else {
          // Create a new point at the blank place where the user clicked

          this.parentPoint = new SEPoint();
          this.parentPoint.locationVector = this.parentPointVector;
          // Create plottable for the Label
          const newSELabel = new SELabel("point", this.parentPoint);
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

        // Create the model object for the new point and link them
        const vtx = new SEAntipodalPoint(this.parentPoint, true);

        // Create the plottable label
        const newSELabel = new SELabel("point", vtx);

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
        antipodalCommandGroup.addCommand(
          new AddAntipodalPointCommand(vtx, this.parentPoint, newSELabel)
        );
        vtx.shallowUpdate();

        antipodalCommandGroup.execute();

        // reset in prep for next antipodal point
        this.mouseLeave(event);
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    let displayTemporaryAntipode = true;
    // Only one point can be processed at a time, so set the first point nearby to glowing
    // The user can create points (with the antipode) on ellipses, circles, segments, and lines, so
    // highlight those as well (but only one) if they are the only nearby objects
    if (this.hitSEPoints.length > 0) {
      // check to see if the antipode is already displayed
      // first find the index
      this.tmpVector1 // holds the location of the antipode
        .copy(this.hitSEPoints[0].locationVector)
        .multiplyScalar(-1);

      const antipodeIndex = AntipodalPointHandler.store.sePoints.findIndex(
        pt => {
          if (
            this.tmpVector
              .subVectors(this.tmpVector1, pt.locationVector)
              .isZero()
          ) {
            return true;
          } else {
            return false;
          }
        }
      );
      let possibleAntipode: SEPoint | null = null;
      if (antipodeIndex === -1) {
        throw new Error(
          `AntipodePointHandler: The point ${this.hitSEPoints[0].name} doesn't have an antipode 1!`
        );
      } else {
        possibleAntipode = AntipodalPointHandler.store.sePoints[
          antipodeIndex
        ] as SEPoint;
      }

      if (
        possibleAntipode !== null &&
        ((possibleAntipode instanceof SEAntipodalPoint &&
          !possibleAntipode.isUserCreated) ||
          (possibleAntipode instanceof SEIntersectionPoint &&
            !possibleAntipode.isUserCreated &&
            !possibleAntipode.isAntipodal))
      ) {
        //The antipode is not displayed
        this.hitSEPoints[0].glowing = true;
        this.snapToTemporaryPoint = this.hitSEPoints[0];
        this.snapToTemporaryOneDimensional = null;
      } else {
        // console.debug(`here display temp is false`);
        displayTemporaryAntipode = false;
      }
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
    } else if (this.hitSEEllipses.length > 0) {
      this.hitSEEllipses[0].glowing = true;
      this.snapToTemporaryOneDimensional = this.hitSEEllipses[0];
      this.snapToTemporaryPoint = null;
    } else if (this.hitSEParametrics.length > 0) {
      this.hitSEParametrics[0].glowing = true;
      this.snapToTemporaryOneDimensional = this.hitSEParametrics[0];
      this.snapToTemporaryPoint = null;
    } else if (this.hitSEPolygons.length > 0) {
      this.hitSEPolygons[0].glowing = true;
      this.snapToTemporaryOneDimensional = this.hitSEPolygons[0];
      this.snapToTemporaryPoint = null;
    } else {
      this.snapToTemporaryOneDimensional = null;
      this.snapToTemporaryPoint = null;
    }
    if (this.isOnSphere) {
      // If the temporary antipode has *not* been added to the scene do so now (only once)
      if (!this.isTemporaryAntipodeAdded) {
        this.isTemporaryAntipodeAdded = true;
        this.temporaryAntipodeMarker.addToLayers(this.layers);
      }
      // If the temporary point has *not* been added to the scene do so now (only once)
      if (!this.isTemporaryPointAdded) {
        this.isTemporaryPointAdded = true;
        this.temporaryPointMarker.addToLayers(this.layers);
      }
      // Move the temporaryAntipodeMarker to the antipode of the current mouse location, and snap to one dimensional or point  (if appropriate)
      if (
        this.snapToTemporaryOneDimensional === null &&
        this.snapToTemporaryPoint === null
      ) {
        this.temporaryAntipodeMarker.positionVector = this.tmpVector
          .copy(this.currentSphereVector)
          .multiplyScalar(-1);
        if (this.hitSEPoints.length === 0) {
          //no nearby points that can be antipode_ed, so display the pointMarker
          this.temporaryPointMarker.positionVector = this.tmpVector.copy(
            this.currentSphereVector
          );
        } else {
          // there is a nearby point so the temporary point should not be displayed
          // Remove the temporary objects from the display.
          this.temporaryPointMarker.removeFromLayers();
          this.isTemporaryPointAdded = false;
          //console.debug(`Here`);
          // if the nearby point is not antipode-able remove the temporary antipode
          if (!displayTemporaryAntipode && this.isTemporaryAntipodeAdded) {
            this.temporaryAntipodeMarker.removeFromLayers();
            this.isTemporaryAntipodeAdded = false;
          }
        }
      } else if (
        this.snapToTemporaryOneDimensional !== null &&
        this.snapToTemporaryPoint === null
      ) {
        //console.debug(`Here antipode`);
        this.temporaryAntipodeMarker.positionVector = this.tmpVector
          .copy(
            this.snapToTemporaryOneDimensional.closestVector(
              this.currentSphereVector
            )
          )
          .multiplyScalar(-1);
        if (this.hitSEPoints.length === 0) {
          //no nearby points, so display the pointMarker
          this.temporaryPointMarker.positionVector = this.tmpVector.copy(
            this.snapToTemporaryOneDimensional.closestVector(
              this.currentSphereVector
            )
          );
        } else {
          // there is a nearby point so the temporary point should not be displayed
          // Remove the temporary objects from the display.
          this.temporaryPointMarker.removeFromLayers();
          this.isTemporaryPointAdded = false;

          // if the nearby point is not antipode-able remove the temporary antipode
          if (!displayTemporaryAntipode && this.isTemporaryAntipodeAdded) {
            this.temporaryAntipodeMarker.removeFromLayers();
            this.isTemporaryAntipodeAdded = false;
          }
        }
      } else if (
        this.snapToTemporaryOneDimensional === null &&
        this.snapToTemporaryPoint !== null
      ) {
        this.temporaryAntipodeMarker.positionVector = this.tmpVector
          .copy(this.snapToTemporaryPoint.locationVector)
          .multiplyScalar(-1);
        if (this.hitSEPoints.length === 0) {
          //no nearby points, so display the pointMarker
          this.temporaryPointMarker.positionVector = this.tmpVector.copy(
            this.snapToTemporaryPoint.locationVector
          );
        } else {
          // there is a nearby point so the temporary point should not be displayed
          // Remove the temporary objects from the display.
          this.temporaryPointMarker.removeFromLayers();
          this.isTemporaryPointAdded = false;
          // if the nearby point is not antipode-able remove the temporary antipode
          // if (!displayTemporaryAntipode) {
          //   this.temporaryAntipodeMarker.removeFromLayers();
          //   this.isTemporaryAntipodeAdded = false;
          // }
        }
      }
    } else {
      if (this.isTemporaryAntipodeAdded) {
        // Remove the temporary objects from the display.
        this.temporaryAntipodeMarker.removeFromLayers();
        this.isTemporaryAntipodeAdded = false;
      }
      if (this.isTemporaryPointAdded) {
        // Remove the temporary objects from the display.
        this.temporaryPointMarker.removeFromLayers();
        this.isTemporaryPointAdded = false;
      }
      this.snapToTemporaryOneDimensional = null;
      this.snapToTemporaryPoint = null;
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
    if (this.isTemporaryAntipodeAdded) {
      // Remove the temporary objects from the display.
      this.temporaryAntipodeMarker.removeFromLayers();
    }
    this.isTemporaryAntipodeAdded = false;
    if (this.isTemporaryPointAdded) {
      // Remove the temporary objects from the display.
      this.temporaryPointMarker.removeFromLayers();
    }
    this.isTemporaryPointAdded = false;
    this.snapToTemporaryOneDimensional = null;
    this.snapToTemporaryPoint = null;
  }
  activate(): void {
    // If there is exactly one point selected, reveal its anitpode unless it is already visible
    if (AntipodalPointHandler.store.selectedSENodules.length == 1) {
      const object = AntipodalPointHandler.store.selectedSENodules[0];
      if (object instanceof SEPoint) {
        // find the antipode
        const antipodeIndex = AntipodalPointHandler.store.sePoints.findIndex(
          pt => {
            this.tmpVector.copy(pt.locationVector).multiplyScalar(-1);
            this.tmpVector.sub(object.locationVector);
            if (this.tmpVector.isZero()) {
              return true;
            } else {
              return false;
            }
          }
        );
        if (antipodeIndex > -1) {
          const possibleAntipode =
            AntipodalPointHandler.store.sePoints[antipodeIndex];
          this.revealAntipode(possibleAntipode, object);
        } else {
          console.warn(
            `Antipode Point Handler: Antipode of selected point ${object.name} doesn't exist!!!!!`
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

  revealAntipode(possibleAntipode: SEPoint, parent: SEPoint): void {
    if (
      possibleAntipode !== null &&
      ((possibleAntipode instanceof SEAntipodalPoint &&
        !possibleAntipode.isUserCreated) ||
        (possibleAntipode instanceof SEIntersectionPoint &&
          !possibleAntipode.isUserCreated &&
          !possibleAntipode.isAntipodal))
    ) {
      //The antipode is not displayed
      const antipodalCommandGroup = new CommandGroup();
      antipodalCommandGroup.addCommand(
        new SetPointUserCreatedValueCommand(possibleAntipode, true)
      );
      // if the possible antipode is an intersection point convert it to antipodal mode
      if (possibleAntipode instanceof SEIntersectionPoint) {
        antipodalCommandGroup.addCommand(
          new ConvertIntersectionPointToAntipodalMode(
            possibleAntipode,
            this.parentPoint as SEIntersectionPoint
          )
        );
      }
      if (
        this.parentPoint instanceof SEIntersectionPoint &&
        !this.parentPoint.isUserCreated // Do not add antipodal points here because if this parentPoint is seAntipode its parent already exists
      ) {
        //Make it user created and turn on the display
        antipodalCommandGroup.addCommand(
          new SetPointUserCreatedValueCommand(
            this.parentPoint as SEIntersectionPoint,
            true
          )
        );
      }
      antipodalCommandGroup.execute();
    } else {
      // the antipode is already displayed
      //"The antipode of the selected point is the point {pointName} and has already been created.",
      EventBus.fire("show-alert", {
        key: `handlers.antipodeDuplicate`,
        keyOptions: {
          pointName: parent.label!.ref.shortUserName
        },
        type: "error"
      });
    }
  }
}
