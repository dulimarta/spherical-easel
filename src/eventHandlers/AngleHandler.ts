import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import EventBus from "@/eventHandlers/EventBus";
import AngleMarker from "@/plottables/AngleMarker";
import { OneDimensional, SEOneOrTwoDimensional } from "@/types";
import Point from "@/plottables/Point";
import { Vector3 } from "three";
import { DisplayStyle } from "@/plottables/Nodule";
import SETTINGS from "@/global-settings";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneOrTwoDimensionalCommand";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { SEEllipse } from "@/models/SEEllipse";
import { SEStore } from "@/store";
import { AngleMode } from "@/types";
import { SEParametric } from "@/models/SEParametric";
import { AddAngleMarkerCommand } from "@/commands/AddAngleMarkerAndExpressionCommand";

enum HighlightMode {
  NONE,
  ONLYPOINTS,
  ONLYLINESANDSEGMENTS
}
type SEOneDimensionalPlusSEPoint =
  | SELine
  | SESegment
  | SECircle
  | SEEllipse
  | SEParametric
  | SEPoint;

export default class AngleHandler extends Highlighter {
  /**
   * Arrays to collect the SENodules making up the angle
   */
  private targetPoints: (SEPoint | null)[] = [];
  private targetLines: SELine[] = [];
  private targetSegments: SESegment[] = [];
  /**
   * The angleMode tells us which SENodule objects make up the angle and grantees that
   * 1) If angleMode === AngleMode.POINTS, the angle is made of three points, the second is the vertex and
   *    (first and second) and (second and third) are not the same or antipodal (at least initially)
   * 2) If angleMode === AngleMode.LINES, the angle is made of two distinct lines
   * 3) If angleMode === AngleMode.SEGMENTS, the angle is made of two distinct segments that have at least one endpoint in common
   * 4) If angleMode === AngleMode.LINEANDSEGMENT, the angle is made of a line and a segment that has at least one endpoint on the line
   * 5) If angleMode === AngleMode.SEGMENTSORLINEANDSEGMENT, this is a temporary mode that will become either option 3 or 4 when the user is done
   */
  private angleMode = AngleMode.NONE;

  /**
   * In the same where an angle is determined by a line and a segment with an endpoint on the line,
   * this variable tells us if the line was selected first. This matter for the angle is different
   * depending on the order in which they were selected.
   */
  private lineSelectedFirst = true;
  /**
   * highlinghtMode indicates what objects should be highlighted in the mouse move method
   */
  private highlightMode = HighlightMode.NONE;

  /**
   * Arrays to hold the possible parents/locations of the SEPoints making up the angle.
   * Can be null if there is no parent of SEPoint.
   * The first point CANNOT be created as a point on a
   * line or segment because initially we need to allow the user to select a line or segment and
   * we will assume that the user wants to create a angle from lines & segments (and not put
   * a point on the line or segment). The first point can be a point on a SECircle or SEEllipse.
   */
  private sePointOneDimensionalParents: (SEOneOrTwoDimensional | null)[] = [];
  private pointLocations: Vector3[] = [];

  /**
   * Temporary Vectors to hold the locations of the three points making up the angle
   * In the case of an angle from three points, these three vectors will always the
   * entries of pointLocations.
   */
  private tmpPointVector1 = new Vector3();
  private tmpPointVector2 = new Vector3();
  private tmpPointVector3 = new Vector3();

  /**
   * A temporary plottable (TwoJS) points created while the user is making the angle with points
   */
  protected temporaryFirstPoint: Point;
  protected temporarySecondPoint: Point;
  protected temporaryThirdPoint: Point;
  /** Have the temporary points been added to the scene?*/
  private isTemporaryFirstPointAdded = false;
  private isTemporarySecondPointAdded = false;
  private isTemporaryThirdPointAdded = false;

  /**  The temporary plottable TwoJS angle displayed as the move the mouse */
  private temporaryAngleMarker: AngleMarker;
  /** Has the temporary angleMarker been added to the scene?*/
  private isTemporaryAngleMarkerAdded = false;

  /** The objects that a temporary point making up an angle could snap to (displayed only) */
  private snapPoint: SEPoint | null = null;
  private snapOneDimensional: SEOneOrTwoDimensional | null = null;

  /* temporary vector to help with computations */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();

  /**
   * If the user starts to make an angleMarker and mouse press at a location on the sphere (or not on the sphere), then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that.
   */
  private makingAnAngleMarker = false;

  constructor(layers: Two.Group[]) {
    super(layers);

    // Create and style the temporary angle marker
    this.temporaryAngleMarker = new AngleMarker();
    this.temporaryAngleMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryAngleMarker);

    // Create and style the temporary points marking the points in the angle (if appropriate)
    this.temporaryFirstPoint = new Point();
    this.temporaryFirstPoint.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryFirstPoint);

    this.temporarySecondPoint = new Point();
    this.temporarySecondPoint.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporarySecondPoint);

    this.temporaryThirdPoint = new Point();
    this.temporaryThirdPoint.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryThirdPoint);
  }

  private allowPointLocation(candidate: Vector3): boolean {
    // Make sure that the candidate location is NOT antipodal or equal to the second point (i.e. vertex point of the angle) on the list
    if (this.pointLocations.length === 1) {
      if (
        this.tmpVector1
          .crossVectors(candidate, this.pointLocations[0])
          .isZero(SETTINGS.nearlyAntipodalIdeal)
      ) {
     
        EventBus.fire("show-alert", {
          key: `handlers.antipodalPointMessage`,
          keyOptions: {},
          type: "warning"
        });
        return false;
      }
    } else if (this.pointLocations.length === 2) {
      if (
        this.tmpVector1
          .crossVectors(candidate, this.pointLocations[1])
          .isZero(SETTINGS.nearlyAntipodalIdeal)
      ) {
        console.log("here 2", this.pointLocations.length);
        EventBus.fire("show-alert", {
          key: `handlers.antipodalPointMessage2`,
          keyOptions: {},
          type: "warning"
        });
        return false;
      }
    }
    return true;
  }

  private handleNextLine(candidate: SELine) {
    // Check for duplicate lines
    const pos = this.targetLines.findIndex(x => x.id === candidate.id);
    if (pos < 0) {
      this.targetLines.push(candidate);
    } else
      EventBus.fire("show-alert", {
        key: `handlers.duplicateLineMessage`,
        keyOptions: {},
        type: "warning"
      });
  }

  private handleNextSegment(candidate: SESegment) {
    // Check for duplicate segments
    const pos = this.targetSegments.findIndex(x => x.id === candidate.id);
    if (pos < 0) {
      // end to make sure that they have an endpoint in common
      if (
        this.targetSegments[0].startSEPoint === candidate.startSEPoint ||
        this.targetSegments[0].startSEPoint === candidate.endSEPoint ||
        this.targetSegments[0].endSEPoint === candidate.startSEPoint ||
        this.targetSegments[0].endSEPoint === candidate.endSEPoint
      ) {
        this.targetSegments.push(candidate);
      } else {
        EventBus.fire("show-alert", {
          key: `handlers.segmentsWithOutCommonEndpoint`,
          keyOptions: {},
          type: "warning"
        });
      }
    } else {
      EventBus.fire("show-alert", {
        key: `handlers.duplicateSegmentMessage`,
        keyOptions: {},
        type: "warning"
      });
    }
  }

  private handleNextSegmentLineCombination(candidate: SESegment | SELine) {
    // Make sure that one the of the endpoints of the segment is a point on the line or one of the points defining the line
    if (candidate instanceof SELine) {
      // a segment has already been selected
      if (
        (this.targetSegments[0].startSEPoint instanceof
          SEPointOnOneOrTwoDimensional &&
          this.targetSegments[0].startSEPoint.parentOneDimensional ===
            candidate) ||
        (this.targetSegments[0].endSEPoint instanceof
          SEPointOnOneOrTwoDimensional &&
          this.targetSegments[0].endSEPoint.parentOneDimensional ===
            candidate) ||
        this.targetSegments[0].endSEPoint === candidate.startSEPoint ||
        this.targetSegments[0].endSEPoint === candidate.endSEPoint ||
        this.targetSegments[0].startSEPoint === candidate.startSEPoint ||
        this.targetSegments[0].startSEPoint === candidate.endSEPoint
      ) {
        this.targetLines.push(candidate);
      } else {
        EventBus.fire("show-alert", {
          key: `handlers.lineDoesNotContainEndpointOfSegment`,
          keyOptions: {},
          type: "warning"
        });
      }
    }
    if (candidate instanceof SESegment) {
      // a line has already been selected
      if (
        (candidate.startSEPoint instanceof SEPointOnOneOrTwoDimensional &&
          candidate.startSEPoint.parentOneDimensional ===
            this.targetLines[0]) ||
        (candidate.endSEPoint instanceof SEPointOnOneOrTwoDimensional &&
          candidate.endSEPoint.parentOneDimensional === this.targetLines[0]) ||
        this.targetLines[0].endSEPoint === candidate.startSEPoint ||
        this.targetLines[0].endSEPoint === candidate.endSEPoint ||
        this.targetLines[0].startSEPoint === candidate.startSEPoint ||
        this.targetLines[0].startSEPoint === candidate.endSEPoint
      ) {
        this.targetSegments.push(candidate);
      } else {
        EventBus.fire("show-alert", {
          key: `handlers.segmentWithOutEndpointOnLine`,
          keyOptions: {},
          type: "warning"
        });
      }
    }
  }

  mousePressed(event: MouseEvent): void {
    //Select an object
    if (this.isOnSphere) {
      switch (this.angleMode) {
        case AngleMode.NONE:
          if (this.hitSEPoints.length > 0) {
            this.angleMode = AngleMode.POINTS;
            this.targetPoints.push(this.hitSEPoints[0]);
            this.sePointOneDimensionalParents.push(null);
            this.pointLocations.push(
              this.tmpPointVector1.copy(this.hitSEPoints[0].locationVector)
            );
            this.temporaryAngleMarker.startVector = this.hitSEPoints[0].locationVector;
            this.temporaryFirstPoint.positionVector = this.hitSEPoints[0].locationVector;
            // select (to prevent unglowing by highlighter.ts)  and glow the point
            this.hitSEPoints[0].glowing = true;
            this.hitSEPoints[0].selected = true;
          } else if (this.hitSELines.length > 0) {
            // The user selected a line and is going to create an angle with another line or segment
            this.angleMode = AngleMode.SEGMENTSORLINEANDSEGMENT;
            this.targetLines.push(this.hitSELines[0]);
            this.lineSelectedFirst = true;
            // select (to prevent unglowing by highlighter.ts) and glow the line
            this.hitSELines[0].glowing = true;
            this.hitSELines[0].selected = true;
          } else if (this.hitSESegments.length > 0) {
            // The user selected a segment and is going to create an angle with another line or segment
            this.angleMode = AngleMode.SEGMENTSORLINEANDSEGMENT;
            this.targetSegments.push(this.hitSESegments[0]);
            this.lineSelectedFirst = false;
            // select (to prevent unglowing by highlighter.ts) and glow the segment
            this.hitSESegments[0].glowing = true;
            this.hitSESegments[0].selected = true;
          } else if (this.hitSECircles.length > 0) {
            // The user clicked on a circle, assume they want to create an
            // from three points, the first of which is on a circle.
            this.angleMode = AngleMode.POINTS;
            this.targetPoints.push(null);
            this.sePointOneDimensionalParents.push(this.hitSECircles[0]);
            this.pointLocations.push(
              this.tmpPointVector1.copy(
                this.hitSECircles[0].closestVector(this.currentSphereVector)
              )
            );
            this.temporaryAngleMarker.startVector = this.hitSECircles[0].closestVector(
              this.currentSphereVector
            );
            this.temporaryFirstPoint.positionVector = this.hitSECircles[0].closestVector(
              this.currentSphereVector
            );
          } else if (this.hitSEEllipses.length > 0) {
            // The user clicked on a ellipse, assume they want to create an
            // from three points, the first of which is on a ellipse.
            this.angleMode = AngleMode.POINTS;
            this.targetPoints.push(null);
            this.sePointOneDimensionalParents.push(this.hitSEEllipses[0]);
            this.pointLocations.push(
              this.tmpPointVector1.copy(
                this.hitSEEllipses[0].closestVector(this.currentSphereVector)
              )
            );
            this.temporaryAngleMarker.startVector = this.hitSEEllipses[0].closestVector(
              this.currentSphereVector
            );
            this.temporaryFirstPoint.positionVector = this.hitSEEllipses[0].closestVector(
              this.currentSphereVector
            );
          } else if (this.hitSEParametrics.length > 0) {
            // The user clicked on a parametric, assume they want to create an
            // from three points, the first of which is on a parametric.
            this.angleMode = AngleMode.POINTS;
            this.targetPoints.push(null);
            this.sePointOneDimensionalParents.push(this.hitSEParametrics[0]);
            this.pointLocations.push(
              this.tmpPointVector1.copy(
                this.hitSEParametrics[0].closestVector(this.currentSphereVector)
              )
            );
            this.temporaryAngleMarker.startVector = this.hitSEParametrics[0].closestVector(
              this.currentSphereVector
            );
            this.temporaryFirstPoint.positionVector = this.hitSEParametrics[0].closestVector(
              this.currentSphereVector
            );
          } else if (this.hitSEPolygons.length > 0) {
            // The user clicked on a parametric, assume they want to create an
            // from three points, the first of which is on a parametric.
            this.angleMode = AngleMode.POINTS;
            this.targetPoints.push(null);
            this.sePointOneDimensionalParents.push(this.hitSEPolygons[0]);
            this.pointLocations.push(
              this.tmpPointVector1.copy(
                this.hitSEPolygons[0].closestVector(this.currentSphereVector)
              )
            );
            this.temporaryAngleMarker.startVector = this.hitSEPolygons[0].closestVector(
              this.currentSphereVector
            );
            this.temporaryFirstPoint.positionVector = this.hitSEPolygons[0].closestVector(
              this.currentSphereVector
            );
          } else {
            // The user clicked on empty space, assume they want to create
            // an angle from three points, the first of which is a free point
            this.angleMode = AngleMode.POINTS;
            this.targetPoints.push(null);
            this.sePointOneDimensionalParents.push(null);
            this.pointLocations.push(
              this.tmpPointVector1.copy(this.currentSphereVector)
            );
            this.temporaryAngleMarker.startVector = this.currentSphereVector;
            this.temporaryFirstPoint.positionVector = this.currentSphereVector;
          }
          this.makingAnAngleMarker = true;
          break;
        case AngleMode.POINTS:
          // There is one point/location selected, the length of
          // this.targetPoints/sePointOneDimensionalParent/pointLocations are equal (and equal to 1 or 2)
          if (this.hitSEPoints.length > 0) {
            // The user continued to add more points to make the angle
            if (this.allowPointLocation(this.hitSEPoints[0].locationVector)) {
              this.targetPoints.push(this.hitSEPoints[0]);
              this.sePointOneDimensionalParents.push(null);
              if (this.targetPoints.length == 2) {
                this.temporaryAngleMarker.vertexVector = this.hitSEPoints[0].locationVector;
                this.temporarySecondPoint.positionVector = this.hitSEPoints[0].locationVector;
                this.pointLocations.push(
                  this.tmpPointVector2.copy(this.hitSEPoints[0].locationVector)
                );
              } else {
                this.temporaryAngleMarker.endVector = this.hitSEPoints[0].locationVector;
                this.temporaryThirdPoint.positionVector = this.hitSEPoints[0].locationVector;
                this.pointLocations.push(
                  this.tmpPointVector3.copy(this.hitSEPoints[0].locationVector)
                );
              }
              // select (to prevent unglowing by highlighter.ts)  and glow the point
              this.hitSEPoints[0].glowing = true;
              this.hitSEPoints[0].selected = true;
            }
          } else if (this.hitSELines.length > 0) {
            // The user wants to create a point on a line to make an angle
            this.tmpVector.copy(
              this.hitSELines[0].closestVector(this.currentSphereVector)
            );
            if (this.allowPointLocation(this.tmpVector)) {
              this.targetPoints.push(null);
              this.sePointOneDimensionalParents.push(this.hitSELines[0]);
              if (this.targetPoints.length == 2) {
                this.temporaryAngleMarker.vertexVector = this.tmpVector;
                this.temporarySecondPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector2.copy(this.tmpVector)
                );
              } else {
                this.temporaryAngleMarker.endVector = this.tmpVector;
                this.temporaryThirdPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector3.copy(this.tmpVector)
                );
              }
            }
          } else if (this.hitSESegments.length > 0) {
            // The user wants to create a point on a line to make an angle
            this.tmpVector.copy(
              this.hitSESegments[0].closestVector(this.currentSphereVector)
            );
            if (this.allowPointLocation(this.tmpVector)) {
              this.targetPoints.push(null);
              this.sePointOneDimensionalParents.push(this.hitSESegments[0]);
              if (this.targetPoints.length == 2) {
                this.temporaryAngleMarker.vertexVector = this.tmpVector;
                this.temporarySecondPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector2.copy(this.tmpVector)
                );
              } else {
                this.temporaryAngleMarker.endVector = this.tmpVector;
                this.temporaryThirdPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector3.copy(this.tmpVector)
                );
              }
            }
          } else if (this.hitSECircles.length > 0) {
            // the user wants to create a point on a circle to make an angle
            this.tmpVector.copy(
              this.hitSECircles[0].closestVector(this.currentSphereVector)
            );
            if (this.allowPointLocation(this.tmpVector)) {
              this.targetPoints.push(null);
              this.sePointOneDimensionalParents.push(this.hitSECircles[0]);
              if (this.targetPoints.length == 2) {
                this.temporaryAngleMarker.vertexVector = this.tmpVector;
                this.temporarySecondPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector2.copy(this.tmpVector)
                );
              } else {
                this.temporaryAngleMarker.endVector = this.tmpVector;
                this.temporaryThirdPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector3.copy(this.tmpVector)
                );
              }
            }
          } else if (this.hitSEEllipses.length > 0) {
            // the user wants to create a point on a ellipse to make an angle
            this.tmpVector.copy(
              this.hitSEEllipses[0].closestVector(this.currentSphereVector)
            );
            if (this.allowPointLocation(this.tmpVector)) {
              this.targetPoints.push(null);
              this.sePointOneDimensionalParents.push(this.hitSEEllipses[0]);
              if (this.targetPoints.length == 2) {
                this.temporaryAngleMarker.vertexVector = this.tmpVector;
                this.temporarySecondPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector2.copy(this.tmpVector)
                );
              } else {
                this.temporaryAngleMarker.endVector = this.tmpVector;
                this.temporaryThirdPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector3.copy(this.tmpVector)
                );
              }
            }
          } else if (this.hitSEParametrics.length > 0) {
            // the user wants to create a point on a parametric to make an angle
            this.tmpVector.copy(
              this.hitSEParametrics[0].closestVector(this.currentSphereVector)
            );
            if (this.allowPointLocation(this.tmpVector)) {
              this.targetPoints.push(null);
              this.sePointOneDimensionalParents.push(this.hitSEParametrics[0]);
              if (this.targetPoints.length == 2) {
                this.temporaryAngleMarker.vertexVector = this.tmpVector;
                this.temporarySecondPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector2.copy(this.tmpVector)
                );
              } else {
                this.temporaryAngleMarker.endVector = this.tmpVector;
                this.temporaryThirdPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector3.copy(this.tmpVector)
                );
              }
            }
          } else if (this.hitSEPolygons.length > 0) {
            // the user wants to create a point on a parametric to make an angle
            this.tmpVector.copy(
              this.hitSEPolygons[0].closestVector(this.currentSphereVector)
            );
            if (this.allowPointLocation(this.tmpVector)) {
              this.targetPoints.push(null);
              this.sePointOneDimensionalParents.push(this.hitSEPolygons[0]);
              if (this.targetPoints.length == 2) {
                this.temporaryAngleMarker.vertexVector = this.tmpVector;
                this.temporarySecondPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector2.copy(this.tmpVector)
                );
              } else {
                this.temporaryAngleMarker.endVector = this.tmpVector;
                this.temporaryThirdPoint.positionVector = this.tmpVector;
                this.pointLocations.push(
                  this.tmpPointVector3.copy(this.tmpVector)
                );
              }
            }
          } else {
            // the user wants to create a new point to make an angle
            if (this.allowPointLocation(this.currentSphereVector)) {
              this.targetPoints.push(null);
              this.sePointOneDimensionalParents.push(null);
              if (this.targetPoints.length == 2) {
                this.temporaryAngleMarker.vertexVector = this.currentSphereVector;
                this.temporarySecondPoint.positionVector = this.currentSphereVector;
                this.pointLocations.push(
                  this.tmpPointVector2.copy(this.currentSphereVector)
                );
              } else {
                this.temporaryAngleMarker.endVector = this.currentSphereVector;
                this.temporaryThirdPoint.positionVector = this.currentSphereVector;
                this.pointLocations.push(
                  this.tmpPointVector3.copy(this.currentSphereVector)
                );
              }
            }
          }
          break;
        case AngleMode.SEGMENTSORLINEANDSEGMENT:
          // At this point either there is one line xor one segment selected
          if (this.hitSELines.length > 0) {
            // The user selects a line
            // Has the user previously selected a line or segment
            if (this.targetLines.length === 1) {
              this.handleNextLine(this.hitSELines[0]);
            } else {
              this.handleNextSegmentLineCombination(this.hitSELines[0]);
            }
          } else if (this.hitSESegments.length > 0) {
            // The user selects a segment
            // Has the user previously selected a line or segment
            if (this.targetLines.length === 1) {
              this.handleNextSegmentLineCombination(this.hitSESegments[0]);
            } else {
              this.handleNextSegment(this.hitSESegments[0]);
            }
          }
          break;
      }
      // Check to see if we are ready to make the angle
      if (this.targetPoints.length === 3) {
        if (this.makeAngleMarkerFromThreePoints()) {
          EventBus.fire("show-alert", {
            key: `handlers.newAngleAdded`,
            keyOptions: {},
            type: "success"
          });
        }
        //clear the arrays and prepare for the next angle and remove temporary objects
        this.mouseLeave(event);
      } else if (this.targetLines.length === 2) {
        if (this.makeAngleMarkerFromTwoLines()) {
          EventBus.fire("show-alert", {
            key: `handlers.newAngleAdded`,
            keyOptions: {},
            type: "success"
          });
        }
        //clear the arrays and prepare for the next angle and remove temporary objects
        this.mouseLeave(event);
      } else if (this.targetSegments.length === 2) {
        if (this.makeAngleMarkerFromTwoSegments()) {
          EventBus.fire("show-alert", {
            key: `handlers.newAngleAdded`,
            keyOptions: {},
            type: "success"
          });
        }
        //clear the arrays and prepare for the next angle and remove temporary objects
        this.mouseLeave(event);
      } else if (
        this.targetLines.length === 1 &&
        this.targetSegments.length === 1
      ) {
        if (this.makeAngleMarkerFromLineAndSegment()) {
          EventBus.fire("show-alert", {
            key: `handlers.newAngleAdded`,
            keyOptions: {},
            type: "success"
          });
        }
        //clear the arrays and prepare for the next angle and remove temporary objects
        this.mouseLeave(event);
      } else {
        let needed = 0;
        switch (this.angleMode) {
          case AngleMode.POINTS:
            needed = 3 - this.pointLocations.length;
            EventBus.fire("show-alert", {
              key: `handlers.selectMorePoints`,
              keyOptions: { needed: `${needed}` },
              type: "info"
            });
            break;
          case AngleMode.SEGMENTSORLINEANDSEGMENT:
            EventBus.fire("show-alert", {
              key: `handlers.selectAnotherLineOrSegment`,
              keyOptions: {},
              type: "info"
            });
        }
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    if (this.isOnSphere) {
      //Glow the appropriate object and set the appropriate snap objects
      switch (this.angleMode) {
        case AngleMode.NONE:
          //Then highlight the one nearby object point> segment >line >circles > ellipse -- snapping only to points, circles and lines!
          if (this.hitSEPoints.length > 0) {
            this.hitSEPoints[0].glowing = true;
            this.snapOneDimensional = null;
            this.snapPoint = this.hitSEPoints[0];
          } else if (this.hitSESegments.length > 0) {
            this.hitSESegments[0].glowing = true;
            this.snapPoint = null;
          } else if (this.hitSELines.length > 0) {
            this.hitSELines[0].glowing = true;
            this.snapPoint = null;
          } else if (this.hitSECircles.length > 0) {
            this.hitSECircles[0].glowing = true;
            this.snapOneDimensional = this.hitSECircles[0];
            this.snapPoint = null;
          } else if (this.hitSEEllipses.length > 0) {
            this.hitSEEllipses[0].glowing = true;
            this.snapOneDimensional = this.hitSEEllipses[0];
            this.snapPoint = null;
          } else if (this.hitSEParametrics.length > 0) {
            this.hitSEParametrics[0].glowing = true;
            this.snapOneDimensional = this.hitSEParametrics[0];
            this.snapPoint = null;
          } else if (this.hitSEPolygons.length > 0) {
            this.hitSEPolygons[0].glowing = true;
            this.snapOneDimensional = this.hitSEPolygons[0];
            this.snapPoint = null;
          }
          break;
        case AngleMode.POINTS:
          // The use has selected or created a point
          // Highlight and snap to the nearby object
          if (this.hitSEPoints.length > 0) {
            this.hitSEPoints[0].glowing = true;
            this.snapPoint = this.hitSEPoints[0];
            this.snapOneDimensional = null;
          } else if (this.hitSESegments.length > 0) {
            this.hitSESegments[0].glowing = true;
            this.snapPoint = null;
            this.snapOneDimensional = this.hitSESegments[0];
          } else if (this.hitSELines.length > 0) {
            this.hitSELines[0].glowing = true;
            this.snapPoint = null;
            this.snapOneDimensional = this.hitSELines[0];
          } else if (this.hitSECircles.length > 0) {
            this.hitSECircles[0].glowing = true;
            this.snapPoint = null;
            this.snapOneDimensional = this.hitSECircles[0];
          } else if (this.hitSEEllipses.length > 0) {
            this.hitSEEllipses[0].glowing = true;
            this.snapPoint = null;
            this.snapOneDimensional = this.hitSEEllipses[0];
          } else if (this.hitSEParametrics.length > 0) {
            this.hitSEParametrics[0].glowing = true;
            this.snapPoint = null;
            this.snapOneDimensional = this.hitSEParametrics[0];
          } else if (this.hitSEPolygons.length > 0) {
            this.hitSEPolygons[0].glowing = true;
            this.snapPoint = null;
            this.snapOneDimensional = this.hitSEPolygons[0];
          } else {
            //Nothing nearby so don't snap to anything
            this.snapOneDimensional = null;
            this.snapPoint = null;
          }
          break;
        case AngleMode.SEGMENTSORLINEANDSEGMENT:
          //Only highlight lines and segments
          if (this.hitSELines.length > 0) {
            this.hitSELines[0].glowing = true;
          } else if (this.hitSESegments.length > 0) {
            this.hitSESegments[0].glowing = true;
          }
          // no snapping
          this.snapOneDimensional = null;
          this.snapPoint = null;
          break;
      }
      if (this.angleMode !== AngleMode.SEGMENTSORLINEANDSEGMENT) {
        //Manage the display and location of the temporary objects
        switch (this.pointLocations.length) {
          case 0:
            // Add the first temporary point marker only once if we are in NONE Or POINT angle mode
            if (!this.isTemporaryFirstPointAdded) {
              this.isTemporaryFirstPointAdded = true;
              this.temporaryFirstPoint.addToLayers(this.layers);
            }
            //Update its location to the mouse
            this.temporaryFirstPoint.positionVector = this.currentSphereVector;

            //If there is a nearby point, line or segment turn off the temporary point marker, but leave in for circles and ellipses
            if (
              this.hitSENodules.filter(
                p =>
                  p instanceof SEPoint ||
                  p instanceof SELine ||
                  p instanceof SESegment
              ).length > 0
            ) {
              this.temporaryFirstPoint.removeFromLayers();
              this.isTemporaryFirstPointAdded = false;
            }

            break;
          case 1:
            // Add the second temporary point marker only once (We MUST be in AngleMode.POINTS)
            if (!this.isTemporarySecondPointAdded) {
              this.isTemporarySecondPointAdded = true;
              this.temporarySecondPoint.addToLayers(this.layers);
            }
            //Remove the second marker if there is a nearby point
            if (this.snapPoint !== null) {
              this.temporarySecondPoint.removeFromLayers();
              this.isTemporarySecondPointAdded = false;
            }
            //Update its location
            if (this.snapPoint !== null) {
              this.temporarySecondPoint.positionVector = this.snapPoint.locationVector;
            } else if (this.snapOneDimensional !== null) {
              this.temporarySecondPoint.positionVector = this.snapOneDimensional.closestVector(
                this.currentSphereVector
              );
            } else {
              this.temporarySecondPoint.positionVector = this.currentSphereVector;
            }

            break;
          case 2:
            // Add the third temporary point marker only once (We MUST be in AngleMode.POINTS)
            if (!this.isTemporaryThirdPointAdded) {
              this.isTemporaryThirdPointAdded = true;
              this.temporaryThirdPoint.addToLayers(this.layers);
            }
            //Remove the third marker if there is a nearby point
            if (this.snapPoint !== null) {
              this.temporaryThirdPoint.removeFromLayers();
              this.isTemporaryThirdPointAdded = false;
            }
            //Update its location
            if (this.snapPoint !== null) {
              this.temporaryThirdPoint.positionVector = this.snapPoint.locationVector;
            } else if (this.snapOneDimensional !== null) {
              this.temporaryThirdPoint.positionVector = this.snapOneDimensional.closestVector(
                this.currentSphereVector
              );
            } else {
              this.temporaryThirdPoint.positionVector = this.currentSphereVector;
            }

            // Add the temporary angle marker only once
            if (!this.isTemporaryAngleMarkerAdded) {
              this.isTemporaryAngleMarkerAdded = true;
              this.temporaryAngleMarker.addToLayers(this.layers);
            }

            // update the temporary angle marker
            this.temporaryAngleMarker.setAngleMarkerFromThreeVectors(
              this.temporaryFirstPoint.positionVector,
              this.temporarySecondPoint.positionVector,
              this.currentSphereVector,
              AngleMarker.currentAngleMarkerRadius
            );

            this.temporaryAngleMarker.updateDisplay();
            break;
        }
      }
    } else {
      // Remove the temporary objects from the display depending the the number of points selected already
      switch (this.pointLocations.length) {
        case 0:
          // remove all temporary points and angle marker
          this.temporaryFirstPoint.removeFromLayers();
          this.isTemporaryFirstPointAdded = false;

          this.temporarySecondPoint.removeFromLayers();
          this.isTemporarySecondPointAdded = false;

          this.temporaryThirdPoint.removeFromLayers();
          this.isTemporaryThirdPointAdded = false;

          this.temporaryAngleMarker.removeFromLayers();
          this.isTemporaryAngleMarkerAdded = false;
          break;
        case 1:
          this.temporarySecondPoint.removeFromLayers();
          this.isTemporarySecondPointAdded = false;

          this.temporaryThirdPoint.removeFromLayers();
          this.isTemporaryThirdPointAdded = false;

          this.temporaryAngleMarker.removeFromLayers();
          this.isTemporaryAngleMarkerAdded = false;
          break;
        case 2:
          this.temporaryThirdPoint.removeFromLayers();
          this.isTemporaryThirdPointAdded = false;

          this.temporaryAngleMarker.removeFromLayers();
          this.isTemporaryAngleMarkerAdded = false;
          break;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseReleased(_event: MouseEvent): void {
    // No code ???
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // unselect all points, lines, segments (unglow happens in super.mouseLeave(event))
    this.targetLines.forEach(l => (l.selected = false));
    this.targetSegments.forEach(l => (l.selected = false));
    this.targetPoints.forEach(l => {
      if (l !== null) {
        l.selected = false;
      }
    });
    //clear the arrays and prepare for the next angle
    this.targetPoints.splice(0);
    this.targetLines.splice(0);
    this.targetSegments.splice(0);
    this.pointLocations.splice(0);
    this.sePointOneDimensionalParents.splice(0);
    this.makingAnAngleMarker = false;
    this.angleMode = AngleMode.NONE;
    // Remove temporary objects
    this.temporaryFirstPoint.removeFromLayers();
    this.isTemporaryFirstPointAdded = false;
    this.temporarySecondPoint.removeFromLayers();
    this.isTemporarySecondPointAdded = false;
    this.temporaryThirdPoint.removeFromLayers();
    this.isTemporaryThirdPointAdded = false;
    this.temporaryAngleMarker.removeFromLayers();
    this.isTemporaryAngleMarkerAdded = false;
    this.snapOneDimensional = null;
    this.snapPoint = null;
  }

  activate(): void {
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
    // call an unglow all command
    SEStore.unglowAllSENodules();
    this.infoText.hide();
    // unselect all points, lines, segments
    this.targetLines.forEach(l => (l.selected = false));
    this.targetSegments.forEach(l => (l.selected = false));
    this.targetPoints.forEach(l => {
      if (l !== null) {
        l.selected = false;
      }
    });
    //clear the arrays and prepare for the next angle
    this.targetPoints.clear();
    this.targetLines.clear();
    this.targetSegments.clear();
    this.pointLocations.clear();
    this.sePointOneDimensionalParents.clear();
    this.makingAnAngleMarker = false;
    this.angleMode = AngleMode.NONE;
    // Remove temporary objects
    this.temporaryFirstPoint.removeFromLayers();
    this.isTemporaryFirstPointAdded = false;
    this.temporarySecondPoint.removeFromLayers();
    this.isTemporarySecondPointAdded = false;
    this.temporaryThirdPoint.removeFromLayers();
    this.isTemporaryThirdPointAdded = false;
    this.temporaryAngleMarker.removeFromLayers();
    this.isTemporaryAngleMarkerAdded = false;
    this.snapOneDimensional = null;
    this.snapPoint = null;
  }

  private makeAngleMarkerFromThreePoints(): boolean {
    // make sure that this triple of points has not been measured already
    // this is only possible if all three points are existing points
    if (this.targetPoints.every(entry => entry !== null)) {
      let measurementName = "";
      if (
        SEStore.expressions.some(exp => {
          if (
            exp instanceof SEAngleMarker &&
            exp.parents[0].name === this.targetPoints[0]?.name && // order matters in angles angle 0 1 2 is different than 2 1 0
            exp.parents[1].name === this.targetPoints[1]?.name &&
            exp.parents[2].name === this.targetPoints[2]?.name
          ) {
            measurementName = exp.name;
            return true;
          } else {
            return false;
          }
        })
      ) {
        EventBus.fire("show-alert", {
          key: `handlers.duplicateThreePointAngleMeasurement`,
          keyOptions: {
            pt0Name: `${this.targetPoints[0]?.name}`,
            pt1Name: `${this.targetPoints[1]?.name}`,
            pt2Name: `${this.targetPoints[2]?.name}`,
            measurementName: `${measurementName}`
          },
          type: "error"
        });
        return false;
      }
    }
    // Create a command group to add the points defining the circle and the circle to the store
    // This way a single undo click will undo all (potentially three) operations.
    const angleMarkerCommandGroup = new CommandGroup();

    // At this point in the code, this.pointLocations contains three locations and depending on the the
    // null (or not) corresponding locations in this.targetPoints/seOneDimensionalParent we have to create points
    for (let i = 0; i < 3; i++) {
      if (
        this.sePointOneDimensionalParents[i] !== null &&
        this.targetPoints[i] === null
      ) {
        // create a new point *on object*
        // we have to create a new point
        const newPoint = new Point();
        // Set the display to the default values
        newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
        // Adjust the size of the point to the current zoom magnification factor
        newPoint.adjustSize();

        // Create the model object for the new point and link them
        const vtx = new SEPointOnOneOrTwoDimensional(
          newPoint,
          this.sePointOneDimensionalParents[i]!
        );

        // Create a plottable label
        const newLabel = new Label();
        // Create an SELabel and link it to the plottable object
        const newSELabel = new SELabel(newLabel, vtx);

        angleMarkerCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.sePointOneDimensionalParents[i]!,
            newSELabel
          )
        );
        vtx.locationVector = this.pointLocations[i];
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

        //Add the newly created point to the targetPoint array
        this.targetPoints[i] = vtx;
      } else if (
        this.sePointOneDimensionalParents[i] === null &&
        this.targetPoints[i] === null
      ) {
        // create a new point
        // we have to create a new point
        const newPoint = new Point();
        // Set the display to the default values
        newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
        // Adjust the size of the point to the current zoom magnification factor
        newPoint.adjustSize();

        // Create the model object for the new point and link them
        const vtx = new SEPoint(newPoint);

        // Create a plottable label
        const newLabel = new Label();
        // Create an SELabel and link it to the plottable object
        const newSELabel = new SELabel(newLabel, vtx);

        angleMarkerCommandGroup.addCommand(
          new AddPointCommand(vtx, newSELabel)
        );
        vtx.locationVector = this.pointLocations[i];
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
        //Add the newly created point to the targetPoint array
        this.targetPoints[i] = vtx;
      }
    }

    // Clone the current angle marker after the target points are set
    const newAngleMarker = this.temporaryAngleMarker.clone();
    // Set the display to the default values
    newAngleMarker.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the stroke width to the current zoom magnification factor
    newAngleMarker.adjustSize();

    const newSEAngleMarker = new SEAngleMarker(
      newAngleMarker,
      AngleMode.POINTS,
      this.targetPoints[0] as SEPoint,
      this.targetPoints[1] as SEPoint,
      this.targetPoints[2] as SEPoint
    );

    // Create the plottable and model label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newSEAngleMarker);

    // Update the display of the new angle marker (do it here so that the placement of the newLabel is correct)
    newSEAngleMarker.markKidsOutOfDate();
    newSEAngleMarker.update();

    // Set the initial label location near the vertex vector
    // and turn off the lable of the vertex if SETTINGS.angleMarker.turnOffVertexLabelOnCreation
    this.tmpVector
      .copy(this.pointLocations[1])
      .add(
        new Vector3(
          -2 * SETTINGS.angleMarker.initialLabelOffset,
          -1 * SETTINGS.angleMarker.initialLabelOffset,
          0
        )
      )
      .normalize();

    if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
      this.targetPoints[1]!.label!.showing = false;
    }

    newSELabel.locationVector = this.tmpVector;

    angleMarkerCommandGroup.addCommand(
      new AddAngleMarkerCommand(
        AngleMode.POINTS,
        newSEAngleMarker,
        newSELabel,
        this.targetPoints[0] as SEPoint,
        this.targetPoints[1] as SEPoint,
        this.targetPoints[2] as SEPoint
      )
    );

    // execute the command to do all the creating
    angleMarkerCommandGroup.execute();

    // Update the display of the new angle marker
    newSEAngleMarker.markKidsOutOfDate();
    newSEAngleMarker.update();

    return true;
  }

  private makeAngleMarkerFromTwoLines(): boolean {
    // make sure that this pair of lines has not been measured already
    let measurementName = "";
    if (
      SEStore.expressions.some(exp => {
        if (
          exp instanceof SEAngleMarker &&
          exp.parents[0].name === this.targetLines[0]?.name && // order matters in angles angle from L1 to L2 is different than from L2 to L1
          exp.parents[1].name === this.targetLines[1]?.name
        ) {
          measurementName = exp.name;
          return true;
        } else {
          return false;
        }
      })
    ) {
      EventBus.fire("show-alert", {
        key: `handlers.duplicateLineAngleMeasurement`,
        keyOptions: {
          line0Name: `${this.targetLines[0]?.name}`,
          line1Name: `${this.targetLines[1]?.name}`,
          measurementName: `${measurementName}`
        },
        type: "error"
      });
      return false;
    }

    // Create a new angle marker plottable
    const newAngleMarker = new AngleMarker();
    // Set the display to the default values
    newAngleMarker.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the stroke width to the current zoom magnification factor
    newAngleMarker.adjustSize();

    const newSEAngleMarker = new SEAngleMarker(
      newAngleMarker,
      AngleMode.LINES,
      this.targetLines[0],
      this.targetLines[1]
    );

    // Create the plottable and model label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newSEAngleMarker);

    // Update the display of the new angle marker (do it here so that the placement of the newLabel is correct)
    newSEAngleMarker.markKidsOutOfDate();
    newSEAngleMarker.update();

    // Set the initial label location near the intersection on the front side of the sphere
    this.tmpVector.crossVectors(
      this.targetLines[0].normalVector,
      this.targetLines[1].normalVector
    );
    if (this.tmpVector.z < 0) {
      this.tmpVector.multiplyScalar(-1);
    }
    this.tmpVector
      .add(
        new Vector3(
          -2 * SETTINGS.angleMarker.initialLabelOffset,
          -1 * SETTINGS.angleMarker.initialLabelOffset,
          0
        )
      )
      .normalize();
    newSELabel.locationVector = this.tmpVector;

    // execute the command to do all the creating
    new AddAngleMarkerCommand(
      AngleMode.LINES,
      newSEAngleMarker,
      newSELabel,
      this.targetLines[0],
      this.targetLines[1]
    ).execute();
    // Update the display of the new angle marker
    newSEAngleMarker.markKidsOutOfDate();
    newSEAngleMarker.update();
    return true;
  }

  private makeAngleMarkerFromTwoSegments(): boolean {
    // make sure that this pair of segments has not been measured already
    let measurementName = "";
    if (
      SEStore.expressions.some(exp => {
        if (
          exp instanceof SEAngleMarker &&
          exp.parents[0].name === this.targetSegments[0]?.name && // order matters in angles angle from S1 to S2 is different than from S2 to S1
          exp.parents[1].name === this.targetSegments[1]?.name
        ) {
          measurementName = exp.name;
          return true;
        } else {
          return false;
        }
      })
    ) {
      EventBus.fire("show-alert", {
        key: `handlers.duplicateSegmentAngleMeasurement`,
        keyOptions: {
          seg0Name: `${this.targetSegments[0]?.name}`,
          seg1Name: `${this.targetSegments[1]?.name}`,
          measurementName: `${measurementName}`
        },
        type: "error"
      });
      return false;
    }

    // Create a new angle marker plottable
    const newAngleMarker = new AngleMarker();
    // Set the display to the default values
    newAngleMarker.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the stroke width to the current zoom magnification factor
    newAngleMarker.adjustSize();

    const newSEAngleMarker = new SEAngleMarker(
      newAngleMarker,
      AngleMode.SEGMENTS,
      this.targetSegments[0],
      this.targetSegments[1]
    );

    // Create the plottable and model label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newSEAngleMarker);

    // Update the display of the new angle marker (do it here so that the placement of the newLabel is correct)
    newSEAngleMarker.markKidsOutOfDate();
    newSEAngleMarker.update();

    // Set the initial label location near the common endpoint of the segments
    // and turn off the label of the vertex point (SETTINGS.angleMarker.turnOffVertexLabelOnCreation)
    if (
      this.targetSegments[0].startSEPoint ===
      this.targetSegments[1].startSEPoint
    ) {
      this.tmpVector.copy(this.targetSegments[0].startSEPoint.locationVector);
      if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
        this.targetSegments[0].startSEPoint.label!.showing = false;
      }
    } else if (
      this.targetSegments[0].startSEPoint === this.targetSegments[1].endSEPoint
    ) {
      this.tmpVector.copy(this.targetSegments[0].startSEPoint.locationVector);
      if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
        this.targetSegments[0].startSEPoint.label!.showing = false;
      }
    } else if (
      this.targetSegments[0].endSEPoint === this.targetSegments[1].startSEPoint
    ) {
      this.tmpVector.copy(this.targetSegments[1].startSEPoint.locationVector);
      if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
        this.targetSegments[1].startSEPoint.label!.showing = false;
      }
    } else if (
      this.targetSegments[0].endSEPoint === this.targetSegments[1].endSEPoint
    ) {
      this.tmpVector.copy(this.targetSegments[1].endSEPoint.locationVector);
      if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
        this.targetSegments[1].endSEPoint.label!.showing = false;
      }
    } else {
      this.tmpVector.set(0, 0, 1);
      console.log(
        "In AngleHandler A pair of select segments doesn't have a common endpoint -- error!"
      );
    }
    this.tmpVector
      .add(
        new Vector3(
          -2 * SETTINGS.angleMarker.initialLabelOffset,
          -1 * SETTINGS.angleMarker.initialLabelOffset,
          0
        )
      )
      .normalize();
    newSELabel.locationVector = this.tmpVector;

    new AddAngleMarkerCommand(
      AngleMode.SEGMENTS,
      newSEAngleMarker,
      newSELabel,
      this.targetSegments[0],
      this.targetSegments[1]
    ).execute();

    // Update the display of the new angle marker
    newSEAngleMarker.markKidsOutOfDate();
    newSEAngleMarker.update();
    return true;
  }

  private makeAngleMarkerFromLineAndSegment(): boolean {
    // make sure that this segment and line has not been measured already
    let measurementName = "";
    if (this.lineSelectedFirst) {
      SEStore.expressions.some(exp => {
        if (
          exp instanceof SEAngleMarker &&
          exp.firstSEParent.name === this.targetLines[0]?.name && // order matters in angles angle from S1 to S2 is different than from S2 to S1
          exp.secondSEParent.name === this.targetSegments[0]?.name
        ) {
          measurementName = exp.name;
          return true;
        } else {
          return false;
        }
      });
    } else {
      SEStore.expressions.some(exp => {
        if (
          exp instanceof SEAngleMarker &&
          exp.firstSEParent.name === this.targetSegments[0]?.name &&
          exp.secondSEParent.name === this.targetLines[0]?.name // order matters in angles angle from S1 to S2 is different than from S2 to S1
        ) {
          measurementName = exp.name;
          return true;
        } else {
          return false;
        }
      });
    }
    if (measurementName !== "") {
      EventBus.fire("show-alert", {
        key: `handlers.duplicateSegmentLineAngleMeasurement`,
        keyOptions: {
          lineName: `${this.targetLines[0]?.name}`,
          segName: `${this.targetSegments[0]?.name}`,
          measurementName: `${measurementName}`
        },
        type: "error"
      });
      return false;
    }

    // Create a new angle marker plottable
    const newAngleMarker = new AngleMarker();
    // Set the display to the default values
    newAngleMarker.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the stroke width to the current zoom magnification factor
    newAngleMarker.adjustSize();

    let newSEAngleMarker;

    if (this.lineSelectedFirst) {
      newSEAngleMarker = new SEAngleMarker(
        newAngleMarker,
        AngleMode.LINEANDSEGMENT,
        this.targetLines[0],
        this.targetSegments[0]
      );
    } else {
      newSEAngleMarker = new SEAngleMarker(
        newAngleMarker,
        AngleMode.LINEANDSEGMENT,
        this.targetSegments[0],
        this.targetLines[0]
      );
    }
    // Create the plottable and model label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newSEAngleMarker);

    // Update the display of the new angle marker (do it here so that the placement of the newLabel is correct)
    newSEAngleMarker.markKidsOutOfDate();
    newSEAngleMarker.update();

    // Set the initial label location near point of the segment that is on the line
    // and turn off the label of the vertex point (SETTINGS.angleMarker.turnOffVertexLabelOnCreation)
    if (
      this.targetSegments[0].startSEPoint instanceof
        SEPointOnOneOrTwoDimensional &&
      this.targetSegments[0].startSEPoint.parentOneDimensional ===
        this.targetLines[0]
    ) {
      this.tmpVector.copy(this.targetSegments[0].startSEPoint.locationVector);
      if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
        this.targetSegments[0].startSEPoint.label!.showing = false;
      }
    } else if (
      this.targetSegments[0].endSEPoint instanceof
        SEPointOnOneOrTwoDimensional &&
      this.targetSegments[0].endSEPoint.parentOneDimensional ===
        this.targetLines[0]
    ) {
      this.tmpVector.copy(this.targetSegments[0].endSEPoint.locationVector);
      if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
        this.targetSegments[0].endSEPoint.label!.showing = false;
      }
    } else if (
      this.targetSegments[0].endSEPoint === this.targetLines[0].startSEPoint ||
      this.targetSegments[0].endSEPoint === this.targetLines[0].endSEPoint
    ) {
      this.tmpVector.copy(this.targetSegments[0].endSEPoint.locationVector);
      if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
        this.targetSegments[0].endSEPoint.label!.showing = false;
      }
    } else if (
      this.targetSegments[0].startSEPoint ===
        this.targetLines[0].startSEPoint ||
      this.targetSegments[0].startSEPoint === this.targetLines[0].endSEPoint
    ) {
      this.tmpVector.copy(this.targetSegments[0].startSEPoint.locationVector);
      if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
        this.targetSegments[0].startSEPoint.label!.showing = false;
      }
    } else {
      this.tmpVector.set(0, 0, 1);
      console.log(
        "In AngleHandler a selected segment doesn't have a endpoint on selected line -- error!"
      );
    }
    this.tmpVector
      .add(
        new Vector3(
          -2 * SETTINGS.angleMarker.initialLabelOffset,
          -1 * SETTINGS.angleMarker.initialLabelOffset,
          0
        )
      )
      .normalize();
    newSELabel.locationVector = this.tmpVector;
    // execute the command to do all the creating
    new AddAngleMarkerCommand(
      AngleMode.LINEANDSEGMENT,
      newSEAngleMarker,
      newSELabel,
      this.targetLines[0],
      this.targetSegments[0]
    ).execute();
    // Update the display of the new angle marker
    newSEAngleMarker.markKidsOutOfDate();
    newSEAngleMarker.update();
    return true;
  }
}
