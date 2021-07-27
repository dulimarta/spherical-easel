import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Circle from "@/plottables/Circle";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import SETTINGS from "@/global-settings";
import {
  DEFAULT_POLYGON_BACK_STYLE,
  DEFAULT_POLYGON_FRONT_STYLE
} from "@/types/Styles";
import { UpdateMode, UpdateStateType, PolygonState } from "@/types";
import { Labelable } from "@/types";
import { SELabel } from "@/models/SELabel";
import { SEStore } from "@/store";
import i18n from "@/i18n";
import { SESegment } from "./SESegment";
import { SEAngleMarker } from "./SEAngleMarker";
import Polygon from "@/plottables/Polygon";

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_POLYGON_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_POLYGON_BACK_STYLE)
]);
export class SEPolygon extends SENodule implements Visitable, Labelable {
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
  private _SEEdgeSegments: SESegment[] = [];
  private _segmentIsFlipped: boolean[] = [];

  /**
   * _angleMarkers[i] is the angle between _SESegments[i-1] and _SESegments[i]
   */
  private _angleMarkers: SEAngleMarker[] = [];

  /**
   * An array with the same length as _SEEdgeSegments containing the +1/-1 multiplier on the normal of SESegments, so
   * that a point pt is inside the polygon if and only if
   *
   *  pt dot ( _interiorDirectionMultipliers[i] * SEEdgeSegments[i].normal) > 0
   *
   * for all i
   */
  private _interiorDirectionMultipliers: number[] = [];

  /** Temporary vectors */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();

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
    interiorDirectionMultipliers: number[],
    angleMarkers: SEAngleMarker[]
  ) {
    super();
    this.ref = poly;
    this._SEEdgeSegments.push(...edges);
    this._interiorDirectionMultipliers.push(...interiorDirectionMultipliers);
    this._segmentIsFlipped.push(...flippedBooleans);
    this._angleMarkers.push(...angleMarkers);

    SENodule.POLYGON_COUNT++;
    this.name = `Po${SENodule.POLYGON_COUNT}`;
  }

  customStyles(): Set<string> {
    return styleSet;
  }

  get SEEdgeSegments(): SESegment[] {
    return this._SEEdgeSegments;
  }

  get interiorDirectionMultipliers(): number[] {
    return this._interiorDirectionMultipliers;
  }

  get segmentFlippedList(): boolean[] {
    return this._segmentIsFlipped;
  }

  public get noduleDescription(): string {
    let edgeNames = "";
    this._SEEdgeSegments.forEach(seg => {
      edgeNames = edgeNames + seg.label?.ref.shortUserName + ", ";
    });
    edgeNames = edgeNames.substring(0, edgeNames.length - 2);
    if (this._SEEdgeSegments.length === 3) {
      return String(
        i18n.t(`objectTree.triangleWithEdges`, {
          edges: edgeNames
        })
      );
    } else {
      return String(
        i18n.t(`objectTree.polygonWithEdges`, {
          edges: edgeNames
        })
      );
    }
  }

  public get noduleItemText(): string {
    return this.label?.ref.shortUserName ?? "No Label Short Name In SEPolygon";
  }

  get area(): number {
    let sumOfAngles = 0;
    this._angleMarkers.forEach(ang => {
      sumOfAngles = +ang.value;
    });
    return sumOfAngles - this._angleMarkers.length * Math.PI;
  }

  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    const interior: boolean[] = [];
    this._SEEdgeSegments.forEach((seg, ind) => {
      this.tmpVector.copy(seg.normalVector);
      this.tmpVector.multiplyScalar(this._interiorDirectionMultipliers[ind]);
      interior.push(
        unitIdealVector.dot(this.tmpVector) >
          -SETTINGS.polygon.hitIdealDistance / currentMagnificationFactor
      );
    });
    return interior.every(bol => bol === true);
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);

    // All parent segments must exist (This is equivalent to checking that all the angle markers exist)
    this._exists = this._SEEdgeSegments.every(seg => seg.exists === true);

    const n = this._SEEdgeSegments.length;
    if (this._exists) {
      // All vertices must be far enough away from any nonadjacent edge to exist
      for (let i = 0; i < this._SEEdgeSegments.length; i++) {
        let vertex: SEPoint;
        if (this._segmentIsFlipped[i]) {
          vertex = this._SEEdgeSegments[i].endSEPoint;
        } else {
          vertex = this._SEEdgeSegments[i].startSEPoint;
        }

        for (let j = 0; j < this._SEEdgeSegments.length; j++) {
          // don't check the segments that are adjacent to the vertex
          if (j !== i || j !== (((i - 1) % n) + n) % n) {
            if (
              this._SEEdgeSegments[j]
                .closestVector(vertex.locationVector)
                .angleTo(vertex.locationVector) <
              SETTINGS.polygon.minimumVertexToEdgeThickness
            ) {
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
      for (let i = 0; i < this._SEEdgeSegments.length; i++) {
        const intersectionPointListWithParentSegi = SEStore.findIntersectionPointsByParent(
          this._SEEdgeSegments[i].name
        );
        for (let j = 0; j < this._SEEdgeSegments.length; j++) {
          // don't check the segments that are adjacent to the segment
          if (j !== (((i + 1) % n) + n) % n || j !== (((i - 1) % n) + n) % n) {
            if (
              intersectionPointListWithParentSegi.some(pt => {
                if (pt.name.includes(this._SEEdgeSegments[i].name)) {
                  return pt.exists; // this will get executed *twice* as every pair of segments intersects twice
                } else {
                  return false;
                }
              })
            ) {
              // no need to keep searching break out of the inner loop
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

    if (this._exists) {
      // update the interior direction multipliers
      this._SEEdgeSegments.forEach((seg, index) => {
        const nextIndex = (((index + 1) % n) + n) % n;
        const testVector = this._SEEdgeSegments[nextIndex].getMidPointVector();
        if (
          this._angleMarkers[nextIndex].value <
          Math.PI - SETTINGS.tolerance
        ) {
          // When the angle is less than Pi
          // the normal vector to this._SEEdgeSegments[index] and testVector should be on the
          // same side of the line containing this._SEEdgeSegments[index]
          if (this._SEEdgeSegments[index].normalVector.dot(testVector) > 0) {
            this._interiorDirectionMultipliers[index] = 1;
          } else {
            this._interiorDirectionMultipliers[index] = -1;
          }
        } else if (
          this._angleMarkers[nextIndex].value >
          Math.PI + SETTINGS.tolerance
        ) {
          // When the angle is greater than Pi
          // the normal vector to this._SEEdgeSegments[index] and testVector are on the
          // opposite sides of the line containing this._SEEdgeSegments[index]
          if (this._SEEdgeSegments[index].normalVector.dot(testVector) > 0) {
            this._interiorDirectionMultipliers[index] = -1;
          } else {
            this._interiorDirectionMultipliers[index] = 1;
          }
        } else {
          // We have a straight angle, record a zero and fix after this first pass
          this._interiorDirectionMultipliers[index] = 0;
        }
      });
      // handle the angles that are exactly pi (within SETTINGS.tolerance)
      while (this._interiorDirectionMultipliers.some(val => val === 0)) {
        const zeroIndex = this._interiorDirectionMultipliers.findIndex(
          val => val === 0
        );
        let nextNonZeroIndex = zeroIndex; // temporary assignment
        for (let i = 1; i < this._interiorDirectionMultipliers.length; i++) {
          //search the (zeroIndex plus i) mod n for the next non-zero
          const nextIndex = (((zeroIndex + 1) % n) + n) % n;
          if (this._interiorDirectionMultipliers[nextIndex] !== 0) {
            nextNonZeroIndex = nextIndex;
            break;
          }
        }
        const testVector = this._SEEdgeSegments[
          nextNonZeroIndex
        ].getMidPointVector();
        if (this._angleMarkers[nextNonZeroIndex].value < Math.PI) {
          // When the angle is less than Pi
          // the normal vector to this._SEEdgeSegments[nextNonZeroIndex] and testVector should be on the
          // same side of the line containing this._SEEdgeSegments[nextNonZeroIndex]
          if (
            this._SEEdgeSegments[nextNonZeroIndex].normalVector.dot(
              testVector
            ) > 0
          ) {
            this._interiorDirectionMultipliers[nextNonZeroIndex] = 1;
          } else {
            this._interiorDirectionMultipliers[nextNonZeroIndex] = -1;
          }
        } else if (this._angleMarkers[nextNonZeroIndex].value > Math.PI) {
          // When the angle is greater than Pi
          // the normal vector to this._SEEdgeSegments[nextNonZeroIndex] and testVector are on the
          // opposite sides of the line containing this._SEEdgeSegments[nextNonZeroIndex]
          if (
            this._SEEdgeSegments[nextNonZeroIndex].normalVector.dot(
              testVector
            ) > 0
          ) {
            this._interiorDirectionMultipliers[nextNonZeroIndex] = -1;
          } else {
            this._interiorDirectionMultipliers[nextNonZeroIndex] = 1;
          }
        } else {
          throw new Error(
            "SEPolygon: Updating the interiorDirectionMultipliers. This angle should not be PI."
          );
        }
      }

      // display the new polygon with the updated values
      this.ref.area = this.area; // must be updated so that the display polygon is rendered correctly
      this.ref.updateDisplay();
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // These polygons are completely determined by their angle marker parents and an update on the parents
    // will cause this polygon to be put into the correct location. Therefore there is no need to
    // store it in the stateArray for undo move. Only store for delete

    if (state.mode == UpdateMode.RecordStateForDelete) {
      const polygonState: PolygonState = {
        kind: "polygon",
        object: this
      };
      state.stateArray.push(polygonState);
    }

    this.updateKids(state);
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
    this._SEEdgeSegments.forEach(seg => {
      this.tmpVector.copy(seg.closestVector(idealUnitSphereVector));
      const distanceToSeg = this.tmpVector.angleTo(idealUnitSphereVector);
      if (distanceToSeg < minimumDistance) {
        minimumDistance = distanceToSeg;
        minimumDistanceVector.copy(this.tmpVector);
      }
    });

    return minimumDistanceVector.normalize();
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

  // I wish the SENodule methods would work but I couldn't figure out how
  // See the attempts in SENodule around line 218
  public isFreePoint(): boolean {
    return false;
  }
  public isOneDimensional(): boolean {
    return false;
  }
  public isPoint(): boolean {
    return false;
  }
  public isPointOnOneDimensional(): boolean {
    return false;
  }
  public isLabel(): boolean {
    return false;
  }
  public isSegmentOfLengthPi(): boolean {
    return false;
  }
  public isLabelable(): boolean {
    return true;
  }
  public isNonFreeLine(): boolean {
    return false;
  }
}
