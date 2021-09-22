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
import { AngleMode, SavedNames } from "@/types";
import { StyleEditPanels } from "@/types/Styles";

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
    this.seAngleMarker.markKidsOutOfDate();
    this.seAngleMarker.update();
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
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seAngleMarker.name),
      "objectExists=" + this.seAngleMarker.exists,
      "objectShowing=" + this.seAngleMarker.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seAngleMarker.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seAngleMarker.ref.currentStyleState(StyleEditPanels.Back)
          )
        ),
      // All labels have these attributes
      "labelName=" + Command.symbolToASCIIDec(this.seLabel.name),
      "labelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seLabel.ref.currentStyleState(StyleEditPanels.Label)
          )
        ),
      "labelVector=" + this.seLabel.ref._locationVector.toFixed(7),
      "labelShowing=" + this.seLabel.showing,
      "labelExists=" + this.seLabel.exists,
      // Object specific attributes
      "angleMarkerMode=" + this.mode,
      "angleMarkerFirstParentName=" + this._firstSEParent.name,
      "angleMarkerSecondParentName=" + this._secondSEParent.name,
      "angleMarkerThirdParentName=" + this._thirdSEParent?.name // this can be undefined
    ].join("&");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    // console.log(command);
    const tokens = command.split("&");
    const propMap = new Map<SavedNames, string>();
    // load the tokens into the map
    tokens.forEach((token, ind) => {
      if (ind === 0) return; // don't put the command type in the propMap
      const parts = token.split("=");
      propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
    });

    // get the object specific attributes
    const firstParent = objMap.get(
      propMap.get("angleMarkerFirstParentName") ?? ""
    ) as SELine | SESegment | SEPoint | undefined;

    const secondParent = objMap.get(
      propMap.get("angleMarkerSecondParentName") ?? ""
    ) as SELine | SESegment | SEPoint | undefined;

    const thirdParentPoint = objMap.get(
      propMap.get("angleMarkerThirdParentName") ?? ""
    ) as SEPoint | undefined;

    const mode = Number(propMap.get("angleMarkerMode")) as
      | AngleMode
      | undefined;

    if (firstParent && secondParent && mode) {
      //make the angleMarker
      const angleMarker = new AngleMarker();
      const seAngleMarker = new SEAngleMarker(
        angleMarker,
        mode,
        firstParent,
        secondParent,
        thirdParentPoint
      );
      //style the angle marker
      const angleMarkerFrontStyleString = propMap.get("objectFrontStyle");
      if (angleMarkerFrontStyleString !== undefined)
        angleMarker.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(angleMarkerFrontStyleString)
        );
      const angleMarkerBackStyleString = propMap.get("objectBackStyle");
      if (angleMarkerBackStyleString !== undefined)
        angleMarker.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(angleMarkerBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const seLabel = new SELabel(label, seAngleMarker);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the angleMarker in the object map
      if (propMap.get("objectName") !== undefined) {
        seAngleMarker.name = propMap.get("objectName") ?? "";
        seAngleMarker.showing = propMap.get("objectShowing") === "true";
        seAngleMarker.exists = propMap.get("objectExists") === "true";
        objMap.set(seAngleMarker.name, seAngleMarker);
      } else {
        throw new Error("AddAngleMarker: AngleMarker Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddAngleMarker: Label Name doesn't exist");
      }
      return new AddAngleMarkerCommand(
        mode,
        seAngleMarker,
        seLabel,
        firstParent,
        secondParent,
        thirdParentPoint // can be undefined
      );
    }
    throw new Error(
      `AddAngleMarker: ${firstParent}, ${secondParent} or ${mode} is undefined`
    );
  }
}
