import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SENodule } from "@/models/SENodule";
import { AddExpressionCommand } from "@/commands/AddExpressionCommand";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import EventBus from "@/eventHandlers/EventBus";
import AngleMarker from "@/plottables/AngleMarker";
import { OneDimensional, SEOneDimensional, UpdateMode } from "@/types";
import Point from "@/plottables/Point";
import { Vector3 } from "three";
import { DisplayStyle } from "@/plottables/Nodule";
import SETTINGS from "@/global-settings";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import { AddAngleMarkerCommand as AddAngleMarkerAndExpressionCommand } from "@/commands/AddAngleMarkerAndExpressionCommand";
enum AngleMode {
  NONE,
  LINES,
  POINTS,
  SEGMENTS,
  LINEANDSEGMENT
}

enum HighlightMode {
  NONE,
  ONLYPOINTS,
  ONLYLINESANDSEGMENTS
}

export default class AngleHandler extends Highlighter {
  /**
   * Arrays to collect the SENodules making up the angle
   */
  private targetPoints: SEPoint[] = [];
  private targetLines: SELine[] = [];
  private targetSegments: SESegment[] = [];
  /**
   * The angleMode tells us which SENodule objects make up the angle and grantees that
   * 1) If angleMode === AngleMode.POINTS, the angle is made of three points, the second is the vertex and
   *    (first and second) and (second and third) are not the same or antipodal (at least initially)
   * 2) If angleMode === AngleMode.LINES, the angle is made of two distinct lines
   * 3) If angleMode === AngleMode.SEGMENTS, the angle is made of two distinct segments that have at least one endpoint in common
   * 4) If angleMode === AngleMode.LINEANDSEGMENT, the angle is made of a line and a segment that has at least one endpoint on the line
   */
  private angleMode = AngleMode.NONE;

  /**
   * highlinghtMode indicates what objects should be highlighted in the mouse move method
   */
  private highlightMode = HighlightMode.NONE;

  /**  The temporary plottable TwoJS angle displayed as the move the mouse */
  private temporaryAngleMarker: AngleMarker;
  /** Has the temporary angleMarker been added to the scene?*/
  private isTemporaryAngleMarkerAdded = false;

  /** The possible parents of the SEPoints making up the angle*/
  private firstSEPointOneDimensionalParent: SEOneDimensional | null = null;
  private secondSEPointOneDimensionalParent: SEOneDimensional | null = null;
  private thirdSEPointOneDimensionalParent: SEOneDimensional | null = null;

  /** The objects that a point making up an angle could snap to */
  private snapPoint: SEPoint | null = null;
  private snapOneDimensional: OneDimensional | null = null;

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

  /* temporary vector to help with computations */
  private tmpVector = new Vector3();

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
    this.store.commit.addTemporaryNodule(this.temporaryAngleMarker);

    // Create and style the temporary points marking the points in the angle (if appropriate)
    this.temporaryFirstPoint = new Point();
    this.temporaryFirstPoint.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.temporaryFirstPoint);

    this.temporarySecondPoint = new Point();
    this.temporarySecondPoint.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.temporarySecondPoint);

    this.temporaryThirdPoint = new Point();
    this.temporaryThirdPoint.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.temporaryThirdPoint);
  }

  private handleNextPoint(candidate: SEPoint) {
    // Make sure that the candidate point is NOT antipodal to the second point (i.e. vertex point of the angle) on the list
    if (this.targetPoints.length === 1) {
      if (
        this.tmpVector
          .crossVectors(
            candidate.locationVector,
            this.targetPoints[0].locationVector
          )
          .isZero(SETTINGS.nearlyAntipodalIdeal)
      ) {
        EventBus.fire("show-alert", {
          key: `handlers.antipodalPointMessage`,
          keyOptions: {},
          type: "warning"
        });
        return;
      }
    } else if (this.targetPoints.length === 2) {
      if (
        this.tmpVector
          .crossVectors(
            candidate.locationVector,
            this.targetPoints[1].locationVector
          )
          .isZero(SETTINGS.nearlyAntipodalIdeal)
      ) {
        EventBus.fire("show-alert", {
          key: `handlers.antipodalPointMessage2`,
          keyOptions: {},
          type: "warning"
        });
        return;
      }
    }

    // Check for duplicate points
    const pos = this.targetPoints.findIndex(x => x.id === candidate.id);
    if (pos < 0) {
      this.targetPoints.push(candidate);
    } else
      EventBus.fire("show-alert", {
        key: `handlers.duplicatePointMessage`,
        keyOptions: {},
        type: "warning"
      });
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
    // Check for duplicate lines
    const pos = this.targetSegments.findIndex(x => x.id === candidate.id);
    if (pos < 0) {
      this.targetSegments.push(candidate);
    } else
      EventBus.fire("show-alert", {
        key: `handlers.duplicateSegmentMessage`,
        keyOptions: {},
        type: "warning"
      });
  }

  mousePressed(event: MouseEvent): void {
    //Select an object
    if (this.isOnSphere) {
      switch (this.angleMode) {
        case AngleMode.NONE:
          this.targetPoints.clear();
          this.targetLines.clear();
          if (this.hitSEPoints.length > 0) {
            this.angleMode = AngleMode.POINTS;
            this.highlightMode = HighlightMode.ONLYPOINTS;
            this.targetPoints.push(this.hitSEPoints[0]);
            this.temporaryAngleMarker.startVector = this.hitSEPoints[0].locationVector;
          } else if (this.hitSELines.length > 0) {
            this.angleMode = AngleMode.LINES;
            this.targetLines.push(this.hitSELines[0]);
          } else if (this.hitSESegments.length > 0) {
            this.angleMode = AngleMode.LINES;
            this.targetSegments.push(this.hitSESegments[0]);
          }
          break;
        case AngleMode.POINTS:
          if (this.hitSEPoints.length > 0) {
            // The user continued to add more points
            this.handleNextPoint(this.hitSEPoints[0]);
            if (this.targetPoints.length == 2) {
              this.temporaryAngleMarker.vertexVector = this.hitSEPoints[0].locationVector;
            }
          } else if (this.hitSELines.length > 0) {
            // The user change mind from points to lines?
            this.targetPoints.clear();
            this.angleMode = AngleMode.LINES;
            this.targetLines.push(this.hitSELines[0]);
          } else if (this.hitSESegments.length > 0) {
            // The user change mind from points to lines?
            this.targetPoints.clear();
            this.angleMode = AngleMode.LINES;
            this.targetSegments.push(this.hitSESegments[0]);
          }
          break;
        // case AngleMode.LINES:
        //   if (this.hitSEPoints.length > 0) {
        //     // The user change mind from lines to points?
        //     this.targetLines.clear();
        //     this.angleMode = AngleMode.POINTS;
        //     this.targetPoints.push(this.hitSEPoints[0]);
        //     this.handleNextPoint(this.hitSEPoints[0]);
        //   } else if (this.hitSELines.length > 0) {
        //     // The user continued to add more points
        //     this.handleNextLine(this.hitSELines[0]);
        //   } else if (this.hitSESegments.length > 0) {
        //     // The user continued to add more points
        //     this.handleNextSegment(this.hitSESegments[0]);
        //   }
        //   break;
      }

      if (this.targetPoints.length === 3) {
        this.makeAngleMarkerFromThreePoints();
        EventBus.fire("show-alert", {
          key: `handlers.newAngleAdded`,
          keyOptions: {},
          type: "success"
        });
        //clear the arrays and prepare for the next angle
        this.mouseLeave(event);
      } else if (this.targetLines.length === 2) {
        // const angleFrom2Lines = new SEAngleMarker({
        //   lines: this.targetLines
        // });
        // EventBus.fire("show-alert", {
        //   key: `handlers.newAngleAddedV2`,
        //   keyOptions: { name: `${angleFrom2Lines.name}` },
        //   type: "success"
        // });
        // new AddExpressionCommand(angleFrom2Lines).execute();
        this.angleMode = AngleMode.NONE;
      } else {
        let needed = 0;
        switch (this.angleMode) {
          case AngleMode.POINTS:
            needed = 3 - this.targetPoints.length;
            EventBus.fire("show-alert", {
              key: `handlers.selectMorePoints`,
              keyOptions: { needed: `${needed}` },
              type: "info"
            });
            break;
          case AngleMode.LINES:
            EventBus.fire("show-alert", {
              key: `handlers.selectAnotherLine`,
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
    switch (this.angleMode) {
      case AngleMode.NONE:
        //To start off highlight one object point> segment >line >circles
        if (this.hitSEPoints.length > 0) {
          this.hitSEPoints[0].glowing;
        } else if (this.hitSESegments.length > 0) {
          this.hitSESegments[0].glowing;
        } else if (this.hitSELines.length > 0) {
          this.hitSELines[0].glowing;
        }
        break;
      case AngleMode.POINTS:
        if (this.hitSEPoints.length > 0) {
          this.hitSEPoints[0].glowing;
        }
        break;
      case AngleMode.LINES:
        //Only highlight lines
        if (this.hitSELines.length > 0) {
          this.hitSELines[0].glowing;
        }
        break;
      case AngleMode.SEGMENTS:
        //only highlight segments
        if (this.hitSESegments.length > 0) {
          this.hitSESegments[0].glowing;
        }
        break;
      case AngleMode.LINEANDSEGMENT:
        // only highligh segments and lines
        if (this.hitSESegments.length > 0) {
          this.hitSESegments[0].glowing;
        } else if (this.hitSELines.length > 0) {
          this.hitSELines[0].glowing;
        }
        break;
    }

    if (this.isOnSphere) {
      switch (this.targetPoints.length) {
        case 0:
          // Add the first temporary point marker only once
          if (!this.isTemporaryFirstPointAdded) {
            this.isTemporaryFirstPointAdded = true;
            this.temporaryFirstPoint.addToLayers(this.layers);
          }
          //Update its location to the mouse
          this.temporaryFirstPoint.positionVector = this.currentSphereVector;
          break;
        case 1:
          // Add the second temporary point marker only once
          if (!this.isTemporarySecondPointAdded) {
            this.isTemporarySecondPointAdded = true;
            this.temporarySecondPoint.addToLayers(this.layers);
          }
          //Update its location to the mouse
          this.temporarySecondPoint.positionVector = this.currentSphereVector;
          break;
        case 2:
          // Add the third temporary point marker only once
          if (!this.isTemporaryThirdPointAdded) {
            this.isTemporaryThirdPointAdded = true;
            this.temporaryThirdPoint.addToLayers(this.layers);
          }
          //Update its location to the mouse
          this.temporaryThirdPoint.positionVector = this.currentSphereVector;

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
            SETTINGS.angleMarker.defaultRadius
          );

          this.temporaryAngleMarker.updateDisplay();
          break;
      }
    } else {
      // Remove the temporary objects from the display depending the the number of points selected already
      switch (this.targetPoints.length) {
        case 0:
          if (this.isTemporaryFirstPointAdded) {
            this.temporaryFirstPoint.removeFromLayers();
            this.isTemporaryFirstPointAdded = false;
          }
          break;
        case 1:
          if (this.isTemporarySecondPointAdded) {
            this.temporarySecondPoint.removeFromLayers();
            this.isTemporarySecondPointAdded = false;
          }
          break;
        case 2:
          if (this.isTemporaryAngleMarkerAdded) {
            this.temporaryAngleMarker.removeFromLayers();
            this.isTemporaryAngleMarkerAdded = false;
          }
          if (this.isTemporaryThirdPointAdded) {
            this.temporaryThirdPoint.removeFromLayers();
            this.isTemporaryThirdPointAdded = false;
          }
          break;
      }
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // clear temporary objects from the scene
    if (this.isTemporaryFirstPointAdded) {
      this.temporaryFirstPoint.removeFromLayers();
      this.isTemporaryFirstPointAdded = false;
    }
    if (this.isTemporarySecondPointAdded) {
      this.temporarySecondPoint.removeFromLayers();
      this.isTemporarySecondPointAdded = false;
    }
    if (this.isTemporaryAngleMarkerAdded) {
      this.temporaryAngleMarker.removeFromLayers();
      this.isTemporaryAngleMarkerAdded = false;
    }
    if (this.isTemporaryThirdPointAdded) {
      this.temporaryThirdPoint.removeFromLayers();
      this.isTemporaryThirdPointAdded = false;
    }

    // Reset the targetSegment in preparation for another deletion.
    this.targetPoints.clear();
    this.targetLines.clear();
    this.targetSegments.clear();
    this.angleMode = AngleMode.NONE;
  }

  activate(): void {
    super.activate();
    this.targetPoints.clear();
    this.targetLines.clear();
    this.targetSegments.clear();
  }
  deactivate(): void {
    super.deactivate();
  }

  private makeAngleMarkerFromThreePoints(): void {
    // Clone the current circle after the circlePoint is set
    const newAngleMarker = this.temporaryAngleMarker.clone();
    // Set the display to the default values
    newAngleMarker.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the stroke width to the current zoom magnification factor
    newAngleMarker.adjustSize();

    const newSEAngleMarker = new SEAngleMarker(
      newAngleMarker,
      this.angleMode,
      this.targetPoints[0],
      this.targetPoints[1],
      this.targetPoints[2]
    );

    // Create the plottable and model label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newSEAngleMarker);
    // Set the initial label location
    this.tmpVector
      .copy(this.targetPoints[1].locationVector)
      .add(new Vector3(0, SETTINGS.angleMarker.initialLabelOffset, 0))
      .normalize();
    newSELabel.locationVector = this.tmpVector;

    new AddAngleMarkerAndExpressionCommand(
      this.angleMode,
      newSEAngleMarker,
      newSELabel,
      this.targetPoints[0],
      this.targetPoints[1],
      this.targetPoints[2]
    ).execute();
    // Update the display of the new angle marker
    newSEAngleMarker.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });

    //get ready for the next angle
    this.targetPoints.clear();
  }
  // private makeAngleFromTwoLines(): void {}
  // private makeAngleFromTwoSegments(): void {}
  //private makeAnglefromLineAndSegment(): void {}
}
