/** @format */

import { Vector3, Matrix4 } from "three";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_POLYGON_FRONT_STYLE,
  DEFAULT_POLYGON_BACK_STYLE
} from "@/types/Styles";
import { location, visitedIndex } from "@/types";
import { SESegment } from "@/models/SESegment";
//import Two from "two.js";
import { Path } from "two.js/src/path";
import { Anchor } from "two.js/src/anchor";
import { Stop } from "two.js/src/effects/stop";
import { RadialGradient } from "two.js/src/effects/radial-gradient";
import { Group } from "two.js/src/group";
import { Vector } from "two.js/src/vector";

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

  /**
   * The stops and gradient for front/back fill
   */
  private frontGradientColorCenter = new Stop(0, SETTINGS.fill.frontWhite, 1);
  private frontGradientColor = new Stop(
    2 * SETTINGS.boundaryCircle.radius,
    SETTINGS.polygon.drawn.fillColor.front,
    1
  );

  private frontGradient = new RadialGradient(
    SETTINGS.fill.lightSource.x,
    SETTINGS.fill.lightSource.y,
    1 * SETTINGS.boundaryCircle.radius,
    [this.frontGradientColorCenter, this.frontGradientColor]
  );

  private backGradientColorCenter = new Stop(0, SETTINGS.fill.backGray, 1);
  private backGradientColor = new Stop(
    1 * SETTINGS.boundaryCircle.radius,
    SETTINGS.polygon.drawn.fillColor.back,
    1
  );
  private backGradient = new RadialGradient(
    -SETTINGS.fill.lightSource.x,
    -SETTINGS.fill.lightSource.y,
    2 * SETTINGS.boundaryCircle.radius,
    [this.backGradientColorCenter, this.backGradientColor]
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
    this.seEdgeSegments.push(...segmentList);
    this.segmentIsFlipped.push(...segmentFlippedList);

    // There are this.edgeSegment.length number of straight lines in the polygon
    // at most two of these edges can intersect the boundary circle twice
    // so the polygon can
    // intersect the boundary circle at most this.edgeSegment.length-1 times + 2.
    // This means that there are at most ceiling(this.edgeSegment.length+1)/2) of each front and back fill parts

    // To render the polygon we use 2 times the number of vertices in each segment (because each segment can have at most three parts front/back/extra and each of those have SETTINGS.segment.numPoints in them) plus 2*BOUNDARYSUBDIVISIONS plus 2 (the extra 2 are to close up the annular region when the polygon is a hole on the front or back)

    // Each segment (all parts) is rendered with 2*SETTINGS.segment.numPoints
    const verticesFill: Anchor[] = [];
    for (
      let k = 0;
      k <
      2 * SETTINGS.segment.numPoints * this.seEdgeSegments.length +
        BOUNDARYSUBDIVISIONS +
        1;
      k++
    ) {
      verticesFill.push(new Anchor(0, 0));
    }
    this.frontFills[0] = new Path(
      verticesFill,
      /* closed */ true,
      /* curve */ false,
     // /*manual*/ true
    );

    // now create, record ids, and set noStroke (and stripped of their anchors so that the number of anchors is correct) the other parts that may be needed
    for (let i = 0; i < this.seEdgeSegments.length; i++) {
      // When some segments are longer than pi, you need more faces than (#edges -1)/2, a witch hat triangle with the pointy tip on the opposite sides of the to endpoints of the longer than pi side
      this.backFills[i] = new Path(
        verticesFill,
        /* closed */ true,
        /* curve */ false,
       // /*manual*/ true
      );

      if (i > 0) {
        // clear the vectors from all the parts so that the total number (between front and back) of vectors is 2*SUBDIVISIONS
        this.frontFills[i] = new Path(
          verticesFill,
          /* closed */ true,
          /* curve */ false,
          ///*manual*/ true
        );
        this.frontFills[i].vertices.splice(0);
        this.backFills[i].vertices.splice(0);
      }
      Nodule.idPlottableDescriptionMap.set(String(this.frontFills[i].id), {
        type: "polygon",
        side: "front",
        fill: true,
        part: ""
      });

      Nodule.idPlottableDescriptionMap.set(String(this.backFills[i].id), {
        type: "polygon",
        side: "back",
        fill: true,
        part: ""
      });

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
        console.log("########################");
        console.log("seg flipped", index, this.segmentIsFlipped[index]);
        console.log("first vertex on front", seg.firstVertexIsOnFront);
        console.log("last vertex on front", seg.lastVertexIsOnFront);
        console.log("front length", seg.frontPartInUse);
        console.log("back length", seg.backPartInUse);
        console.log("front extra length", seg.frontExtraInUse);
        console.log("back extra length", seg.backExtraInUse);
        // get the local transformation matrix of the segment (should be the same for all parts front/back part/extra)
        var localMatrix = seg.frontPart.matrix; //local matrix works for just the position, rotation, and scale of that object in its local frame
        // Add the vertices in the segment in the orientation of the segment and flip it later if necessary
        let numVerticesAdded = 0;
        if (seg.firstVertexIsOnFront) {
          // This seg starts with frontPart, then backPart, then frontExtra (the last two might not be in use)
          if (seg.frontPartInUse) {
            for (let i = 0; i < seg.frontPart.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.frontPart.vertices[i].x,
                seg.frontPart.vertices[i].y,
                1
              );
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: true
              });
              numVerticesAdded++;
            }
          }
          if (seg.backPartInUse) {
            for (let i = 0; i < seg.backPart.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.backPart.vertices[i].x,
                seg.backPart.vertices[i].y,
                1
              );
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: false
              });
              numVerticesAdded++;
            }
          }
          if (seg.frontExtraInUse) {
            for (let i = 0; i < seg.frontExtra.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.frontExtra.vertices[i].x,
                seg.frontExtra.vertices[i].y,
                1
              );
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: true
              });
              numVerticesAdded++;
            }
          }

          if (this.segmentIsFlipped[index]) {
            // reverse the last numVerticesAdded in the locationArray
            const tempArray = locationArray.splice(
              locationArray.length - numVerticesAdded,
              numVerticesAdded
            );
            locationArray.push(...tempArray.reverse());
          }
        } else {
          // This seg starts with backPart, then frontPart, then backExtra (the last two might not be in use)
          if (seg.backPartInUse) {
            for (let i = 0; i < seg.backPart.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.backPart.vertices[i].x,
                seg.backPart.vertices[i].y,
                1
              );
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: false
              });
              numVerticesAdded++;
            }
          }
          if (seg.frontPartInUse) {
            for (let i = 0; i < seg.frontPart.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.frontPart.vertices[i].x,
                seg.frontPart.vertices[i].y,
                1
              );
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: true
              });
              numVerticesAdded++;
            }
          }
          if (seg.backExtraInUse) {
            for (let i = 0; i < seg.backExtra.vertices.length; i++) {
              var coords = localMatrix.multiply(
                seg.backExtra.vertices[i].x,
                seg.backExtra.vertices[i].y,
                1
              );
              locationArray.push({
                x: coords[0],
                y: coords[1],
                front: false
              });
              numVerticesAdded++;
            }
          }

          if (this.segmentIsFlipped[index]) {
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
    const allEdgesOnFront = locationArray.every(loc => loc.front === true);
    const allEdgesOnBack = locationArray.every(loc => loc.front === false);

    // The polygon interior is split between front and back
    if (!allEdgesOnFront && !allEdgesOnBack) {
      // Count and record the indices of intersections with the boundary circle
      const frontToBackIntersectionIndices: visitedIndex[] = []; // i is on this list if location[i-1] is on front and location[i] is on back
      const backToFrontIntersectionIndices: visitedIndex[] = []; // i is on this list if location[i-1] is on back and location[i] is on front
      const n = locationArray.length;
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

      console.log(
        "num of front to back",
        frontToBackIntersectionIndices.length
      );
      frontToBackIntersectionAngles.forEach(ang => console.log(ang));
      console.log(
        "num of back to front",
        backToFrontIntersectionIndices.length
      );
      backToFrontIntersectionAngles.forEach(ang => console.log(ang));
      console.log(
        "angle diff",
        -frontToBackIntersectionAngles[0] + backToFrontIntersectionAngles[0]
      );

      // Keep track of the front fill index
      let currentFrontFillIndex = -1;

      // now trace all the front fills
      while (
        backToFrontIntersectionIndices.some(visnum => visnum.visited === false)
      ) {
        currentFrontFillIndex += 1;
        console.log("################## Front fill new")
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
              console.log("####");
              console.log(
                i,
                "size",
                locationArray[i].x ** 2 + locationArray[i].y ** 2
              );
              console.log(
                "ang",
                Math.atan2(locationArray[i].y, locationArray[i].x)
              );
              console.log("front?", locationArray[i].front);
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
          // console.log("start ang", startAngle);
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
          // Compute the angular width of the section of the boundary polygon to add to the front/back fill
          // This can be positive if traced counterclockwise or negative if traced clockwise (add 2 Pi to make positive)
          let angularWidth = startAngle - endAngle;
          if (angularWidth < 0) {
            angularWidth += 2 * Math.PI;
          }
          // console.log("ang Width", angularWidth);

          // When tracing the boundary polygon we start from fromVector locationArray[previousIndex] (which is on the front)
          const size = Math.sqrt(
            locationArray[previousIndex].x * locationArray[previousIndex].x +
              locationArray[previousIndex].y * locationArray[previousIndex].y
          );
          const fromVector = [
            (SETTINGS.boundaryCircle.radius *
              (locationArray[previousIndex].x *
                SETTINGS.boundaryCircle.radius)) /
              size,
            (SETTINGS.boundaryCircle.radius *
              (locationArray[previousIndex].y *
                SETTINGS.boundaryCircle.radius)) /
              size
          ];

          // then
          // trace in the direction of a toVector that is perpendicular to locationArray[previousIndex]
          // and is the next one CW from  locationArray[previousIndex]
          const toVector = [fromVector[1], -fromVector[0]];

          // add the boundary vertices from start to end in the direction of toVector
          const boundaryPoints = this.boundaryCircleCoordinates(
            fromVector,
            Math.floor(BOUNDARYSUBDIVISIONS / this.seEdgeSegments.length),
            toVector,
            angularWidth
          );
          boundaryPoints.forEach(pt => {
           //if (currentFrontFillIndex == 0) {
              console.log("#### Fill Face: ",currentFrontFillIndex,"\nang", Math.atan2(pt[1], pt[0]));
            //}
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
          // go to the start of the while loop with the next index at the start of a backToFrontIntersection
          backToFrontIndex = nextSmallestAngleIndex;
        }
      }

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
          // console.log("ang Width", angularWidth);

          // When tracing the boundary polygon we start from fromVector locationArray[previousIndex] (which is on the front)
          const size = Math.sqrt(
            locationArray[previousIndex].x * locationArray[previousIndex].x +
              locationArray[previousIndex].y * locationArray[previousIndex].y
          );
          const fromVector = [
            (SETTINGS.boundaryCircle.radius *
              (locationArray[previousIndex].x *
                SETTINGS.boundaryCircle.radius)) /
              size,
            (SETTINGS.boundaryCircle.radius *
              (locationArray[previousIndex].y *
                SETTINGS.boundaryCircle.radius)) /
              size
          ];

          // then
          // trace in the direction of a toVector that is perpendicular to locationArray[previousIndex]
          // and is the next one CCW from  locationArray[previousIndex]
          const toVector = [-fromVector[1], fromVector[0]];

          // add the boundary vertices from start to end in the direction of toVector
          const boundaryPoints = this.boundaryCircleCoordinates(
            fromVector,
            Math.floor(BOUNDARYSUBDIVISIONS / this.seEdgeSegments.length),
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
          // go to the start of the while loop with the next index at the start of a frontToBackIntersection
          frontToBackIndex = nextBiggestAngleIndex;
        }
      }
    }
    // The polygon interior is only on the front of the sphere
    else if (allEdgesOnFront && this._area < 2 * Math.PI) {
      locationArray.forEach(loc => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = loc.x;
          vertex.y = loc.y;
          this.frontFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Ploygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
    }
    // The polygon interior is only on the back of the sphere
    else if (allEdgesOnBack && this._area < 2 * Math.PI) {
      locationArray.forEach(loc => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = loc.x;
          vertex.y = loc.y;
          this.backFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Ploygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
    }
    // The polygon interior covers the entire front half of the sphere and is a 'hole' on the back
    else if (allEdgesOnBack && this._area > 2 * Math.PI) {
      // location[0] is a point *not* on the boundary circle, we project to the boundary circle so that when
      // tracing the boundary we start close to this point
      const size = Math.sqrt(
        locationArray[0].x * locationArray[0].x +
          locationArray[0].y * locationArray[0].y
      );
      const startPoint = [
        (SETTINGS.boundaryCircle.radius *
          (locationArray[0].x * SETTINGS.boundaryCircle.radius)) /
          size,
        (SETTINGS.boundaryCircle.radius *
          (locationArray[0].y * SETTINGS.boundaryCircle.radius)) /
          size
      ];
      const boundary = this.boundaryCircleCoordinates(
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
            "Ploygon: Not enough vertices from the fills in the pool!"
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
            "Ploygon: Not enough vertices from the fills in the pool!"
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
            "Ploygon: Not enough vertices from the fills in the pool!"
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
    else if (allEdgesOnFront && this._area > 2 * Math.PI) {
      // location[0] is a point *not* on the boundary circle, we project to the boundary circle so that when
      // tracing the boundary we start close to this point
      const size = Math.sqrt(
        locationArray[0].x * locationArray[0].x +
          locationArray[0].y * locationArray[0].y
      );
      const startPoint = [
        (SETTINGS.boundaryCircle.radius *
          (locationArray[0].x * SETTINGS.boundaryCircle.radius)) /
          size,
        (SETTINGS.boundaryCircle.radius *
          (locationArray[0].y * SETTINGS.boundaryCircle.radius)) /
          size
      ];
      const boundary = this.boundaryCircleCoordinates(
        startPoint,
        BOUNDARYSUBDIVISIONS,
        [-startPoint[1], startPoint[0]],
        2 * Math.PI
      );
      // console.log(
      //   "0 boundary point size, pool size",
      //   boundary.length,
      //   this.pool.length
      // );
      // In this case set the backFillVertices to the entire boundary circle which are boundary,
      boundary.forEach(v => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = v[0];
          vertex.y = v[1];
          this.backFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Ploygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
      // console.log("1 pool size", this.pool.length);
      // In this case the frontFillVertices must trace out the boundary circle first and then the polygon
      boundary.reverse().forEach(v => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = v[0];
          vertex.y = v[1];
          this.frontFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Ploygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
      // console.log("2 pool size", this.pool.length);
      // Make sure that the next entry in the backFill is the first to closed up the annular region
      const vert1 = this.pool.pop();
      if (vert1 !== undefined) {
        vert1.x = this.frontFills[0].vertices[0].x;
        vert1.y = this.frontFills[0].vertices[0].y;
        this.frontFills[0].vertices.push(vert1);
      } else {
        throw new Error(
          "Ploygon: Not enough vertices from the fills in the pool!"
        );
      }
      // console.log("3 pool size", this.pool.length);
      // now add the location vertices
      locationArray.forEach(v => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = v.x;
          vertex.y = v.y;
          this.frontFills[0].vertices.push(vertex);
        } else {
          throw new Error(
            "Ploygon: Not enough vertices from the fills in the pool!"
          );
        }
      });
      // console.log("4 pool size", this.pool.length);
      // Make sure that the next entry in the frontFill is the first to closed up the annular region
      const vert2 = this.pool.pop();
      if (vert2 !== undefined) {
        vert2.x = this.frontFills[0].vertices.slice(-1)[0].x;
        vert2.y = this.frontFills[0].vertices.slice(-1)[0].y;
        this.frontFills[0].vertices.push(vert2);
      }
      // console.log("5 pool size", this.pool.length);
    }
  }

  /**
   * startPt is a point on the the boundary of the display circle,
   * this method returns an ordered list of numPoints points from startPoint for and
   * angular length of angularLength in the direction of yAxis.
   * This returns an array of point on the boundary circle so that the angle subtended at the origin between
   * any two consecutive ones is equal and equal to the angle between the first returned to startPt. The last one is
   * a equal measure less than angularLength
   *
   * yAxis is perpendicular to startPt
   */
  boundaryCircleCoordinates(
    startPt: number[],
    numPoints: number,
    yAxis: number[],
    angularLength: number
  ): number[][] {
    const xAxisVector = new Vector3(startPt[0], startPt[1], 0).normalize();
    const yAxisVector = new Vector3(yAxis[0], yAxis[1], 0).normalize();
    const returnArray = [];

    for (let i = 0; i < numPoints; i++) {
      this.tmpVector.set(0, 0, 0);
      this.tmpVector.addScaledVector(
        xAxisVector,
        Math.cos((i + 1) * (angularLength / (numPoints + 1)))
      );
      this.tmpVector.addScaledVector(
        yAxisVector,
        Math.sin((i + 1) * (angularLength / (numPoints + 1)))
      );
      // now scale to the radius of the boundary circle
      this.tmpVector.normalize().multiplyScalar(SETTINGS.boundaryCircle.radius);

      returnArray.push([this.tmpVector.x, this.tmpVector.y]);
    }
    return returnArray;
  }

  /**
   * Set the a and b parameters (Used by ellipse handler to set these values for the temporary ellipse)
   */
  set area(newArea: number) {
    this._area = newArea;
  }
  // set SEPolygon(sePolygon: SEPolygon) {
  // this._sePolgon = sePolygon;
  // }

  // frontGlowingDisplay(): void {
  //   this.frontFills.forEach(part => (part.visible = true));
  //   this.seEdgeSegments.forEach(seg => {
  //     if (!seg.selected) {
  //       seg.ref.frontGlowingDisplay();
  //     }
  //   });
  // }

  // backGlowingDisplay(): void {
  //   this.backFills.forEach(part => (part.visible = true));
  //   this.seEdgeSegments.forEach(seg => {
  //     if (!seg.selected) {
  //       seg.ref.backGlowingDisplay();
  //     }
  //   });
  // }
  glowingDisplay(): void {
    this.frontFills.forEach(part => (part.visible = true));
    this.backFills.forEach(part => (part.visible = true));
    this.seEdgeSegments.forEach(seg => {
      if (!seg.selected) {
        seg.ref.glowingDisplay();
      }
    });
  }
  // frontNormalDisplay(): void {
  //   this.frontFills.forEach(part => (part.visible = true));
  //   this.seEdgeSegments.forEach(seg => {
  //     if (!seg.selected) {
  //       seg.ref.frontNormalDisplay();
  //     }
  //   });
  // }
  // backNormalDisplay(): void {
  //   this.backFills.forEach(part => (part.visible = true));
  //   this.seEdgeSegments.forEach(seg => {
  //     if (!seg.selected) {
  //       seg.ref.backNormalDisplay();
  //     }
  //   });
  // }
  normalDisplay(): void {
    this.frontFills.forEach((part,ind) => {
      part.visible = true
      //if (ind ==0){
      //   console.log("###########################")
      //   console.log("fill 0 vert dump")
      //   part.vertices.forEach(vert => {
      //     console.log( 'size', vert.x**2+vert.y**2)
      //     console.log("Angle", Math.atan2(vert.y,vert.x))
      //     }
      //   )
      // }
    });
    this.backFills.forEach(part => (part.visible = true));
    this.seEdgeSegments.forEach(seg => {
      if (!seg.selected) {
        seg.ref.normalDisplay();
      }
    });
  }

  setVisible(flag: boolean): void {
    console.log("setvisible polygon",flag)
    if (!flag) {
      this.frontFills.forEach(part => (part.visible = false));
      this.backFills.forEach(part => (part.visible = false));
    } else {
      this.normalDisplay();
    }
  }

  setSelectedColoring(flag: boolean): void {
    //set the new colors into the variables of each segment
    this.seEdgeSegments
      .map(z => z.ref)
      .forEach(seg => seg.setSelectedColoring(flag));
  }

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
        // This should never be executed
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the js objects.

        // FRONT
        const frontStyle = this.styleOptions.get(StyleCategory.Front);

        if (Nodule.hslaIsNoFillOrNoStroke(frontStyle?.fillColor)) {
          this.frontFills.forEach(fill => fill.noFill());
        } else {
          this.frontGradientColor.color = frontStyle?.fillColor ?? "black";
          this.frontFills.forEach(fill => {
            fill.fill = this.frontGradient;
          });
        }

        // BACK
        const backStyle = this.styleOptions.get(StyleCategory.Back);
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hslaIsNoFillOrNoStroke(
              Nodule.contrastFillColor(frontStyle?.fillColor)
            )
          ) {
            this.backFills.forEach(fill => fill.noFill());
          } else {
            this.backGradientColor.color = Nodule.contrastFillColor(
              frontStyle?.fillColor ?? "black"
            );

            this.backFills.forEach(fill => {
              fill.fill = this.backGradient;
            });
          }
        } else {
          if (Nodule.hslaIsNoFillOrNoStroke(backStyle?.fillColor)) {
            this.backFills.forEach(fill => fill.noFill());
          } else {
            this.backGradientColor.color = backStyle?.fillColor ?? "black";
            this.backFills.forEach(fill => {
              fill.fill = this.backGradient;
            });
          }
        }
        break;
      }
    }
  }
}
