import { SEExpression } from "./SEExpression";
import { SESegment } from "./SESegment";
import { ObjectState } from "@/types";
import SETTINGS from "@/global-settings";
import i18n from "@/i18n";

const emptySet = new Set<string>();
export class SESegmentLength extends SEExpression {
  readonly seSegment: SESegment;

  constructor(parent: SESegment) {
    super(); // this.name is set to a measurement token M### in the super constructor
    this.seSegment = parent;
    this._valueDisplayMode = SETTINGS.segment.initialValueDisplayMode;
  }

  public get value(): number {
    return this.seSegment.arcLength;
  }

  public get noduleDescription(): string {
    // const val = ;
    return String(
      i18n.t(`objectTree.segmentLength`, {
        seg: this.seSegment.label?.ref.shortUserName,
        val: this.value
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.name +
      ": " +
      this.seSegment.label?.ref.shortUserName +
      ` ${this.prettyValue}`
    );
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);

    this.exists = this.seSegment.exists;

    if (this.exists) {
      // When this updates send its value to the label of the segment
      if (this.seSegment.label) {
        this.seSegment.label.ref.value = [this.value];
      }
    }

    // These segment measurement is completely determined by its parent and an update on the parent
    // will cause this measurement update correctly. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Segment Length with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "segmentLength", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public customStyles = (): Set<string> => emptySet;
}
