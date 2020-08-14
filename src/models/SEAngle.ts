import { SEMeasurement } from "./SEMeasurement";
import { SEPoint } from "./SEPoint";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";

import { UpdateStateType, UpdateMode } from "@/types";
import { Vector3 } from "three";
import { SENodule } from "./SENodule";

const ANGLE_FROM_POINTS = 1;
const ANGLE_FROM_LINES = 2;
type SELineOrSegment = SELine | SESegment;

const tmpNormal1 = new Vector3();
const tmpNormal2 = new Vector3();
export class SEAngle extends SEMeasurement {
  private angleType = -1;

  constructor({
    points,
    lines
  }: {
    points?: SEPoint[];
    lines?: SELineOrSegment[];
  }) {
    super();
    let parentNames = "";
    if (points?.length === 3) {
      this.angleType = ANGLE_FROM_POINTS;
      points.forEach((p: SEPoint) => {
        p.registerChild(this);
      });
      parentNames = points.map(p => p.name).join(",");
    } else if (lines?.length === 2) {
      this.angleType = ANGLE_FROM_LINES;
      lines.forEach((l: SELineOrSegment) => {
        l.registerChild(this);
      });
      parentNames = lines.map(m => m.name).join(",");
    } else {
      throw new Error("Angles are computed only from 2 lines or 3 points");
    }
    this.name = this.name + `-Angle(${parentNames}):${this.prettyValue()}`;
  }

  public get value(): number {
    let lines: SELineOrSegment[];
    let points: SEPoint[];

    switch (this.angleType) {
      case ANGLE_FROM_LINES:
        lines = this.parents.map((n: SENodule) => n as SELineOrSegment);
        return lines[0].normalVector.angleTo(lines[1].normalVector);
      case ANGLE_FROM_POINTS:
        // The second point in the array is the origin of the angle
        points = this.parents.map((n: SENodule, pos: number) => n as SEPoint);
        tmpNormal1.crossVectors(
          points[0].locationVector,
          points[1].locationVector
        );
        tmpNormal2.crossVectors(
          points[2].locationVector,
          points[1].locationVector
        );
        return tmpNormal1.angleTo(tmpNormal2);

      default:
        return Number.NaN;
    }

    // return this.firstSEPoint.locationVector.distanceTo(
    //   this.secondSEPoint.locationVector
    // );
  }

  public prettyValue(): string {
    return (this.value / Math.PI).toFixed(2) + "\u{1D7B9}";
  }
}
