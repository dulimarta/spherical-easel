import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
import NonFreePoint from "@/plottables/NonFreePoint";
import { Vector3 } from "three";
import NonFreeLine from "@/plottables/NonFreeLine";
import { SEAngleMarker } from "./SEAngleMarker";

export class SENSectLine extends SELine {
  /**
   * The angle parent of this SENSectLine
   */
  private _seAngleParent: SEAngleMarker;
  private _N: number; // the angle is divided into N pieces (so for bisection N=2, for trisection N=3)
  private _index: number; // This is point _index of _N . _index can have the values of 1 <= _index < _N

  private tempVector = new Vector3();
  /**
   *
   * @param line The plottable
   * @param seAngleParent
   * @param index
   * @param N
   */
  constructor(
    line: NonFreeLine,
    startSEPoint: SEPoint,
    normalVector: Vector3,
    endSEPoint: SEPoint,
    seAngleParent: SEAngleMarker,
    index: number,
    N: number
  ) {
    super(line, startSEPoint, normalVector, endSEPoint);
    this._seAngleParent = seAngleParent;
    this._index = index;
    this._N = N;
  }

  public get noduleDescription(): string {
    if (this._N === 2) {
      return String(
        i18n.t(`objectTree.aMidLineOf`, {
          angle: this._seAngleParent.label?.ref.shortUserName
        })
      );
    } else {
      return String(
        i18n.t(`objectTree.anNsectLineOf`, {
          angle: this._seAngleParent.label?.ref.shortUserName,
          index: this._index,
          N: this._N
        })
      );
    }
  }

  get seAngleParent(): SEAngleMarker {
    return this._seAngleParent;
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

    this._exists = this._seAngleParent.exists;

    if (this._exists) {
      // update the startSEPoint
      this.startSEPoint.locationVector = this._seAngleParent.vertexVector;

      // create the orthonormal frame with the z -axis as this.startSEPoint.locationVector
      const fromVector = new Vector3();
      fromVector.copy(this._seAngleParent.startVector);
      fromVector
        .addScaledVector(
          this._seAngleParent.vertexVector,
          -1 *
            this._seAngleParent.vertexVector.dot(
              this._seAngleParent.startVector
            )
        )
        .normalize();

      const toVector = new Vector3();
      toVector.crossVectors(this._seAngleParent.vertexVector, fromVector)
        .normalize;
      const angle = this._seAngleParent.value;

      // The other (end) point on the line is the point at
      // fromVector*cos(angle*(index/N)) + toVector*sin(angle *index/N)
      fromVector.multiplyScalar(Math.cos((angle * this._index) / this._N));
      toVector.multiplyScalar(Math.sin((angle * this._index) / this._N));
      this.tempVector.addVectors(fromVector, toVector).normalize();
      this.endSEPoint.locationVector = this.tempVector;

      //update the normal vector
      this.tempVector
        .crossVectors(
          this.startSEPoint.locationVector,
          this.endSEPoint.locationVector
        )
        .normalize();
      this._normalVector.copy(this.tempVector);

      // Set the normal vector in the plottable object (the setter also calls the updateDisplay() method)
      this.ref.normalVector = this._normalVector;
    }

    // Update visibility
    if (this._showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    // These n sect lines are completely determined by their line/segment/point parents and an update on the parents
    // will cause this line to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `nSectLine with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "nSectLine", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }
  public isNonFreeLine(): boolean {
    return true;
  }
}
