import { Command } from "./Command";
import { SECircle } from "@/models/SECircle";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SENodule } from "@/models/SENodule";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";

enum AngleMode {
  NONE,
  LINES,
  POINTS,
  SEGMENTS,
  LINEANDSEGMENT
}

export class AddAngleMarkerCommand extends Command {
  /**
   * The model SE object that is the first parent of this angle marker (line, line segment, point). This is never undefined.
   */
  private _firstSEParent: SELine | SESegment | SEPoint;

  /**
   * The model SE object that is the second parent of this angle marker (line, line segment, point). This is never undefined.
   */
  private _secondSEParent: SELine | SESegment | SEPoint;

  /**
   * The model SE object that is the third parent of this angle marker (point or undefined). This is undefined when the two other
   * parents are both lines or both line segments.
   */
  private _thirdSEParent: SEPoint | undefined = undefined;

  // The type of SENodules that make up the angle
  private mode = AngleMode.NONE;

  //The label of this anglemarker
  private seLabel: SELabel;

  //The SEAngleMarker
  private seAngleMarker: SEAngleMarker;

  constructor(
    mode: AngleMode,
    seAngleMarker: SEAngleMarker,
    seLabel: SELabel,
    firstParent: SELine | SESegment | SEPoint,
    secondParent: SELine | SESegment | SEPoint,
    thirdParent?: SEPoint | undefined
  ) {
    super();
    this.mode = mode;
    this.seAngleMarker = seAngleMarker;
    this._firstSEParent = firstParent;
    this._secondSEParent = secondParent;
    this._thirdSEParent = thirdParent;
    this.seLabel = seLabel;
  }

  do(): void {
    this._firstSEParent.registerChild(this.seAngleMarker);
    this._secondSEParent.registerChild(this.seAngleMarker);
    if (this._thirdSEParent) {
      this._thirdSEParent.registerChild(this.seAngleMarker);
    }
    this.seAngleMarker.registerChild(this.seLabel);
    Command.store.commit.addAngleMarkerAndExpression(this.seAngleMarker);
    Command.store.commit.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seAngleMarker.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    Command.store.commit.removeAngleMarkerAndExpression(this.lastState);
    this.seAngleMarker.unregisterChild(this.seLabel);
    if (this._thirdSEParent) {
      this._thirdSEParent.unregisterChild(this.seAngleMarker);
    }
    this._secondSEParent.unregisterChild(this.seAngleMarker);
    this._firstSEParent.unregisterChild(this.seAngleMarker);
  }
}
