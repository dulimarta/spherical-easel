import Two from "two.js";
import Highlighter from "./Highlighter";
import { SESegment } from "@/models/SESegment";
import { AddLengthMeasurementCommand } from "@/commands/AddLengthMeasurementCommand";
import { SESegmentLength } from "@/models/SESegmentLength";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { StyleEditPanels } from "@/types/Styles";
import { SEMeasurable } from "@/types";
import { SEExpression } from "@/models/SEExpression";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SETranslation } from "@/models/SETranslation";
import { AddTranslationCommand } from "@/commands/AddTranslationCommand";
import { SELine } from "@/models/SELine";
import { Vector3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SEPointDistance } from "@/models/SEPointDistance";
import { AddPointDistanceMeasurementCommand } from "@/commands/AddPointDistanceMeasurementCommand";
export default class TranslationTransformationHandler extends Highlighter {
  /**  The model object line or line segment to translate along */
  private translationLineOrSegment: SELine | SESegment | null = null;

  /**
   * If the user starts to make a translation and mouse press at a location on the sphere (or not on the sphere), then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that.
   */
  private translationLineOrSegmentSelected = false;

  /** The possible parent of the measurement that determines length of the translation*/
  private measurementSEParent: SEMeasurable | null = null;

  /* temporary vector and matrix to help with computations */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(_event: MouseEvent): void {
    // First decide if the location of the event is on the sphere
    // if the user has already selected a center do nothing
    if (this.isOnSphere && !this.translationLineOrSegmentSelected) {
      // next decide if this tool can be used
      if (
        TranslationTransformationHandler.store.seCircles.length === 0 &&
        TranslationTransformationHandler.store.seSegments.length === 0 &&
        TranslationTransformationHandler.store.expressions.length === 0
      ) {
        // warn the user
        EventBus.fire("show-alert", {
          key: "handlers.firstMustCreateMeasurable",
          type: "error"
        });
        // switch to tools tab
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 0 });
        // Change the tool
        TranslationTransformationHandler.store.setActionMode({
          id: "segment",
          name: "CreateLineSegmentDisplayedName"
        });
        return;
      }
      // Check to see if the current location is near any segments
      if (this.hitSESegments.length > 0) {
        // The translate along a segment
        this.translationLineOrSegment = this.hitSESegments[0];
        // The user is making a translation
        this.translationLineOrSegmentSelected = true;
        this.translationLineOrSegment.selected = true;
        this.translationLineOrSegment.glowing = true;
      } else if (this.hitSELines.length > 0) {
        // The translate along a line
        this.translationLineOrSegment = this.hitSELines[0];
        // The user is making a translation
        this.translationLineOrSegmentSelected = true;
        this.translationLineOrSegment.selected = true;
        this.translationLineOrSegment.glowing = true;
      }
      if (this.translationLineOrSegmentSelected) {
        EventBus.fire("show-alert", {
          key: `handlers.translationLineOrSegmentSelected`,
          keyOptions: {},
          type: "info"
        });
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    // Make sure that the event is on the sphere
    // The user has not selected a rotation point
    if (this.isOnSphere && !this.translationLineOrSegmentSelected) {
      // Only object can be interacted with at a given time, so set the first point nearby to glowing
      // The user can create points on ellipses, circles, segments, and lines, so
      // highlight those as well (but only one) if they are nearby also

      if (this.hitSESegments.length > 0) {
        this.hitSESegments[0].glowing = true;
      } else if (this.hitSELines.length > 0) {
        this.hitSELines[0].glowing = true;
      }
    }
    // Make sure that the event is on the sphere
    // The user has selected a center point
    else if (this.isOnSphere && this.translationLineOrSegmentSelected) {
      // Only object can be interacted with at a given time, so set the first point nearby to glowing
      // The user can create points on ellipses, circles, segments, and lines, so
      // highlight those as well (but only one) if they are nearby also

      const hitLabels = this.hitSELabels.filter(lab =>
        lab.parent.isMeasurable()
      );
      if (this.hitSESegments.length > 0) {
        this.hitSESegments[0].glowing = true;
        this.measurementSEParent = this.hitSESegments[0];
      } else if (this.hitSECircles.length > 0) {
        this.hitSECircles[0].glowing = true;
        this.measurementSEParent = this.hitSECircles[0];
      } else if (this.hitSEPolygons.length > 0) {
        this.hitSEPolygons[0].glowing = true;
        this.measurementSEParent = this.hitSEPolygons[0];
      } else if (this.hitSEAngleMarkers.length > 0) {
        this.hitSEAngleMarkers[0].glowing = true;
        this.measurementSEParent = this.hitSEAngleMarkers[0];
      } else if (hitLabels.length > 0) {
        this.hitSELabels[0].glowing = true;
        this.measurementSEParent = this.hitSELabels[0].parent as SEMeasurable;
      } else {
        this.measurementSEParent = null;
      }
    }
    // Not on the sphere -- remove the temporary circle
  }

  mouseReleased(_event: MouseEvent): void {
    if (this.isOnSphere) {
      // Make sure the user didn't trigger the mouse leave event and is actually making a translation
      if (this.translationLineOrSegmentSelected) {
        // If the user isn't over measureable object don't do anything
        if (this.measurementSEParent !== null) {
          if (!this.makeTranslation()) {
            EventBus.fire("show-alert", {
              key: `handlers.duplicateTranslation`,
              keyOptions: {},
              type: "error"
            });
          }
          //reset the tool to handle the next circle
          this.prepareForNextTranslation();
        }
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
  }

  prepareForNextTranslation(): void {
    // Remove the temporary objects from the scene and mark the temporary object
    //  not added to the scene clear snap objects

    // Clear old points and values to get ready for creating the next circle.
    if (this.translationLineOrSegment !== null) {
      this.translationLineOrSegment.glowing = false;
      this.translationLineOrSegment.selected = false;
    }
    this.translationLineOrSegment = null;
    this.translationLineOrSegmentSelected = false;

    this.measurementSEParent = null;
    // call an unglow all command
    TranslationTransformationHandler.store.unglowAllSENodules();
  }

  setExpression(expression: SEExpression): void {
    // do nothing if the rotation location is not set
    if (this.translationLineOrSegmentSelected) {
      this.measurementSEParent = expression;
      if (!this.makeTranslation()) {
        EventBus.fire("show-alert", {
          key: `handlers.duplicateTranslation`,
          keyOptions: {},
          type: "error"
        });
      }
      //reset the tool to handle the next circle
      this.prepareForNextTranslation();
    }
  }
  /**
   * Add a new rotation if it not a duplicate
   */
  makeTranslation(): boolean {
    // Create a command group to add the points defining the circle and the circle to the store
    // This way a single undo click will undo all (potentially three) operations.
    const translationCommandGroup = new CommandGroup();

    // create the SEExpression based on this.measurementSEParent
    let measurementSEExpression: SEExpression | null = null;

    if (this.measurementSEParent instanceof SESegment) {
      // determine if this SESegment has already been measured
      if (
        !TranslationTransformationHandler.store.expressions.some(exp => {
          if (
            exp instanceof SESegmentLength &&
            this.measurementSEParent !== null &&
            exp.seSegment.name === this.measurementSEParent.name
          ) {
            measurementSEExpression = exp;
            return true;
          } else {
            return false;
          }
        })
      ) {
        // the segment has not been measured so create new SEEXpression for the measurement
        measurementSEExpression = new SESegmentLength(this.measurementSEParent);
        EventBus.fire("show-alert", {
          key: `handlers.newSegmentMeasurementAdded`,
          keyOptions: { name: `${measurementSEExpression.name}` },
          type: "success"
        });
        translationCommandGroup.addCommand(
          new AddLengthMeasurementCommand(
            measurementSEExpression,
            this.measurementSEParent
          )
        );
        if (
          this.measurementSEParent !== null &&
          this.measurementSEParent.label !== undefined
        ) {
          // Set the selected segment's Label to display and to show NameAndValue in an undoable way
          translationCommandGroup.addCommand(
            new StyleNoduleCommand(
              [this.measurementSEParent.label.ref],
              StyleEditPanels.Label,
              [
                {
                  labelDisplayMode: SETTINGS.segment.measuringChangesLabelModeTo
                }
              ],
              [
                {
                  labelDisplayMode:
                    this.measurementSEParent.label.ref.labelDisplayMode
                }
              ]
            )
          );
          translationCommandGroup.addCommand(
            new SetNoduleDisplayCommand(this.measurementSEParent.label, true)
          );
        }
      }
    } else if (this.measurementSEParent instanceof SECircle) {
      // make sure that this pair (center point to circle point) has not been measured already
      if (
        !TranslationTransformationHandler.store.expressions.some(exp => {
          if (
            exp instanceof SEPointDistance &&
            this.measurementSEParent instanceof SECircle &&
            ((exp.parents[0].name ===
              this.measurementSEParent.circleSEPoint.name &&
              exp.parents[1].name ===
                this.measurementSEParent.centerSEPoint.name) ||
              (exp.parents[0].name ===
                this.measurementSEParent.centerSEPoint.name &&
                exp.parents[1].name ===
                  this.measurementSEParent.circleSEPoint.name))
          ) {
            // distance between points has already been measured don't add a new SEExpression
            measurementSEExpression = exp;
            return true;
          } else {
            return false;
          }
        })
      ) {
        // the distance between the points has not been added so create a new SEExpression to measure the distance

        measurementSEExpression = new SEPointDistance(
          this.measurementSEParent.centerSEPoint,
          this.measurementSEParent.circleSEPoint
        );
        EventBus.fire("show-alert", {
          key: `handlers.newMeasurementAdded`,
          keyOptions: { name: `${measurementSEExpression.name}` },
          type: "success"
        });
        translationCommandGroup.addCommand(
          new AddPointDistanceMeasurementCommand(measurementSEExpression, [
            this.measurementSEParent.centerSEPoint,
            this.measurementSEParent.circleSEPoint
          ])
        );
      }
    } else {
      measurementSEExpression = this.measurementSEParent as SEExpression;
    }

    // check to make sure that this rotation doesn't already exist
    if (
      TranslationTransformationHandler.store.seTransformations.some(
        trans =>
          trans instanceof SETranslation &&
          trans.seLineOrSegment.name === this.translationLineOrSegment?.name &&
          measurementSEExpression?.name ===
            trans.translationDistanceExpression.name
      )
    ) {
      return false;
    }
    if (
      measurementSEExpression !== null &&
      this.translationLineOrSegment !== null
    ) {
      // create the rotation

      const newSETranslation = new SETranslation(
        this.translationLineOrSegment,
        measurementSEExpression
      );

      translationCommandGroup.addCommand(
        new AddTranslationCommand(
          newSETranslation,
          this.translationLineOrSegment,
          measurementSEExpression
        )
      );
      EventBus.fire("show-alert", {
        key: `handlers.newTranslationAdded`,
        keyOptions: { name: `${newSETranslation.name}` },
        type: "success"
      });
    }

    translationCommandGroup.execute();
    return true;
  }

  activate(): void {
    // Unselect the selected objects and clear the selectedObject arrays test
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
    this.prepareForNextTranslation();
  }
}
