import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
import NonFreePoint from "@/plottables/NonFreePoint";
import { Vector3 } from "three";

export class SENSectPoint extends SEPoint {
  /**
   * The segment parent of this SENSectPoint
   */
  private _seSegmentParent: SESegment;
  private _N: number; // the segment is divided into N pieces (so for midpoints N=2, for trisection N=3)
  private _index: number; // This is point _index of _N . _index can have the values of 1 <= _index < _N

  /**
   *
   * @param point The plottable
   * @param seSegmentParent
   * @param index
   * @param N
   */
  constructor(
    point: NonFreePoint,
    seSegmentParent: SESegment,
    index: number,
    N: number
  ) {
    super(point);
    this._seSegmentParent = seSegmentParent;
    this._index = index;
    this._N = N;
  }

  public get noduleDescription(): string {
    if (this._N === 2) {
      return String(
        i18n.t(`objectTree.aMidPointOf`, {
          segment: this._seSegmentParent.label?.ref.shortUserName
        })
      );
    } else {
      return String(
        i18n.t(`objectTree.anNsectPointOf`, {
          segment: this._seSegmentParent.label?.ref.shortUserName,
          index: this._index,
          N: this._N
        })
      );
    }
  }

  get seSegmentParent(): SESegment {
    return this._seSegmentParent;
  }

  get N(): number {
    return this._N;
  }
  get index(): number {
    return this._index;
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this._exists = this._seSegmentParent.exists;

    if (this._exists) {
      const startVector = new Vector3();
      startVector.copy(this._seSegmentParent.startSEPoint.locationVector);
      const arcLength = this._seSegmentParent.arcLength;
      const normalVector = this._seSegmentParent.normalVector;

      const toAxis = new Vector3();
      toAxis
        .crossVectors(normalVector, startVector)
        .multiplyScalar(arcLength > Math.PI ? -1 : 1)
        .normalize();
      // this point is located at
      // startVector*cos(arcLength * index/N) + toAxis*sin(arcLength * index/N)
      startVector.multiplyScalar(Math.cos((arcLength * this._index) / this._N));
      toAxis.multiplyScalar(Math.sin((arcLength * this._index) / this._N));

      // Update the current location in the plottable
      this._locationVector.addVectors(startVector, toAxis).normalize();
      this.ref.positionVector = this._locationVector;
    }

    // Update visibility
    if (this._showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // These n sect points are completely determined by their line/segment/point parents and an update on the parents
    // will cause this point to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `nSectPoint with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "nSectPoint", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }
  public isNonFreePoint(): boolean {
    return true;
  }
  public isFreePoint(): boolean {
    return false;
  }
}
