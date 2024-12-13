/** @format */

import { Vector3 } from "three";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_POLYGON_FRONT_STYLE,
  DEFAULT_POLYGON_BACK_STYLE
} from "@/types/Styles";
import { location, toSVGType, visitedIndex } from "@/types";
import { SESegment } from "@/models/SESegment";
//import Two from "two.js";
import { Path } from "two.js/src/path";
import { Anchor } from "two.js/src/anchor";
import { Stop } from "two.js/src/effects/stop";
import { RadialGradient } from "two.js/src/effects/radial-gradient";
import { Group } from "two.js/src/group";

const BOUNDARYSUBDIVISIONS = SETTINGS.polygon.numPoints; // The number of points used to draw parts of the boundary circle when the polygon crosses it.

export default class Polygon extends Nodule {
  /**
   * The Segments that are the boundary of this polygon are stored in edgeSegments
   * These are listed so that tracing out the segment boundary in order
   *
   *  edgeSegments[0] to edgeSegments[1] to ... to edgeSegments[length-1] to edgeSegments[0]
   *
   * is positive (where positive means that the interior of the polygon is on the right when traced this way).
   *
   * The segmentIsFlipped are chosen so that
   * if segmentIsFlipped[i]===true
   * then
   * _edgeSegments[i].endSEPoint to edgeSegments[i].startSEPoint is the positive direction in edge edgeSegments[i]
   * else
   *  edgeSegments[i].startSEPoint to edgeSegments[i].endSEPoint is the positive direction in edge edgeSegments[i]
   *
   */
  // private edgeSegments: Segment[] = [];
  private segmentIsFlipped: boolean[] = [];
  private seEdgeSegments: SESegment[] = [];

  /**
   * The area of the polygon. This must be updated before the updateDisplay can be called
   */
  private _area = 0;
  /**
   * The TwoJS objects to display the front/back fill parts.
   */
  private frontFills: Path[] = []; // filled in the constructor
  private backFills: Path[] = []; // filled in the constructor

  private pool: Anchor[] = []; //The pool of vertices, initially empty

  private allEdgesOnFront = true;
  private allEdgesOnBack = false;

  //Export to SVG booleans
  // private frontFillIsWholeHemisphere = false;
  // private backFillIsWholeHemisphere = false;
  private frontFillInUse = false;
  private backFillInUse = false;

  /**
   * The stops and gradient for front/back fill
   */
  private frontGradientColorCenter = new Stop(
    0,
    SETTINGS.style.fill.frontWhite,
    1
  );
  private frontGradientColor = new Stop(
    SETTINGS.style.fill.gradientPercent,
    SETTINGS.polygon.drawn.fillColor.front,
    1
  );

  private frontGradient = new RadialGradient(
    SETTINGS.style.fill.center.x,
    SETTINGS.style.fill.center.y,
    SETTINGS.boundaryCircle.radius,
    [this.frontGradientColorCenter, this.frontGradientColor],
    SETTINGS.style.fill.lightSource.x,
    SETTINGS.style.fill.lightSource.y
  );

  private backGradientColorCenter = new Stop(
    0,
    SETTINGS.style.fill.backGray,
    1
  );
  private backGradientColor = new Stop(
    SETTINGS.style.fill.gradientPercent,
    SETTINGS.polygon.drawn.fillColor.back,
    1
  );
  private backGradient = new RadialGradient(
    -SETTINGS.style.fill.center.x,
    -SETTINGS.style.fill.center.y,
    SETTINGS.boundaryCircle.radius,
    [this.backGradientColorCenter, this.backGradientColor],
    -SETTINGS.style.fill.lightSource.x,
    -SETTINGS.style.fill.lightSource.y
  );

  /**
   * For temporary calculation with ThreeJS objects
   */
  private tmpVector = new Vector3();

  constructor(
    noduleName: string,
    segmentList: SESegment[],
    segmentFlippedList: boolean[]
  ) {
    super(noduleName);

    this.frontGradient.units = "userSpaceOnUse"; // this means that the gradient uses the coordinates of the layer (but centered on the projection of the circle)
    this.backGradient.units = "userSpaceOnUse";

    this.seEdgeSegments.push(...segmentList);
    this.segmentIsFlipped.push(...segmentFlippedList);

    // There are this.edgeSegment.length number of straight lines in the polygon
    //
    // At most two of these edges can intersect the boundary circle twice while
    // not intersecting each other
    // Proof: Suppose there are three non-intersecting segments that each intersects the
    // boundary circle twice. If a
    // segment crosses twice, its endpoints are on the same side of the sphere *and* the
    // opposite side to the endpoints is divided into two disconnected regions --
    // quarter spheres -- by the part of the segment of length pi on that side.
    // Therefore if two
    // different non-intersecting segments that intersect the boundary twice
    // have their endpoints on the same side, the two intersection points of the lines that
    // contain the segments are on opposite sides of the sphere. The intersection point
    // on the opposite side of the endpoints *must* be contained in the
    // the segment (because the length on that side is pi). Therefore the two segments
    // intersect. This means that the endpoints of two of the segments must be
    // on opposite sides of the sphere. The third's endpoints must be on one
    // side or the other, which means the third must intersect one of the first
    // two. Contradiction.
    //
    // The segments in each polygon edge consist of two (or three for at most two of them)
    // parts (front/back/extra). Each front/back/extra part consists of
    // SETTINGS.segment.numPoints. So the non-boundary parts of the fills have
    //
    // (this.edgeSegment.length-2)*2*SETTINGS.segment.numPoints +2*3*SETTINGS.segment.numPoints
    //
    // vertices. Assuming that all edges intersect the boundary, the edges intersect
    // the boundary circle at most
    //
    // this.edgeSegment.length +2
    //
    // times. If the region between each intersection point is assumed to be
    // an edge of fill, there are
    //
    // ceiling(this.edgeSegment.length+2)/2)
    //
    // regions on one side (because as we trace the boundary circle intersection
    // with the polygon, we alternate inside and outside of the polygon).
    //
    // This means that there are at most ceiling(this.edgeSegment.length+2)/2) of
    // EITHER front and back fill parts
    //
    // To render the parts of the fills that are on the boundary circle we
    // break the total number, BOUNDARYSUBDIVISIONS, into numbers that are proportional
    // to the angular width. Note: this is for only one side, double for both sides
    //
    // Summary:
    //  In total there are
    //
    // (this.edgeSegment.length-2)*2*SETTINGS.segment.numPoints
    //      +2*3*SETTINGS.segment.numPoints
    //      + 2*BOUNDARYSUBDIVISIONS
    //
    //  vertices and
    //
    // ceiling(this.edgeSegment.length+2)/2)
    //
    // front and back fill parts

    const frontVerticesFill: Anchor[] = [];
    for (
      let k = 0;
      k <
      (this.seEdgeSegments.length - 2) * 3 * SETTINGS.segment.numPoints +
        2 * 3 * SETTINGS.segment.numPoints +
        2 * BOUNDARYSUBDIVISIONS;
      k++
    ) {
      frontVerticesFill.push(new Anchor(0, 0));
    }
    this.frontFills[0] = new Path(
      frontVerticesFill,
      /* closed */ true,
      /* curve */ false
      // /*manual*/ true
    );

    this.backFills[0] = new Path(
      [] /* The empty array of anchors doesn't matter because all anchors are put into a pool*/,
      /* closed */ true,
      /* curve */ false
      // /*manual*/ true
    );

    // now create, record ids, and set noStroke (and stripped of their anchors so that the number of anchors is correct) the other parts that may be needed
    for (let i = 0; i < Math.ceil((this.seEdgeSegments.length + 2) / 2); i++) {
      if (i > 0) {
        this.frontFills[i] = new Path(
          [],
          /* closed */ true,
          /* curve */ false
          ///*manual*/ true
        );
        this.backFills[i] = new Path(
          [],
          /* closed */ true,
          /* curve */ false
          ///*manual*/ true
        );
      }
      // i=0 fills were created before this loop

      // The front/back fill have no stroke because that is handled by the front/back part
      this.frontFills[i].noStroke();
      this.backFills[i].noStroke();

      //Turn off the glowing display initially but leave it on so that the temporary objects show up
      this.frontFills[i].visible = true;
      this.backFills[i].visible = true;
    }
    //set the fill gradient color correctly (especially the opacity which is set separately than the color -- not set by the opacity of the fillColor)
    this.frontGradientColor.color = SETTINGS.polygon.drawn.fillColor.front;
    this.backGradientColor.color = SETTINGS.polygon.dynamicBackStyle
      ? Nodule.contrastFillColor(SETTINGS.polygon.drawn.fillColor.front)
      : SETTINGS.polygon.drawn.fillColor.back;
    this.styleOptions.set(StyleCategory.Front, DEFAULT_POLYGON_FRONT_STYLE);
    this.styleOptions.set(StyleCategory.Back, DEFAULT_POLYGON_BACK_STYLE);
  }

  /**
   * Use the existing and already updated segments to trace each part of the fill
   */
  public updateDisplay(): void {
    //Build the front/back fill objects based on the segments on the edge
    // Bring all the anchor points to a common pool
    // Each front/back fill will pull anchor points from this pool as needed
    this.frontFills.forEach(fill => this.pool.push(...fill.vertices.splice(0)));
    this.backFills.forEach(fill => this.pool.push(...fill.vertices.splice(0)));
    // console.log("pool size", this.pool.length);
    // Bring all the locations of the vertices in the correct order in one array
    const locationArray: location[] = [];

    this.seEdgeSegments
      .map(z => z.ref)
      .forEach((seg, index) => {
        // console.log("########################");
        // console.log("seg flipped", index, this.segmentIsFlipped[index]);
        // console.log("first vertex on front", seg.firstVertexIsOnFront);
        // console.log("last vertex on front", seg.lastVertexIsOnFront);
        // console.log("front length", seg.frontPartInUse);
        // console.log("back length", seg.backPartInUse);
        // console.log("front extra length", seg.frontExtraInUse);
        // console.log("back extra length", seg.backExtraInUse);
        // get the local transformation matrix of the segment (should be the same for all parts front/back part/extra)
        var localMatrix = seg.frontPart.matrix; //local matrix works for just the position, rotation, and scale of that object in its local frame
        // Add the vertices in the segment in the orientation of the segment and flip it later if necessary
        let numVerticesAdded = 0;
        if (seg.firstVertexIsOnFront) {
          // This seg starts with frontPart, then backPart, then frontExtra (the last two might not be in use)
          if (seg.frontPartInUse && Nodule.longEnoughToAdd(seg.frontPart)) {
            for (let i = 0; i < seg.frontPart.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.frontPart.vertices[i].x,
                seg.frontPart.vertices[i].y,
                1
              );
              // console.log(index, "coords", coords, "FP");
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: true
              });
              numVerticesAdded++;
            }
          }
          if (seg.backPartInUse && Nodule.longEnoughToAdd(seg.backPart)) {
            for (let i = 0; i < seg.backPart.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.backPart.vertices[i].x,
                seg.backPart.vertices[i].y,
                1
              );
              // console.log(index, "coords", coords, "BP");
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: false
              });
              numVerticesAdded++;
            }
          }
          if (seg.frontExtraInUse && Nodule.longEnoughToAdd(seg.frontExtra)) {
            for (let i = 0; i < seg.frontExtra.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.frontExtra.vertices[i].x,
                seg.frontExtra.vertices[i].y,
                1
              );
              // console.log(index, "coords", coords, "FE");
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: true
              });
              numVerticesAdded++;
            }
          }

          if (this.segmentIsFlipped[index]) {
            // console.log("Reverse!");
            // reverse the last numVerticesAdded in the locationArray
            const tempArray = locationArray.splice(
              locationArray.length - numVerticesAdded,
              numVerticesAdded
            );
            locationArray.push(...tempArray.reverse());
          }
        } else {
          // This seg starts with backPart, then frontPart, then backExtra (the last two might not be in use)
          if (seg.backPartInUse && Nodule.longEnoughToAdd(seg.backPart)) {
            for (let i = 0; i < seg.backPart.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.backPart.vertices[i].x,
                seg.backPart.vertices[i].y,
                1
              );
              // console.log(index, "coords", coords, "BP");
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: false
              });
              numVerticesAdded++;
            }
          }
          if (seg.frontPartInUse && Nodule.longEnoughToAdd(seg.frontPart)) {
            for (let i = 0; i < seg.frontPart.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.frontPart.vertices[i].x,
                seg.frontPart.vertices[i].y,
                1
              );
              // console.log(index, "coords", coords, "FP");
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: true
              });
              numVerticesAdded++;
            }
          }
          if (seg.backExtraInUse && Nodule.longEnoughToAdd(seg.backExtra)) {
            for (let i = 0; i < seg.backExtra.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.backExtra.vertices[i].x,
                seg.backExtra.vertices[i].y,
                1
              );
              // console.log(index, "coords", coords, "BE");
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: false
              });
              numVerticesAdded++;
            }
          }

          if (this.segmentIsFlipped[index]) {
            // console.log("Reverse!");
            // reverse the last numVerticesAdded in the locationArray
            const tempArray = locationArray.splice(
              locationArray.length - numVerticesAdded,
              numVerticesAdded
            );
            locationArray.push(...tempArray.reverse());
          }
        }
      });

    // console.log("number in location Array", locationArray.length);
    this.allEdgesOnFront = locationArray.every(loc => loc.front === true);
    this.allEdgesOnBack = locationArray.every(loc => loc.front === false);
    // console.log("#############DUM############")
    // locationArray.forEach((loc,ind) => {console.log("@vec ", ind, "\n", loc.x, "\n", loc.y, "\n", loc.front)})
    // The polygon interior is split between front and back
    if (!this.allEdgesOnFront && !this.allEdgesOnBack) {
      // this.frontFillIsWholeHemisphere = false;
      // this.backFillIsWholeHemisphere = false;
      this.frontFillInUse = true;
      this.backFillInUse = true;

      // Count and record the indices of intersections with the boundary circle
      const frontToBackIntersectionIndices: visitedIndex[] = []; // i is on this list if location[i-1] is on front and location[i] is on back
      const backToFrontIntersectionIndices: visitedIndex[] = []; // i is on this list if location[i-1] is on back and location[i] is on front
      let n = locationArray.length;
      locationArray.forEach((loc, ind) => {
        const previousIndex = (((ind - 1) % n) + n) % n;
        if (loc.front && !locationArray[previousIndex].front) {
          backToFrontIntersectionIndices.push({ index: ind, visited: false });
        } else if (!loc.front && locationArray[previousIndex].front) {
          frontToBackIntersectionIndices.push({ index: ind, visited: false });
        }
      });

      // for each intersection index compute the angle from the x axis so that at a crossing we can find the next crossing
      const frontToBackIntersectionAngles: number[] = [];
      frontToBackIntersectionIndices.forEach(visnum =>
        frontToBackIntersectionAngles.push(
          Math.atan2(
            locationArray[visnum.index].y,
            locationArray[visnum.index].x
          )
        )
      );
      const backToFrontIntersectionAngles: number[] = [];
      backToFrontIntersectionIndices.forEach(visnum =>
        backToFrontIntersectionAngles.push(
          Math.atan2(
            locationArray[visnum.index].y,
            locationArray[visnum.index].x
          )
        )
      );

      // console.log(
      //   "num of front to back",
      //   frontToBackIntersectionIndices.length
      // );
      // frontToBackIntersectionAngles.forEach(ang => console.log(ang));
      // console.log(
      //   "num of back to front",
      //   backToFrontIntersectionIndices.length
      // );
      // backToFrontIntersectionAngles.forEach(ang => console.log(ang));
      // console.log(
      //   "angle diff",
      //   -frontToBackIntersectionAngles[0] + backToFrontIntersectionAngles[0]
      // );

      // Keep track of the front fill index
      let currentFrontFillIndex = -1;

      // now trace all the front fills
      while (
        backToFrontIntersectionIndices.some(visnum => visnum.visited === false)
      ) {
        currentFrontFillIndex += 1;
        // console.log("################## Front fill new");
        if (currentFrontFillIndex === this.frontFills.length) {
          throw new Error(
            "Polygon: Not enough front fill parts allocated in the constructor"
          );
        }
        // first draw an edge in the fill from the first non-visited intersection
        let backToFrontIndex = backToFrontIntersectionIndices.findIndex(
          visnum => visnum.visited === false
        );

        // trace a fill face
        while (
          backToFrontIntersectionIndices[backToFrontIndex].visited === false // if we haven't passed through this back to front intersection we haven't finish a front fill face
        ) {
          // mark this intersection visited
          backToFrontIntersectionIndices[backToFrontIndex].visited = true;

          let i = backToFrontIntersectionIndices[backToFrontIndex].index;

          // have we completed tracing an edge of the face?
          while (locationArray[i].front === true) {
            //if (currentFrontFillIndex == 0) {
            // console.log(
            //   "#### Fill Face: E",
            //   currentFrontFillIndex,
            //   i,
            //   "size",
            //   locationArray[i].x ** 2 + locationArray[i].y ** 2,
            //   "\nang",
            //   Math.atan2(locationArray[i].y, locationArray[i].x)
            // );
            //}
            const vertex = this.pool.pop();
            if (vertex !== undefined) {
              vertex.x = locationArray[i].x;
              vertex.y = locationArray[i].y;
              this.frontFills[currentFrontFillIndex].vertices.push(vertex);
            } else {
              throw new Error(
                "Polygon: not enough anchors in the pool to trace a front edge."
              );
            }
            i = (((i + 1) % n) + n) % n;
          }
          // compute the angle at which the edge we were tracing left the front face (at this point location[i].front = false, i.e. location[i] is on the back)
          const previousIndex = (((i - 1) % n) + n) % n;
          const startAngle = Math.atan2(
            locationArray[previousIndex].y,
            locationArray[previousIndex].x
          );
          // now trace the boundary circle to find the nearest back to front index search CCW from startAngle among the angles to find the index to continue with
          let nextSmallestAngle = startAngle - 2 * Math.PI; // *after* looping this will be the value of the angle that is smaller than start angle and bigger than all others on the back to front intersection angles. It needs to start smaller than all angles, so subtract 2 pi
          let nextSmallestAngleIndex = -1; // the index of the nextSmallestAngle.
          let biggestAngle = -2 * Math.PI; // this is needed to start smaller than all angles
          let biggestAngleIndex = -1;
          backToFrontIntersectionAngles.forEach((ang, ind) => {
            if (startAngle > ang && ang > nextSmallestAngle) {
              nextSmallestAngle = ang;
              nextSmallestAngleIndex = ind;
            }
            if (ang > biggestAngle) {
              biggestAngle = ang;
              biggestAngleIndex = ind;
            }
          });
          //If nextSmallestAngleIndex remains at -1, then startAngle was smaller than all angles and, cyclically, the next smallest is the biggest angle
          if (nextSmallestAngleIndex === -1) {
            nextSmallestAngleIndex = biggestAngleIndex;
          }
          // console.log(
          //   "front start ang, index, location",
          //   startAngle,
          //   previousIndex,
          //   locationArray[previousIndex]
          // );
          // console.log(
          //   "next smallest ang",
          //   backToFrontIntersectionAngles[nextSmallestAngleIndex]
          // );

          const nextIndex =
            backToFrontIntersectionIndices[nextSmallestAngleIndex].index;

          const endAngle = Math.atan2(
            locationArray[nextIndex].y,
            locationArray[nextIndex].x
          );
          // console.log(
          //   "front end angle, index, location",
          //   endAngle,
          //   nextIndex,
          //   locationArray[nextIndex]
          // );

          // Compute the angular width of the section of the boundary polygon to add to the front/back fill
          // This can be positive if traced counterclockwise or negative if traced clockwise (add 2 Pi to make positive)
          let angularWidth = startAngle - endAngle;
          if (angularWidth < 0) {
            angularWidth += 2 * Math.PI;
          }
          // console.log("front ang Width", angularWidth, locationArray);
          // if the locations on the edge are too close together skip adding a boundary component
          if (
            (locationArray[nextIndex].x - locationArray[previousIndex].x) ** 2 +
              (locationArray[nextIndex].y - locationArray[previousIndex].y) **
                2 >
            0.0001
          ) {
            // When tracing the boundary polygon we start from fromVector locationArray[previousIndex] (which is on the front)
            const size = Math.sqrt(
              locationArray[previousIndex].x * locationArray[previousIndex].x +
                locationArray[previousIndex].y * locationArray[previousIndex].y
            );
            const fromVector = [
              (locationArray[previousIndex].x *
                SETTINGS.boundaryCircle.radius) /
                size,
              (locationArray[previousIndex].y *
                SETTINGS.boundaryCircle.radius) /
                size
            ];

            // then
            // trace in the direction of a toVector that is perpendicular to locationArray[previousIndex]
            // and is the next one CW from  locationArray[previousIndex]
            const toVector = [fromVector[1], -fromVector[0]];

            // add the boundary vertices from start to end in the direction of toVector
            const boundaryPoints = Nodule.boundaryCircleCoordinates(
              fromVector,
              Math.floor((angularWidth * BOUNDARYSUBDIVISIONS) / (2 * Math.PI)),
              toVector,
              angularWidth
            );

            boundaryPoints.forEach(pt => {
              const vertex = this.pool.pop();
              if (vertex !== undefined) {
                vertex.x = pt[0];
                vertex.y = pt[1];
                this.frontFills[currentFrontFillIndex].vertices.push(vertex);
              } else {
                throw new Error(
                  "Polygon: not enough anchors in the pool to trace a front boundary circle edge."
                );
              }
            });
          } else {
            // console.log("#########Front Piece Skipped");
          }
          // go to the start of the while loop with the next index at the start of a backToFrontIntersection
          backToFrontIndex = nextSmallestAngleIndex;
        }
      }

      // var count = 0
      // console.log("##########DUMP#################");
      // this.frontFills.forEach((part, ind) => {
      //   part.vertices.forEach((vert: any,ind:number) => {
      //     console.log("@", count+ind, "\n", vert.x, "\n", vert.y, "\n", "true")
      //   });
      //   count += part.vertices.length
      //   // }
      // });
      // this.backFills.forEach(part => {
      //   part.vertices.forEach((vert: any,ind:number) => {
      //     console.log("@",ind+ count," \n", vert.x, "\n", vert.y, "\n", "false")
      //   });
      //   count += part.vertices.length
      // });

      // Keep track of the back fill index
      let currentBackFillIndex = -1;

      // now trace all the back fills
      while (
        frontToBackIntersectionIndices.some(visnum => visnum.visited === false) // if we haven't passed through this front to back intersection we haven't finish a back fill face
      ) {
        currentBackFillIndex += 1;
        if (currentBackFillIndex === this.backFills.length) {
          throw new Error(
            "Polygon: Not enough back fill parts allocated in the constructor"
          );
        }
        // first draw an edge in the fill from the first non-visited intersection
        let frontToBackIndex = frontToBackIntersectionIndices.findIndex(
          visnum => visnum.visited === false
        );

        // trace a fill face
        while (
          frontToBackIntersectionIndices[frontToBackIndex].visited === false
        ) {
          // mark this intersection visited
          frontToBackIntersectionIndices[frontToBackIndex].visited = true;

          let i = frontToBackIntersectionIndices[frontToBackIndex].index;

          // have we completed tracing an edge of the face?
          while (locationArray[i].front === false) {
            const vertex = this.pool.pop();
            if (vertex !== undefined) {
              vertex.x = locationArray[i].x;
              vertex.y = locationArray[i].y;
              this.backFills[currentBackFillIndex].vertices.push(vertex);
            } else {
              throw new Error(
                "Polygon: not enough anchors in the pool to trace a front edge."
              );
            }
            i = (((i + 1) % n) + n) % n;
          }

          // compute the angle at which the edge we were tracing left the back face (at this point location[i].front = true, i.e. location[i] is on the front)
          const previousIndex = (((i - 1) % n) + n) % n;
          const startAngle = Math.atan2(
            locationArray[previousIndex].y,
            locationArray[previousIndex].x
          );

          // now trace the boundary circle to find the nearest back to front index search CW from startAngle among the angles to find the index to continue with
          let nextBiggestAngle = startAngle + 2 * Math.PI; // this will be the value of the angle that is bigger than start angle and less than all others. It needs to start bigger than all angles, so add 2 pi
          let nextBiggestAngleIndex = -1; // the index of the nextBiggestAngle.
          let smallestAngle = 2 * Math.PI; // this need to start bigger than all angles
          let smallestAngleIndex = -1;
          frontToBackIntersectionAngles.forEach((ang, ind) => {
            if (startAngle < ang && ang < nextBiggestAngle) {
              nextBiggestAngle = ang;
              nextBiggestAngleIndex = ind;
            }
            if (ang < smallestAngle) {
              smallestAngle = ang;
              smallestAngleIndex = ind;
            }
          });
          //If nextBiggestAngleIndex remains at -1, then startAngle was bigger than all angles and, cyclically, the next biggest is the smallest angle
          if (nextBiggestAngleIndex === -1) {
            nextBiggestAngleIndex = smallestAngleIndex;
          }
          // console.log("start ang", startAngle);
          // console.log(
          //   "next biggest ang",
          //   frontToBackIntersectionAngles[nextBiggestAngleIndex]
          // );
          const nextIndex =
            frontToBackIntersectionIndices[nextBiggestAngleIndex].index;

          const endAngle = Math.atan2(
            locationArray[nextIndex].y,
            locationArray[nextIndex].x
          );
          // Compute the angular width of the section of the boundary polygon to add to the front/back fill
          // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
          let angularWidth = startAngle - endAngle;
          if (angularWidth < 0) {
            angularWidth += 2 * Math.PI;
          }
          angularWidth = 2 * Math.PI - angularWidth;
          // console.log("back ang Width", angularWidth);

          // if the locations on the edge are too close together skip adding a boundary component
          if (
            (locationArray[nextIndex].x - locationArray[previousIndex].x) ** 2 +
              (locationArray[nextIndex].y - locationArray[previousIndex].y) **
                2 >
            0.0001
          ) {
            // When tracing the boundary polygon we start from fromVector locationArray[previousIndex] (which is on the front)
            const size = Math.sqrt(
              locationArray[previousIndex].x * locationArray[previousIndex].x +
                locationArray[previousIndex].y * locationArray[previousIndex].y
            );
            const fromVector = [
              (locationArray[previousIndex].x *
                SETTINGS.boundaryCircle.radius) /
                size,
              (locationArray[previousIndex].y *
                SETTINGS.boundaryCircle.radius) /
                size
            ];

            // then
            // trace in the direction of a toVector that is perpendicular to locationArray[previousIndex]
            // and is the next one CCW from  locationArray[previousIndex]
            const toVector = [-fromVector[1], fromVector[0]];

            // add the boundary vertices from start to end in the direction of toVector
            const boundaryPoints = Nodule.boundaryCircleCoordinates(
              fromVector,
              Math.floor((angularWidth * BOUNDARYSUBDIVISIONS) / (2 * Math.PI)),
              toVector,
              angularWidth
            );

            boundaryPoints.forEach(pt => {
              const vertex = this.pool.pop();
              if (vertex !== undefined) {
                vertex.x = pt[0];
                vertex.y = pt[1];
                this.backFills[currentBackFillIndex].vertices.push(vertex);
              } else {
                throw new Error(
                  "Polygon: not enough anchors in the pool to trace a front boundary circle edge."
                );
              }
            });
          }
          // go to the start of the while loop with the next index at the start of a frontToBackIntersection
          frontToBackIndex = nextBiggestAngleIndex;
        }
      }
      // var count = 0
      // console.log("##########DUMP#################");
      // this.frontFills.forEach((part, ind) => {
      //   part.vertices.forEach((vert: any,ind:number) => {
      //     console.log("@", count+ind, "\n", vert.x, "\n", vert.y, "\n", "true")
      //   });
      //   count += part.vertices.length
      //   // }
      // });
      // this.backFills.forEach(part => {
      //   part.vertices.forEach((vert: any,ind:number) => {
      //     console.log("@",ind+ count," \n", vert.x, "\n", vert.y, "\n", "false")
      //   });
      //   count += part.vertices.length
      // });
    }
    // The polygon interior is only on the front of the sphere
    else if (this.allEdgesOnFront && this._area < 2 * Math.PI) {
      // this.frontFillIsWholeHemisphere = false;
      // this.backFillIsWholeHemisphere = false;
      this.frontFillInUse = true;
      this.backFillInUse = false;
      locationArray.forEach(loc => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = loc.x;
          vertex.y = loc.y;
          this.frontFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Polygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
    }
    // The polygon interior is only on the back of the sphere
    else if (this.allEdgesOnBack && this._area < 2 * Math.PI) {
      // this.frontFillIsWholeHemisphere = false;
      // this.backFillIsWholeHemisphere = false;
      this.frontFillInUse = false;
      this.backFillInUse = true;

      locationArray.forEach(loc => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = loc.x;
          vertex.y = loc.y;
          this.backFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Polygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
    }
    // The polygon interior covers the entire front half of the sphere and is a 'hole' on the back
    else if (this.allEdgesOnBack && this._area > 2 * Math.PI) {
      // this.frontFillIsWholeHemisphere = true;
      // this.backFillIsWholeHemisphere = false;
      this.frontFillInUse = true;
      this.backFillInUse = true;
      // location[0] is a point *not* necessarily on the boundary circle, we project to the boundary circle so that when
      // tracing the boundary we start close to this point
      const size = Math.sqrt(
        locationArray[0].x * locationArray[0].x +
          locationArray[0].y * locationArray[0].y
      );
      const startPoint = [
        (locationArray[0].x * SETTINGS.boundaryCircle.radius) / size,
        (locationArray[0].y * SETTINGS.boundaryCircle.radius) / size
      ];
      const boundary = Nodule.boundaryCircleCoordinates(
        startPoint,
        BOUNDARYSUBDIVISIONS,
        [-startPoint[1], startPoint[0]],
        2 * Math.PI
      );
      // In this case set the frontFillVertices to the entire boundary circle which are boundary,
      boundary.forEach(v => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = v[0];
          vertex.y = v[1];
          this.frontFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Polygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
      // In this case the backFillVertices must trace out first the boundary circle  and then the polygon
      boundary.reverse().forEach(v => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = v[0];
          vertex.y = v[1];
          this.backFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Polygon: Not enough vertices from the fills in the pool!"
          );
        }
      });

      // Make sure that the next entry in the backFill is the first to closed up the annular region
      const vert1 = this.pool.pop();
      if (vert1 !== undefined) {
        vert1.x = this.backFills[0].vertices[0].x;
        vert1.y = this.backFills[0].vertices[0].y;
        this.backFills[0].vertices.push(vert1);
      }
      // now add the location vertices
      locationArray.forEach(v => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = v.x;
          vertex.y = v.y;
          this.backFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Polygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
      // Make sure that the next entry in the backFill is the first to closed up the annular region
      const vert2 = this.pool.pop();
      if (vert2 !== undefined) {
        vert2.x = this.backFills[0].vertices.slice(-1)[0].x;
        vert2.y = this.backFills[0].vertices.slice(-1)[0].y;
        this.backFills[0].vertices.push(vert2);
      }
    }
    // // The polygon interior covers the entire back half of the sphere and is a 'hole' on the front
    else if (this.allEdgesOnFront && this._area > 2 * Math.PI) {
      // this.frontFillIsWholeHemisphere = false;
      // this.backFillIsWholeHemisphere = true;
      this.frontFillInUse = true;
      this.backFillInUse = true;
      // location[0] is a point *not* on the boundary circle, we project to the boundary circle so that when
      // tracing the boundary we start close to this point
      const size = Math.sqrt(
        locationArray[0].x * locationArray[0].x +
          locationArray[0].y * locationArray[0].y
      );
      const startPoint = [
        (locationArray[0].x * SETTINGS.boundaryCircle.radius) / size,
        (locationArray[0].y * SETTINGS.boundaryCircle.radius) / size
      ];
      const boundary = Nodule.boundaryCircleCoordinates(
        startPoint,
        BOUNDARYSUBDIVISIONS,
        [-startPoint[1], startPoint[0]],
        2 * Math.PI
      );
      // In this case set the backFillVertices to the entire boundary circle which are boundary,
      boundary.forEach(v => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = v[0];
          vertex.y = v[1];
          this.backFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Polygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
      // In this case the frontFillVertices must trace out the boundary circle first and then the polygon
      boundary.reverse().forEach(v => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = v[0];
          vertex.y = v[1];
          this.frontFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Polygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
      // Make sure that the next entry in the backFill is the first to closed up the annular region
      const vert1 = this.pool.pop();
      if (vert1 !== undefined) {
        vert1.x = this.frontFills[0].vertices[0].x;
        vert1.y = this.frontFills[0].vertices[0].y;
        this.frontFills[0].vertices.push(vert1);
      } else {
        throw new Error(
          "Polygon: Not enough vertices from the fills in the pool!"
        );
      }
      // now add the location vertices
      locationArray.forEach(v => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = v.x;
          vertex.y = v.y;
          this.frontFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Polygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
      // Make sure that the next entry in the frontFill is the first to closed up the annular region
      const vert2 = this.pool.pop();
      if (vert2 !== undefined) {
        vert2.x = this.frontFills[0].vertices.slice(-1)[0].x;
        vert2.y = this.frontFills[0].vertices.slice(-1)[0].y;
        this.frontFills[0].vertices.push(vert2);
      }
    }
    // var count = 0
    // console.log("##########DUMP#################");
    // this.frontFills.forEach((part, ind) => {
    //   part.vertices.forEach((vert: any,ind:number) => {
    //     console.log("@", count+ind, "\n", vert.x, "\n", vert.y, "\n", "true")
    //   });
    //   count += part.vertices.length
    //   // }
    // });
    // this.backFills.forEach(part => {
    //   part.vertices.forEach((vert: any,ind:number) => {
    //     console.log("@",ind+ count," \n", vert.x, "\n", vert.y, "\n", "false")
    //   });
    //   count += part.vertices.length
    // });
  }

  /**
   * Set the a and b parameters (Used by ellipse handler to set these values for the temporary ellipse)
   */
  set area(newArea: number) {
    this._area = newArea;
  }

  glowingDisplay(): void {
    this.frontFills.forEach(part => {
      if (part.vertices.length !== 0) {
        part.visible = true;
      } else {
        part.visible = false;
      }
    });
    this.backFills.forEach(part => {
      if (part.vertices.length !== 0) {
        part.visible = true;
      } else {
        part.visible = false;
      }
    });
    this.seEdgeSegments.forEach(seg => {
      if (!seg.selected) {
        seg.ref.glowingDisplay();
      }
    });
  }

  normalDisplay(): void {
    this.frontFills.forEach((part, ind) => {
      if (part.vertices.length !== 0) {
        part.visible = true;
      } else {
        part.visible = false;
      }
    });
    this.backFills.forEach(part => {
      if (part.vertices.length !== 0) {
        part.visible = true;
      } else {
        part.visible = false;
      }
    });
    this.seEdgeSegments.forEach(seg => {
      if (!seg.selected) {
        seg.ref.normalDisplay();
      }
    });
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontFills.forEach(part => (part.visible = false));
      this.backFills.forEach(part => (part.visible = false));
    } else {
      this.normalDisplay();
    }
  }

  // setSelectedColoring(flag: boolean): void {
  //   //set the new colors into the variables of each segment
  //   this.seEdgeSegments
  //     .map(z => z.ref)
  //     .forEach(seg => seg.setSelectedColoring(flag));
  // }

  /**
   * Sets the variables for stroke width glowing/not, this is empty in Polygon because there are no edges to stroke
   */
  adjustSize(): void {
    // there is nothing to adjust
  }

  /**
   * Adds the front/back/glowing/not parts to the correct layers
   * @param layers
   */
  addToLayers(layers: Group[]): void {
    // These must always be executed even if the front/back part is empty
    // Otherwise when they become non-empty they are not displayed
    this.frontFills.forEach(part => part.addTo(layers[LAYER.foregroundFills]));
    this.backFills.forEach(part => part.addTo(layers[LAYER.backgroundFills]));
  }

  removeFromLayers(/*layers: Group[]*/): void {
    this.frontFills.forEach(part => part.remove());
    this.backFills.forEach(part => part.remove());
  }

  toSVG(nonScaling?: {
    stroke: boolean;
    text: boolean;
    pointRadius: boolean;
    scaleFactor: number;
  }): toSVGType[] {
    //make sure that everything is upto date
    this.updateDisplay();
    // Create an empty return type and then fill in the non-null parts
    const returnSVGObject: toSVGType = {
      frontGradientDictionary: null,
      backGradientDictionary: null,
      frontStyleDictionary: null,
      backStyleDictionary: null,
      layerSVGArray: [],
      type: "polygon"
    };

    // Add the gradient to the gradient dictionary (if used)
    if (Nodule.getGradientFill()) {
      if (this.frontFillInUse) {
        returnSVGObject.frontGradientDictionary =
          Nodule.createSVGGradientDictionary(
            this.frontGradient,
            this.frontGradientColorCenter,
            this.frontGradientColor
          );
      }

      if (this.backFillInUse) {
        returnSVGObject.backGradientDictionary =
          Nodule.createSVGGradientDictionary(
            this.backGradient,
            this.backGradientColorCenter,
            this.backGradientColor
          );
      }
    }

    // collect the front style of the circle
    if (this.frontFillInUse) {
      returnSVGObject.frontStyleDictionary = Nodule.createSVGStyleDictionary({
        fillObject: this.frontFills[0]
      });
    }
    // collect the front style of the circle
    if (this.backFillInUse) {
      returnSVGObject.backStyleDictionary = Nodule.createSVGStyleDictionary({
        fillObject: this.backFills[0]
      });
    }
    // now collect the geometric information by copying all the front fills and backfills
    this.frontFills.forEach(fill => {
      if (fill.vertices.length != 0) {
        let svgFrontString = '<path d="';
        const localMatrix = fill.matrix;
        fill.vertices.forEach((v: Anchor, index: number) => {
          var coords = localMatrix.multiply(v.x, v.y, 1);
          if (index == 0) {
            svgFrontString += "M" + coords[0] + " " + coords[1] + " ";
          } else {
            svgFrontString += "L" + coords[0] + " " + coords[1] + " ";
          }
        });
        svgFrontString += 'Z"/>';

        returnSVGObject.layerSVGArray.push([
          LAYER.foregroundFills,
          svgFrontString
        ]);
      }
    });

    this.backFills.forEach(fill => {
      if (fill.vertices.length != 0) {
        let svgBackString = '<path d="';
        const localMatrix = fill.matrix;
        fill.vertices.forEach((v: Anchor, index: number) => {
          var coords = localMatrix.multiply(v.x, v.y, 1);
          if (index == 0) {
            svgBackString += "M" + coords[0] + " " + coords[1] + " ";
          } else {
            svgBackString += "L" + coords[0] + " " + coords[1] + " ";
          }
        });
        svgBackString += 'Z"/>';

        returnSVGObject.layerSVGArray.push([
          LAYER.backgroundFills,
          svgBackString
        ]);
      }
    });

    return [returnSVGObject];
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleCategory): StyleOptions {
    switch (panel) {
      case StyleCategory.Front:
        return DEFAULT_POLYGON_FRONT_STYLE;
      case StyleCategory.Back:
        if (SETTINGS.parametric.dynamicBackStyle)
          return {
            ...DEFAULT_POLYGON_BACK_STYLE,
            strokeWidthPercent: Nodule.contrastStrokeWidthPercent(100),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.parametric.drawn.strokeColor.front
            ),
            fillColor: Nodule.contrastFillColor(
              SETTINGS.parametric.drawn.fillColor.front
            )
          };
        else return DEFAULT_POLYGON_BACK_STYLE;
      default:
        return {};
    }
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the Polygon
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // This should never be executed there are no temporary polygons
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the js objects.

        // FRONT
        const frontStyle = this.styleOptions.get(StyleCategory.Front);

        if (Nodule.rgbaIsNoFillOrNoStroke(frontStyle?.fillColor)) {
          this.frontFills.forEach(fill => fill.noFill());
        } else {
          if (Nodule.globalGradientFill) {
            this.frontGradientColor.color = frontStyle?.fillColor ?? "black";
            this.frontFills.forEach(fill => {
              fill.fill = this.frontGradient;
            });
          } else {
            this.frontFills.forEach(fill => {
              fill.fill = frontStyle?.fillColor ?? "black";
            });
          }
        }

        // BACK
        const backStyle = this.styleOptions.get(StyleCategory.Back);
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.rgbaIsNoFillOrNoStroke(
              Nodule.contrastFillColor(frontStyle?.fillColor)
            )
          ) {
            this.backFills.forEach(fill => fill.noFill());
          } else {
            if (Nodule.globalGradientFill) {
              this.backGradientColor.color = Nodule.contrastFillColor(
                frontStyle?.fillColor ?? "black"
              );

              this.backFills.forEach(fill => {
                fill.fill = this.backGradient;
              });
            } else {
              this.backFills.forEach(fill => {
                fill.fill = Nodule.contrastFillColor(
                  frontStyle?.fillColor ?? "black"
                );
              });
            }
          }
        } else {
          if (Nodule.rgbaIsNoFillOrNoStroke(backStyle?.fillColor)) {
            this.backFills.forEach(fill => fill.noFill());
          } else {
            if (Nodule.globalGradientFill) {
              this.backGradientColor.color = backStyle?.fillColor ?? "black";
              this.backFills.forEach(fill => {
                fill.fill = this.backGradient;
              });
            } else {
              this.backFills.forEach(fill => {
                fill.fill = backStyle?.fillColor ?? "black";
              });
            }
          }
        }
        break;
      }
    }
  }
}
