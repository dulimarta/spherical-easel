import { Command } from "./Command";
import { SELine } from "@/models/SELine";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { StyleCategory } from "@/types/Styles";
import { SavedNames } from "@/types";
import { toSVGType } from "@/types";


export class AddLineCommand extends Command {
  private seLine: SELine;
  private startSEPoint: SEPoint;
  private endSEPoint: SEPoint;
  private seLabel: SELabel;

  constructor(
    seLine: SELine,
    startSEPoint: SEPoint,
    endSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seLine = seLine;
    this.startSEPoint = startSEPoint;
    this.endSEPoint = endSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.startSEPoint.registerChild(this.seLine);
    this.endSEPoint.registerChild(this.seLine);
    this.seLine.registerChild(this.seLabel);
    Command.store.addLine(this.seLine);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seLine.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeLine(this.lastState);
    this.seLabel.unregisterChild(this.seLabel);
    this.startSEPoint.unregisterChild(this.seLine);
    this.endSEPoint.unregisterChild(this.seLine);
  }

  getSVGObjectLabelPairs(): [SENodule, SELabel][] {
    return [[this.seLine, this.seLabel]];
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddLine",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seLine.name),
      "objectExists=" + this.seLine.exists,
      "objectShowing=" + this.seLine.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seLine.ref.currentStyleState(StyleCategory.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seLine.ref.currentStyleState(StyleCategory.Back)
          )
        ),
      // All labels have these attributes
      "labelName=" + Command.symbolToASCIIDec(this.seLabel.name),
      "labelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seLabel.ref.currentStyleState(StyleCategory.Label)
          )
        ),
      "labelVector=" + this.seLabel.ref._locationVector.toFixed(9),
      "labelShowing=" + this.seLabel.showing,
      "labelExists=" + this.seLabel.exists,
      // Object specific attributes
      "lineNormalVector=" + this.seLine.normalVector.toFixed(9),
      "lineStartPointName=" + this.startSEPoint.name,
      "lineEndPointName=" + this.endSEPoint.name
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
    const lineStartPoint = objMap.get(
      propMap.get("lineStartPointName") ?? ""
    ) as SEPoint | undefined;

    const lineEndPoint = objMap.get(propMap.get("lineEndPointName") ?? "") as
      | SEPoint
      | undefined;

    const lineNormalVector = new Vector3();
    lineNormalVector.from(propMap.get("lineNormalVector")); // convert to vector, if .from() fails the vector is set to 0,0,1

    if (lineEndPoint && lineStartPoint && lineNormalVector.z !== 1) {
      //make the line
      const seLine = new SELine(lineStartPoint, lineNormalVector, lineEndPoint);
      //style the line
      const lineFrontStyleString = propMap.get("objectFrontStyle");
      if (lineFrontStyleString !== undefined)
        seLine.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(lineFrontStyleString)
        );
      const lineBackStyleString = propMap.get("objectBackStyle");
      if (lineBackStyleString !== undefined)
        seLine.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(lineBackStyleString)
        );

      //make the label and set its location
      const seLabel = new SELabel("line", seLine);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        seLabel.updatePlottableStyle(
          StyleCategory.Label,
          JSON.parse(labelStyleString)
        );

      //put the line in the object map
      if (propMap.get("objectName") !== undefined) {
        seLine.name = propMap.get("objectName") ?? "";
        seLine.showing = propMap.get("objectShowing") === "true";
        seLine.exists = propMap.get("objectExists") === "true";
        objMap.set(seLine.name, seLine);
      } else {
        throw new Error("AddLine: Line Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddLine: Label Name doesn't exist");
      }
      return new AddLineCommand(seLine, lineStartPoint, lineEndPoint, seLabel);
    }
    throw new Error(
      `AddLine: ${lineEndPoint}, ${lineStartPoint},or ${lineNormalVector}  is undefined`
    );
  }
}
