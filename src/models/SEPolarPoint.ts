import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SEPoint } from "./SEPoint";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
const { t } = i18n.global;

export class SEPolarPoint extends SEPoint {
  /**
   * The point parent of this SEAntipodalPoint
   */
  private _polarLineOrSegmentParent: SELine | SESegment;
  private index: number;

  /**
   *
   * @param point The TwoJS object associated with this SEPoint
   * @param polarLineOrSegmentParent The SELine parent of this SEPoint
   * @param index Which point is this?  There are two polar points associated with each line
   */
  constructor(polarLineOrSegmentParent: SELine | SESegment, index: number) {
    super(true);
    this._polarLineOrSegmentParent = polarLineOrSegmentParent;
    this.index = index;
  }

  public get noduleDescription(): string {
    if (this._polarLineOrSegmentParent instanceof SELine) {
      return String(
        i18n.global.t(`objectTree.aPolarPointOfLine`, {
          line: this._polarLineOrSegmentParent.label?.ref.shortUserName,
          index: this.index
        })
      );
    } else {
      return String(
        i18n.global.t(`objectTree.aPolarPointOfSegment`, {
          line: this._polarLineOrSegmentParent.label?.ref.shortUserName,
          index: this.index
        })
      );
    }
  }

  public shallowUpdate(): void {
    this._exists = this._polarLineOrSegmentParent.exists;

    if (this._exists) {
      // Update the current location normal vector of the line, multiply by -1 if index is 1
      this._locationVector
        .copy(this._polarLineOrSegmentParent.normalVector)
        .multiplyScalar(this.index === 1 ? -1 : 1);
      this.ref.positionVector = this._locationVector;
    }

    // Update visibility
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
    // These polar point are completely determined by their line/segment/point parents and an update on the parents
    // will cause this poin t to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        // `Polar Point with id ${this.id} has been visited twice proceed no further down this branch of the DAG. Hopefully this is because we are moving two or more SENodules at the same time in the MoveHandler.`
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "polarPoint", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }
  public isNonFreePoint(): boolean {
    return true;
  }
  public isFreePoint(): boolean {
    return false;
  }
}
