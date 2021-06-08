import { SEMeasurement } from "./SEMeasurement";
import { SEPoint } from "./SEPoint";
import { UpdateStateType, UpdateMode } from "@/types";
import { Styles } from "@/types/Styles";
import SETTINGS from "@/global-settings";

const emptySet = new Set<Styles>();

export class SESegmentDistance extends SEMeasurement {
  readonly firstSEPoint: SEPoint;
  readonly secondSEPoint: SEPoint;

  constructor(first: SEPoint, second: SEPoint) {
    super();
    this.firstSEPoint = first;
    this.secondSEPoint = second;
  }

  public get longName(): string {
    return `Distance(${this.firstSEPoint.label!.ref.shortName},${
      this.secondSEPoint.label!.ref.shortName
    }):${this.prettyValue}`;
  }

  public get shortName(): string {
    return (
      this.name +
      `- Dist(${this.firstSEPoint.label!.ref.shortName},${
        this.secondSEPoint.label!.ref.shortName
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

  public get prettyValue(): string {
    if (this._displayInMultiplesOfPi) {
      return (
        (this.value / Math.PI).toFixed(SETTINGS.decimalPrecision) + "\u{1D7B9}"
      );
    } else {
      return this.value.toFixed(SETTINGS.decimalPrecision);
    }
  }

  public get value(): number {
    return this.firstSEPoint.locationVector.angleTo(
      this.secondSEPoint.locationVector
    );
  }

  public customStyles = (): Set<Styles> => emptySet;
}
