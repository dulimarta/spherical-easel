import { SEPoint } from "./SEPoint";
import { SEOneDimensionalNotStraight, ObjectState } from "@/types";
import { SELine } from "./SELine";
import { Vector3 } from "three";
import Line from "@/plottables/Line";
import i18n from "@/i18n";
import { SECircle } from "./SECircle";
import { SEEllipse } from "./SEEllipse";
import { SEParametric } from "./SEParametric";

export class SETangentLineThruPoint extends SELine {
  /**
   * The One-Dimensional parent of this SETangentLine
   */
  private _seParentOneDimensional: SEOneDimensionalNotStraight;

  /**
   * The point parent of this SETangentLine
   */

  private _seParentPoint: SEPoint;

  /** Temporary vectors to help with calculations */

  private tempVector1 = new Vector3();

  /**
   * In the case of ellipses or parametrics where there are many possible tangents through a point, this is the index to use
   */
  private _index: number;
  /**
   * Create an intersection point between two one-dimensional objects
   * @param line the TwoJS Line associated with this intersection
   * @param _seParentOneDimensional The one-dimensional parent
   * @param _seParentPoint The point parent
   * @param normalVector
   * @param seEndPoint
   * @param index
   */
  constructor(
    line: Line,
    seParentOneDimensional: SEOneDimensionalNotStraight,
    seParentPoint: SEPoint,
    normalVector: Vector3,
    seEndPoint: SEPoint,
    index: number
  ) {
    super(line, seParentPoint, normalVector, seEndPoint);
    this.ref = line;
    this._seParentOneDimensional = seParentOneDimensional;
    this._seParentPoint = seParentPoint;
    this._index = index;
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);

    this._exists =
      this._seParentOneDimensional.exists && this._seParentPoint.exists;

    if (this._exists) {
      const tVec = new Vector3();
      tVec.copy(this._normalVector);
      // console.log("before x", this.name, this._normalVector.x);
      // Get the normal(s) vector to the line
      const normals = this._seParentOneDimensional.getNormalsToTangentLinesThru(
        this._seParentPoint.locationVector,
        true
      );

      if (normals[this._index] !== undefined) {
        this._normalVector.copy(normals[this._index]);

        // Given this.startPoint (in SELine)=this._seParentPoint and this.normalVector compute the endSEPoint
        // This is *never* undefined because the getNormalsToTangentLinesThru *never* returns a point with
        //  location parallel to this._seParentPoint.locationVector
        this.tempVector1.crossVectors(
          this._seParentPoint.locationVector,
          this._normalVector
        );

        this.endSEPoint.locationVector = this.tempVector1.normalize();

        // Set the normal vector in the plottable object (the setter also calls the updateDisplay() method)
        this.ref.normalVector = this._normalVector;
      } else {
        this._exists = false;
      }
    }
    // Update visibility
    if (this._exists && this._showing) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // These tangent lines are completely determined by their parametric parents and an update on the parents
    // will cause this line to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      orderedSENoduleList.push(this.id);
      if (objectState.has(this.id)) {
        console.log(
          `Tangent Line Though Point with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "tangentLineThruPoint", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  set glowing(b: boolean) {
    super.glowing = b;
  }

  get index(): number {
    return this._index;
  }

  get seParentOneDimensional(): SEOneDimensionalNotStraight {
    return this._seParentOneDimensional;
  }

  get seParentPoint(): SEPoint {
    return this._seParentPoint;
  }

  public get noduleDescription(): string {
    let oneDimensionalParentType;
    if (this._seParentOneDimensional instanceof SECircle) {
      oneDimensionalParentType = i18n.tc("objects.circles", 3);
    } else if (this._seParentOneDimensional instanceof SEEllipse) {
      oneDimensionalParentType = i18n.tc("objects.ellipses", 3);
    } else if (this._seParentOneDimensional instanceof SEParametric) {
      oneDimensionalParentType = i18n.tc("objects.parametrics", 3);
    }

    return String(
      i18n.t(`objectTree.tangentLineThru`, {
        pt: this._seParentPoint.label?.ref.shortUserName,
        oneDimensionalParentType: oneDimensionalParentType,
        oneDimensionalParent: this._seParentOneDimensional.label?.ref
          .shortUserName,
        index: this._index
      })
    );
  }
  public isNonFreeLine(): boolean {
    return true;
  }
}
