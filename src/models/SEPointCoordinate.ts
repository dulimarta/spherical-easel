import { Matrix4, Vector3 } from "three";
import { ObjectState, ValueDisplayMode } from "@/types";
import i18n from "@/i18n";
import EventBus from "@/eventHandlers/EventBus";
import { SEExpression } from "./SEExpression";
import { SEPoint } from "./SEPoint";
import { SENodule } from "@/models/SENodule";
const emptySet = new Set<string>();
const { t } = i18n.global;

export enum CoordinateSelection {
  X_VALUE,
  Y_VALUE,
  Z_VALUE
}
export class SEPointCoordinate extends SEExpression {
  private selector = CoordinateSelection.X_VALUE;
  readonly sePoint: SEPoint;

  /**
   * Temporary matrix and vector so that can compute the location of the point with out all the rotations
   */
  private invMatrix = new Matrix4();
  private valueVector = new Vector3();

  constructor(point: SEPoint, selector: CoordinateSelection) {
    super(); // this.name is set to a measurement token M### in the super constructor
    this.selector = selector;
    this.sePoint = point;
  }
  public customStyles = (): Set<string> => emptySet;

  public get value(): number {
    switch (this.selector) {
      case CoordinateSelection.X_VALUE:
        return this.valueVector.x;
      case CoordinateSelection.Y_VALUE:
        return this.valueVector.y;
      case CoordinateSelection.Z_VALUE:
        return this.valueVector.z;

      default:
        return Number.NaN;
    }
  }

  get point(): SEPoint {
    return this.sePoint;
  }

  /**Controls if the expression measurement should be displayed in multiples of pi, degrees or a number*/
  get valueDisplayMode(): ValueDisplayMode {
    return this._valueDisplayMode;
  }
  set valueDisplayMode(vdm: ValueDisplayMode) {
    //console.log("update VDM in point coordinate ", this.selector);
    this._valueDisplayMode = vdm;
    // move the vdm to the plottable label, but SEPointCoordinate are
    // not effected by the value of vdm UNLESS in Earth mode so
    // update the value display mode label of the SEPoint because setting this
    // triggers an update of the label
    if (this.sePoint.label && this.selector === CoordinateSelection.Z_VALUE) {
      this.sePoint.label.ref.valueDisplayMode = vdm;
    }
  }

  public get noduleDescription(): string {
    switch (this.selector) {
      case CoordinateSelection.X_VALUE:
        return String(
          i18n.global.t(`objectTree.coordinateOf`, {
            axisName: String(i18n.global.t(`objectTree.x`)),
            pt: this.sePoint.label?.ref.shortUserName,
            val: this.value
          })
        );
      case CoordinateSelection.Y_VALUE:
        return String(
          i18n.global.t(`objectTree.coordinateOf`, {
            axisName: String(i18n.global.t(`objectTree.y`)),
            pt: this.sePoint.label?.ref.shortUserName,
            val: this.value
          })
        );
      case CoordinateSelection.Z_VALUE:
        return String(
          i18n.global.t(`objectTree.coordinateOf`, {
            axisName: String(i18n.global.t(`objectTree.z`)),
            pt: this.sePoint.label?.ref.shortUserName,
            val: this.value
          })
        );
      default:
        return this.name;
    }
  }

  public get noduleItemText(): string {
    switch (this.selector) {
      case CoordinateSelection.X_VALUE:
        return String(
          i18n.global.t(`objectTree.coordOf`, {
            token: this.name,
            axisName: String(i18n.global.t(`objectTree.x`)),
            pt: this.sePoint.label?.ref.shortUserName,
            val: this.prettyValue()
          })
        );
      case CoordinateSelection.Y_VALUE:
        return String(
          i18n.global.t(`objectTree.coordOf`, {
            token: this.name,
            axisName: String(i18n.global.t(`objectTree.y`)),
            pt: this.sePoint.label?.ref.shortUserName,
            val: this.prettyValue()
          })
        );
      case CoordinateSelection.Z_VALUE:
        return String(
          i18n.global.t(`objectTree.coordOf`, {
            token: this.name,
            axisName: String(i18n.global.t(`objectTree.z`)),
            pt: this.sePoint.label?.ref.shortUserName,
            val: this.prettyValue()
          })
        );
      default:
        return this.name;
    }
  }

  public shallowUpdate(): void {
    this.exists = this.sePoint.exists;

    if (this.exists) {
      super.shallowUpdate();
      // apply the inverse of the total rotation matrix to compute the location of the point without all the sphere rotations.
      this.invMatrix = SENodule.store.inverseTotalRotationMatrix;
      this.valueVector
        .copy(this.sePoint.locationVector)
        .applyMatrix4(this.invMatrix);

      // When this updates send its value to the label
      if (this.sePoint.label) {
        this.sePoint.label.ref.value = [
          this.valueVector.x,
          this.valueVector.y,
          this.valueVector.z
        ];
      }
    }
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);
    this.shallowUpdate();

    // These point coordinates are completely determined by their parent and an update on the parent
    // will cause this point update correctly. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        // `Point Coordinate with id ${this.id} has been visited twice proceed no further down this branch of the DAG. Hopefully this is because we are moving two or more SENodules at the same time in the MoveHandler.`
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "pointCoordinate", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }
}
