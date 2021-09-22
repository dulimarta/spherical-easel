import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Matrix4, Vector3 } from "three";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import { SEEllipse } from "@/models/SEEllipse";
import Ellipse from "@/plottables/Ellipse";
import { StyleEditPanels } from "@/types/Styles";
import { SavedNames } from "@/types";

export class AddEllipseCommand extends Command {
  private seEllipse: SEEllipse;
  private focus1SEPoint: SEPoint;
  private focus2SEPoint: SEPoint;
  private ellipseSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(
    seEllipse: SEEllipse,
    focus1SEPoint: SEPoint,
    focus2SEPoint: SEPoint,
    ellipseSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seEllipse = seEllipse;
    this.focus1SEPoint = focus1SEPoint;
    this.focus2SEPoint = focus2SEPoint;
    this.ellipseSEPoint = ellipseSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.focus1SEPoint.registerChild(this.seEllipse);
    this.focus2SEPoint.registerChild(this.seEllipse);
    this.ellipseSEPoint.registerChild(this.seEllipse);
    this.seEllipse.registerChild(this.seLabel);
    Command.store.addEllipse(this.seEllipse);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seEllipse.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeEllipse(this.lastState);
    this.seEllipse.unregisterChild(this.seLabel);
    this.ellipseSEPoint.unregisterChild(this.seEllipse);
    this.focus2SEPoint.unregisterChild(this.seEllipse);
    this.focus1SEPoint.unregisterChild(this.seEllipse);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddEllipse",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seEllipse.name),
      "objectExists=" + this.seEllipse.exists,
      "objectShowing=" + this.seEllipse.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seEllipse.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seEllipse.ref.currentStyleState(StyleEditPanels.Back)
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
      "ellipseFocus1Name=" + this.focus1SEPoint.name,
      "ellipseFocus2Name=" + this.focus2SEPoint.name,
      "ellipsePointOnEllipseName=" + this.ellipseSEPoint.name
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
    const ellipseFocus1 = objMap.get(propMap.get("ellipseFocus1Name") ?? "") as
      | SEPoint
      | undefined;

    const ellipseFocus2 = objMap.get(propMap.get("ellipseFocus2Name") ?? "") as
      | SEPoint
      | undefined;

    const ellipsePointOnEllipse = objMap.get(
      propMap.get("ellipsePointOnEllipseName") ?? ""
    ) as SEPoint | undefined;

    if (ellipseFocus1 && ellipseFocus2 && ellipsePointOnEllipse) {
      //make the ellipse
      const ellipse = new Ellipse();
      const seEllipse = new SEEllipse(
        ellipse,
        ellipseFocus1,
        ellipseFocus2,
        ellipsePointOnEllipse
      );
      //style the ellipse
      const ellipseFrontStyleString = propMap.get("objectFrontStyle");
      if (ellipseFrontStyleString !== undefined)
        ellipse.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(ellipseFrontStyleString)
        );
      const ellipseBackStyleString = propMap.get("objectBackStyle");
      if (ellipseBackStyleString !== undefined)
        ellipse.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(ellipseBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const seLabel = new SELabel(label, seEllipse);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the ellipse in the object map
      if (propMap.get("objectName") !== undefined) {
        seEllipse.name = propMap.get("objectName") ?? "";
        seEllipse.showing = propMap.get("objectShowing") === "true";
        seEllipse.exists = propMap.get("objectExists") === "true";
        objMap.set(seEllipse.name, seEllipse);
      } else {
        throw new Error("AddEllipse: Ellipse Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddEllipse: Label Name doesn't exist");
      }
      return new AddEllipseCommand(
        seEllipse,
        ellipseFocus1,
        ellipseFocus2,
        ellipsePointOnEllipse,
        seLabel
      );
    }
    throw new Error(
      `AddEllipse: ${ellipseFocus1}, ${ellipseFocus2},or ${ellipsePointOnEllipse}  is undefined`
    );
  }
}
