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
import Polygon from "@/plottables/Polygon";
import { SEPolygon } from "@/models/SEPolygon";
import { AddPolygonCommand } from "@/commands/AddPolygonAndExpressionCommand";
import { AddAngleMarkerCommand } from "@/commands/AddAngleMarkerAndExpressionCommand";
import { SESegmentLength } from "@/models/SESegmentLength";
import { AddLengthMeasurementCommand } from "@/commands/AddLengthMeasurementCommand";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { StyleEditPanels } from "@/types/Styles";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";

export default class PolygonHandler extends Highlighter {
  /**
   * Arrays to collect the SESegments making up the polygon
   */
  private seEdgeSegments: SESegment[] = [];

  /**
   * The endpoints of the chain of segments
   */
  private startSEPoint: SEPoint | null = null;
  private endSEPoint: SEPoint | null = null;
  private chainClosed = false; // true only if the chain of segments forms a loop.
  /**
   * The segmentIsFlipped are chosen so that
   * if segmentIsFlipped[i]===true
   * then
   *  seEdgeSegments[i].endSEPoint to seEdgeSegments[i].startSEPoint is the positive direction in edge seEdgeSegments[i]
   * else
   *  seEdgeSegments[i].startSEPoint to seEdgeSegments[i].endSEPoint is the positive direction in edge seEdgeSegments[i]
   *
   */
  private segmentIsFlipped: boolean[] = [];

  /**
   * Triangle Selection Mode (set in order to restrict to a triangle) Set once by the constructor
   * Allows us to not write a separate triangle selections handler.
   */
  private triangleSelectionMode: boolean;

  /**
   * Temporary Vectors to hold the locations of the three points making up the angle
   * In the case of an angle from three points, these three vectors will always the
   * entries of pointLocations.
   */
  private tmpVector = new Vector3();
  private tmpVector2 = new Vector3();
  private tmpVector3 = new Vector3();

  /**  The temporary plottable TwoJS angles/indicate interior displayed as the move the mouse */
  private temporaryAngleMarkers: AngleMarker[] = [];
  /** Has the temporary angleMarker been added to the scene?*/
  private temporaryAngleMarkersAdded: boolean[] = [];

  constructor(layers: Two.Group[], selectOnlyTriangles?: boolean) {
    super(layers);
    this.triangleSelectionMode = selectOnlyTriangles ?? false;

    // Create and style the temporary angle markers
    for (let i = 0; i < SETTINGS.polygon.numberOfTemporaryAngleMarkers; i++) {
      const tmpAm = new AngleMarker();
      tmpAm.stylize(DisplayStyle.ApplyTemporaryVariables);
      SEStore.addTemporaryNodule(tmpAm);
      this.temporaryAngleMarkers.push(tmpAm);
      this.temporaryAngleMarkersAdded.push(false);
    }
  }

  mousePressed(event: MouseEvent): void {
    if (this.isOnSphere) {
      if (this.hitSESegments.length > 0) {
        if (this.seEdgeSegments.length == 0) {
          // the user has just begun to select segments add any segment to SEEdgeSegment
          this.seEdgeSegments.push(this.hitSESegments[0]);
          this.hitSESegments[0].selected = true;
        } else if (this.seEdgeSegments.length === 1) {
          if (
            this.seEdgeSegments[0].startSEPoint.name ===
              this.hitSESegments[0].startSEPoint.name ||
            this.seEdgeSegments[0].startSEPoint.name ===
              this.hitSESegments[0].endSEPoint.name
          ) {
            if (
              this.acceptableAddition(
                this.seEdgeSegments,
                this.hitSESegments[0],
                this.seEdgeSegments[0].startSEPoint.name ===
                  this.hitSESegments[0].endSEPoint.name,
                this.seEdgeSegments[0].endSEPoint.name ===
                  this.hitSESegments[0].startSEPoint.name // test for bi-gon
              )
            ) {
              // add the hit segment to SEEdgeSegment and set startPoint and endSEPoint and update flipped array
              const newSegmentIsFlipped =
                this.seEdgeSegments[0].startSEPoint.name ===
                this.hitSESegments[0].endSEPoint.name;
              this.seEdgeSegments.push(this.hitSESegments[0]);
              this.segmentIsFlipped.push(true);
              this.segmentIsFlipped.push(newSegmentIsFlipped);
              this.startSEPoint = this.seEdgeSegments[0].endSEPoint;
              if (newSegmentIsFlipped) {
                this.endSEPoint = this.seEdgeSegments[1].startSEPoint;
              } else {
                this.endSEPoint = this.seEdgeSegments[1].endSEPoint;
              }
              this.hitSESegments[0].selected = true;
              // The user could have selected to segments with common endpoints;  each segment is Pi long
              this.chainClosed = newSegmentIsFlipped
                ? this.hitSESegments[0].startSEPoint.name ===
                  this.startSEPoint?.name
                : this.hitSESegments[0].endSEPoint.name ===
                  this.startSEPoint?.name;
            } else {
              EventBus.fire("show-alert", {
                key: `handlers.newSegmentIntersectsOrToClose`,
                keyOptions: {},
                type: "warning"
              });
              return;
            }
          } else if (
            this.seEdgeSegments[0].endSEPoint.name ===
              this.hitSESegments[0].startSEPoint.name ||
            this.seEdgeSegments[0].endSEPoint.name ===
              this.hitSESegments[0].endSEPoint.name
          ) {
            if (
              this.acceptableAddition(
                this.seEdgeSegments,
                this.hitSESegments[0],
                this.seEdgeSegments[0].endSEPoint.name ===
                  this.hitSESegments[0].endSEPoint.name,
                this.seEdgeSegments[0].startSEPoint.name ===
                  this.hitSESegments[0].startSEPoint.name // test for bi-gon
              )
            ) {
              // add the hit segment to SEEdgeSegment and set startPoint and endSEPoint and update flipped array
              const newSegmentIsFlipped =
                this.seEdgeSegments[0].endSEPoint.name ===
                this.hitSESegments[0].endSEPoint.name;
              this.seEdgeSegments.push(this.hitSESegments[0]);
              this.segmentIsFlipped.push(false);
              this.segmentIsFlipped.push(newSegmentIsFlipped);

              this.startSEPoint = this.seEdgeSegments[0].startSEPoint;
              if (newSegmentIsFlipped) {
                this.endSEPoint = this.seEdgeSegments[1].startSEPoint;
              } else {
                this.endSEPoint = this.seEdgeSegments[1].endSEPoint;
              }
              this.hitSESegments[0].selected = true;
              // The user could have selected to segments with common endpoints;  each segment is Pi long
              this.chainClosed = newSegmentIsFlipped
                ? this.hitSESegments[0].startSEPoint.name ===
                  this.startSEPoint?.name
                : this.hitSESegments[0].endSEPoint.name ===
                  this.startSEPoint?.name;
            } else {
              EventBus.fire("show-alert", {
                key: `handlers.newSegmentIntersectsOrToClose`,
                keyOptions: {},
                type: "warning"
              });
              return;
            }
          } else {
            EventBus.fire("show-alert", {
              key: `handlers.newSegmentMustHaveEndpointInCommon`,
              keyOptions: {},
              type: "warning"
            });
            return;
          }
        } else if (
          this.seEdgeSegments.length === 2 &&
          this.triangleSelectionMode
        ) {
          // the user has selected at two segments, use only a segment that has an endpoint in common, is acceptable *and* close the triangle
          const flippedData = this.chainEndPointOnSegment(
            this.endSEPoint,
            this.hitSESegments[0]
          );
          if (flippedData[0]) {
            if (
              (flippedData[1] &&
                this.hitSESegments[0].startSEPoint.name !==
                  this.startSEPoint?.name) ||
              (!flippedData[1] &&
                this.hitSESegments[0].endSEPoint.name !==
                  this.startSEPoint?.name)
            ) {
              EventBus.fire("show-alert", {
                key: `handlers.newSegmentMustCloseTriangle`,
                keyOptions: {},
                type: "warning"
              });
              return;
            }
            if (
              this.acceptableAddition(
                this.seEdgeSegments,
                this.hitSESegments[0],
                flippedData[1],
                true
              )
            ) {
              // Add the selected segment and set chain closed to true
              this.seEdgeSegments.push(this.hitSESegments[0]);
              this.segmentIsFlipped.push(flippedData[1]);
              this.chainClosed = true;
            } else {
              EventBus.fire("show-alert", {
                key: `handlers.newSegmentIntersectsOrToClose`,
                keyOptions: {},
                type: "warning"
              });
              return;
            }
          } else {
            EventBus.fire("show-alert", {
              key: `handlers.newSegmentMustHaveEndpointInCommon`,
              keyOptions: {},
              type: "warning"
            });
            return;
          }
        } else {
          // the user has selected at least one segment, add a segment that has an endpoint in common and is acceptable. Check to see if the chain is closed
          const flippedData = this.chainEndPointOnSegment(
            this.endSEPoint,
            this.hitSESegments[0]
          );
          if (flippedData[0]) {
            const tempClosedChain = flippedData[1]
              ? this.hitSESegments[0].startSEPoint.name ===
                this.startSEPoint?.name
              : this.hitSESegments[0].endSEPoint.name ===
                this.startSEPoint?.name;
            if (
              this.acceptableAddition(
                this.seEdgeSegments,
                this.hitSESegments[0],
                flippedData[1],
                tempClosedChain
              )
            ) {
              // add the selected segment and record if it closes the chain
              this.seEdgeSegments.push(this.hitSESegments[0]);
              this.hitSESegments[0].selected = true;
              this.segmentIsFlipped.push(flippedData[1]);
              this.chainClosed = tempClosedChain;
              // update end SEPoint
              this.endSEPoint = flippedData[1]
                ? this.hitSESegments[0].startSEPoint
                : this.hitSESegments[0].endSEPoint;
            } else {
              EventBus.fire("show-alert", {
                key: `handlers.newSegmentIntersectsOrToClose`,
                keyOptions: {},
                type: "warning"
              });
              return;
            }
          } else {
            EventBus.fire("show-alert", {
              key: `handlers.newSegmentMustHaveEndpointInCommon`,
              keyOptions: {},
              type: "warning"
            });
            return;
          }
        }
      }
      // Check to see if we are ready to make the polygon
      if (this.chainClosed) {
        // makes sure that this polygon has not been measured before
        let measuredBefore = false;
        let token = "";
        SEStore.sePolygons.forEach(poly => {
          // if they have different lengths they are different
          if (poly.seEdgeSegments.length !== this.seEdgeSegments.length) {
            return;
          }
          // find the name of the first segment of the proposed polygon (this), in the existing one (poly)
          // we are searching cyclically
          const startIndex = poly.seEdgeSegments.findIndex(
            seg => seg.name === this.seEdgeSegments[0].name
          );
          // if the first segment wasn't found, then they are different
          if (startIndex !== -1) {
            // Search the rest of this.seSegment for the same segments in the same order (but only if not measureBefore is true -- don't overwrite measured before)
            if (measuredBefore === false) {
              measuredBefore = this.seEdgeSegments.every((seg, i) => {
                const cyclicNextIndex =
                  (((i + startIndex) % this.seEdgeSegments.length) +
                    this.seEdgeSegments.length) %
                  this.seEdgeSegments.length;
                if (
                  poly.seEdgeSegments[cyclicNextIndex].name ===
                  this.seEdgeSegments[i].name
                ) {
                  return true;
                } else {
                  return false;
                }
              });
              if (measuredBefore) {
                token = poly.name;
              }
            }
          }
        });

        if (measuredBefore) {
          EventBus.fire("show-alert", {
            key: `handlers.previouslyMeasuredPolygon`,
            keyOptions: { token: token },
            type: "error"
          });
          //clear the arrays and prepare for the next angle and remove temporary objects
          this.mouseLeave(event);
          return;
        }
        const polygonCommandGroup = new CommandGroup();

        // Create and add all the angle markers to the polygonCommandGroup
        const seAngleMarkerList = this.addAngleMarkers(polygonCommandGroup);

        // Create and add all the angle markers to the polygonCommandGroup
        this.addMeasuredSegments(polygonCommandGroup);

        const newPolygon = new Polygon(
          this.seEdgeSegments,
          this.segmentIsFlipped
        );
        // Set the display to the default values
        newPolygon.stylize(DisplayStyle.ApplyCurrentVariables);
        newPolygon.adjustSize();

        // Create the model object for the new polygon and link them
        const vtx = new SEPolygon(
          newPolygon,
          this.seEdgeSegments,
          this.segmentIsFlipped,
          seAngleMarkerList
        );

        // Create the plottable label
        const newLabel = new Label();
        const newSELabel = new SELabel(newLabel, vtx);

        if (this.startSEPoint) {
          // Set the initial label location
          this.tmpVector
            .copy(this.startSEPoint.locationVector)
            .add(
              new Vector3(
                2 * SETTINGS.polygon.initialLabelOffset,
                SETTINGS.polygon.initialLabelOffset,
                0
              )
            )
            .normalize();
          newSELabel.locationVector = this.tmpVector;
        }
        // Create and execute the command to create a new point for undo/redo
        polygonCommandGroup
          .addCommand(
            new AddPolygonCommand(
              vtx,
              this.seEdgeSegments,
              this.segmentIsFlipped,
              seAngleMarkerList,
              newSELabel
            )
          )
          .execute();
        // Update the display
        vtx.markKidsOutOfDate();
        vtx.update();

        // Update the display so the changes become apparent
        this.seEdgeSegments.forEach(seg => {
          seg.markKidsOutOfDate();
          seg.update();
        });

        EventBus.fire("show-alert", {
          key: `handlers.newPolygonAdded`,
          keyOptions: {},
          type: "success"
        });
        //clear the arrays and prepare for the next angle and remove temporary objects
        this.mouseLeave(event);
      }
    }
  }
  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    if (this.isOnSphere) {
      //Glow the appropriate object(s)
      if (this.hitSESegments.length > 0) {
        let possibleSegments: SESegment[] = [];
        if (this.seEdgeSegments.length == 0) {
          // the user has just begun to select segments
          this.hitSESegments[0].glowing = true;
        } else if (this.seEdgeSegments.length == 1) {
          // highlight only those segment that are acceptable and have an endpoint in common with this.seEdgeSegments[0]
          possibleSegments = this.hitSESegments.filter(seg => {
            if (
              this.seEdgeSegments[0].startSEPoint.name ===
                seg.startSEPoint.name ||
              this.seEdgeSegments[0].startSEPoint.name === seg.endSEPoint.name
            ) {
              // console.log("here1");
              return this.acceptableAddition(
                this.seEdgeSegments,
                seg,
                this.seEdgeSegments[0].startSEPoint.name ===
                  seg.endSEPoint.name,
                this.seEdgeSegments[0].endSEPoint.name === seg.startSEPoint.name // this could be a bi-gon, we have to check if the second edge closes the bi-gon
              );
            } else if (
              this.seEdgeSegments[0].endSEPoint.name ===
                seg.startSEPoint.name ||
              this.seEdgeSegments[0].endSEPoint.name === seg.endSEPoint.name
            ) {
              // console.log(
              //   "here2",
              //   this.seEdgeSegments[0].endSEPoint.name,
              //   seg.endSEPoint.name,
              //   this.seEdgeSegments[0].endSEPoint.name === seg.endSEPoint.name
              // );
              return this.acceptableAddition(
                this.seEdgeSegments,
                seg,
                this.seEdgeSegments[0].endSEPoint.name === seg.endSEPoint.name,
                this.seEdgeSegments[0].startSEPoint.name ===
                  seg.startSEPoint.name // this could be a bi-gon, we have to check if the second edge closes the bi-gon
              );
            } else {
              return false;
            }
          });
          if (possibleSegments.length > 0) {
            possibleSegments[0].glowing = true;
          }
        } else if (
          this.seEdgeSegments.length === 2 &&
          this.triangleSelectionMode
        ) {
          // the user has selected at two segments, highlight all segments that have an endpoint in common, are acceptable *and* close the triangle
          // Do I want to make this only high light the hit segments or all segments (i.e. change this.hitSESegments to SEStore.seSegments)
          possibleSegments = this.hitSESegments
            .filter(seg => this.chainEndPointOnSegment(this.endSEPoint, seg)[0])
            .filter(seg => {
              const flipped = this.chainEndPointOnSegment(
                this.endSEPoint,
                seg
              )[1];

              if (
                flipped &&
                seg.startSEPoint.name !== this.startSEPoint?.name
              ) {
                return false;
              } else if (
                !flipped &&
                seg.endSEPoint.name !== this.startSEPoint?.name
              ) {
                return false;
              }
              // console.log("here7");
              return this.acceptableAddition(
                this.seEdgeSegments,
                seg,
                flipped,
                true
              );
            });
          if (possibleSegments.length > 0) {
            possibleSegments[0].glowing = true;
          }
        } else {
          // the user has selected at least one segment, highlight all segments that have an endpoint in common and are acceptable
          // Do I want to make this only high light the hit segments or all segments (i.e. change this.hitSESegments to SEStore.seSegments)
          possibleSegments = this.hitSESegments
            .filter(seg => this.chainEndPointOnSegment(this.endSEPoint, seg)[0])
            .filter(seg => {
              //we already know that flippedData[0] is true because of the first filter
              const flippedData = this.chainEndPointOnSegment(
                this.endSEPoint,
                seg
              );

              return this.acceptableAddition(
                this.seEdgeSegments,
                seg,
                flippedData[1],
                flippedData[1]
                  ? seg.startSEPoint.name === this.startSEPoint?.name
                  : seg.endSEPoint.name === this.startSEPoint?.name
              );
            });
          if (possibleSegments.length > 0) {
            possibleSegments[0].glowing = true;
          }
        }
      }

      // Add or remove the appropriate temporary angle markers depending on the number of segments selected
      if (
        this.seEdgeSegments.length > 1 &&
        this.seEdgeSegments.length <
          SETTINGS.polygon.numberOfTemporaryAngleMarkers
      ) {
        this.seEdgeSegments.forEach((seg, ind) => {
          if (!this.temporaryAngleMarkersAdded[ind] && ind !== 0) {
            const previousSeg = this.seEdgeSegments[ind - 1];
            this.tmpVector.copy(
              this.segmentIsFlipped[ind - 1]
                ? previousSeg.endSEPoint.locationVector
                : previousSeg.startSEPoint.locationVector
            );
            this.tmpVector2.copy(
              this.segmentIsFlipped[ind]
                ? seg.startSEPoint.locationVector
                : seg.endSEPoint.locationVector
            );
            this.temporaryAngleMarkers[ind].setAngleMarkerFromThreeVectors(
              this.tmpVector.multiplyScalar(previousSeg.longerThanPi ? -1 : 1),
              this.segmentIsFlipped[ind]
                ? seg.endSEPoint.locationVector
                : seg.startSEPoint.locationVector,
              this.tmpVector2.multiplyScalar(seg.longerThanPi ? -1 : 1),
              AngleMarker.currentAngleMarkerRadius
            );
            this.temporaryAngleMarkersAdded[ind] = true;
            this.temporaryAngleMarkers[ind].addToLayers(this.layers);
            this.temporaryAngleMarkers[ind].updateDisplay();
          }
        });

        if (!this.temporaryAngleMarkersAdded[0]) {
          this.temporaryAngleMarkersAdded[0] = true;
          this.temporaryAngleMarkers[0].addToLayers(this.layers);
        }

        this.tmpVector3.copy(
          this.segmentIsFlipped[0]
            ? this.seEdgeSegments[0].startSEPoint.locationVector
            : this.seEdgeSegments[0].endSEPoint.locationVector
        );
        // update the zeroth temporary angle marker
        // if (this.seEdgeSegments[0].longerThanPi) {
        // this.temporaryAngleMarkers[0].setAngleMarkerFromThreeVectors(
        //   this.tmpVector3.multiplyScalar(
        //     this.seEdgeSegments[0].longerThanPi ? -1 : 1
        //   ),
        //   this.segmentIsFlipped[0]
        //     ? this.seEdgeSegments[0].endSEPoint.locationVector
        //     : this.seEdgeSegments[0].startSEPoint.locationVector,
        //   this.currentSphereVector,
        //   AngleMarker.currentAngleMarkerRadius
        // );
        // } else {
        this.temporaryAngleMarkers[0].setAngleMarkerFromThreeVectors(
          this.currentSphereVector,
          this.segmentIsFlipped[0]
            ? this.seEdgeSegments[0].endSEPoint.locationVector
            : this.seEdgeSegments[0].startSEPoint.locationVector,
          this.tmpVector3.multiplyScalar(
            this.seEdgeSegments[0].longerThanPi ? -1 : 1
          ),
          AngleMarker.currentAngleMarkerRadius
        );
        // }

        this.temporaryAngleMarkers[0].updateDisplay();
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseReleased(_event: MouseEvent): void {
    // No code ???
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // console.log("mouse leave");
    // call an unglow all command
    SEStore.unglowAllSENodules();
    this.infoText.hide();
    // unselect segments
    this.seEdgeSegments.forEach(l => (l.selected = false));
    this.seEdgeSegments.splice(0);
    this.segmentIsFlipped.splice(0);
    this.chainClosed = false;
    this.startSEPoint = null;
    this.endSEPoint = null;

    // remove all temporary angle markers
    this.temporaryAngleMarkers.forEach((am, ind) => {
      am.removeFromLayers();
      this.temporaryAngleMarkersAdded[ind] = false;
    });
  }

  activate(): void {
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
    // call an unglow all command
    SEStore.unglowAllSENodules();
    this.infoText.hide();
    // unselect segments
    this.seEdgeSegments.forEach(l => (l.selected = false));
    this.seEdgeSegments.splice(0);
    this.segmentIsFlipped.splice(0);
    this.chainClosed = false;
    this.startSEPoint = null;
    this.endSEPoint = null;
  }

  /**
   *  Determines if a potential new segment has an endpoint in common with the existing chain
   * @param endSEPointOFChain
   * @param potentialNewSegment
   * @returns [false] if the potential segment doesn't have an endpoint in common with the exist chain
   * @returns [true, false] if the potential segment has an endpoint in common with the exist chain and the potentialNew segment is *not* flipped
   * @returns [true, true] if the potential segment has an endpoint in common with the exist chain and the potentialNew segment *needs* to be flipped
   * */
  chainEndPointOnSegment(
    endSEPointOFChain: SEPoint | null,
    potentialNewSegment: SESegment
  ): boolean[] {
    if (endSEPointOFChain) {
      if (endSEPointOFChain.name === potentialNewSegment.startSEPoint.name) {
        return [true, false];
      }
      if (endSEPointOFChain.name === potentialNewSegment.endSEPoint.name) {
        return [true, true];
      }
    } else {
      return [true];
    }
    return [false];
  }

  /**
   * seEdgeSegments is already an acceptable chain, so we have to check only if
   *    1) potentialNewSegment's free endpoint is far enough away from existing seEdgeSegments
   *    2) potentialNewSegment doesn't intersect the existing seEdgeSegments
   *  segmentCloses indicates if the potential segment connects the initial/start point of the chain to the endpoint of the chain
   * @param seEdgeSegments
   * @param potentialNewSegment
   * @param potentialSegmentIsFlipped
   * @param segmentCloses
   * @returns
   */
  acceptableAddition(
    seEdgeSegments: SESegment[],
    potentialNewSegment: SESegment,
    potentialSegmentIsFlipped: boolean,
    segmentCloses: boolean
  ): boolean {
    // The potential new segment's free end must be far enough away from the existing chain
    let vertex: Vector3;
    if (potentialSegmentIsFlipped) {
      vertex = potentialNewSegment.startSEPoint.locationVector;
    } else {
      vertex = potentialNewSegment.endSEPoint.locationVector;
    }
    // if the segment closes then we know that both endpoints of the segment are on the curve so no need to check for too close
    if (!segmentCloses) {
      for (let j = 0; j < seEdgeSegments.length; j++) {
        if (
          seEdgeSegments[j].closestVector(vertex).angleTo(vertex) <
          SETTINGS.polygon.minimumVertexToEdgeThickness
        ) {
          // console.log(
          //   potentialNewSegment.name,
          //   "seg to close to",
          //   seEdgeSegments[j].name
          // );
          //the potential segment's free endpoint is too close to an edge segment
          return false;
        }
      }
    }

    // All segments must only intersect at endpoints
    // always exclude the last segment in the chain
    // if this segment is one that potentially closed the chain, don't check the first segment
    let startIndex = 0;
    if (segmentCloses) {
      startIndex = 1;
    }

    for (let j = startIndex; j < seEdgeSegments.length - 1; j++) {
      if (
        SEStore.findIntersectionPointsByParent(
          potentialNewSegment.name,
          seEdgeSegments[j].name
        ).some(pt => pt.exists)
      ) {
        // the potential new segment intersects the existing chain
        return false;
      }
    }
    // The potential new segment passes both tests
    return true;
  }

  addAngleMarkers(polygonCommandGroup: CommandGroup): SEAngleMarker[] {
    // create the SEAngleMarkers for the chain of segments
    const seAngleMarkers: SEAngleMarker[] = [];
    const n = this.seEdgeSegments.length;
    this.seEdgeSegments.forEach((seg1, index) => {
      //get the previous segment
      const seg0 = this.seEdgeSegments[(((index - 1) % n) + n) % n];

      // make sure that this pair of segments has not been measured already
      const oldAngleMarker = SEStore.expressions.find(exp => {
        if (
          exp instanceof SEAngleMarker &&
          exp.parents[0].name === seg0?.name && // order matters in angles angle from S1 to S2 is different than from S2 to S1
          exp.parents[1].name === seg1?.name
        ) {
          return true;
        } else {
          return false;
        }
      });
      if (oldAngleMarker !== undefined) {
        EventBus.fire("show-alert", {
          key: `handlers.duplicateSegmentAngleMeasurement`,
          keyOptions: {
            seg0Name: `${seg0?.name}`,
            seg1Name: `${seg1?.name}`,
            measurementName: `${oldAngleMarker.name}`
          },
          type: "warning"
        });
        // add the new SEAngleMarker to the list
        seAngleMarkers.push(oldAngleMarker as SEAngleMarker);
        return; //do not create a new angle marker
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
        seg0,
        seg1
      );

      // Create the plottable and model label
      const newLabel = new Label();
      const newSELabel = new SELabel(newLabel, newSEAngleMarker);

      // Update the display of the new angle marker (do it here so that the placement of the newLabel is correct)
      newSEAngleMarker.markKidsOutOfDate();
      newSEAngleMarker.update();

      // Set the initial label location near the common endpoint of the segments
      // and turn off the label of the vertex point (SETTINGS.angleMarker.turnOffVertexLabelOnCreation)
      if (seg0.startSEPoint === seg1.startSEPoint) {
        this.tmpVector.copy(seg0.startSEPoint.locationVector);
        if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
          seg0.startSEPoint.label!.showing = false;
        }
      } else if (seg0.startSEPoint === seg1.endSEPoint) {
        this.tmpVector.copy(seg0.startSEPoint.locationVector);
        if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
          seg0.startSEPoint.label!.showing = false;
        }
      } else if (seg0.endSEPoint === seg1.startSEPoint) {
        this.tmpVector.copy(seg1.startSEPoint.locationVector);
        if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
          seg1.startSEPoint.label!.showing = false;
        }
      } else if (seg0.endSEPoint === seg1.endSEPoint) {
        this.tmpVector.copy(seg1.endSEPoint.locationVector);
        if (SETTINGS.angleMarker.turnOffVertexLabelOnCreation) {
          seg1.endSEPoint.label!.showing = false;
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

      polygonCommandGroup.addCommand(
        new AddAngleMarkerCommand(
          AngleMode.SEGMENTS,
          newSEAngleMarker,
          newSELabel,
          seg0,
          seg1
        )
      );

      // add the new SEAngleMarker to the list
      seAngleMarkers.push(newSEAngleMarker);

      // Update the display of the new angle marker
      newSEAngleMarker.markKidsOutOfDate();
      newSEAngleMarker.update();
    });
    return seAngleMarkers;
  }
  addMeasuredSegments(polygonCommandGroup: CommandGroup): void {
    this.seEdgeSegments.forEach(seg => {
      // make sure that this pair of segments has not been measured already
      const oldSegmentLength = SEStore.expressions.find(exp => {
        if (exp instanceof SESegmentLength && exp.seSegment.name === seg.name) {
          return true;
        } else {
          return false;
        }
      });
      if (oldSegmentLength !== undefined) {
        EventBus.fire("show-alert", {
          key: `handlers.duplicateSegmentMeasurement`,
          keyOptions: {
            segName: `${seg.name}`,
            measurementName: `${oldSegmentLength.name}`
          },
          type: "warning"
        });

        return; //do not create a new segment length measure
      }

      const lenMeasure = new SESegmentLength(seg);

      polygonCommandGroup.addCommand(
        new AddLengthMeasurementCommand(lenMeasure, seg)
      );
      // Set the selected segment's Label to display and to show NameAndValue in an undoable way
      if (seg.label !== undefined) {
        polygonCommandGroup.addCommand(
          new StyleNoduleCommand(
            [seg.label.ref],
            StyleEditPanels.Label,
            [
              {
                // panel: StyleEditPanels.Front,
                // labelVisibility: true,
                labelDisplayMode: SETTINGS.segment.measuringChangesLabelModeTo
              }
            ],
            [
              {
                // panel: StyleEditPanels.Front,
                // labelVisibility: seg.label!.showing,
                labelDisplayMode: seg.label.ref.labelDisplayMode
              }
            ]
          )
        );
        polygonCommandGroup.addCommand(
          new SetNoduleDisplayCommand(seg.label, true)
        );
      }
    });
  }
}
