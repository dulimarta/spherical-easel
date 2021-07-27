/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_POLYGON_FRONT_STYLE,
  DEFAULT_POLYGON_BACK_STYLE
} from "@/types/Styles";
import { location } from "@/types";
import AppStore from "@/store";
import { SENodule } from "@/models/SENodule";
import { SEExpression } from "@/models/SEExpression";
import { SEStore } from "@/store";
import { ExpressionParser } from "@/expression/ExpressionParser";
import Segment from "./Segment";

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
  private edgeSegments: Segment[] = [];
  private segmentIsFlipped: boolean[] = [];

  /**
   * An array with the same length as _edgeSegments containing the +1/-1 multiplier on the normal of SESegments, so
   * that a point pt is inside the polygon if and only if
   *
   *  pt dot ( interiorDirectionMultipliers[i] * SEEdgeSegments.normal) > 0
   *
   * for all i
   */
  private interiorDirectionMultipliers: number[] = [];

  /**
   * Vuex global state
   */
  protected store = AppStore; //

  /**
   * The area of the polygon. This must be updated before the updateDisplay can be called
   */
  private _area = 0;
  /**
   * The TwoJS objects to display the front/back fill parts.
   */
  private frontFills: Two.Path[] = [];
  private backFills: Two.Path[] = [];

  private pool: Two.Anchor[] = []; //The pool of vertices

  /**
   * The stops and gradient for front/back fill
   */
  private frontGradientColorCenter = new Two.Stop(
    0,
    SETTINGS.fill.frontWhite,
    1
  );
  private frontGradientColor = new Two.Stop(
    2 * SETTINGS.boundaryCircle.radius,
    SETTINGS.polygon.drawn.fillColor.front,
    1
  );

  private frontGradient = new Two.RadialGradient(
    SETTINGS.fill.lightSource.x,
    SETTINGS.fill.lightSource.y,
    1 * SETTINGS.boundaryCircle.radius,
    [this.frontGradientColorCenter, this.frontGradientColor]
  );

  private backGradientColorCenter = new Two.Stop(0, SETTINGS.fill.backGray, 1);
  private backGradientColor = new Two.Stop(
    1 * SETTINGS.boundaryCircle.radius,
    SETTINGS.polygon.drawn.fillColor.back,
    1
  );
  private backGradient = new Two.RadialGradient(
    -SETTINGS.fill.lightSource.x,
    -SETTINGS.fill.lightSource.y,
    2 * SETTINGS.boundaryCircle.radius,
    [this.backGradientColorCenter, this.backGradientColor]
  );

  /**
   * For temporary calculation with ThreeJS objects
   */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpMatrix = new Matrix4();

  constructor(
    segmentList: Segment[],
    segmentFlippedList: boolean[],
    interiorDirectionMultipliers: Vector3[]
  ) {
    super();
    this.edgeSegments.push(...segmentList);
    this.segmentIsFlipped.push(...segmentFlippedList);

    // There are this.edgeSegment.length number of straight lines in the polygon so the polygon can
    // intersect the boundary circle at most this.edgeSegment.length-1 times.
    // This means that there are at most ceiling(this.edgeSegment.length-1)/2) of each front and back fill parts

    // To render the polygon we use the number of vertices in each segment plus BOUNDARYSUBDIVISIONS plus 2 (the extra 2 are to close up the annular region when the polygon is a hole on the front or back)

    // Each segment (all parts) is rendered with 2*SETTINGS.segment.numPoints
    const verticesFill: Two.Vector[] = [];
    for (
      let k = 0;
      k < SETTINGS.segment.numPoints + BOUNDARYSUBDIVISIONS / 2 + 1;
      k++
    ) {
      verticesFill.push(new Two.Vector(0, 0));
    }
    this.frontFills[0] = new Two.Path(
      verticesFill,
      /* closed */ true,
      /* curve */ false
    );

    // now create, record ids, and set noStroke (and strip of their anchors so that the number of anchors is correct) the other parts that may be needed
    for (let i = 0; i < Math.ceil((this.edgeSegments.length - 1) / 2); i++) {
      this.backFills[i] = this.frontFills[0].clone();

      if (i > 0) {
        // clear the vectors from all the parts so that the total number (between front and back) of vectors is 2*SUBDIVISIONS
        this.frontFills[i] = this.frontFills[0].clone();
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
    this.styleOptions.set(StyleEditPanels.Front, DEFAULT_POLYGON_FRONT_STYLE);
    this.styleOptions.set(StyleEditPanels.Back, DEFAULT_POLYGON_BACK_STYLE);
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
    // Bring all the locations of the vertices in the correct order in one array
    const locationArray: location[] = [];
    this.edgeSegments.forEach((seg, index) => {
      if (this.segmentIsFlipped[index]) {
        // work from the end to the start in each part of the segment
        if (seg.lastVertexIsOnFront) {
          // the last vertex was on the front
          for (let i = seg.frontPartExtra.vertices.length - 1; i > -1; i--) {
            locationArray.push({
              x: seg.frontPartExtra.vertices[i].x,
              y: seg.frontPartExtra.vertices[i].y,
              front: true
            });
          }
          for (let i = seg.backPart.vertices.length - 1; i > -1; i--) {
            locationArray.push({
              x: seg.backPart.vertices[i].x,
              y: seg.backPart.vertices[i].y,
              front: false
            });
          }
          for (let i = seg.frontPart.vertices.length - 1; i > -1; i--) {
            locationArray.push({
              x: seg.frontPart.vertices[i].x,
              y: seg.frontPart.vertices[i].y,
              front: true
            });
          }
        } else {
          // the last vertex was not on the front (on the back)
          for (let i = seg.backPartExtra.vertices.length - 1; i > -1; i--) {
            locationArray.push({
              x: seg.backPartExtra.vertices[i].x,
              y: seg.backPartExtra.vertices[i].y,
              front: false
            });
          }
          for (let i = seg.frontPart.vertices.length - 1; i > -1; i--) {
            locationArray.push({
              x: seg.frontPart.vertices[i].x,
              y: seg.frontPart.vertices[i].y,
              front: true
            });
          }
          for (let i = seg.backPart.vertices.length - 1; i > -1; i--) {
            locationArray.push({
              x: seg.backPart.vertices[i].x,
              y: seg.backPart.vertices[i].y,
              front: true
            });
          }
        }
      } else {
        // work from start to end in each part of the segment
        if (seg.firstVertexIsOnFront) {
          // the first vertex was on the front
          for (let i = 0; i < seg.frontPart.vertices.length; i++) {
            locationArray.push({
              x: seg.frontPart.vertices[i].x,
              y: seg.frontPart.vertices[i].y,
              front: true
            });
          }
          for (let i = 0; i < seg.backPart.vertices.length; i++) {
            locationArray.push({
              x: seg.backPart.vertices[i].x,
              y: seg.backPart.vertices[i].y,
              front: false
            });
          }
          for (let i = 0; i < seg.frontPartExtra.vertices.length; i++) {
            locationArray.push({
              x: seg.frontPartExtra.vertices[i].x,
              y: seg.frontPartExtra.vertices[i].y,
              front: true
            });
          }
        } else {
          // the first vertex was not on the front (on the back)
          for (let i = 0; i < seg.backPart.vertices.length; i++) {
            locationArray.push({
              x: seg.backPart.vertices[i].x,
              y: seg.backPart.vertices[i].y,
              front: true
            });
          }
          for (let i = 0; i < seg.frontPart.vertices.length; i++) {
            locationArray.push({
              x: seg.frontPart.vertices[i].x,
              y: seg.frontPart.vertices[i].y,
              front: true
            });
          }
          for (let i = 0; i < seg.backPartExtra.vertices.length; i++) {
            locationArray.push({
              x: seg.backPartExtra.vertices[i].x,
              y: seg.backPartExtra.vertices[i].y,
              front: false
            });
          }
        }
      }
    });
    const allEdgesOnFront = locationArray.every(loc => loc.front === true);
    const allEdgesOnBack = locationArray.every(loc => loc.front === false);
    // The polygon interior is split between front and back
    if (!allEdgesOnFront && !allEdgesOnBack) {
      // Count the intersections with the boundary circle
      // first rotate the locationArray so that locationArray[0] is on the back side of the sphere
      //  and locationArray[-1] is on the front. (LocationArray[0] is on the boundary circle)
      let firstChangeSidesIndexFromFrontToBack = -1;
      let numberOfFrontToBackIntersections = 0;
      let numberOfBackToFrontIntersections = 0;
      const n = locationArray.length;
      locationArray.forEach((loc, index) => {
        const previousIndex = (((index - 1) % n) + n) % n;
        if (loc.front && !locationArray[previousIndex].front) {
          numberOfBackToFrontIntersections += 1;
        } else if (!loc.front && locationArray[previousIndex].front) {
          numberOfFrontToBackIntersections = +1;
          if (firstChangeSidesIndexFromFrontToBack === -1) {
            firstChangeSidesIndexFromFrontToBack = index;
          }
        }
      });
      locationArray.rotate(firstChangeSidesIndexFromFrontToBack); //locationArray[0] is now the old locationArray[changeSidedIndex]

      // Keep track of the front/back fill index
      let currentFrontFillIndex = 0;
      let currentBackFillIndex = 0;

      //keep track of the start boundary point and the current side so we can add boundary points appropriately
      let boundaryCircleStartPoint = [locationArray[0].x, locationArray[0].y];
      let currentSideIsFront = locationArray[0].front === true;

      locationArray.forEach((loc, index) => {
        if (!loc.front) {
          // Move to the next back fill if necessary
          // if (lastNegativeIndex !== index - 1 && !firstBackPart) {
          //   currentBackFillIndex++;
          //   // console.log(
          //   //   "c back part ind",
          //   //   currentBackFillIndex,
          //   //   this.backParts.length
          //   // );
          //   if (currentBackFillIndex >= this.backFills.length) {
          //     throw new Error(
          //       "Polygon update: Needs more back fills than were allocated in the constructor"
          //     );
          //   }
          // }
          // firstBackPart = false;
          // lastNegativeIndex = index;

          const vertex = this.pool.pop();
          if (vertex !== undefined) {
            vertex.x = loc.x;
            vertex.y = loc.y;
            this.backFills[currentBackFillIndex].vertices.push(vertex);
          }
        } else {
          // Move to the next front fill if necessary
          // if (lastPositiveIndex !== index - 1 && !firstFrontPart) {
          //   currentFrontFillIndex++;
          //   // console.log(
          //   //   "c front part ind",
          //   //   currentBackFillIndex,
          //   //   this.backParts.length
          //   // );
          //   if (currentFrontFillIndex >= this.frontFills.length) {
          //     throw new Error(
          //       "Polygon Update: Needs more front fills than were allocated in the constructor"
          //     );
          //   }
          // }
          // firstFrontPart = false;
          // lastPositiveIndex = index;

          const vertex = this.pool.pop();
          if (vertex !== undefined) {
            vertex.x = loc.x;
            vertex.y = loc.y;
            this.frontFills[currentFrontFillIndex].vertices.push(vertex);
          }
        }

        const nextIndex = (((index + 1) % n) + n) % n;
        // Check to see if the nextIndex leads to a location on the other side.
        if (locationArray[index].front !== locationArray[nextIndex].front) {
          // The nextIndex leads to a location on the other side.
          // Time to cap off the side we have been writing to and add
          if (currentSideIsFront) {
            //find the angular width of the part of the boundary polygon to be copied
            // Compute the angle from the positive x axis to the boundary start point
            //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
            const startAngle = Math.atan2(
              boundaryCircleStartPoint[0],
              boundaryCircleStartPoint[1]
            );
            // Compute the angle from the positive x axis to the current location
            //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
            const endAngle = Math.atan2(
              locationArray[index].y,
              locationArray[index].x
            );
          } else {
          }

          // reset the boundaryCircleStartPoint and currentSide is front variable for tracing the next part of the fill
          boundaryCircleStartPoint = [
            locationArray[nextIndex].x,
            locationArray[nextIndex].y
          ];
          currentSideIsFront = locationArray[nextIndex].front === true;
        }
      });

      //   //find the angular width of the part of the boundary polygon to be copied
      //   // Compute the angle from the positive x axis to the last frontPartVertex
      //   //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
      //   const startAngle = Math.atan2(
      //     this.frontPart.vertices[frontLen - 1].y,
      //     this.frontPart.vertices[frontLen - 1].x
      //   );
      //   // Compute the angle from the positive x axis to the first frontPartVertex
      //   //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
      //   const endAngle = Math.atan2(
      //     this.frontPart.vertices[0].y,
      //     this.frontPart.vertices[0].x
      //   );
      //   // Compute the angular width of the section of the boundary polygon to add to the front/back fill
      //   // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
      //   let angularWidth = endAngle - startAngle;
      //   if (angularWidth < 0) {
      //     angularWidth += 2 * Math.PI;
      //   }
      //   //console.log(angularWidth);
      //   // When tracing the boundary polygon we start from fromVector = this.frontPart.vertices[frontLen - 1]
      //   const fromVector = [
      //     this.frontPart.vertices[frontLen - 1].x,
      //     this.frontPart.vertices[frontLen - 1].y
      //   ];
      //   // then
      //   // trace in the direction of a toVector that is perpendicular to this.frontPart.vertices[frontLen - 1]
      //   // and points in the same direction as this.frontPart.vertices[0]
      //   let toVector = [-fromVector[1], fromVector[0]];
      //   // If the toVector doesn't point in the same direction as the first vector in frontPart then reverse the toVector
      //   if (
      //     toVector[0] * this.frontPart.vertices[0].x +
      //       toVector[1] * this.frontPart.vertices[0].y <
      //     0
      //   ) {
      //     toVector = [-toVector[0], -toVector[1]];
      //   }
      //   // If the a,b are bigger than Pi/2 then reverse the toVector
      //   if (this._a > Math.PI / 2) {
      //     toVector = [-toVector[0], -toVector[1]];
      //   }
      //   // Create the boundary points
      //   boundaryPoints = this.boundaryCircleCoordinates(
      //     fromVector,
      //     SUBDIVISIONS + 1,
      //     toVector,
      //     angularWidth
      //   );
      //   // Build the frontFill- first add the frontPart.vertices
      //   this.frontPart.vertices.forEach(node => {
      //     if (posIndexFill === this.frontFill.vertices.length) {
      //       //add a vector from the pool
      //       this.frontFill.vertices.push(pool.pop()!);
      //     }
      //     this.frontFill.vertices[posIndexFill].x = node.x;
      //     this.frontFill.vertices[posIndexFill].y = node.y;
      //     posIndexFill++;
      //   });
      //   // add the boundary points
      //   boundaryPoints.forEach(node => {
      //     if (posIndexFill === this.frontFill.vertices.length) {
      //       //add a vector from the pool
      //       this.frontFill.vertices.push(pool.pop()!);
      //     }
      //     this.frontFill.vertices[posIndexFill].x = node[0];
      //     this.frontFill.vertices[posIndexFill].y = node[1];
      //     posIndexFill++;
      //   });
      //   // console.log("posIndex", posIndexFill, " of ", 4 * SUBDIVISIONS + 2);
      //   // console.log("pool size", pool.length);
      //   // Build the backFill- first add the backPart.vertices
      //   this.backPart.vertices.forEach(node => {
      //     if (negIndexFill === this.backFill.vertices.length) {
      //       //add a vector from the pool
      //       this.backFill.vertices.push(pool.pop()!);
      //     }
      //     this.backFill.vertices[negIndexFill].x = node.x;
      //     this.backFill.vertices[negIndexFill].y = node.y;
      //     negIndexFill++;
      //   });
      //   // console.log("negIndex", negIndexFill, " of ", 4 * SUBDIVISIONS + 2);
      //   // console.log("pool size", pool.length);
      //   // add the boundary points (but in reverse!)
      //   boundaryPoints.reverse().forEach(node => {
      //     if (negIndexFill === this.backFill.vertices.length) {
      //       //add a vector from the pool
      //       this.backFill.vertices.push(pool.pop()!);
      //     }
      //     this.backFill.vertices[negIndexFill].x = node[0];
      //     this.backFill.vertices[negIndexFill].y = node[1];
      //     negIndexFill++;
      //   });
      //   // put remaining vertices in the storage (there shouldn't be any in this case)
      //   this.fillStorageAnchors.push(...pool.splice(0));
    }
    // The polygon interior is only on the front of the sphere
    else if (allEdgesOnFront && this._area < 2 * Math.PI) {
      locationArray.forEach(loc => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = loc.x;
          vertex.y = loc.y;
          this.frontFills[0].vertices.push(vertex);
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
        }
      });
    }
    // The polygon interior covers the entire front half of the sphere and is a 'hole' on the back
    else if (allEdgesOnBack && this._area > 2 * Math.PI) {
      const size = Math.sqrt(locationArray[0].x ^ (2 + locationArray[0].y) ^ 2);
      const startPoint = [
        (locationArray[0].x * SETTINGS.boundaryCircle.radius) / size,
        (locationArray[0].y * SETTINGS.boundaryCircle.radius) / size
      ];
      const boundary = this.boundaryCircleCoordinates(
        startPoint,
        BOUNDARYSUBDIVISIONS,
        [-startPoint[0], startPoint[1]],
        2 * Math.PI
      );
      // In this case set the frontFillVertices to the entire boundary circle which are boundary, but only add half of them
      // so that only BOUNDARYSUBDIVISIONS/2 number of vectors are used.
      boundary.forEach((v, ind) => {
        if (ind % 2 === 0) {
          const vertex = this.pool.pop();
          if (vertex !== undefined) {
            vertex.x = v[0];
            vertex.y = v[1];
            this.frontFills[0].vertices.push(vertex);
          }
        }
      });
      // In this case the backFillVertices must trace out first the boundary circle  and then the polygon
      boundary.reverse().forEach((v, ind) => {
        // Again add every other one so that only BOUNDARYSUBDIVISIONS/2 vectors are used in the first part of backFill
        if (ind % 2 === 0) {
          const vertex = this.pool.pop();
          if (vertex !== undefined) {
            vertex.x = v[0];
            vertex.y = v[1];
            this.backFills[0].vertices.push(vertex);
          }
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
      const size = Math.sqrt(locationArray[0].x ^ (2 + locationArray[0].y) ^ 2);
      const startPoint = [
        (locationArray[0].x * SETTINGS.boundaryCircle.radius) / size,
        (locationArray[0].y * SETTINGS.boundaryCircle.radius) / size
      ];
      const boundary = this.boundaryCircleCoordinates(
        startPoint,
        BOUNDARYSUBDIVISIONS,
        [-startPoint[0], startPoint[1]],
        2 * Math.PI
      );
      // In this case set the backFillVertices to the entire boundary circle which are boundary, but only add half of them
      // so that only BOUNDARYSUBDIVISIONS/2 number of vectors are used.
      boundary.forEach((v, ind) => {
        if (ind % 2 === 0) {
          const vertex = this.pool.pop();
          if (vertex !== undefined) {
            vertex.x = v[0];
            vertex.y = v[1];
            this.backFills[0].vertices.push(vertex);
          }
        }
      });
      // In this case the backFillVertices must trace out first the boundary circle  and then the polygon
      boundary.reverse().forEach((v, ind) => {
        // Again add every other one so that only BOUNDARYSUBDIVISIONS/2 vectors are used in the first part of backFill
        if (ind % 2 === 0) {
          const vertex = this.pool.pop();
          if (vertex !== undefined) {
            vertex.x = v[0];
            vertex.y = v[1];
            this.frontFills[0].vertices.push(vertex);
          }
        }
      });

      // Make sure that the next entry in the backFill is the first to closed up the annular region
      const vert1 = this.pool.pop();
      if (vert1 !== undefined) {
        vert1.x = this.frontFills[0].vertices[0].x;
        vert1.y = this.frontFills[0].vertices[0].y;
        this.frontFills[0].vertices.push(vert1);
      }
      // now add the location vertices
      locationArray.forEach(v => {
        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = v.x;
          vertex.y = v.y;
          this.frontFills[0].vertices.push(vertex);
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

  frontGlowingDisplay(): void {
    this.frontFills.forEach(part => (part.visible = true));
    this.edgeSegments.forEach(seg => seg.frontGlowingDisplay());
  }
  backGlowingDisplay(): void {
    this.backFills.forEach(part => (part.visible = true));
    this.edgeSegments.forEach(seg => seg.backGlowingDisplay());
  }
  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }
  frontNormalDisplay(): void {
    this.frontFills.forEach(part => (part.visible = true));
    this.edgeSegments.forEach(seg => seg.frontNormalDisplay());
  }
  backNormalDisplay(): void {
    this.backFills.forEach(part => (part.visible = true));
    this.edgeSegments.forEach(seg => seg.backNormalDisplay());
  }
  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontFills.forEach(part => (part.visible = false));
      this.backFills.forEach(part => (part.visible = false));
    } else {
      this.normalDisplay();
    }
  }

  setSelectedColoring(flag: boolean): void {
    //set the new colors into the variables of each segment
    this.edgeSegments.forEach(seg => seg.setSelectedColoring(flag));
  }

  /**
   * Sets the variables for stroke width glowing/not, this is empty in Polygon because there are no edges to stroke
   */
  adjustSize(): void {}

  /**
   * Adds the front/back/glowing/not parts to the correct layers
   * @param layers
   */
  addToLayers(layers: Two.Group[]): void {
    // These must always be executed even if the front/back part is empty
    // Otherwise when they become non-empty they are not displayed

    this.frontFills.forEach(part => part.addTo(layers[LAYER.foregroundFills]));

    this.backFills.forEach(part => part.addTo(layers[LAYER.backgroundFills]));
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontFills.forEach(part => part.remove());

    this.backFills.forEach(part => part.remove());
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_POLYGON_FRONT_STYLE;
      case StyleEditPanels.Back:
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
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual Two.js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual Two.js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual Two.js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // This should never be executed
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.

        // FRONT
        const frontStyle = this.styleOptions.get(StyleEditPanels.Front);

        if (frontStyle?.fillColor === "noFill") {
          this.frontFills.forEach(fill => fill.noFill());
        } else {
          this.frontGradientColor.color = frontStyle?.fillColor ?? "black";
          this.frontFills.forEach(fill => (fill.fill = this.frontGradient));
        }

        // BACK
        const backStyle = this.styleOptions.get(StyleEditPanels.Back);
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.contrastFillColor(frontStyle?.fillColor ?? "black") ===
            "noFill"
          ) {
            this.backFills.forEach(fill => fill.noFill());
          } else {
            this.backGradientColor.color = Nodule.contrastFillColor(
              frontStyle?.fillColor ?? "black"
            );

            this.backFills.forEach(fill => (fill.fill = this.backGradient));
          }
        } else {
          if (backStyle?.fillColor === "noFill") {
            this.backFills.forEach(fill => fill.noFill());
          } else {
            this.backGradientColor.color = backStyle?.fillColor ?? "black";
            this.backFills.forEach(fill => (fill.fill = this.backGradient));
          }
        }
        break;
      }
    }
  }
}
