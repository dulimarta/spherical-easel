import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SENodule } from "@/models/SENodule";
import AngleMarker from "@/plottables/AngleMarker";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import { Vector3 } from "three";
import { UpdateMode, AngleMode } from "@/types";

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
    if (this._thirdSEParent !== undefined) {
      this._thirdSEParent.registerChild(this.seAngleMarker);
    }
    this.seAngleMarker.registerChild(this.seLabel);
    Command.store.addAngleMarkerAndExpression(this.seAngleMarker);
    Command.store.addLabel(this.seLabel);
    this.seAngleMarker.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }

  saveState(): void {
    this.lastState = this.seAngleMarker.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeAngleMarkerAndExpression(this.lastState);
    this.seAngleMarker.unregisterChild(this.seLabel);
    if (this._thirdSEParent !== undefined) {
      this._thirdSEParent.unregisterChild(this.seAngleMarker);
    }
    this._secondSEParent.unregisterChild(this.seAngleMarker);
    this._firstSEParent.unregisterChild(this.seAngleMarker);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddAngleMarker",
      /* arg-1 */ this.seAngleMarker.name,
      /* arg-2 */ this.mode,
      /* arg-3 */ this._firstSEParent.name,
      /* arg-4 */ this._secondSEParent.name,
      /* arg-5 */ this._thirdSEParent?.name,
      /* arg-6 */ this.seLabel.name,
      /* arg-7 */ this.seLabel.locationVector.toFixed(7)
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const mode = Number(tokens[2]);
    const firstParent = objMap.get(tokens[3]) as
      | SELine
      | SESegment
      | SEPoint
      | undefined;
    const secondParent = objMap.get(tokens[4]) as
      | SELine
      | SESegment
      | SEPoint
      | undefined;
    const thirdParent = objMap.get(tokens[5]) as SEPoint | undefined;
    // In the following if-statement we don't check the existence
    // of the third parent because it may be undefined
    if (firstParent && secondParent) {
      const angleMarker = new AngleMarker();
      angleMarker.stylize(DisplayStyle.ApplyCurrentVariables);
      angleMarker.adjustSize();

      // All cases of angle marker constructions follow the same recipe
      // So it's not necessary to distinguish them with a switch statement
      const seAngleMarker = new SEAngleMarker(
        angleMarker,
        mode,
        firstParent,
        secondParent,
        thirdParent // can be undefined
      );
      objMap.set(tokens[1], seAngleMarker);

      const seLabel = new SELabel(new Label(), seAngleMarker);
      const labelPosition = new Vector3();
      labelPosition.from(tokens[7]);
      seLabel.locationVector = labelPosition;
      objMap.set(tokens[6], seLabel);

      return new AddAngleMarkerCommand(
        mode,
        seAngleMarker,
        seLabel,
        firstParent,
        secondParent,
        thirdParent // can be undefined
      );
    }
    throw new Error(
      `AddAngleMarker: ${tokens[3]}, ${tokens[4]} or ${tokens[5]} is undefined`
    );
  }
}
