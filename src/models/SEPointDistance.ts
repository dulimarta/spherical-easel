import { SEExpression } from "./SEExpression";
import { SEPoint } from "./SEPoint";
import { UpdateStateType, UpdateMode, ValueDisplayMode } from "@/types";
import { Styles } from "@/types/Styles";
import SETTINGS from "@/global-settings";

const emptySet = new Set<Styles>();

export class SEPointDistance extends SEExpression {
  readonly firstSEPoint: SEPoint;
  readonly secondSEPoint: SEPoint;

  constructor(first: SEPoint, second: SEPoint) {
    super();
    this.firstSEPoint = first;
    this.secondSEPoint = second;
  }

  public get longName(): string {
    return `Distance(${this.firstSEPoint.label!.ref.shortUserName},${
      this.secondSEPoint.label!.ref.shortUserName
    }):${this.prettyValue}`;
  }

  public get shortName(): string {
    return (
      this.name +
      `-Dist(${this.firstSEPoint.label!.ref.shortUserName},${
        this.secondSEPoint.label!.ref.shortUserName
      }):${this.prettyValue}`
    );
  }

  public update(state: UpdateStateType): void {
    if (state.mode !== UpdateMode.DisplayOnly) return;
    if (!this.canUpdateNow()) return;
    // When this updates send its value to the label but this has no label to update
    //const pos = this.name.lastIndexOf(":");
    //this.name = this.name.substring(0, pos + 2) + this.prettyValue;
    this.setOutOfDate(false);
    this.updateKids(state);
  }

  public get value(): number {
    return this.firstSEPoint.locationVector.angleTo(
      this.secondSEPoint.locationVector
    );
  }

  public customStyles = (): Set<Styles> => emptySet;
}
