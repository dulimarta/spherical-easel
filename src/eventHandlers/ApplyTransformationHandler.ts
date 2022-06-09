/** @format */

import { AddTransformedPointCommand } from "@/commands/AddTransformedPointCommand";
import { CommandGroup } from "@/commands/CommandGroup";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import SETTINGS from "@/global-settings";
import i18n from "@/i18n";
import { SECircle } from "@/models/SECircle";
import { SEEllipse } from "@/models/SEEllipse";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEInversion } from "@/models/SEInversion";
import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { SEParametric } from "@/models/SEParametric";
import { SEPoint } from "@/models/SEPoint";
import { SEPointReflection } from "@/models/SEPointReflection";
import { SEReflection } from "@/models/SEReflection";
import { SERotation } from "@/models/SERotation";
import { SESegment } from "@/models/SESegment";
import { SETransformation } from "@/models/SETransformation";
import { SETransformedPoint } from "@/models/SETransformedPoint";
import { SEIsometrySegment } from "@/models/SEIsometrySegment";
import { SETranslation } from "@/models/SETranslation";
import Circle from "@/plottables/Circle";
import Ellipse from "@/plottables/Ellipse";
import Label from "@/plottables/Label";
import Line from "@/plottables/Line";
import { DisplayStyle } from "@/plottables/Nodule";
import NonFreePoint from "@/plottables/NonFreePoint";
import NonFreeSegment from "@/plottables/NonFreeSegment";
import Parametric from "@/plottables/Parametric";
import Point from "@/plottables/Point";
import Segment from "@/plottables/Segment";
import { SEStore } from "@/store";
import { Vector3, Matrix4 } from "three";
import Two from "two.js";
import EventBus from "./EventBus";
import Highlighter from "./Highlighter";
import { AddIsometrySegmentCommand } from "@/commands/AddIsometrySegmentCommand";
import { AddIsometryCircleCommand } from "@/commands/AddIsometryCircleCommand";
import { SEIsometryCircle } from "@/models/SEIsometryCircle";
import NonFreeCircle from "@/plottables/NonFreeCircle";
import { AddIsometryEllipseCommand } from "@/commands/AddIsometryEllipseCommand";
import { SEIsometryEllipse } from "@/models/SEIsometryEllipse";
import NonFreeEllipse from "@/plottables/NonFreeEllipse";
import { AddIsometryLineCommand } from "@/commands/AddIsometryLineCommand";
import { SEIsometryLine } from "@/models/SEIsometryLine";
import NonFreeLine from "@/plottables/NonFreeLine";

export default class ApplyTransformationHandler extends Highlighter {
  /**  The model object that is being transformed */
  private preimageSEPoint: SEPoint | null = null;
  private preimageSESegment: SESegment | null = null;
  private preimageSELine: SELine | null = null;
  private preimageSECircle: SECircle | null = null;
  private preimageSEEllipse: SEEllipse | null = null;
  private preimageSEParametric: SEParametric | null = null;

  /** The transformation that is being applied */
  private transformationSEParent: SETransformation | null = null;
  private transformationType = "";

  /**
   * If the user has select a transformation this variable is set
   */
  //private transformationSelected = false; // if the transformation is null, then it has not been user selected

  /**  The temporary plottable TwoJS object displayed as the user moves the mouse or drags after selecting a transformation */
  private temporaryPoint: Point;
  private temporarySegment: Segment;
  private temporaryLine: Line;
  private temporaryCircle: Circle;
  private temporaryEllipse: Ellipse;
  private temporaryParametric: Parametric;

  /** Has the temporary object been added to the scene?*/
  private temporaryCircleAdded = false;
  private temporaryPointAdded = false;
  private temporarySegmentAdded = false;
  private temporaryLineAdded = false;
  private temporaryEllipseAdded = false;
  private temporaryParametricAdded = false;

  /* temporary vector and matrix to help with computations */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpMatrix = new Matrix4();

  constructor(layers: Two.Group[]) {
    super(layers);
    // Set the style using the temporary defaults
    this.temporaryPoint = new Point();
    this.temporaryPoint.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryPoint);

    this.temporarySegment = new Segment();
    this.temporarySegment.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporarySegment);

    this.temporaryLine = new Line();
    this.temporaryLine.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryLine);

    this.temporaryCircle = new Circle();
    this.temporaryCircle.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryCircle);

    this.temporaryEllipse = new Ellipse();
    this.temporaryEllipse.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryEllipse);

    this.temporaryParametric = new Parametric();
    this.temporaryParametric.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryParametric);
  }

  mousePressed(_event: MouseEvent): void {
    // First decide if the location of the event is on the sphere
    if (this.isOnSphere) {
      // determine if the user has selected a transformation
      if (this.transformationSEParent != null) {
        if (this.hitSEPoints.length > 0) {
          this.preimageSEPoint = this.hitSEPoints[0];
          if (
            !this.preimageSEPoint.kids.some(kid => {
              kid instanceof SETransformedPoint &&
                this.transformationSEParent &&
                kid.parentTransformation.name ===
                  this.transformationSEParent.name;
            })
          ) {
            // this point has not been transformed with this transformation
            const transformedPointCommandGroup = new CommandGroup();
            this.addTransformedPointCommands(transformedPointCommandGroup);
            transformedPointCommandGroup.execute();
            this.prepareForNextGeometricObject();
          } else {
            // this point has already been transformed with this transformation
            EventBus.fire("show-alert", {
              key: `handlers.duplicateTransformedObject`,
              keyOptions: {
                object: i18n.tc(`objects.points`, 3),
                name: this.preimageSEPoint.name,
                type: this.transformationType,
                trans: this.transformationSEParent.name
              },
              type: "success"
            });
          }
        } else if (this.hitSESegments.length > 0) {
          this.preimageSESegment = this.hitSESegments[0];
          if (
            !this.preimageSESegment.kids.some(kid => {
              kid instanceof SEIsometrySegment &&
                this.transformationSEParent &&
                kid.parentIsometry.name === this.transformationSEParent.name;
            })
          ) {
            // this Segment has not been transformed with this transformation
            const transformedSegmentCommandGroup = new CommandGroup();
            this.addTransformedSegmentCommands(transformedSegmentCommandGroup);
            transformedSegmentCommandGroup.execute();
            this.prepareForNextGeometricObject();
          } else {
            // this Segment has already been transformed with this transformation
            EventBus.fire("show-alert", {
              key: `handlers.duplicateTransformedSegment`,
              keyOptions: {
                object: i18n.tc(`objects.Segments`, 3),
                name: this.preimageSESegment.name,
                type: this.transformationType,
                trans: this.transformationSEParent.name
              },
              type: "success"
            });
          }
        } else if (this.hitSECircles.length > 0) {
          //
        } else if (this.hitSEEllipses.length > 0) {
          //
        } else if (this.hitSEParametrics.length > 0) {
          // not yet implemented
        }
      } else {
        // the user is clicking on the sphere, but hasn't selected a transformation
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
        EventBus.fire("expand-transformation-sheet", {});
        EventBus.fire("show-alert", {
          key: "handlers.applyTransformationSelectTransformation",
          type: "warning"
        });
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    if (this.transformationSEParent !== null) {
      // Find all the nearby (hitSE... objects) and update location vectors
      super.mouseMoved(event);

      // Make sure that the event is on the sphere
      // The user has not selected a center point
      if (this.isOnSphere) {
        // Only object can be interacted with at a given time, so set the first point nearby to glowing
        // The user can create points on ellipses, circles, segments, and lines, so
        // highlight those as well (but only one) if they are nearby also
        // Also set the snap objects
        let possiblyGlowing: SEPoint | SEOneOrTwoDimensional | null = null;
        if (this.hitSEPoints.length > 0) {
          possiblyGlowing = this.hitSEPoints[0];
        } else if (this.hitSESegments.length > 0) {
          possiblyGlowing = this.hitSESegments[0];
        } else if (this.hitSELines.length > 0) {
          possiblyGlowing = this.hitSELines[0];
        } else if (this.hitSECircles.length > 0) {
          possiblyGlowing = this.hitSECircles[0];
        } else if (this.hitSEEllipses.length > 0) {
          possiblyGlowing = this.hitSEEllipses[0];
        } else if (this.hitSEParametrics.length > 0) {
          possiblyGlowing = this.hitSEParametrics[0];
        } else if (this.hitSEPolygons.length > 0) {
          possiblyGlowing = this.hitSEPolygons[0];
        } else {
          this.snapTemporaryPointMarkerToOneDimensional = null;
          this.snapTemporaryPointMarkerToPoint = null;
        }

        if (possiblyGlowing !== null) {
          if (possiblyGlowing instanceof SEPoint) {
            possiblyGlowing.glowing = true;
            this.snapTemporaryPointMarkerToOneDimensional = null;
            this.snapTemporaryPointMarkerToPoint = possiblyGlowing;
          }
          // possiblyGlowing is a oneDimensional Object
          else {
            possiblyGlowing.glowing = true;
            this.snapTemporaryPointMarkerToOneDimensional = possiblyGlowing;
            this.snapTemporaryPointMarkerToPoint = null;
          }
        }

        // If the temporary startMarker has *not* been added to the scene do so now
        if (!this.temporaryCenterMarkerAdded) {
          this.temporaryCenterMarkerAdded = true;
          this.temporaryCenterMarker.addToLayers(this.layers);
        }
        // Remove the temporary startMarker if there is a nearby point which can glowing
        if (this.snapTemporaryPointMarkerToPoint !== null) {
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // glowing when the user select that location and then moves the mouse away - see line 115) we don't
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            this.snapTemporaryPointMarkerToPoint instanceof
              SEIntersectionPoint &&
            !this.snapTemporaryPointMarkerToPoint.isUserCreated
          ) {
            this.temporaryCenterMarker.positionVector =
              this.snapTemporaryPointMarkerToPoint.locationVector;
          } else {
            this.temporaryCenterMarker.removeFromLayers();
            this.temporaryCenterMarkerAdded = false;
          }
        }
        // Set the location of the temporary startMarker by snapping to appropriate object (if any)
        if (this.snapTemporaryPointMarkerToOneDimensional !== null) {
          this.temporaryCenterMarker.positionVector =
            this.snapTemporaryPointMarkerToOneDimensional.closestVector(
              this.currentSphereVector
            );
        } else if (this.snapTemporaryPointMarkerToPoint == null) {
          this.temporaryCenterMarker.positionVector = this.currentSphereVector;
        }
      }
      // Make sure that the event is on the sphere
      // The user has selected a center point
      else if (this.isOnSphere && this.transformationSelected) {
        // Only object can be interacted with at a given time, so set the first point nearby to glowing
        // The user can create points on ellipses, circles, segments, and lines, so
        // highlight those as well (but only one) if they are nearby also

        const hitLabels = this.hitSELabels.filter(lab =>
          lab.parent.isMeasurable()
        );
        if (this.hitSESegments.length > 0) {
          this.hitSESegments[0].glowing = true;
          this.transformationSEParent = this.hitSESegments[0];
        } else if (this.hitSECircles.length > 0) {
          this.hitSECircles[0].glowing = true;
          this.transformationSEParent = this.hitSECircles[0];
        } else if (this.hitSEPolygons.length > 0) {
          this.hitSEPolygons[0].glowing = true;
          this.transformationSEParent = this.hitSEPolygons[0];
        } else if (this.hitSEAngleMarkers.length > 0) {
          this.hitSEAngleMarkers[0].glowing = true;
          this.transformationSEParent = this.hitSEAngleMarkers[0];
        } else if (hitLabels.length > 0) {
          this.hitSELabels[0].glowing = true;
          this.transformationSEParent = this.hitSELabels[0]
            .parent as SEMeasurable;
        } else {
          this.transformationSEParent = null;
        }

        if (this.transformationSEParent !== null) {
          // If the temporary circle has *not* been added to the scene do so now (only once)
          if (!this.temporaryCircleAdded) {
            this.temporaryCircleAdded = true;
            this.temporaryCircle.addToLayers(this.layers);
          }

          //compute the radius of the temporary circle
          if (this.transformationSEParent instanceof SESegment) {
            this.arcRadius = this.transformationSEParent.arcLength;
          } else if (this.transformationSEParent instanceof SECircle) {
            this.arcRadius = this.transformationSEParent.circleRadius;
          } else if (
            this.transformationSEParent instanceof SEPolygon ||
            this.transformationSEParent instanceof SEAngleMarker ||
            this.transformationSEParent instanceof SEExpression
          ) {
            this.arcRadius = this.transformationSEParent.value;
          }

          // Set the radius of the temporary circle, the center was set in Mouse Press
          this.temporaryCircle.circleRadius = this.arcRadius;
          //update the display
          this.temporaryCircle.updateDisplay();
        } else {
          this.temporaryCircle.removeFromLayers();
          this.temporaryCircleAdded = false;
        }
      }
      // Not on the sphere -- remove the temporary circle and point
      else {
        this.temporaryCenterMarker.removeFromLayers();
        this.temporaryCenterMarkerAdded = false;
        this.temporaryCircle.removeFromLayers();
        this.temporaryCircleAdded = false;
      }
    }
  }

  mouseReleased(_event: MouseEvent): void {
    if (this.isOnSphere) {
      // Make sure the user didn't trigger the mouse leave event and is actually making a circle
      if (this.transformationSelected) {
        // If the user isn't over  measureable object don't do anything
        if (this.transformationSEParent !== null) {
          if (!this.makeCircle()) {
            EventBus.fire("show-alert", {
              key: `handlers.measuredCircleCreationAttemptDuplicate`,
              keyOptions: {},
              type: "error"
            });
          }
          //reset the tool to handle the next circle
          this.prepareForNextGeometricObject();
        }
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
  }

  prepareForNextGeometricObject(): void {
    // Remove the temporary objects from the scene and mark the temporary object
    //  not added to the scene

    this.temporaryPoint.removeFromLayers();
    this.temporaryPointAdded = false;

    this.temporarySegment.removeFromLayers();
    this.temporarySegmentAdded = false;

    this.temporaryLine.removeFromLayers();
    this.temporaryLineAdded = false;

    this.temporaryCircle.removeFromLayers();
    this.temporaryCircleAdded = false;

    this.temporaryEllipse.removeFromLayers();
    this.temporaryEllipseAdded = false;

    this.temporaryParametric.removeFromLayers();
    this.temporaryParametricAdded = false;

    // Clear old points and values to get ready for creating the next transformed object.
    if (this.preimageSEPoint !== null) {
      this.preimageSEPoint.glowing = false;
      this.preimageSEPoint.selected = false;
      this.preimageSEPoint = null;
    }

    if (this.preimageSESegment !== null) {
      this.preimageSESegment.glowing = false;
      this.preimageSESegment.selected = false;
      this.preimageSESegment = null;
    }

    if (this.preimageSELine !== null) {
      this.preimageSELine.glowing = false;
      this.preimageSELine.selected = false;
      this.preimageSELine = null;
    }

    if (this.preimageSECircle !== null) {
      this.preimageSECircle.glowing = false;
      this.preimageSECircle.selected = false;
      this.preimageSECircle = null;
    }

    if (this.preimageSEEllipse !== null) {
      this.preimageSEEllipse.glowing = false;
      this.preimageSEEllipse.selected = false;
      this.preimageSEEllipse = null;
    }

    if (this.preimageSEParametric !== null) {
      this.preimageSEParametric.glowing = false;
      this.preimageSEParametric.selected = false;
      this.preimageSEParametric = null;
    }

    // call an unglow all command
    SEStore.unglowAllSENodules();
  }

  prepareForNextTransformation(): void {
    this.prepareForNextGeometricObject();
    this.transformationSEParent = null;
    this.transformationType = "";
  }

  setTransformation(transformation: SETransformation): void {
    this.transformationSEParent = transformation;

    if (this.transformationSEParent instanceof SETranslation) {
      this.transformationType = i18n.tc(`objects.translations`, 3);
    } else if (this.transformationSEParent instanceof SEPointReflection) {
      this.transformationType = i18n.tc(`objects.pointReflections`, 3);
    } else if (this.transformationSEParent instanceof SEReflection) {
      this.transformationType = i18n.tc(`objects.reflections`, 3);
    } else if (this.transformationSEParent instanceof SERotation) {
      this.transformationType = i18n.tc(`objects.rotations`, 3);
    } else if (this.transformationSEParent instanceof SEInversion) {
      this.transformationType = i18n.tc(`objects.inversions`, 3);
    }
  }

  addTransformedPointCommands(
    commandGroup: CommandGroup
  ): SETransformedPoint | null {
    // the preimageSEPoint and transformation are set
    if (this.preimageSEPoint && this.transformationSEParent) {
      if (
        this.preimageSEPoint instanceof SEIntersectionPoint &&
        !this.preimageSEPoint.isUserCreated
      ) {
        // Mark the intersection point as created
        commandGroup.addCommand(
          new ConvertInterPtToUserCreatedCommand(this.preimageSEPoint)
        );
      }
      // we have to create a new tranformed point
      const newTransformedPoint = new NonFreePoint();
      // Set the display to the default values
      newTransformedPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the size of the point to the current zoom magnification factor
      newTransformedPoint.adjustSize();

      const newTransformedSEPoint = new SETransformedPoint(
        newTransformedPoint,
        this.preimageSEPoint,
        this.transformationSEParent
      );

      // Create the label
      const newSELabel = new SELabel(new Label(), newTransformedSEPoint);
      // Set the initial label location
      this.tmpVector
        .copy(newTransformedSEPoint.locationVector)
        .add(
          new Vector3(
            2 * SETTINGS.point.initialLabelOffset,
            SETTINGS.point.initialLabelOffset,
            0
          )
        )
        .normalize();
      newSELabel.locationVector = this.tmpVector;

      commandGroup.addCommand(
        new AddTransformedPointCommand(
          newTransformedSEPoint,
          newSELabel,
          this.preimageSEPoint,
          this.transformationSEParent
        )
      );
      EventBus.fire("show-alert", {
        key: `handlers.newTransformedPointAdded`,
        keyOptions: { name: `${newTransformedSEPoint.name}` },
        type: "success"
      });
      return newTransformedSEPoint;
    } else {
      return null;
    }
  }

  addTransformedSegmentCommands(commandGroup: CommandGroup): void {
    // the preimageSESegment and transformation are set
    if (this.preimageSESegment && this.transformationSEParent) {
      // make the images of the endpoints of the segment
      //  make sure they don't exist first
      let transformedStartSEPoint: SETransformedPoint | null = null;
      this.preimageSESegment.startSEPoint.kids.forEach(kid => {
        if (
          kid instanceof SETransformedPoint &&
          this.transformationSEParent &&
          kid.parentTransformation.name === this.transformationSEParent.name
        ) {
          transformedStartSEPoint = kid;
        }
      });
      if (transformedStartSEPoint === null) {
        // the start of the segment hasn't been transformed by this transformation
        this.preimageSEPoint = this.preimageSESegment.startSEPoint;
        transformedStartSEPoint =
          this.addTransformedPointCommands(commandGroup);
        this.preimageSEPoint = null;
      }

      let transformedEndSEPoint: SETransformedPoint | null = null;
      this.preimageSESegment.endSEPoint.kids.forEach(kid => {
        if (
          kid instanceof SETransformedPoint &&
          this.transformationSEParent &&
          kid.parentTransformation.name === this.transformationSEParent.name
        ) {
          transformedEndSEPoint = kid;
        }
      });
      if (transformedEndSEPoint === null) {
        // the end of the segment hasn't been transformed by this transformation
        this.preimageSEPoint = this.preimageSESegment.endSEPoint;
        transformedEndSEPoint = this.addTransformedPointCommands(commandGroup);
        this.preimageSEPoint = null;
      }
      if (transformedStartSEPoint === null) {
        throw Error(
          "Apply Transformation Handler: transformed segment start SE Point not found and not created"
        );
      }
      if (transformedEndSEPoint === null) {
        throw Error(
          "Apply Transformation Handler: transformed segment end SE Point not found and not created"
        );
      }
      // first deal with the isometries
      if (
        this.transformationSEParent instanceof SEReflection ||
        this.transformationSEParent instanceof SERotation ||
        this.transformationSEParent instanceof SEPointReflection ||
        this.transformationSEParent instanceof SETranslation
      ) {
        // we have to create a new transformed segment
        const newTransformedSegment = new NonFreeSegment();
        // Set the display to the default values
        newTransformedSegment.stylize(DisplayStyle.ApplyCurrentVariables);
        // Adjust the size of the point to the current zoom magnification factor
        newTransformedSegment.adjustSize();

        const newIsometrySESegment = new SEIsometrySegment(
          newTransformedSegment,
          transformedStartSEPoint,
          this.transformationSEParent.f(this.preimageSESegment.normalVector),
          this.preimageSESegment.arcLength,
          transformedEndSEPoint,
          this.preimageSESegment,
          this.transformationSEParent
        );

        // Create the label
        const newSELabel = new SELabel(new Label(), newIsometrySESegment);
        // Set the initial label location
        this.tmpVector
          .copy(newIsometrySESegment.getMidPointVector())
          .add(
            new Vector3(
              2 * SETTINGS.segment.initialLabelOffset,
              SETTINGS.segment.initialLabelOffset,
              0
            )
          )
          .normalize();
        newSELabel.locationVector = this.tmpVector;

        commandGroup.addCommand(
          new AddIsometrySegmentCommand(
            newIsometrySESegment,
            newSELabel,
            this.preimageSESegment,
            this.transformationSEParent
          )
        );

        EventBus.fire("show-alert", {
          key: `handlers.newIsometrySegmentAdded`,
          keyOptions: { name: `${newIsometrySESegment.name}` },
          type: "success"
        });
      } else if (this.transformationSEParent instanceof SEInversion) {
        // not implemented yet
      }
    }
  }

  addTransformedLineCommands(commandGroup: CommandGroup): void {
    // the preimageSELine and transformation are set
    if (this.preimageSELine && this.transformationSEParent) {
      // make the images of the endpoints of the Line
      //  make sure they don't exist first
      let transformedStartSEPoint: SETransformedPoint | null = null;
      this.preimageSELine.startSEPoint.kids.forEach(kid => {
        if (
          kid instanceof SETransformedPoint &&
          this.transformationSEParent &&
          kid.parentTransformation.name === this.transformationSEParent.name
        ) {
          transformedStartSEPoint = kid;
        }
      });
      if (transformedStartSEPoint === null) {
        // the start of the Line hasn't been transformed by this transformation
        this.preimageSEPoint = this.preimageSELine.startSEPoint;
        transformedStartSEPoint =
          this.addTransformedPointCommands(commandGroup);
        this.preimageSEPoint = null;
      }

      let transformedEndSEPoint: SETransformedPoint | null = null;
      this.preimageSELine.endSEPoint.kids.forEach(kid => {
        if (
          kid instanceof SETransformedPoint &&
          this.transformationSEParent &&
          kid.parentTransformation.name === this.transformationSEParent.name
        ) {
          transformedEndSEPoint = kid;
        }
      });
      if (transformedEndSEPoint === null) {
        // the end of the Line hasn't been transformed by this transformation
        this.preimageSEPoint = this.preimageSELine.endSEPoint;
        transformedEndSEPoint = this.addTransformedPointCommands(commandGroup);
        this.preimageSEPoint = null;
      }
      if (transformedStartSEPoint === null) {
        throw Error(
          "Apply Transformation Handler: transformed Line start SE Point not found and not created"
        );
      }
      if (transformedEndSEPoint === null) {
        throw Error(
          "Apply Transformation Handler: transformed Line end SE Point not found and not created"
        );
      }
      // first deal with the isometries
      if (
        this.transformationSEParent instanceof SEReflection ||
        this.transformationSEParent instanceof SERotation ||
        this.transformationSEParent instanceof SEPointReflection ||
        this.transformationSEParent instanceof SETranslation
      ) {
        // we have to create a new transformed Line
        const newTransformedLine = new NonFreeLine();
        // Set the display to the default values
        newTransformedLine.stylize(DisplayStyle.ApplyCurrentVariables);
        // Adjust the size of the point to the current zoom magnification factor
        newTransformedLine.adjustSize();

        const newIsometrySELine = new SEIsometryLine(
          newTransformedLine,
          transformedStartSEPoint,
          this.transformationSEParent.f(this.preimageSELine.normalVector),
          transformedEndSEPoint,
          this.preimageSELine,
          this.transformationSEParent
        );

        // Create the label
        const newSELabel = new SELabel(new Label(), newIsometrySELine);
        // Set the initial label location
        this.tmpVector
          .copy(newIsometrySELine.endSEPoint.locationVector)
          .add(
            new Vector3(
              2 * SETTINGS.line.initialLabelOffset,
              SETTINGS.line.initialLabelOffset,
              0
            )
          )
          .normalize();
        newSELabel.locationVector = this.tmpVector;

        commandGroup.addCommand(
          new AddIsometryLineCommand(
            newIsometrySELine,
            newSELabel,
            this.preimageSELine,
            this.transformationSEParent
          )
        );

        EventBus.fire("show-alert", {
          key: `handlers.newIsometryLineAdded`,
          keyOptions: { name: `${newIsometrySELine.name}` },
          type: "success"
        });
      } else if (this.transformationSEParent instanceof SEInversion) {
        // not implemented yet
      }
    }
  }

  addTransformedCircleCommands(commandGroup: CommandGroup): void {
    // the preimageSECircle and transformation are set
    if (this.preimageSECircle && this.transformationSEParent) {
      // make the images of the endpoints of the Circle
      //  make sure they don't exist first
      let transformedCenterSEPoint: SETransformedPoint | null = null;
      this.preimageSECircle.centerSEPoint.kids.forEach(kid => {
        if (
          kid instanceof SETransformedPoint &&
          this.transformationSEParent &&
          kid.parentTransformation.name === this.transformationSEParent.name
        ) {
          transformedCenterSEPoint = kid;
        }
      });
      if (transformedCenterSEPoint === null) {
        // the center of the Circle hasn't been transformed by this transformation
        this.preimageSEPoint = this.preimageSECircle.centerSEPoint;
        transformedCenterSEPoint =
          this.addTransformedPointCommands(commandGroup);
        this.preimageSEPoint = null;
      }

      let transformedCircleSEPoint: SETransformedPoint | null = null;
      this.preimageSECircle.circleSEPoint.kids.forEach(kid => {
        if (
          kid instanceof SETransformedPoint &&
          this.transformationSEParent &&
          kid.parentTransformation.name === this.transformationSEParent.name
        ) {
          transformedCircleSEPoint = kid;
        }
      });
      if (transformedCircleSEPoint === null) {
        // the end of the Circle hasn't been transformed by this transformation
        this.preimageSEPoint = this.preimageSECircle.circleSEPoint;
        transformedCircleSEPoint =
          this.addTransformedPointCommands(commandGroup);
        this.preimageSEPoint = null;
      }
      if (transformedCenterSEPoint === null) {
        throw Error(
          "Apply Transformation Handler: transformed Circle center SE Point not found and not created"
        );
      }
      if (transformedCircleSEPoint === null) {
        throw Error(
          "Apply Transformation Handler: transformed Circle circle SE Point not found and not created"
        );
      }
      // first deal with the isometries
      if (
        this.transformationSEParent instanceof SEReflection ||
        this.transformationSEParent instanceof SERotation ||
        this.transformationSEParent instanceof SEPointReflection ||
        this.transformationSEParent instanceof SETranslation
      ) {
        // we have to create a new transformed Circle
        const newTransformedCircle = new NonFreeCircle();
        // Set the display to the default values
        newTransformedCircle.stylize(DisplayStyle.ApplyCurrentVariables);
        // Adjust the size of the point to the current zoom magnification factor
        newTransformedCircle.adjustSize();

        const newIsometrySECircle = new SEIsometryCircle(
          newTransformedCircle,
          transformedCenterSEPoint,
          transformedCircleSEPoint,
          this.preimageSECircle,
          this.transformationSEParent
        );

        // Create the label
        const newSELabel = new SELabel(new Label(), newIsometrySECircle);
        // Set the initial label location
        this.tmpVector
          .copy(newIsometrySECircle.circleSEPoint.locationVector)
          .add(
            new Vector3(
              2 * SETTINGS.circle.initialLabelOffset,
              SETTINGS.circle.initialLabelOffset,
              0
            )
          )
          .normalize();
        newSELabel.locationVector = this.tmpVector;

        commandGroup.addCommand(
          new AddIsometryCircleCommand(
            newIsometrySECircle,
            newSELabel,
            this.preimageSECircle,
            this.transformationSEParent
          )
        );

        EventBus.fire("show-alert", {
          key: `handlers.newIsometryCircleAdded`,
          keyOptions: { name: `${newIsometrySECircle.name}` },
          type: "success"
        });
      } else if (this.transformationSEParent instanceof SEInversion) {
        // not implemented yet
      }
    }
  }

  addTransformedEllipseCommands(commandGroup: CommandGroup): void {
    // the preimageSEEllipse and transformation are set
    if (this.preimageSEEllipse && this.transformationSEParent) {
      // make the images of the endpoints of the Ellipse
      //  make sure they don't exist first
      let transformedFocus1SEPoint: SETransformedPoint | null = null;
      this.preimageSEEllipse.focus1SEPoint.kids.forEach(kid => {
        if (
          kid instanceof SETransformedPoint &&
          this.transformationSEParent &&
          kid.parentTransformation.name === this.transformationSEParent.name
        ) {
          transformedFocus1SEPoint = kid;
        }
      });
      if (transformedFocus1SEPoint === null) {
        // the start of the Ellipse hasn't been transformed by this transformation
        this.preimageSEPoint = this.preimageSEEllipse.focus1SEPoint;
        transformedFocus1SEPoint =
          this.addTransformedPointCommands(commandGroup);
        this.preimageSEPoint = null;
      }

      let transformedFocus2SEPoint: SETransformedPoint | null = null;
      this.preimageSEEllipse.focus1SEPoint.kids.forEach(kid => {
        if (
          kid instanceof SETransformedPoint &&
          this.transformationSEParent &&
          kid.parentTransformation.name === this.transformationSEParent.name
        ) {
          transformedFocus2SEPoint = kid;
        }
      });
      if (transformedFocus2SEPoint === null) {
        // the start of the Ellipse hasn't been transformed by this transformation
        this.preimageSEPoint = this.preimageSEEllipse.focus1SEPoint;
        transformedFocus2SEPoint =
          this.addTransformedPointCommands(commandGroup);
        this.preimageSEPoint = null;
      }

      let transformedEllipseSEPoint: SETransformedPoint | null = null;
      this.preimageSEEllipse.ellipseSEPoint.kids.forEach(kid => {
        if (
          kid instanceof SETransformedPoint &&
          this.transformationSEParent &&
          kid.parentTransformation.name === this.transformationSEParent.name
        ) {
          transformedEllipseSEPoint = kid;
        }
      });
      if (transformedEllipseSEPoint === null) {
        // the end of the Ellipse hasn't been transformed by this transformation
        this.preimageSEPoint = this.preimageSEEllipse.ellipseSEPoint;
        transformedEllipseSEPoint =
          this.addTransformedPointCommands(commandGroup);
        this.preimageSEPoint = null;
      }
      if (transformedFocus1SEPoint === null) {
        throw Error(
          "Apply Transformation Handler: transformed Ellipse focus1 SE Point not found and not created"
        );
      }
      if (transformedFocus2SEPoint === null) {
        throw Error(
          "Apply Transformation Handler: transformed Ellipse focus2 SE Point not found and not created"
        );
      }
      if (transformedEllipseSEPoint === null) {
        throw Error(
          "Apply Transformation Handler: transformed Ellipse ellipse SE Point not found and not created"
        );
      }
      // first deal with the isometries
      if (
        this.transformationSEParent instanceof SEReflection ||
        this.transformationSEParent instanceof SERotation ||
        this.transformationSEParent instanceof SEPointReflection ||
        this.transformationSEParent instanceof SETranslation
      ) {
        // we have to create a new transformed Ellipse
        const newTransformedEllipse = new NonFreeEllipse();
        // Set the display to the default values
        newTransformedEllipse.stylize(DisplayStyle.ApplyCurrentVariables);
        // Adjust the size of the point to the current zoom magnification factor
        newTransformedEllipse.adjustSize();

        const newIsometrySEEllipse = new SEIsometryEllipse(
          newTransformedEllipse,
          transformedFocus1SEPoint,
          transformedFocus2SEPoint,
          transformedEllipseSEPoint,
          this.preimageSEEllipse,
          this.transformationSEParent
        );

        // Create the label
        const newSELabel = new SELabel(new Label(), newIsometrySEEllipse);
        // Set the initial label location
        this.tmpVector
          .copy(newIsometrySEEllipse.ellipseSEPoint.locationVector)
          .add(
            new Vector3(
              2 * SETTINGS.ellipse.initialLabelOffset,
              SETTINGS.ellipse.initialLabelOffset,
              0
            )
          )
          .normalize();
        newSELabel.locationVector = this.tmpVector;

        commandGroup.addCommand(
          new AddIsometryEllipseCommand(
            newIsometrySEEllipse,
            newSELabel,
            this.preimageSEEllipse,
            this.transformationSEParent
          )
        );

        EventBus.fire("show-alert", {
          key: `handlers.newIsometryEllipseAdded`,
          keyOptions: { name: `${newIsometrySEEllipse.name}` },
          type: "success"
        });
      } else if (this.transformationSEParent instanceof SEInversion) {
        // not implemented yet
      }
    }
  }
  activate(): void {
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
    this.prepareForNextTransformation();
  }
}
