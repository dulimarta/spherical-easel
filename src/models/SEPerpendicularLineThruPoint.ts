import { SEPoint } from "./SEPoint";
import { ObjectState, SEOneDimensional } from "@/types";

import { SELine } from "./SELine";
import { Vector3 } from "three";
import Line from "@/plottables/Line";
import i18n from "@/i18n";
import { SESegment } from "./SESegment";
import { SECircle } from "./SECircle";
import { SEEllipse } from "./SEEllipse";
import { SEParametric } from "./SEParametric";
import { SEPencil } from "./SEPencil";

export class SEPerpendicularLineThruPoint extends SELine {
  /**
   * The One-Dimensional parent of this SEPerpendicularLine
   */
  private seParentOneDimensional: SEOneDimensional;
  public seParentPencil: SEPencil | null = null;

  /**
   * The point parent of this SEPerpendicularLine
   */

  private seParentPoint: SEPoint;

  /** Temporary vectors to help with calculations */

  private tempVector1 = new Vector3();

  /**
   * In the case of ellipses (or parametric curves in general)
   * there can be multiple number of perpendiculars through a point, this is the index to use
   */
  private _index: number;
  // private _pencilSize: number;
  /**
   * Create an intersection point between two one-dimensional objects
   * @param line the TwoJS Line associated with this intersection
   * @param seParentOneDimensional The one-dimensional parent
   * @param seParentPoint The point parent
   * @param normalVector
   * @param seEndPoint
   * @param index
   */
  constructor(
    line: Line,
    seParentOneDimensional: SEOneDimensional,
    seParentPoint: SEPoint,
    normalVector: Vector3,
    seEndPoint: SEPoint,
    index: number
    // pencilSize: number
  ) {
    super(line, seParentPoint, normalVector, seEndPoint);
    this.ref = line;
    this.seParentOneDimensional = seParentOneDimensional;
    this.seParentPoint = seParentPoint;
    this._index = index;
    // this._pencilSize = pencilSize;
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    if (this.seParentPencil !== null) {
      if (!this.canUpdateNow()) {
        // If any one parent is not up to date, don't do anything
        return;
      }
    }

    this.setOutOfDate(false);

    this._exists =
      this.seParentOneDimensional.exists && this.seParentPoint.exists;

    if (this._exists) {
      this.seParentPencil?.update(); // SEParentPencil isn't in the DAG, so it only serves to create new perpendiculars
      const tVec = new Vector3();
      tVec.copy(this._normalVector);
      // console.log("before x", this.name, this._normalVector.x);
      // Get the normal(s) vector to the line
      const normals = this.seParentOneDimensional.getNormalsToPerpendicularLinesThru(
        this.seParentPoint.locationVector,
        this._normalVector // the soon to be old normal vector
      );

      // console.log(
      //   "angle change with returned normals",
      //   this.name,
      //   normals[this._index].angleTo(this._normalVector),
      //   this._normalVector.x
      // );

      if (normals[this._index] !== undefined) {
        this._normalVector.copy(normals[this._index].normal);

        // Given this.startPoint (in SELine)=this.seParentPoint and this.normalVector compute the endSEPoint
        // This is *never* undefined because the getNormalsToPerpendicularLinesThru *never* returns a point with
        //  location parallel to this.seParentPoint.locationVector
        this.tempVector1.crossVectors(
          this.seParentPoint.locationVector,
          this._normalVector
        );

        this.endSEPoint.locationVector = this.tempVector1.normalize();

        // Set the normal vector in the plottable object (the setter also calls the updateDisplay() method)
        this.ref.normalVector = this._normalVector;
        // console.log(
        //   "angle change",
        //   this.name,
        //   tVec.angleTo(this._normalVector),
        //   this._normalVector.x
        // );
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

    // These perpendicular lines are completely determined by their parametric parents and an update on the parents
    // will cause this line to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Perpendicular Lint Thru Point with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, {
        kind: "perpendicularLineThruPoint",
        object: this
      });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  set glowing(b: boolean) {
    super.glowing = b;
  }
  get index(): number {
    return this._index;
  }
  // get pencilSize(): number {
  //   return this._pencilSize;
  // }

  public get noduleDescription(): string {
    let oneDimensionalParentType;
    if (this.seParentOneDimensional instanceof SESegment) {
      oneDimensionalParentType = i18n.tc("objects.segments", 3);
    } else if (this.seParentOneDimensional instanceof SELine) {
      oneDimensionalParentType = i18n.tc("objects.lines", 3);
    } else if (this.seParentOneDimensional instanceof SECircle) {
      oneDimensionalParentType = i18n.tc("objects.circles", 3);
    } else if (this.seParentOneDimensional instanceof SEEllipse) {
      oneDimensionalParentType = i18n.tc("objects.ellipses", 3);
    } else if (this.seParentOneDimensional instanceof SEParametric) {
      oneDimensionalParentType = i18n.tc("objects.parametrics", 3);
    }

    return String(
      i18n.t(`objectTree.perpendicularLineThru`, {
        pt: this.seParentPoint.label?.ref.shortUserName,
        oneDimensionalParentType: oneDimensionalParentType,
        oneDimensionalParent: this.seParentOneDimensional.label?.ref
          .shortUserName,
        index: this._index
      })
    );
  }
  public isNonFreeLine(): boolean {
    return true;
  }
}
