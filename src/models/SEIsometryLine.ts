import Line from "@/plottables/Line";
import { Vector3 } from "three";
import { SEPoint } from "./SEPoint";
import { ObjectState, SEIsometry } from "@/types";
import i18n from "@/i18n";
import {
  DEFAULT_LINE_BACK_STYLE,
  DEFAULT_LINE_FRONT_STYLE
} from "@/types/Styles";
import { SELine } from "./SELine";
import { SETranslation } from "./SETranslation";
import { SERotation } from "./SERotation";
import { SEReflection } from "./SEReflection";
import { SEPointReflection } from "./SEPointReflection";

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_LINE_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_LINE_BACK_STYLE)
]);

export class SEIsometryLine extends SELine {
  /**
   * The parents of this SEIsometryLine
   */
  private _seParentLine: SELine;
  private _seParentIsometry: SEIsometry;
  private transType = "";

  /**
   * Create an SELine
   * @param line plottable (TwoJS) line associated with this line
   * @param lineStartSEPoint One Point on the line
   * @param normalVector The normal vector to the plane containing the line
   * @param lineEndSEPoint A second Point on the line
   */
  constructor(
    line: Line,
    lineStartSEPoint: SEPoint,
    normalVector: Vector3,
    lineEndSEPoint: SEPoint,
    seParentLine: SELine,
    seParentIsometry: SEIsometry
  ) {
    super(line, lineStartSEPoint, normalVector, lineEndSEPoint);
    this._seParentLine = seParentLine;
    this._seParentIsometry = seParentIsometry;
    if (this._seParentIsometry instanceof SETranslation) {
      this.transType = i18n.tc("objects.translations", 3);
    } else if (this._seParentIsometry instanceof SERotation) {
      this.transType = i18n.tc("objects.rotations", 3);
    } else if (this._seParentIsometry instanceof SEReflection) {
      this.transType = i18n.tc("objects.reflections", 3);
    } else if (this._seParentIsometry instanceof SEPointReflection) {
      this.transType = i18n.tc("objects.pointReflections", 3);
    }
  }
  get parentLine(): SELine {
    return this._seParentLine;
  }

  get parentIsometry(): SEIsometry {
    return this._seParentIsometry;
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.transformationObject`, {
        object: i18n.tc(`objects.lines`, 3),
        name: this._seParentLine.label?.ref.shortUserName,
        trans: this._seParentIsometry.name,
        transType: this.transType
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ?? "No Label Short Name In SEIsometryLine"
    );
  }

  public shallowUpdate(): void {
    this._exists = this._seParentIsometry.exists && this._seParentLine.exists;

    if (this._exists) {
      // Set the normal vector
      this.normalVector.copy(
        this.parentIsometry.f(this._seParentLine.normalVector)
      );

      ////////////////////////////////////////////////////////////////////////////////////////
      this.ref.normalVector = this.normalVector;
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this.shallowUpdate();

    // Lines are NOT completely determined by their parents so we store additional information
    // If the parent points of the line are antipodal, the normal vector determines the
    // plane of the line.
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Isometry Line with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      const normal = new Vector3();
      normal.copy(this._normalVector);
      objectState.set(this.id, {
        kind: "isometryLine",
        object: this,
        normalVector: normal
      });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public isNonFreeLine(): boolean {
    return true;
  }
}
