import { SENodule } from "./SENodule";
import { Vector3, Matrix4, UniformsLib } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import SETTINGS from "@/global-settings";
import {
  DEFAULT_POLYGON_BACK_STYLE,
  DEFAULT_POLYGON_FRONT_STYLE
} from "@/types/Styles";
import { ObjectState } from "@/types";
import { Labelable } from "@/types";
import { SELabel } from "@/models/SELabel";
import { SEStore } from "@/store";
import i18n from "@/i18n";
import { SESegment } from "./SESegment";
import { SEAngleMarker } from "./SEAngleMarker";
import Polygon from "@/plottables/Polygon";
import { SEExpression } from "./SEExpression";

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_POLYGON_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_POLYGON_BACK_STYLE)
]);
export class SEPolygon extends SEExpression implements Visitable, Labelable {
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public ref: Polygon;
  /**
   * Pointer to the label of this SEPolygon
   */
  public label?: SELabel;
  /**
   * The model SESegments that are the boundary of this polygon are stored in _SEEdgeSegments
   * These are listed so that tracing out the segment boundary in order
   *
   *  _SEEdgeSegments[0] to _SEEdgeSegments[1] to ... to _SEEdgeSegments[length-1] to _SEEdgeSegments[0]
   *
   * is positive (where positive means that the interior of the polygon is on the right when traced this way).
   *
   * The _segmentIsFlipped are chosen so that
   * if _segmentIsFlipped[i]===true
   * then
   * _SEEdgeSegments[i].endSEPoint to _SEEdgeSegments[i].startSEPoint is the positive direction in edge _SEEdgeSegments[i]
   * else
   *  _SEEdgeSegments[i].startSEPoint to _SEEdgeSegments[i].endSEPoint is the positive direction in edge _SEEdgeSegments[i]
   *
   */
  private _seEdgeSegments: SESegment[] = [];
  private _segmentIsFlipped: boolean[] = [];

  /**
   * _angleMarkers[i] is the angle between _SESegments[i-1] and _SESegments[i]
   */
  private _angleMarkers: SEAngleMarker[] = [];

  /**
   * The number of this polygon when it was created (i.e. this is the number polygons have created so far)
   */
  private _polygonNumber = 0;

  /** Temporary vectors */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();

  //** The number of edges in this polygon */
  private _n: number;

  /** The area of the polygon */
  private _area = 0;
  /**
   * Create a model SEPolygon using:
   * @param poly The plottable TwoJS Object associated to this object
   * @param edges
   * @param orderBooleans
   * @param interiorDirectionMultipliers
   * @param angleMarkers
   */
  constructor(
    poly: Polygon,
    edges: SESegment[],
    flippedBooleans: boolean[],
    angleMarkers: SEAngleMarker[]
  ) {
    super();
    this.ref = poly;
    this._seEdgeSegments.push(...edges);
    this._segmentIsFlipped.push(...flippedBooleans);
    this._angleMarkers.push(...angleMarkers);
    this._n = this._seEdgeSegments.length;

    this._valueDisplayMode = SETTINGS.polygon.initialValueDisplayMode;
    // SEPolygon is both an expression and a plottable (not the only one)
    // As an expression to be used in the calculation this.name must be "M###" so that it
    // can be referenced by the user and found by the parser
    // however we don't want the initial shortName of the angle marker's label to be displayed with a "M###"
    //  so we record the angleMarkerNumber and then in SELabel, we set the short name of the Label using this field.
    // The M### name is defined in the SEExpression constructor
    SENodule.POLYGON_COUNT++;
    this._polygonNumber = SENodule.POLYGON_COUNT;
  }

  customStyles(): Set<string> {
    return styleSet;
  }

  get seEdgeSegments(): SESegment[] {
    return this._seEdgeSegments;
  }

  get segmentFlippedList(): boolean[] {
    return this._segmentIsFlipped;
  }

  public get noduleDescription(): string {
    let edgeNames = "";
    this._seEdgeSegments.forEach(seg => {
      edgeNames = edgeNames + seg.label?.ref.shortUserName + ", ";
    });
    edgeNames = edgeNames.substring(0, edgeNames.length - 2);
    if (this._seEdgeSegments.length === 2) {
      return String(
        i18n.t(`objectTree.bigonWithEdges`, {
          edges: edgeNames,
          val: this._area
        })
      );
    } else if (this._seEdgeSegments.length === 3) {
      return String(
        i18n.t(`objectTree.triangleWithEdges`, {
          edges: edgeNames,
          val: this._area
        })
      );
    } else {
      return String(
        i18n.t(`objectTree.polygonWithEdges`, {
          edges: edgeNames,
          val: this._area
        })
      );
    }
  }

  public get noduleItemText(): string {
    return (
      this.name +
      " - " +
      this.label?.ref.shortUserName +
      `: ${this.prettyValue}`
    );
  }

  /**
   * the area of the polygon
   */
  get value(): number {
    return this._area;
  }

  get polygonNumber(): number {
    return this._polygonNumber;
  }

  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    //first make sure the unitIdeal is not a point on any of the line segments
    if (
      this._seEdgeSegments.some(seg =>
        seg.isHitAt(unitIdealVector, currentMagnificationFactor)
      )
    ) {
      // console.log(
      //   "Here inside hit a segment showing?",
      //   this.showing,
      //   this.exists
      // );
      return true;
    }
    // find the closest vertex of the polygon (to each edge, the vertex is the *last* one on the edge in the direction the edge is traced)
    const center = new Vector3();
    let closestSegmentIndex = -1;
    let closestDistance = 2 * Math.PI; // set to a number bigger than all possible distances
    this._seEdgeSegments.forEach((seg, ind) => {
      let distance: number;
      if (this.segmentFlippedList[ind]) {
        distance = seg.startSEPoint.locationVector.angleTo(unitIdealVector);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSegmentIndex = ind;
          center.copy(seg.endSEPoint.locationVector);
        }
      } else {
        distance = seg.endSEPoint.locationVector.angleTo(unitIdealVector);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSegmentIndex = ind;
          center.copy(seg.endSEPoint.locationVector);
        }
      }
    });

    // create a point, P, inside the polygon and near the closest point, then connect unitIdealVector with P and count the intersection (intersections with vertices are not allowed!)
    // with the line segment edges. If the number of intersections is even, unitIdealVector is inside, if odd, outside.

    // first create P near angleMarkers[index+1] which measures the angle from SEEdgeSegments[index] to SEEdgeSegments[index+1]
    // set up a coordinate frame with
    //   center being the common point of SEEdgeSegments[index] and SEEdgeSegments[index+1]
    //   from being a vector in the plane of SEEdgeSegments[index]. Traveling from Q along SEEdgeSegments[index] for Pi/2 angle you arrive at from
    const from = new Vector3();
    const to = new Vector3();
    if (this.segmentFlippedList[closestSegmentIndex]) {
      center.copy(
        this._seEdgeSegments[closestSegmentIndex].startSEPoint.locationVector
      );
    } else {
      center.copy(
        this._seEdgeSegments[closestSegmentIndex].endSEPoint.locationVector
      );
    }
    to.crossVectors(
      center,
      this._seEdgeSegments[closestSegmentIndex].getMidPointVector()
    ).normalize();
    from.crossVectors(to, center).normalize();

    // compute the next index
    const nextIndex =
      (((closestSegmentIndex + 1) % this._n) + this._n) % this._n;
    // read the angle at the closest vector
    const angle = this._angleMarkers[nextIndex].value;
    // P is   sin(SETTINGS.minimumVertexToEdgeThickness/2)*cos(angle/2)*from +
    //        sin(SETTINGS.minimumVertexToEdgeThickness/2)*sin(angle/2)*to +
    //                     cos(SETTINGS.minimumVertexToEdgeThickness/2)*center
    // angle = SETTINGS.polygon.minimumVertexToEdgeThickness / 2 so the point is guaranteed to be inside the polygon
    const P = new Vector3(0, 0, 0);
    P.addScaledVector(
      from,
      Math.sin(SETTINGS.polygon.minimumVertexToEdgeThickness / 2) *
        Math.cos(angle / 2)
    );
    P.addScaledVector(
      to,
      Math.sin(SETTINGS.polygon.minimumVertexToEdgeThickness / 2) *
        Math.sin(angle / 2)
    );
    P.addScaledVector(
      center,
      Math.cos(SETTINGS.polygon.minimumVertexToEdgeThickness / 2)
    );
    P.normalize();

    closestDistance = P.angleTo(unitIdealVector);

    // compute the perpendicular to the line through P and unitIdealVector
    const perpToLineThroughPAndUnitIdealVector = new Vector3();
    perpToLineThroughPAndUnitIdealVector.crossVectors(P, unitIdealVector);
    if (perpToLineThroughPAndUnitIdealVector.isZero(SETTINGS.tolerance)) {
      // P and unitIdealVector are the same or antipodal and any vector perpendicular to P will do
      perpToLineThroughPAndUnitIdealVector.crossVectors(
        P,
        new Vector3(-P.y, P.x, 0).normalize()
      );
      if (perpToLineThroughPAndUnitIdealVector.isZero(SETTINGS.tolerance)) {
        // P is the vector (0,0,+/- 1)
        perpToLineThroughPAndUnitIdealVector.crossVectors(
          P,
          new Vector3(-P.z, 0, P.x).normalize()
        );
      }
    }
    perpToLineThroughPAndUnitIdealVector.normalize();

    // now decide which edges of the polygon can possibly intersect the line segment from the interior point near the closest
    // There are two types of segments to exclude
    //  1) If the end points of the segment are on the same side of the plane containing the segment from P to unitIdealVector and the length of the segment is less than Pi
    //  2) If the angle between the plane containing the segment and P is bigger than closestDistance
    const segmentsToCheck: SESegment[] = [];
    this._seEdgeSegments.forEach((seg, ind) => {
      // check condition 1
      if (
        perpToLineThroughPAndUnitIdealVector.dot(
          seg.endSEPoint.locationVector
        ) *
          perpToLineThroughPAndUnitIdealVector.dot(
            seg.startSEPoint.locationVector
          ) >
          0 &&
        seg.arcLength < Math.PI
      ) {
        return;
      }
      // check condition 2
      // make sure that P and the normal vector to the segment are pointing in the same direction
      if (P.dot(seg.normalVector) > 0) {
        this.tmpVector.copy(seg.normalVector);
      } else {
        this.tmpVector.copy(seg.normalVector).multiplyScalar(-1);
      }

      if (Math.PI / 2 - P.angleTo(this.tmpVector) > closestDistance) {
        return;
      }
      segmentsToCheck.push(seg);
    });

    // console.log("number of excluded segments", this._n - segmentsToCheck.length);
    // how many times does the segment (of length less than or equal to pi) from P to unitIdealVector, called S
    //  cross on the edges of the polygon? if even  unitIdealVector is inside the polygon, if not unitIdealVector is outside

    let totalNumberOfCrossings = 0;
    segmentsToCheck.forEach(seg => {
      // compute the number of intersections between S and seg, the intersections possibly occur at +/- normalToSeg cross perpToLineThroughPAndUnitIdealVector
      const possibleIntersectionLocation = new Vector3();
      possibleIntersectionLocation
        .crossVectors(seg.normalVector, perpToLineThroughPAndUnitIdealVector)
        .normalize();
      let sumOfDistancesFromPAndUnitIdeal =
        P.angleTo(possibleIntersectionLocation) +
        unitIdealVector.angleTo(possibleIntersectionLocation);

      // check to see if the possibleIntersection is on *both* the segment and the P to unitIdeal segment
      if (
        seg.onSegment(possibleIntersectionLocation) &&
        Math.abs(sumOfDistancesFromPAndUnitIdeal - closestDistance) <
          SETTINGS.tolerance
      ) {
        // check to make sure the intersection isn't either endpoint
        if (
          this.tmpVector
            .subVectors(
              seg.startSEPoint.locationVector,
              possibleIntersectionLocation
            )
            .isZero(SETTINGS.tolerance) ||
          this.tmpVector
            .subVectors(
              seg.endSEPoint.locationVector,
              possibleIntersectionLocation
            )
            .isZero(SETTINGS.tolerance)
        ) {
          throw new Error(
            "Polygon: The line from a point interior to unitIdealVector passes through a vertex!"
          );
        } else {
          totalNumberOfCrossings += 1;
        }
      }
      possibleIntersectionLocation.multiplyScalar(-1);
      sumOfDistancesFromPAndUnitIdeal =
        P.angleTo(possibleIntersectionLocation) +
        unitIdealVector.angleTo(possibleIntersectionLocation);

      // check to see if the possibleIntersection is on *both* the segment and the P to unitIdeal segment
      if (
        seg.onSegment(possibleIntersectionLocation) &&
        Math.abs(sumOfDistancesFromPAndUnitIdeal - closestDistance) <
          SETTINGS.tolerance
      ) {
        // check to make sure the intersection isn't either endpoint
        if (
          this.tmpVector
            .subVectors(
              seg.startSEPoint.locationVector,
              possibleIntersectionLocation
            )
            .isZero(SETTINGS.tolerance) ||
          this.tmpVector
            .subVectors(
              seg.endSEPoint.locationVector,
              possibleIntersectionLocation
            )
            .isZero(SETTINGS.tolerance)
        ) {
          throw new Error(
            "Polygon: The line from a point interior to unitIdealVector passes through a vertex!"
          );
        } else {
          totalNumberOfCrossings += 1;
        }
      }
    });

    return totalNumberOfCrossings % 2 === 0;
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    // All parent segments must exist (This is equivalent to checking that all the angle markers exist)
    this._exists = this._seEdgeSegments.every(seg => seg.exists === true);

    if (this._exists) {
      // All vertices must be far enough away from any nonadjacent edge to exist
      for (let i = 0; i < this._n; i++) {
        let nextVertex: Vector3; // the next vertex is common to segment i and i+1
        if (this._segmentIsFlipped[i]) {
          nextVertex = this._seEdgeSegments[i].startSEPoint.locationVector;
        } else {
          nextVertex = this._seEdgeSegments[i].endSEPoint.locationVector;
        }

        for (let j = 0; j < this._n; j++) {
          // don't check the segments that are adjacent to the vertex
          if (j !== i && j !== (((i + 1) % this._n) + this._n) % this._n) {
            if (
              this._seEdgeSegments[j]
                .closestVector(nextVertex)
                .angleTo(nextVertex) <
              SETTINGS.polygon.minimumVertexToEdgeThickness
            ) {
              console.log(
                "too close",
                this._seEdgeSegments[i].name,
                this._seEdgeSegments[j].name
              );
              // break out of the inner loop if we hit a false value (i.e. a vertex is too close to an edge)
              this._exists = false;
              break;
            }
          }
        }
        // break out of the first loop if we hit a false value on the inner loop
        if (!this._exists) {
          break;
        }
      }
    }
    // All segments must only intersect at endpoints
    if (this._exists) {
      for (let i = 0; i < this._n; i++) {
        for (let j = 0; j < this._n; j++) {
          // don't check the segments that are adjacent to segment[i] (or the ith segment)
          if (
            j !== (((i + 1) % this._n) + this._n) % this._n &&
            j !== i &&
            j !== (((i - 1) % this._n) + this._n) % this._n
          ) {
            if (
              SEStore.findIntersectionPointsByParent(
                this._seEdgeSegments[i].name,
                this._seEdgeSegments[j].name
              ).some(pt => pt.exists)
            ) {
              // console.log(
              //   "intersection",
              //   i,
              //   this._seEdgeSegments[i].name,
              //   j,
              //   this._seEdgeSegments[j].name
              // );
              // SEStore.findIntersectionPointsByParent(
              //   this._seEdgeSegments[i].name,
              //   this._seEdgeSegments[j].name
              // ).forEach(pt => console.log(pt));

              // the ith segment intersects the j th segment
              this._exists = false;
              break;
            }
          }
        }
        // break out of the first loop if we hit a false value on the inner loop
        if (!this._exists) {
          break;
        }
      }
    }

    // all the angle markers must exist too
    if (this._exists && this._angleMarkers.every(angMark => angMark.exists)) {
      // update the area
      let sumOfAngles = 0;
      this._angleMarkers.forEach(ang => {
        sumOfAngles += ang.value;
      });
      this._area = sumOfAngles - (this._n - 2) * Math.PI;

      //update the display
      this.ref.area = this._area;
      this.ref.updateDisplay();
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    // These polygons are completely determined by their line/segment/point parents and an update on the parents
    // will cause this polygon to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      orderedSENoduleList.push(this.id);
      if (objectState.has(this.id)) {
        console.log(
          `Polygon with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "polygon", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  /**
   * Return the vector on the SEPolygon that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    // check to see if the idealUnitSphereVector is inside of the polygon
    if (this.isHitAt(idealUnitSphereVector, SEStore.zoomMagnificationFactor)) {
      return idealUnitSphereVector;
    }
    // the ideal unit vector is NOT inside the polygon
    let minimumDistance = 2 * Math.PI; // something larger that the maximum distance from any point to a line segment
    const minimumDistanceVector = new Vector3();
    this._seEdgeSegments.forEach(seg => {
      this.tmpVector.copy(seg.closestVector(idealUnitSphereVector));
      const distanceToSeg = this.tmpVector.angleTo(idealUnitSphereVector);
      if (distanceToSeg < minimumDistance) {
        minimumDistance = distanceToSeg;
        minimumDistanceVector.copy(this.tmpVector);
      }
    });

    return minimumDistanceVector.normalize();
  }

  public getNormalsToLineThru(
    sePointVector: Vector3,
    oldNormal: Vector3,
    useFullTInterval?: boolean
  ): Vector3[] {
    throw new Error("Method not implemented.");
  }

  /**
   * Return the vector near the SECircle (within SETTINGS.polygon.maxLabelDistance) that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestLabelLocationVector(idealUnitSphereVector: Vector3): Vector3 {
    // First find the closest point on the polygon to the idealUnitSphereVector
    this.tmpVector.copy(this.closestVector(idealUnitSphereVector));

    // The current magnification level
    const mag = SEStore.zoomMagnificationFactor;

    // If the idealUnitSphereVector is within the tolerance of the closest point, do nothing, otherwise return the vector in the plane of the ideanUnitSphereVector and the closest point that is at the tolerance distance away.
    if (
      this.tmpVector.angleTo(idealUnitSphereVector) <
      SETTINGS.polygon.maxLabelDistance / mag
    ) {
      return idealUnitSphereVector;
    } else {
      // tmpVector1 is the normal to the plane of the closest point vector and the idealUnitVector
      // This can't be zero because tmpVector can be the closest on the segment to idealUnitSphereVector and parallel with ideanUnitSphereVector
      this.tmpVector1
        .crossVectors(idealUnitSphereVector, this.tmpVector)
        .normalize();
      // compute the toVector (so that tmpVector2= toVector, tmpVector= fromVector, tmpVector1 form an orthonormal frame)
      this.tmpVector2.crossVectors(this.tmpVector, this.tmpVector1).normalize;
      // return cos(SETTINGS.segment.maxLabelDistance)*fromVector/tmpVec + sin(SETTINGS.segment.maxLabelDistance)*toVector/tmpVec2
      this.tmpVector2.multiplyScalar(
        Math.sin(SETTINGS.polygon.maxLabelDistance / mag)
      );
      return this.tmpVector2
        .addScaledVector(
          this.tmpVector,
          Math.cos(SETTINGS.polygon.maxLabelDistance / mag)
        )
        .normalize();
    }
  }
  accept(v: Visitor): void {
    v.actionOnPolygon(this);
  }

  public isLabelable(): boolean {
    return true;
  }
}
