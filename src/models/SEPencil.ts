import { DisplayStyle } from "@/plottables/Nodule";
import NonFreeLine from "@/plottables/NonFreeLine";
import NonFreePoint from "@/plottables/NonFreePoint";
import { ObjectState } from "@/types";
import {
  DEFAULT_LINE_BACK_STYLE,
  DEFAULT_LINE_FRONT_STYLE
} from "@/types/Styles";
import { Vector3 } from "three";
import { SENodule } from "./SENodule";
import { SEParametric } from "./SEParametric";
import { SEPerpendicularLineThruPoint } from "./SEPerpendicularLineThruPoint";
import { SEPoint } from "./SEPoint";
import { SEStore } from "@/store";
const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_LINE_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_LINE_BACK_STYLE)
]);

export class SEPencil extends SENodule {
  private _commonPoint: SEPoint;
  private _commonParent: SEParametric;
  private _lines: Array<SEPerpendicularLineThruPoint> = [];
  private tempVector: Vector3 = new Vector3();
  constructor(
    seParent: SEParametric,
    commontPoint: SEPoint,
    lines: Array<SEPerpendicularLineThruPoint>
  ) {
    super();
    this._commonPoint = commontPoint;
    this._commonParent = seParent;
    this._lines.push(...lines);
  }
  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // This doesn't follow the usual outline of an update method because SEPencil is not in the DAG

    console.debug("Updating SEPencil");

    const normals = this._commonParent.getNormalsToPerpendicularLinesThru(
      this._commonPoint.locationVector,
      this._lines[0].normalVector
    );
    const N = this._lines.length;
    if (normals.length > N) {
      const numMissing = normals.length - N;
      console.debug(`Must allocate ${numMissing} new perpendicular line(s)`);
      for (let k = N; k < normals.length; k++) {
        const plottableEndPoint = new NonFreePoint();
        const endSEPoint = new SEPoint(plottableEndPoint);
        endSEPoint.showing = false;
        endSEPoint.exists = true;

        //endSEPoint.locationVector = this._commonParent.ref.P(normals[k].tVal); // Not a good choice. What if the _commonPoint is on the curve? Then endSEPoint is the same as _commonPoint!
        this.tempVector.crossVectors(
          this._commonPoint.locationVector,
          normals[k].normal
        );
        endSEPoint.locationVector = this.tempVector.normalize();

        const plottableLine = new NonFreeLine();
        plottableLine.stylize(DisplayStyle.ApplyCurrentVariables);
        plottableLine.adjustSize();
        const newPerpLine = new SEPerpendicularLineThruPoint(
          plottableLine,
          this._commonParent,
          this._commonPoint,
          normals[k].normal,
          endSEPoint,
          k
        );
        // TODO: create SELabel and register it
        newPerpLine.seParentPencil = this;
        this._commonPoint.registerChild(newPerpLine);
        this._commonParent.registerChild(newPerpLine);
        this._lines.push(newPerpLine);
        SEStore.addLine(newPerpLine);
      }
    }
    // SEPencil is not in the DAG so it has no kids and updateKids does not need to be called.
  }

  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    return false;
  }

  public get commonPoint(): SEPoint {
    return this._commonPoint;
  }
  public get commonParametric(): SEParametric {
    return this._commonParent;
  }
  public get lines(): Array<SEPerpendicularLineThruPoint> {
    return this._lines;
  }
  public customStyles(): Set<string> {
    return styleSet;
  }
  public get noduleDescription(): string {
    return "Pencil of lines";
  }
  public get noduleItemText(): string {
    return "Pencil of lines";
  }

  public isNonFreeLine(): boolean {
    return true;
  }

  public isOneDimensional(): boolean {
    return true;
  }
}
