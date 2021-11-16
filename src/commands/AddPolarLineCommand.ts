import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SavedNames, SEOneOrTwoDimensional } from "@/types";
import Line from "@/plottables/Line";
import { DisplayStyle } from "@/plottables/Nodule";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import NonFreePoint from "@/plottables/NonFreePoint";
import { SEPolarLine } from "@/models/SEPolarLine";
import NonFreeLine from "@/plottables/NonFreeLine";
import { StyleEditPanels } from "@/types/Styles";
import Point from "@/plottables/Point";

export class AddPolarLineCommand extends Command {
  private sePolarLine: SEPolarLine;
  private parentSEPoint: SEPoint;
  private seLabel: SELabel;

  constructor(
    sePolarLine: SEPolarLine,
    parentSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.sePolarLine = sePolarLine;
    this.parentSEPoint = parentSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentSEPoint.registerChild(this.sePolarLine);
    this.sePolarLine.registerChild(this.seLabel);
    Command.store.addLine(this.sePolarLine);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.sePolarLine.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeLine(this.lastState);
    this.sePolarLine.unregisterChild(this.seLabel);
    this.parentSEPoint.unregisterChild(this.sePolarLine);
  }

  // toOpcode(): null | string | Array<string> {
  //   return [
  //     /* arg-2 */ this.sePolarLine.startSEPoint.name,
  //     /* arg-3 */ this.sePolarLine.startSEPoint.locationVector.toFixed(7),
  //     /* arg-4 */ this.sePolarLine.endSEPoint.name,
  //     /* arg-5 */ this.sePolarLine.endSEPoint.locationVector.toFixed(7),

  //     /* arg-9 */ this.parentSEPoint.name
  //   ].join("/");
  // }
  toOpcode(): null | string | Array<string> {
    return [
      "AddPolarLine",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.sePolarLine.name),
      "objectExists=" + this.sePolarLine.exists,
      "objectShowing=" + this.sePolarLine.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePolarLine.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePolarLine.ref.currentStyleState(StyleEditPanels.Back)
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
      "polarLineParentPointName=" + this.parentSEPoint.name,
      "polarLineStartSEPointLocationVector=" +
        this.sePolarLine.startSEPoint.locationVector.toFixed(7),
      "polarLineEndSEPointLocationVector=" +
        this.sePolarLine.endSEPoint.locationVector.toFixed(7)
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
    const sePolarLineStartSEPointLocation = new Vector3();
    sePolarLineStartSEPointLocation.from(
      propMap.get("polarLineStartSEPointLocationVector")
    );

    const sePolarLineEndSEPointLocation = new Vector3();
    sePolarLineEndSEPointLocation.from(
      propMap.get("polarLineEndSEPointLocationVector")
    );

    const sePolarLineParentPoint = objMap.get(
      propMap.get("polarLineParentPointName") ?? ""
    ) as SEPoint | undefined;

    if (
      sePolarLineParentPoint &&
      sePolarLineStartSEPointLocation.z !== 1 &&
      sePolarLineEndSEPointLocation.z !== 1
    ) {
      //make the polar Line
      const line = new NonFreeLine();
      // create the non-displayed not in the DAG End Point of the line
      const endPoint = new SEPoint(new Point());
      endPoint.locationVector = sePolarLineEndSEPointLocation;
      endPoint.exists = true; //never changes
      endPoint.showing = false; // never changes

      // create the non-displayed not in the DAG Start Point of the line
      const startPoint = new SEPoint(new Point());
      startPoint.locationVector = sePolarLineStartSEPointLocation;
      startPoint.exists = true; //never changes
      startPoint.showing = false; // never changes

      const sePolarLine = new SEPolarLine(
        line,
        startPoint,
        endPoint,
        sePolarLineParentPoint
      );
      //style the Polara Line
      const polarLineFrontStyleString = propMap.get("objectFrontStyle");
      if (polarLineFrontStyleString !== undefined)
        line.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(polarLineFrontStyleString)
        );
      const polarLineBackStyleString = propMap.get("objectBackStyle");
      if (polarLineBackStyleString !== undefined)
        line.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(polarLineBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const seLabel = new SELabel(label, sePolarLine);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the polar line in the object map
      if (propMap.get("objectName") !== undefined) {
        sePolarLine.name = propMap.get("objectName") ?? "";
        sePolarLine.showing = propMap.get("objectShowing") === "true";
        sePolarLine.exists = propMap.get("objectExists") === "true";
        objMap.set(sePolarLine.name, sePolarLine);
      } else {
        throw new Error("AddPolarLine: Polar Line Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddPolarLine: Label Name doesn't exist");
      }
      return new AddPolarLineCommand(
        sePolarLine,
        sePolarLineParentPoint,
        seLabel
      );
    }
    throw new Error(
      `AddPolarLine: ${sePolarLineEndSEPointLocation},  ${sePolarLineParentPoint} or ${sePolarLineStartSEPointLocation} is undefined`
    );
  }
}
