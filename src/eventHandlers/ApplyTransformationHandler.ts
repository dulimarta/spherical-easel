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
import {
  SEIntersectionReturnType,
  SEOneDimensional,
  SEIsometry
} from "@/types";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { SEInversionCircleCenter } from "@/models/SEInversionCircleCenter";

export default class ApplyTransformationHandler extends Highlighter {
  /** The transformation that is being applied */
  private transformationSEParent: SETransformation | null = null;
  private transformationType = "";

  /**  The temporary plottable TwoJS object displayed as the user moves the mouse or drags after selecting a transformation */
  private temporaryPoint1: Point;
  private temporaryPoint2: Point;
  private temporaryPoint3: Point;
  private temporarySegment: Segment;
  private temporaryLine: Line;
  private temporaryCircle: Circle;
  private temporaryEllipse: Ellipse;
  private temporaryParametric: Parametric;

  /** Has the temporary object been added to the scene?*/
  private temporaryCircleAdded = false;
  private temporaryPoint1Added = false;
  private temporaryPoint2Added = false;
  private temporaryPoint3Added = false;
  private temporarySegmentAdded = false;
  private temporaryLineAdded = false;
  private temporaryEllipseAdded = false;
  private temporaryParametricAdded = false;

  /* The last possibly glowing object and the id of the last possibly glowing object*/
  private possiblyGlowing: SEPoint | SEOneDimensional | null = null;
  private lastPossiblyGlowingID = 0;

  /* temporary vector and matrix to help with computations */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();
  private tmpMatrix = new Matrix4();

  constructor(layers: Two.Group[]) {
    super(layers);
    // Set the style using the temporary defaults
    this.temporaryPoint1 = new Point();
    this.temporaryPoint1.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryPoint1);

    this.temporaryPoint2 = new Point();
    this.temporaryPoint2.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryPoint2);

    this.temporaryPoint3 = new Point();
    this.temporaryPoint3.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryPoint3);

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
        //first deal with the isometries
        if (
          this.transformationSEParent instanceof SETranslation ||
          this.transformationSEParent instanceof SERotation ||
          this.transformationSEParent instanceof SEPointReflection ||
          this.transformationSEParent instanceof SEReflection
        ) {
          if (this.hitSEPoints.length > 0) {
            if (
              !this.hitSEPoints[0].kids.some(kid => {
                return (
                  kid instanceof SETransformedPoint &&
                  this.transformationSEParent &&
                  kid.parentTransformation.name ===
                    this.transformationSEParent.name
                );
              })
            ) {
              // this point has not been transformed with this transformation
              // there may be a point at the transformed location and the addTransformedPointCommand will detect this.
              // this detection occurs in the command because the other segment/line/circle/ellipse/parametric transformation commands use the addTransformPointCommand to add the points associated to the object
              const transformedPointCommandGroup = new CommandGroup();
              this.addTransformedPointCommands(
                transformedPointCommandGroup,
                this.transformationSEParent,
                this.hitSEPoints[0]
              );
              transformedPointCommandGroup.execute();
              this.prepareForNextGeometricObject();
            } else {
              // this point has already been transformed with this transformation
              EventBus.fire("show-alert", {
                key: `handlers.duplicateTransformedObject`,
                keyOptions: {
                  object: i18n.tc(`objects.points`, 3),
                  name: this.hitSEPoints[0].name,
                  type: this.transformationType,
                  trans: this.transformationSEParent.name
                },
                type: "error"
              });
            }
          } else if (this.hitSESegments.length > 0) {
            // check if this segment has been transformed before
            if (
              !this.hitSESegments[0].kids.some(kid => {
                return (
                  kid instanceof SEIsometrySegment &&
                  this.transformationSEParent &&
                  kid.parentIsometry.name === this.transformationSEParent.name
                );
              }) &&
              // check to see if the transformation of this segment will land on another segment
              !SEStore.seSegments.some(seg => {
                return (
                  Math.abs(seg.arcLength - this.hitSESegments[0].arcLength) <
                    SETTINGS.tolerance &&
                  this.transformationSEParent &&
                  this.tmpVector
                    .subVectors(
                      seg.normalVector,
                      this.transformationSEParent.f(
                        this.hitSESegments[0].normalVector
                      )
                    )
                    .isZero() &&
                  this.tmpVector1
                    .subVectors(
                      seg.startSEPoint.locationVector,
                      this.transformationSEParent.f(
                        this.transformationSEParent instanceof SEReflection
                          ? this.hitSESegments[0].endSEPoint.locationVector
                          : this.hitSESegments[0].startSEPoint.locationVector
                      )
                    )
                    .isZero()
                );
              })
            ) {
              // this Segment has not been transformed with this transformation and will create a new segment at this location
              this.applyIsometryToSegment(
                this.transformationSEParent,
                this.hitSESegments[0]
              );
              this.prepareForNextGeometricObject();
            } else {
              // this Segment has already been transformed with this transformation
              EventBus.fire("show-alert", {
                key: `handlers.duplicateTransformedObject`,
                keyOptions: {
                  object: i18n.tc(`objects.segments`, 3),
                  name: this.hitSESegments[0].name,
                  type: this.transformationType,
                  trans: this.transformationSEParent.name
                },
                type: "error"
              });
            }
          } else if (this.hitSELines.length > 0) {
            if (
              // make sure this line has be transformed with this isometry before
              !this.hitSELines[0].kids.some(kid => {
                return (
                  kid instanceof SEIsometryLine &&
                  this.transformationSEParent &&
                  kid.parentIsometry.name === this.transformationSEParent.name
                );
              }) &&
              // check to see if the transformation of this line will land on another line
              !SEStore.seLines.some(line => {
                return (
                  this.transformationSEParent &&
                  (this.tmpVector
                    .subVectors(
                      line.normalVector,
                      this.transformationSEParent.f(
                        this.hitSELines[0].normalVector
                      )
                    )
                    .isZero() ||
                    // lines with antipodal normal vectors are the same
                    this.tmpVector
                      .copy(line.normalVector)
                      .multiplyScalar(-1)
                      .sub(
                        this.transformationSEParent.f(
                          this.hitSELines[0].normalVector
                        )
                      )
                      .isZero())
                );
              })
            ) {
              // this Segment has not been transformed with this transformation and will create a new line at this location
              this.applyIsometryToLine(
                this.transformationSEParent,
                this.hitSELines[0]
              );
              this.prepareForNextGeometricObject();
            } else {
              // this Segment has already been transformed with this transformation
              EventBus.fire("show-alert", {
                key: `handlers.duplicateTransformedObject`,
                keyOptions: {
                  object: i18n.tc(`objects.lines`, 3),
                  name: this.hitSELines[0].name,
                  type: this.transformationType,
                  trans: this.transformationSEParent.name
                },
                type: "error"
              });
            }
          } else if (this.hitSECircles.length > 0) {
            if (
              !this.hitSECircles[0].kids.some(kid => {
                return (
                  kid instanceof SEIsometryCircle &&
                  this.transformationSEParent &&
                  kid.parentIsometry.name === this.transformationSEParent.name
                );
              }) &&
              // check to see if the transformation of this circle will land on another circle
              !SEStore.seCircles.some(circ => {
                return (
                  this.transformationSEParent &&
                  this.tmpVector
                    .subVectors(
                      circ.centerSEPoint.locationVector,
                      this.transformationSEParent.f(
                        this.hitSECircles[0].centerSEPoint.locationVector
                      )
                    )
                    .isZero() &&
                  Math.abs(
                    circ.circleRadius - this.hitSECircles[0].circleRadius
                  ) < SETTINGS.tolerance
                );
              })
            ) {
              // this Circle has not been transformed with this transformation and will create a new circle at the transformed location
              this.applyIsometryToCircle(
                this.transformationSEParent,
                this.hitSECircles[0]
              );
              this.prepareForNextGeometricObject();
            } else {
              // this Circle has already been transformed with this transformation
              EventBus.fire("show-alert", {
                key: `handlers.duplicateTransformedObject`,
                keyOptions: {
                  object: i18n.tc(`objects.circles`, 3),
                  name: this.hitSECircles[0].name,
                  type: this.transformationType,
                  trans: this.transformationSEParent.name
                },
                type: "error"
              });
            }
          } else if (this.hitSEEllipses.length > 0) {
            if (
              !this.hitSEEllipses[0].kids.some(kid => {
                return (
                  kid instanceof SEIsometryEllipse &&
                  this.transformationSEParent &&
                  kid.parentIsometry.name === this.transformationSEParent.name
                );
              }) && // check to see if the transformation of this ellipse will land on another ellipse
              !SEStore.seEllipses.some(ellipse => {
                return (
                  this.transformationSEParent &&
                  // (focus1 mapped to focus1 and focus2 mapped to focus2) or (focus2 mapped to focus1 and focus1 mapped to focus2)
                  ((this.tmpVector
                    .subVectors(
                      ellipse.focus1SEPoint.locationVector,
                      this.transformationSEParent.f(
                        this.hitSEEllipses[0].focus1SEPoint.locationVector
                      )
                    )
                    .isZero() &&
                    this.tmpVector
                      .subVectors(
                        ellipse.focus2SEPoint.locationVector,
                        this.transformationSEParent.f(
                          this.hitSEEllipses[0].focus2SEPoint.locationVector
                        )
                      )
                      .isZero()) ||
                    (this.tmpVector
                      .subVectors(
                        ellipse.focus2SEPoint.locationVector,
                        this.transformationSEParent.f(
                          this.hitSEEllipses[0].focus1SEPoint.locationVector
                        )
                      )
                      .isZero() &&
                      this.tmpVector
                        .subVectors(
                          ellipse.focus1SEPoint.locationVector,
                          this.transformationSEParent.f(
                            this.hitSEEllipses[0].focus2SEPoint.locationVector
                          )
                        )
                        .isZero())) &&
                  Math.abs(
                    ellipse.ellipseAngleSum -
                      this.hitSEEllipses[0].ellipseAngleSum
                  ) < SETTINGS.tolerance
                );
              })
            ) {
              // this Ellipse has not been transformed with this transformation
              this.applyIsometryToEllipse(
                this.transformationSEParent,
                this.hitSEEllipses[0]
              );
              this.prepareForNextGeometricObject();
            } else {
              // this Ellipse has already been transformed with this transformation
              EventBus.fire("show-alert", {
                key: `handlers.duplicateTransformedObject`,
                keyOptions: {
                  object: i18n.tc(`objects.ellipses`, 3),
                  name: this.hitSEEllipses[0].name,
                  type: this.transformationType,
                  trans: this.transformationSEParent.name
                },
                type: "error"
              });
            }
          } else if (this.hitSEParametrics.length > 0) {
            // not yet implemented
          }
        } else if (this.transformationSEParent instanceof SEInversion) {
          //not yet implemented
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
    // make sure the transformation is set
    if (this.transformationSEParent !== null) {
      //highlight the geometric part of the transformation
      this.transformationSEParent.geometricChild.glowing = true;

      // Find all the nearby (hitSE... objects) and update location vectors
      super.mouseMoved(event);

      // Make sure that the event is on the sphere
      if (this.isOnSphere) {
        // Only object can be interacted with at a given time, so set the first point nearby to glowing
        // The user can create points on ellipses, circles, segments, and lines, so
        // highlight those as well (but only one) if they are nearby also
        if (this.hitSEPoints.length > 0) {
          this.possiblyGlowing = this.hitSEPoints[0];
        } else if (this.hitSESegments.length > 0) {
          this.possiblyGlowing = this.hitSESegments[0];
        } else if (this.hitSELines.length > 0) {
          this.possiblyGlowing = this.hitSELines[0];
        } else if (this.hitSECircles.length > 0) {
          this.possiblyGlowing = this.hitSECircles[0];
        } else if (this.hitSEEllipses.length > 0) {
          this.possiblyGlowing = this.hitSEEllipses[0];
        } else if (this.hitSEParametrics.length > 0) {
          this.possiblyGlowing = this.hitSEParametrics[0];
        } else {
          this.possiblyGlowing = null;
          this.prepareForNextGeometricObject(); // there is nothing under the mouse so clear all temporary objects
        }

        if (
          this.possiblyGlowing !== null &&
          this.lastPossiblyGlowingID !== this.possiblyGlowing.id
        ) {
          //console.debug("change mouse over object");
          // the possible glowing object has changed so reset and clear the scene of temporary objects
          this.prepareForNextGeometricObject();
        }
        if (this.possiblyGlowing !== null) {
          if (this.possiblyGlowing instanceof SEPoint) {
            // Check to see if this point has been transformed before with the current transformation
            if (
              !this.possiblyGlowing.kids.some(kid => {
                kid instanceof SETransformedPoint &&
                  this.transformationSEParent &&
                  kid.parentTransformation.name ===
                    this.transformationSEParent.name;
              }) &&
              // check to see if there is a point already at the transformed location
              !SEStore.sePoints.some(pt => {
                return (
                  this.transformationSEParent &&
                  this.tmpVector
                    .subVectors(
                      pt.locationVector,
                      this.transformationSEParent.f(
                        this.hitSEPoints[0].locationVector
                      )
                    )
                    .isZero()
                );
              })
            ) {
              // add a temporary marker at the transformed location and glow the point
              if (!this.temporaryPoint1Added) {
                this.temporaryPoint1.addToLayers(this.layers);
                this.temporaryPoint1Added = true;
              }
              this.temporaryPoint1.positionVector =
                this.transformationSEParent.f(
                  this.possiblyGlowing.locationVector
                );

              this.possiblyGlowing.glowing = true;
            }
          } else if (this.possiblyGlowing instanceof SESegment) {
            // deal with the isometries first
            if (
              this.transformationSEParent instanceof SETranslation ||
              this.transformationSEParent instanceof SERotation ||
              this.transformationSEParent instanceof SEPointReflection ||
              this.transformationSEParent instanceof SEReflection
            ) {
              // check if this segment has been transformed before
              if (
                !this.possiblyGlowing.kids.some(kid => {
                  return (
                    kid instanceof SEIsometrySegment &&
                    this.transformationSEParent &&
                    kid.parentIsometry.name === this.transformationSEParent.name
                  );
                }) &&
                // check to see if the transformation of this segment will land on another segment
                !SEStore.seSegments.some(seg => {
                  return (
                    this.possiblyGlowing &&
                    this.possiblyGlowing instanceof SESegment &&
                    Math.abs(seg.arcLength - this.possiblyGlowing.arcLength) <
                      SETTINGS.tolerance &&
                    this.transformationSEParent &&
                    this.tmpVector
                      .subVectors(
                        seg.normalVector,
                        this.transformationSEParent.f(
                          this.possiblyGlowing.normalVector
                        )
                      )
                      .isZero() &&
                    this.tmpVector1
                      .subVectors(
                        seg.startSEPoint.locationVector,
                        this.transformationSEParent.f(
                          this.transformationSEParent instanceof SEReflection
                            ? this.possiblyGlowing.endSEPoint.locationVector
                            : this.possiblyGlowing.startSEPoint.locationVector
                        )
                      )
                      .isZero()
                  );
                })
              ) {
                // this Segment has not been transformed with this transformation
                // add a temporary marker at the transformed endpoint location
                if (!this.temporaryPoint1Added) {
                  this.temporaryPoint1.addToLayers(this.layers);
                  this.temporaryPoint1Added = true;
                }
                this.temporaryPoint1.positionVector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.startSEPoint.locationVector
                  );

                // add a temporary marker at the transformed endpoint location
                if (!this.temporaryPoint2Added) {
                  this.temporaryPoint2.addToLayers(this.layers);
                  this.temporaryPoint2Added = true;
                }
                this.temporaryPoint2.positionVector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.endSEPoint.locationVector
                  );

                // add a temporary segment and set the normal, start and arc length
                if (!this.temporarySegmentAdded) {
                  this.temporarySegment.addToLayers(this.layers);
                  this.temporarySegmentAdded = true;
                }
                this.temporarySegment.normalVector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.normalVector
                  );
                // the orientation reversing isometries are handled differently
                if (this.transformationSEParent instanceof SEReflection) {
                  this.temporarySegment.startVector =
                    this.transformationSEParent.f(
                      this.possiblyGlowing.endSEPoint.locationVector
                    );
                } else {
                  this.temporarySegment.startVector =
                    this.transformationSEParent.f(
                      this.possiblyGlowing.startSEPoint.locationVector
                    );
                }
                this.temporarySegment.arcLength =
                  this.possiblyGlowing.arcLength;

                this.temporarySegment.updateDisplay();
                this.possiblyGlowing.glowing = true;
              }
            } else if (this.transformationSEParent instanceof SEInversion) {
              // not implemented yet
            }
          } else if (this.possiblyGlowing instanceof SELine) {
            // deal with the isometries first
            if (
              this.transformationSEParent instanceof SETranslation ||
              this.transformationSEParent instanceof SERotation ||
              this.transformationSEParent instanceof SEPointReflection ||
              this.transformationSEParent instanceof SEReflection
            ) {
              // check if this segment has been transformed before
              if (
                !this.possiblyGlowing.kids.some(kid => {
                  return (
                    kid instanceof SEIsometryLine &&
                    this.transformationSEParent &&
                    kid.parentIsometry.name === this.transformationSEParent.name
                  );
                }) &&
                // check to see if the transformation of this segment will land on another segment
                !SEStore.seLines.some(line => {
                  return (
                    this.transformationSEParent &&
                    this.possiblyGlowing instanceof SELine &&
                    (this.tmpVector
                      .subVectors(
                        line.normalVector,
                        this.transformationSEParent.f(
                          this.possiblyGlowing.normalVector
                        )
                      )
                      .isZero() ||
                      // lines with antipodal normal vectors are the same
                      this.tmpVector
                        .copy(line.normalVector)
                        .multiplyScalar(-1)
                        .sub(
                          this.transformationSEParent.f(
                            this.possiblyGlowing.normalVector
                          )
                        )
                        .isZero())
                  );
                })
              ) {
                // this line has not been transformed with this transformation
                // add a temporary marker at the transformed endpoint location
                if (!this.temporaryPoint1Added) {
                  this.temporaryPoint1.addToLayers(this.layers);
                  this.temporaryPoint1Added = true;
                }
                this.temporaryPoint1.positionVector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.startSEPoint.locationVector
                  );

                // add a temporary marker at the transformed endpoint location
                if (!this.temporaryPoint2Added) {
                  this.temporaryPoint2.addToLayers(this.layers);
                  this.temporaryPoint2Added = true;
                }
                this.temporaryPoint2.positionVector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.endSEPoint.locationVector
                  );

                // add a temporary Line and set the normal, start and arc length
                if (!this.temporaryLineAdded) {
                  this.temporaryLine.addToLayers(this.layers);
                  this.temporaryLineAdded = true;
                }
                this.temporaryLine.normalVector = this.transformationSEParent.f(
                  this.possiblyGlowing.normalVector
                );

                this.temporaryLine.updateDisplay();
                this.possiblyGlowing.glowing = true;
              }
            } else if (this.transformationSEParent instanceof SEInversion) {
              // not implemented yet
            }
          } else if (this.possiblyGlowing instanceof SECircle) {
            // deal with the isometries first
            if (
              this.transformationSEParent instanceof SETranslation ||
              this.transformationSEParent instanceof SERotation ||
              this.transformationSEParent instanceof SEPointReflection ||
              this.transformationSEParent instanceof SEReflection
            ) {
              if (
                !this.possiblyGlowing.kids.some(kid => {
                  return (
                    kid instanceof SEIsometryCircle &&
                    this.transformationSEParent &&
                    kid.parentIsometry.name === this.transformationSEParent.name
                  );
                }) &&
                // check to see if the transformation of this circle will land on another circle
                !SEStore.seCircles.some(circ => {
                  return (
                    this.transformationSEParent &&
                    this.possiblyGlowing instanceof SECircle &&
                    this.tmpVector
                      .subVectors(
                        circ.centerSEPoint.locationVector,
                        this.transformationSEParent.f(
                          this.possiblyGlowing.centerSEPoint.locationVector
                        )
                      )
                      .isZero() &&
                    Math.abs(
                      circ.circleRadius - this.possiblyGlowing.circleRadius
                    ) < SETTINGS.tolerance
                  );
                })
              ) {
                // this circle has not been transformed with this transformation
                // add a temporary marker at the transformed center location
                if (!this.temporaryPoint1Added) {
                  this.temporaryPoint1.addToLayers(this.layers);
                  this.temporaryPoint1Added = true;
                }
                this.temporaryPoint1.positionVector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.centerSEPoint.locationVector
                  );

                // add a temporary marker at the transformed endpoint location
                if (!this.temporaryPoint2Added) {
                  this.temporaryPoint2.addToLayers(this.layers);
                  this.temporaryPoint2Added = true;
                }
                this.temporaryPoint2.positionVector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.circleSEPoint.locationVector
                  );

                // add a temporary circle and set the center and radius
                if (!this.temporaryCircleAdded) {
                  this.temporaryCircle.addToLayers(this.layers);
                  this.temporaryCircleAdded = true;
                }
                this.temporaryCircle.centerVector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.centerSEPoint.locationVector
                  );

                this.temporaryCircle.circleRadius =
                  this.possiblyGlowing.circleRadius;

                this.temporaryCircle.updateDisplay();
                this.possiblyGlowing.glowing = true;
              }
            } else if (this.transformationSEParent instanceof SEInversion) {
              // not implemented yet
            }
          } else if (this.possiblyGlowing instanceof SEEllipse) {
            // deal with the isometries first
            if (
              this.transformationSEParent instanceof SETranslation ||
              this.transformationSEParent instanceof SERotation ||
              this.transformationSEParent instanceof SEPointReflection ||
              this.transformationSEParent instanceof SEReflection
            ) {
              if (
                !this.possiblyGlowing.kids.some(kid => {
                  return (
                    kid instanceof SEIsometryEllipse &&
                    this.transformationSEParent &&
                    kid.parentIsometry.name === this.transformationSEParent.name
                  );
                }) && // check to see if the transformation of this ellipse will land on another ellipse
                !SEStore.seEllipses.some(ellipse => {
                  return (
                    this.transformationSEParent &&
                    this.possiblyGlowing instanceof SEEllipse &&
                    // (focus1 mapped to focus1 and focus2 mapped to focus2) or (focus2 mapped to focus1 and focus1 mapped to focus2)
                    ((this.tmpVector
                      .subVectors(
                        ellipse.focus1SEPoint.locationVector,
                        this.transformationSEParent.f(
                          this.possiblyGlowing.focus1SEPoint.locationVector
                        )
                      )
                      .isZero() &&
                      this.tmpVector
                        .subVectors(
                          ellipse.focus2SEPoint.locationVector,
                          this.transformationSEParent.f(
                            this.possiblyGlowing.focus2SEPoint.locationVector
                          )
                        )
                        .isZero()) ||
                      (this.tmpVector
                        .subVectors(
                          ellipse.focus2SEPoint.locationVector,
                          this.transformationSEParent.f(
                            this.possiblyGlowing.focus1SEPoint.locationVector
                          )
                        )
                        .isZero() &&
                        this.tmpVector
                          .subVectors(
                            ellipse.focus1SEPoint.locationVector,
                            this.transformationSEParent.f(
                              this.possiblyGlowing.focus2SEPoint.locationVector
                            )
                          )
                          .isZero())) &&
                    Math.abs(
                      ellipse.ellipseAngleSum -
                        this.possiblyGlowing.ellipseAngleSum
                    ) < SETTINGS.tolerance
                  );
                })
              ) {
                // this ellipse has not been transformed with this transformation
                // add a temporary marker at the transformed focus1 location
                if (!this.temporaryPoint1Added) {
                  this.temporaryPoint1.addToLayers(this.layers);
                  this.temporaryPoint1Added = true;
                }
                this.temporaryPoint1.positionVector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.focus1SEPoint.locationVector
                  );

                // add a temporary marker at the transformed focus2 location
                if (!this.temporaryPoint2Added) {
                  this.temporaryPoint2.addToLayers(this.layers);
                  this.temporaryPoint2Added = true;
                }
                this.temporaryPoint2.positionVector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.focus2SEPoint.locationVector
                  );

                // add a temporary marker at the transformed ellipse point location
                if (!this.temporaryPoint3Added) {
                  this.temporaryPoint3.addToLayers(this.layers);
                  this.temporaryPoint3Added = true;
                }
                this.temporaryPoint3.positionVector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.ellipseSEPoint.locationVector
                  );

                // add a temporary Ellipse and set the center and radius
                if (!this.temporaryEllipseAdded) {
                  this.temporaryEllipse.addToLayers(this.layers);
                  this.temporaryEllipseAdded = true;
                }
                this.temporaryEllipse.focus1Vector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.focus1SEPoint.locationVector
                  );

                this.temporaryEllipse.focus2Vector =
                  this.transformationSEParent.f(
                    this.possiblyGlowing.focus2SEPoint.locationVector
                  );

                // set the a and b values of the temporary
                this.temporaryEllipse.a = this.possiblyGlowing.a;
                this.temporaryEllipse.b = this.possiblyGlowing.b;

                this.temporaryEllipse.updateDisplay();
                this.possiblyGlowing.glowing = true;
              }
            } else if (this.transformationSEParent instanceof SEInversion) {
              // not implemented yet
            }
          } else if (this.possiblyGlowing instanceof SEParametric) {
            // deal with the isometries first
            if (
              this.transformationSEParent instanceof SETranslation ||
              this.transformationSEParent instanceof SERotation ||
              this.transformationSEParent instanceof SEPointReflection ||
              this.transformationSEParent instanceof SEReflection
            ) {
              // not implemented yet
              // check to see if this transformation of the parametric has already been done
              // check to see if the transformation of this parametric will land on another ellipse
              // this parametric has not been transformed with this transformation so add temporary objects
              //this.temporaryEllipse.updateDisplay();
              // this.possiblyGlowing.glowing = true;
            } else if (this.transformationSEParent instanceof SEInversion) {
              // not implemented yet
            }
          }
          this.lastPossiblyGlowingID = this.possiblyGlowing.id;
        }
      }
      // Not on the sphere -- remove all temporary objects
      else {
        this.prepareForNextGeometricObject();
      }
    }
  }

  mouseReleased(_event: MouseEvent): void {
    //
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
  }

  prepareForNextGeometricObject(): void {
    // Remove the temporary objects from the scene and mark the temporary object
    //  not added to the scene

    this.temporaryPoint1.removeFromLayers();
    this.temporaryPoint1Added = false;

    this.temporaryPoint2.removeFromLayers();
    this.temporaryPoint2Added = false;

    this.temporaryPoint3.removeFromLayers();
    this.temporaryPoint3Added = false;

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

    // call an unglow all command
    //SEStore.unglowAllSENodules();
  }

  prepareForNextTransformation(): void {
    this.prepareForNextGeometricObject();
    if (this.transformationSEParent) {
      //this.transformationSEParent.geometricChild.selected = false;
      this.transformationSEParent.geometricChild.glowing = false;
    }
    this.transformationSEParent = null;
    this.transformationType = "";
    EventBus.fire("set-apply-transformation-footer-text", {
      text: i18n.t(`objects.selectTransformation`)
    });
  }

  setTransformation(transformation: SETransformation): void {
    this.transformationSEParent = transformation;
    this.transformationSEParent.geometricChild.glowing = true;
    //this.transformationSEParent.geometricChild.selected = true;

    //console.debug("apply transformation: set transform", transformation.name);
    if (this.transformationSEParent instanceof SETranslation) {
      this.transformationType = i18n.tc(`objects.translations`, 3);
      EventBus.fire("set-apply-transformation-footer-text", {
        text:
          i18n.tc(`objects.translations`, 1) +
          " " +
          this.transformationSEParent.name
      });
    } else if (this.transformationSEParent instanceof SEPointReflection) {
      this.transformationType = i18n.tc(`objects.pointReflections`, 3);
      EventBus.fire("set-apply-transformation-footer-text", {
        text:
          i18n.tc(`objects.pointReflections`, 1) +
          " " +
          this.transformationSEParent.name
      });
    } else if (this.transformationSEParent instanceof SEReflection) {
      this.transformationType = i18n.tc(`objects.reflections`, 3);
      EventBus.fire("set-apply-transformation-footer-text", {
        text:
          i18n.tc(`objects.reflections`, 1) +
          " " +
          this.transformationSEParent.name
      });
    } else if (this.transformationSEParent instanceof SERotation) {
      this.transformationType = i18n.tc(`objects.rotations`, 3);
      EventBus.fire("set-apply-transformation-footer-text", {
        text:
          i18n.tc(`objects.rotations`, 1) +
          " " +
          this.transformationSEParent.name
      });
    } else if (this.transformationSEParent instanceof SEInversion) {
      this.transformationType = i18n.tc(`objects.inversions`, 3);
      EventBus.fire("set-apply-transformation-footer-text", {
        text:
          i18n.tc(`objects.inversions`, 1) +
          " " +
          this.transformationSEParent.name
      });
    }
  }

  /**
   * Always returns an SEPoint at the location of the transformation, this is either a new point (in which case that command group contains
   * the commands to do the creation) or an existing point (either the preimageSEPoint or an SEPoint on which the transformed
   * preimageSEPoint would land)
   * @param commandGroup
   * @param transformationSEParent
   * @param preimageSEPoint
   * @returns
   */
  addTransformedPointCommands(
    commandGroup: CommandGroup,
    transformationSEParent: SETransformation,
    preimageSEPoint: SEPoint
  ): SEPoint {
    // make sure that the transformation will move the point.
    // Don't let users create two points at the same location.
    //Users should not be able to
    //  ...reflect points on the line of reflection
    // ... pointReflect the point of reflection or its antipode
    // ... invert points on the circle of inversion
    // ... rotate the point of rotation (or its antipode)
    // ... translate the poles of the axis of translation
    // ... rotate or translate 2*PI
    // In any of these cases this should return the SEPoint that is not moved

    const transformedLocation = transformationSEParent.f(
      preimageSEPoint.locationVector
    );
    let existingPoint = preimageSEPoint; // set initially to the preimage and it is possibly changed in the some method on SEStore.sePoints

    if (
      this.tmpVector
        .subVectors(transformedLocation, preimageSEPoint.locationVector)
        .isZero()
    ) {
      //  "Applying {type} {trans} to point {pt} will never move it to a different location.",
      EventBus.fire("show-alert", {
        key: "handlers.pointDoesNotMoveUnderTransformation",
        keyOptions: {
          type: this.transformationType,
          trans: transformationSEParent.name,
          pt: preimageSEPoint.label?.ref.shortUserName
        },
        type: "warning"
      });
      return existingPoint;
    }

    if (
      SEStore.sePoints.some(pt => {
        if (
          this.tmpVector
            .subVectors(pt.locationVector, transformedLocation)
            .isZero()
        ) {
          existingPoint = pt;
          return true;
        } else {
          return false;
        }
      })
    ) {
      //"Transforming point {preimagePt} using {type} {trans} would create a second point on top of point {existingPt}.",
      EventBus.fire("show-alert", {
        key: "handlers.transformCreatesSecondPoint",
        keyOptions: {
          preimagePt: preimageSEPoint.label?.ref.shortUserName,
          type: this.transformationType,
          trans: transformationSEParent.name,
          existingPt: existingPoint.name
        },
        type: "warning"
      });
      return existingPoint;
    }

    // at this location in the execution, the preimage point will move after being transformed and will not land on top of an existing point
    if (
      preimageSEPoint instanceof SEIntersectionPoint &&
      !preimageSEPoint.isUserCreated
    ) {
      // Mark the intersection point as created
      commandGroup.addCommand(
        new ConvertInterPtToUserCreatedCommand(preimageSEPoint)
      );
    }
    // we have to create a new transformed point
    const newTransformedPoint = new NonFreePoint();
    // Set the display to the default values
    newTransformedPoint.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the size of the point to the current zoom magnification factor
    newTransformedPoint.adjustSize();

    const newTransformedSEPoint = new SETransformedPoint(
      newTransformedPoint,
      preimageSEPoint,
      transformationSEParent
    );
    newTransformedSEPoint.update();

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
        preimageSEPoint,
        transformationSEParent
      )
    );
    EventBus.fire("show-alert", {
      key: `handlers.newTransformedPointAdded`,
      keyOptions: { name: `${newTransformedSEPoint.name}` },
      type: "success"
    });
    return newTransformedSEPoint;
  }

  applyIsometryToSegment(
    transformationSEParent: SEIsometry,
    preimageSESegment: SESegment
  ): void {
    const transformedSegmentCommandGroup = new CommandGroup();
    // make the images of the endpoints of the segment
    //  make sure they don't exist first
    let transformedStartSEPoint: SEPoint | null = null;
    preimageSESegment.startSEPoint.kids.forEach(kid => {
      if (
        kid instanceof SETransformedPoint &&
        transformationSEParent &&
        kid.parentTransformation.name === transformationSEParent.name
      ) {
        transformedStartSEPoint = kid;
      }
    });
    if (transformedStartSEPoint === null) {
      // the start of the segment hasn't been transformed by this transformation
      transformedStartSEPoint = this.addTransformedPointCommands(
        transformedSegmentCommandGroup,
        transformationSEParent,
        preimageSESegment.startSEPoint
      );
    }

    let transformedEndSEPoint: SEPoint | null = null;
    preimageSESegment.endSEPoint.kids.forEach(kid => {
      if (
        kid instanceof SETransformedPoint &&
        transformationSEParent &&
        kid.parentTransformation.name === transformationSEParent.name
      ) {
        transformedEndSEPoint = kid;
      }
    });
    if (transformedEndSEPoint === null) {
      // the end of the segment hasn't been transformed by this transformation
      transformedEndSEPoint = this.addTransformedPointCommands(
        transformedSegmentCommandGroup,
        transformationSEParent,
        preimageSESegment.endSEPoint
      );
    }

    // we have to create a new transformed segment
    const newTransformedSegment = new NonFreeSegment();
    // Set the display to the default values
    newTransformedSegment.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the size of the point to the current zoom magnification factor
    newTransformedSegment.adjustSize();

    const newIsometrySESegment = new SEIsometrySegment(
      newTransformedSegment,
      transformedStartSEPoint,
      transformationSEParent.f(preimageSESegment.normalVector),
      preimageSESegment.arcLength,
      transformedEndSEPoint,
      preimageSESegment,
      transformationSEParent
    );
    newIsometrySESegment.update();

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

    transformedSegmentCommandGroup.addCommand(
      new AddIsometrySegmentCommand(
        newIsometrySESegment,
        newSELabel,
        preimageSESegment,
        transformationSEParent
      )
    );

    // Add all the intersections with this segment
    SEStore.createAllIntersectionsWithSegment(newIsometrySESegment).forEach(
      (item: SEIntersectionReturnType) => {
        // Create the plottable label
        const newLabel = new Label();
        const newSELabel = new SELabel(newLabel, item.SEIntersectionPoint);
        // Set the initial label location
        this.tmpVector
          .copy(item.SEIntersectionPoint.locationVector)
          .add(
            new Vector3(
              2 * SETTINGS.segment.initialLabelOffset,
              SETTINGS.segment.initialLabelOffset,
              0
            )
          )
          .normalize();
        newSELabel.locationVector = this.tmpVector;

        transformedSegmentCommandGroup.addCommand(
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
    transformedSegmentCommandGroup.execute();
    EventBus.fire("show-alert", {
      key: `handlers.newIsometrySegmentAdded`,
      keyOptions: { name: `${newIsometrySESegment.name}` },
      type: "success"
    });
  }

  applyIsometryToLine(
    transformationSEParent: SEIsometry,
    preimageSELine: SELine
  ): void {
    const transformedLineCommandGroup = new CommandGroup();
    // make the images of the endpoints of the Line
    //  make sure they don't exist first
    let transformedStartSEPoint: SEPoint | null = null;
    preimageSELine.startSEPoint.kids.forEach(kid => {
      if (
        kid instanceof SETransformedPoint &&
        transformationSEParent &&
        kid.parentTransformation.name === transformationSEParent.name
      ) {
        transformedStartSEPoint = kid;
      }
    });
    if (transformedStartSEPoint === null) {
      // the start of the Line hasn't been transformed by this transformation
      transformedStartSEPoint = this.addTransformedPointCommands(
        transformedLineCommandGroup,
        transformationSEParent,
        preimageSELine.startSEPoint
      );
    }

    let transformedEndSEPoint: SEPoint | null = null;
    preimageSELine.endSEPoint.kids.forEach(kid => {
      if (
        kid instanceof SETransformedPoint &&
        transformationSEParent &&
        kid.parentTransformation.name === transformationSEParent.name
      ) {
        transformedEndSEPoint = kid;
      }
    });
    if (transformedEndSEPoint === null) {
      // the end of the Line hasn't been transformed by this transformation
      transformedEndSEPoint = this.addTransformedPointCommands(
        transformedLineCommandGroup,
        transformationSEParent,
        preimageSELine.endSEPoint
      );
    }
    // we have to create a new transformed Line
    const newTransformedLine = new NonFreeLine();
    // Set the display to the default values
    newTransformedLine.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the size of the point to the current zoom magnification factor
    newTransformedLine.adjustSize();

    const newIsometrySELine = new SEIsometryLine(
      newTransformedLine,
      transformedStartSEPoint,
      transformationSEParent.f(preimageSELine.normalVector),
      transformedEndSEPoint,
      preimageSELine,
      transformationSEParent
    );
    newIsometrySELine.update();

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

    transformedLineCommandGroup.addCommand(
      new AddIsometryLineCommand(
        newIsometrySELine,
        newSELabel,
        preimageSELine,
        transformationSEParent
      )
    );
    // Add all the intersections with this line
    SEStore.createAllIntersectionsWithLine(newIsometrySELine).forEach(
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

        transformedLineCommandGroup.addCommand(
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

    transformedLineCommandGroup.execute();
    EventBus.fire("show-alert", {
      key: `handlers.newIsometryLineAdded`,
      keyOptions: { name: `${newIsometrySELine.name}` },
      type: "success"
    });
  }

  applyIsometryToCircle(
    transformationSEParent: SEIsometry,
    preimageSECircle: SECircle
  ): void {
    const transformedCircleCommandGroup = new CommandGroup();
    // make the images of the center|circle points of the Circle
    //  make sure they don't exist first
    let transformedCenterSEPoint: SEPoint | null = null;
    preimageSECircle.centerSEPoint.kids.forEach(kid => {
      if (
        kid instanceof SETransformedPoint &&
        transformationSEParent &&
        kid.parentTransformation.name === transformationSEParent.name
      ) {
        transformedCenterSEPoint = kid;
      }
    });
    if (transformedCenterSEPoint === null) {
      // the center of the Circle hasn't been transformed by this transformation
      transformedCenterSEPoint = this.addTransformedPointCommands(
        transformedCircleCommandGroup,
        transformationSEParent,
        preimageSECircle.centerSEPoint
      );
    }

    let transformedCircleSEPoint: SEPoint | null = null;
    preimageSECircle.circleSEPoint.kids.forEach(kid => {
      if (
        kid instanceof SETransformedPoint &&
        transformationSEParent &&
        kid.parentTransformation.name === transformationSEParent.name
      ) {
        transformedCircleSEPoint = kid;
      }
    });
    if (transformedCircleSEPoint === null) {
      // the circle point of the Circle hasn't been transformed by this transformation
      transformedCircleSEPoint = this.addTransformedPointCommands(
        transformedCircleCommandGroup,
        transformationSEParent,
        preimageSECircle.circleSEPoint
      );
    }

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
      preimageSECircle,
      transformationSEParent
    );
    newIsometrySECircle.update();

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

    transformedCircleCommandGroup.addCommand(
      new AddIsometryCircleCommand(
        newIsometrySECircle,
        newSELabel,
        preimageSECircle,
        transformationSEParent
      )
    );
    // Generate new intersection points. These points must be computed and created
    // in the store. Add the new created points to the circle command so they can be undone.
    SEStore.createAllIntersectionsWithCircle(newIsometrySECircle).forEach(
      (item: SEIntersectionReturnType) => {
        // Create the plottable and model label
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

        transformedCircleCommandGroup.addCommand(
          new AddIntersectionPointCommand(
            item.SEIntersectionPoint,
            item.parent1,
            item.parent2,
            newSELabel
          )
        );
        item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points or label
        newSELabel.showing = false;
      }
    );
    transformedCircleCommandGroup.execute();
    EventBus.fire("show-alert", {
      key: `handlers.newIsometryCircleAdded`,
      keyOptions: { name: `${newIsometrySECircle.name}` },
      type: "success"
    });
  }

  // computeCenterOfInvertedCircle(): Vector3 {
  //   // compute the location of the center but first make sure that the preimage circle and transformation parent are set
  //   if (
  //     preimageSECircle &&
  //     transformationSEParent &&
  //     transformationSEParent instanceof SEInversion
  //   ) {
  //     // if the circle being inverted has its center at the center of inversion then the transformed center is the antipode of the center of inversion
  //     if (
  //       this.tmpVector1
  //         .subVectors(
  //           this.preimageSECircle.centerSEPoint.locationVector,
  //           transformationSEParent.seCircleOfInversion.centerSEPoint
  //             .locationVector
  //         )
  //         .isZero()
  //     ) {
  //       return this.tmpVector
  //         .copy(this.preimageSECircle.centerSEPoint.locationVector)
  //         .multiplyScalar(-1);
  //     }
  //     // If the circle being inverted is antipodal to the center of inversion, then the transformed center is the center of inversion
  //     else if (
  //       this.tmpVector1
  //         .subVectors(
  //           this.tmpVector
  //             .copy(this.preimageSECircle.centerSEPoint.locationVector)
  //             .multiplyScalar(-1),
  //           transformationSEParent.seCircleOfInversion.centerSEPoint
  //             .locationVector
  //         )
  //         .isZero()
  //     ) {
  //       return transformationSEParent.seCircleOfInversion.centerSEPoint
  //         .locationVector;
  //     }
  //     // the center of the circle being transformed is not the center of inversion and is not antipodal to the center either.
  //     else {
  //       // See M'Clelland & Preston. A treatise on
  //       // spherical trigonometry with applications to spherical geometry and numerous
  //       // examples - Part 2. 1907 page 144 after Article/Theorem 169
  //       const delta =
  //         transformationSEParent.seCircleOfInversion.centerSEPoint.locationVector.angleTo(
  //           this.preimageSECircle.centerSEPoint.locationVector
  //         ); // the angular distance from the center of inversion to the center of the circle being transformed
  //       const r = this.preimageSECircle.circleRadius; // the radius of the circle being transformed
  //       const a = transformationSEParent.seCircleOfInversion.circleRadius; // the radius of the circle of inversion
  //       let newAngle = Math.atan(
  //         (-Math.sin(a) * Math.sin(a) * Math.sin(delta)) /
  //           ((1 + Math.cos(a) * Math.cos(a)) * Math.cos(delta) -
  //             2 * Math.cos(a) * Math.cos(r))
  //       );
  //       if (newAngle < 0) {
  //         newAngle += Math.PI;
  //       }
  //       this.tmpVector1 // perpendicular to both the center of inversion and the center of the circle being transformed
  //         .crossVectors(
  //           this.preimageSECircle.centerSEPoint.locationVector,
  //           transformationSEParent.seCircleOfInversion.centerSEPoint
  //             .locationVector
  //         )
  //         .normalize();
  //       this.tmpVector // the to vector
  //         .crossVectors(
  //           transformationSEParent.seCircleOfInversion.centerSEPoint
  //             .locationVector,
  //           this.tmpVector1
  //         )
  //         .normalize();
  //       // return vector is cos(newAngle)*circle inversion center + sin(newAngle)*tmpVector
  //       this.tmpVector2
  //         .copy(
  //           transformationSEParent.seCircleOfInversion.centerSEPoint
  //             .locationVector
  //         )
  //         .multiplyScalar(Math.cos(newAngle));
  //       this.tmpVector2.addScaledVector(this.tmpVector, Math.sin(newAngle));
  //       return this.tmpVector2;
  //     }
  //   } else {
  //     return new Vector3();
  //   }
  // }

  applyIsometryToEllipse(
    transformationSEParent: SEIsometry,
    preimageSEEllipse: SEEllipse
  ): void {
    const transformedEllipseCommandGroup = new CommandGroup();
    // make the images of the endpoints of the Ellipse
    //  make sure they don't exist first
    let transformedFocus1SEPoint: SEPoint | null = null;
    preimageSEEllipse.focus1SEPoint.kids.forEach(kid => {
      if (
        kid instanceof SETransformedPoint &&
        transformationSEParent &&
        kid.parentTransformation.name === transformationSEParent.name
      ) {
        transformedFocus1SEPoint = kid;
      }
    });
    if (transformedFocus1SEPoint === null) {
      // the start of the Ellipse hasn't been transformed by this transformation
      transformedFocus1SEPoint = this.addTransformedPointCommands(
        transformedEllipseCommandGroup,
        transformationSEParent,
        preimageSEEllipse.focus1SEPoint
      );
    }

    let transformedFocus2SEPoint: SEPoint | null = null;
    preimageSEEllipse.focus1SEPoint.kids.forEach(kid => {
      if (
        kid instanceof SETransformedPoint &&
        transformationSEParent &&
        kid.parentTransformation.name === transformationSEParent.name
      ) {
        transformedFocus2SEPoint = kid;
      }
    });
    if (transformedFocus2SEPoint === null) {
      // the start of the Ellipse hasn't been transformed by this transformation
      transformedFocus2SEPoint = this.addTransformedPointCommands(
        transformedEllipseCommandGroup,
        transformationSEParent,
        preimageSEEllipse.focus2SEPoint
      );
    }

    let transformedEllipseSEPoint: SEPoint | null = null;
    preimageSEEllipse.ellipseSEPoint.kids.forEach(kid => {
      if (
        kid instanceof SETransformedPoint &&
        transformationSEParent &&
        kid.parentTransformation.name === transformationSEParent.name
      ) {
        transformedEllipseSEPoint = kid;
      }
    });
    if (transformedEllipseSEPoint === null) {
      // the end of the Ellipse hasn't been transformed by this transformation
      transformedEllipseSEPoint = this.addTransformedPointCommands(
        transformedEllipseCommandGroup,
        transformationSEParent,
        preimageSEEllipse.ellipseSEPoint
      );
    }
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
      preimageSEEllipse,
      transformationSEParent
    );
    newIsometrySEEllipse.update();

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

    transformedEllipseCommandGroup.addCommand(
      new AddIsometryEllipseCommand(
        newIsometrySEEllipse,
        newSELabel,
        preimageSEEllipse,
        transformationSEParent
      )
    );

    // Generate new intersection points. These points must be computed and created
    // in the store. Add the new created points to the ellipse command so they can be undone.
    SEStore.createAllIntersectionsWithEllipse(newIsometrySEEllipse).forEach(
      (item: SEIntersectionReturnType) => {
        // Create the plottable and model label
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

        transformedEllipseCommandGroup.addCommand(
          new AddIntersectionPointCommand(
            item.SEIntersectionPoint,
            item.parent1,
            item.parent2,
            newSELabel
          )
        );
        item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points or label
        newSELabel.showing = false;
      }
    );
    transformedEllipseCommandGroup.execute();
    EventBus.fire("show-alert", {
      key: `handlers.newIsometryEllipseAdded`,
      keyOptions: { name: `${newIsometrySEEllipse.name}` },
      type: "success"
    });
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
