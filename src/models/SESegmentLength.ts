import { SEExpression, SENodule, SESegment } from "./internal";
import { ObjectState, ValueDisplayMode } from "@/types";
import SETTINGS from "@/global-settings";
import i18n from "@/i18n";
import EventBus from "@/eventHandlers/EventBus";
const emptySet = new Set<string>();
const { t } = i18n.global;

export class SESegmentLength extends SEExpression {
  readonly seSegment: SESegment;

  constructor(parent: SESegment) {
    super(); // this.name is set to a measurement token M### in the super constructor
    this.seSegment = parent;
    this.valueDisplayMode = SETTINGS.segment.initialValueDisplayMode;
  }
  public customStyles = (): Set<string> => emptySet;
  public get value(): number {
    return this.seSegment.arcLength;
  }

  /**Controls if the expression measurement should be displayed in multiples of pi, degrees or a number*/
  get valueDisplayMode(): ValueDisplayMode {
    return this._valueDisplayMode;
  }
  set valueDisplayMode(vdm: ValueDisplayMode) {
    this._valueDisplayMode = vdm;
    // move the vdm to the plottable label
    if (this.seSegment.label) {
      this.seSegment.label.ref.valueDisplayMode = vdm;
    }
  }

  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.segmentLength`, {
        seg: this.seSegment.label?.ref.shortUserName,
        val: SENodule.store.isEarthMode ? this.prettyValue(true) : this.value
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.name +
      ": " +
      this.seSegment.label?.ref.shortUserName +
      ` ${this.prettyValue()}`
    );
  }

  public shallowUpdate(): void {
    this.exists = this.seSegment.exists;

    if (this.exists) {
      super.shallowUpdate()
      // When this updates send its value to the label of the segment
      if (this.seSegment.label) {
        this.seSegment.label.ref.value = [this.value];
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
}
