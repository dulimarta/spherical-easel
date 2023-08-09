import { SEExpression, SEPoint } from "./internal";
// import { SEPoint } from "./SEPoint";
import { ObjectState, ValueDisplayMode } from "@/types";
// import SETTINGS from "@/global-settings";
import i18n from "@/i18n";
const { t } = i18n.global;
const emptySet = new Set<string>();

export class SEPointDistance extends SEExpression {
  readonly firstSEPoint: SEPoint;
  readonly secondSEPoint: SEPoint;

  constructor(first: SEPoint, second: SEPoint) {
    super(); // this.name is set to a measurement token M### in the super constructor
    this.firstSEPoint = first;
    this.secondSEPoint = second;
  }
  public customStyles = (): Set<string> => emptySet;
  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.distanceBetweenPts`, {
        pt1: this.secondSEPoint.label?.ref.shortUserName,
        pt2: this.firstSEPoint.label?.ref.shortUserName,
        val: this.prettyValue()
      })
    );
  }

  public get noduleItemText(): string {
    return String(
      i18n.global.t(`objectTree.distanceValue`, {
        token: this.name,
        val: this.prettyValue()
      })
    );
  }

  /**Controls if the expression measurement should be displayed in multiples of pi, degrees or a number*/
  get valueDisplayMode(): ValueDisplayMode {
    return this._valueDisplayMode;
  }
  set valueDisplayMode(vdm: ValueDisplayMode) {
    this._valueDisplayMode = vdm;
    // move the vdm to the plottable label, but SECalculations have no SELabel or Label
  }
  public shallowUpdate(): void {
    this.exists = this.firstSEPoint.exists && this.secondSEPoint.exists;
  }
  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);
    this.shallowUpdate();

    // There is no display to update, this doesn't have a presence on the sphere frame

    // These point measurement are completely determined by their parents and an update on the parents
    // will cause this measurement update correctly. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Point Distance with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "pointDistance", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public get value(): number {
    return this.firstSEPoint.locationVector.angleTo(
      this.secondSEPoint.locationVector
    );
  }
}
