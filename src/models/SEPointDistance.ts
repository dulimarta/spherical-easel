import { SEExpression } from "./SEExpression";
import { SEPoint } from "./SEPoint";
import { ObjectState } from "@/types";
import SETTINGS from "@/global-settings";
import i18n from "@/i18n";

const emptySet = new Set<string>();

export class SEPointDistance extends SEExpression {
  readonly firstSEPoint: SEPoint;
  readonly secondSEPoint: SEPoint;

  constructor(first: SEPoint, second: SEPoint) {
    super(); // this.name is set to a measurement token M### in the super constructor
    this.firstSEPoint = first;
    this.secondSEPoint = second;
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.distanceBetweenPts`, {
        pt1: this.secondSEPoint.label?.ref.shortUserName,
        pt2: this.firstSEPoint.label?.ref.shortUserName,
        val: this.value
      })
    );
  }

  public get noduleItemText(): string {
    return String(
      i18n.t(`objectTree.distanceValue`, {
        token: this.name,
        val: this.prettyValue
      })
    );
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this.exists = this.firstSEPoint.exists && this.secondSEPoint.exists;

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

  public customStyles = (): Set<string> => emptySet;
}
