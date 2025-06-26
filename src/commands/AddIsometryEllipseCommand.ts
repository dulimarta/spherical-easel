import { Command } from "./Command";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { StyleCategory } from "@/types/Styles";
import { SavedNames, SEIsometry } from "@/types";
import { SETransformedPoint } from "@/models/SETransformedPoint";
import { SEEllipse } from "@/models/SEEllipse";
import { SEIsometryEllipse } from "@/models/SEIsometryEllipse";
import { toSVGType } from "@/types";

export class AddIsometryEllipseCommand extends Command {
  private preimageSEEllipse: SEEllipse;
  private parentIsometry: SEIsometry;
  private isometrySEEllipse: SEIsometryEllipse;
  private isometrySEEllipseLabel: SELabel;

  constructor(
    isometrySEEllipse: SEIsometryEllipse,
    isometrySEEllipseLabel: SELabel,
    preimageSEEllipse: SEEllipse,
    parentIsometry: SEIsometry
  ) {
    super();
    this.preimageSEEllipse = preimageSEEllipse;
    this.isometrySEEllipse = isometrySEEllipse;
    this.parentIsometry = parentIsometry;
    this.isometrySEEllipseLabel = isometrySEEllipseLabel;
  }

  do(): void {
    this.preimageSEEllipse.registerChild(this.isometrySEEllipse);
    this.parentIsometry.registerChild(this.isometrySEEllipse);
    this.isometrySEEllipse.registerChild(this.isometrySEEllipseLabel);
    Command.store.addEllipse(this.isometrySEEllipse);
    Command.store.addLabel(this.isometrySEEllipseLabel);
  }

  saveState(): void {
    this.lastState = this.isometrySEEllipse.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.isometrySEEllipseLabel.id);
    Command.store.removeEllipse(this.lastState);
    this.isometrySEEllipse.unregisterChild(this.isometrySEEllipseLabel);
    this.parentIsometry.unregisterChild(this.isometrySEEllipse);
    this.preimageSEEllipse.unregisterChild(this.isometrySEEllipse);
  }

  getSVGObjectLabelPairs(): [SENodule, SELabel][] {
    return [[this.isometrySEEllipse, this.isometrySEEllipseLabel]];
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddIsometryEllipse",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.isometrySEEllipse.name),
      "objectExists=" + this.isometrySEEllipse.exists,
      "objectShowing=" + this.isometrySEEllipse.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.isometrySEEllipse.ref.currentStyleState(StyleCategory.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.isometrySEEllipse.ref.currentStyleState(StyleCategory.Back)
          )
        ),
      // All labels have these attributes
      "labelName=" + Command.symbolToASCIIDec(this.isometrySEEllipseLabel.name),
      "labelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.isometrySEEllipseLabel.ref.currentStyleState(
              StyleCategory.Label
            )
          )
        ),
      "labelVector=" +
        this.isometrySEEllipseLabel.ref._locationVector.toFixed(9),
      "labelShowing=" + this.isometrySEEllipseLabel.showing,
      "labelExists=" + this.isometrySEEllipseLabel.exists,
      // Object specific attributes
      "isometryEllipseParentName=" + this.preimageSEEllipse.name,
      "isometryEllipseParentIsometryName=" + this.parentIsometry.name,
      "isometryEllipseFocus1SEPointName=" +
        Command.symbolToASCIIDec(this.isometrySEEllipse.focus1SEPoint.name),
      "isometryEllipseFocus2SEPointName=" +
        Command.symbolToASCIIDec(this.isometrySEEllipse.focus2SEPoint.name),
      "isometryEllipseEllipseSEPointName=" +
        Command.symbolToASCIIDec(this.isometrySEEllipse.ellipseSEPoint.name)
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
    const parentSEEllipse = objMap.get(
      propMap.get("isometryEllipseParentName") ?? ""
    ) as SEEllipse | undefined;

    const isometryEllipseParentIsometry = objMap.get(
      propMap.get("isometryEllipseParentIsometryName") ?? ""
    ) as SEIsometry | undefined;

    const isometryEllipseFocus1Point = objMap.get(
      propMap.get("isometryEllipseFocus1SEPointName") ?? ""
    ) as SETransformedPoint | undefined;

    const isometryEllipseFocus2Point = objMap.get(
      propMap.get("isometryEllipseFocus2SEPointName") ?? ""
    ) as SETransformedPoint | undefined;

    const isometryEllipseEllipsePoint = objMap.get(
      propMap.get("isometryEllipseEllipseSEPointName") ?? ""
    ) as SETransformedPoint | undefined;

    if (
      parentSEEllipse &&
      isometryEllipseParentIsometry &&
      isometryEllipseEllipsePoint &&
      isometryEllipseFocus1Point &&
      isometryEllipseFocus2Point
    ) {
      //make the Ellipse
      const isometrySEEllipse = new SEIsometryEllipse(
        isometryEllipseFocus1Point,
        isometryEllipseFocus2Point,
        isometryEllipseEllipsePoint,
        parentSEEllipse,
        isometryEllipseParentIsometry
      );
      //style the Ellipse
      const EllipseFrontStyleString = propMap.get("objectFrontStyle");
      if (EllipseFrontStyleString !== undefined)
        isometrySEEllipse.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(EllipseFrontStyleString)
        );
      const EllipseBackStyleString = propMap.get("objectBackStyle");
      if (EllipseBackStyleString !== undefined)
        isometrySEEllipse.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(EllipseBackStyleString)
        );

      //make the label and set its location
      const isometrySEEllipseLabel = new SELabel("ellipse", isometrySEEllipse);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      isometrySEEllipseLabel.locationVector = seLabelLocation; // Don't use copy() on a prop
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        isometrySEEllipseLabel.updatePlottableStyle(
          StyleCategory.Label,
          JSON.parse(labelStyleString)
        );

      //put the Ellipse in the object map
      if (propMap.get("objectName") !== undefined) {
        isometrySEEllipse.name = propMap.get("objectName") ?? "";
        isometrySEEllipse.showing = propMap.get("objectShowing") === "true";
        isometrySEEllipse.exists = propMap.get("objectExists") === "true";
        objMap.set(isometrySEEllipse.name, isometrySEEllipse);
      } else {
        throw new Error("AddIsometrySEEllipse: Ellipse Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        isometrySEEllipseLabel.name = propMap.get("labelName") ?? "";
        isometrySEEllipseLabel.showing = propMap.get("labelShowing") === "true";
        isometrySEEllipseLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(isometrySEEllipseLabel.name, isometrySEEllipseLabel);
      } else {
        throw new Error("AddIsometrySEEllipse: Label Name doesn't exist");
      }
      return new AddIsometryEllipseCommand(
        isometrySEEllipse,
        isometrySEEllipseLabel,
        parentSEEllipse,
        isometryEllipseParentIsometry
      );
    }
    throw new Error(
      `AddIsometryEllipse: ${parentSEEllipse} or ${isometryEllipseParentIsometry} or ${isometryEllipseFocus1Point} or ${isometryEllipseEllipsePoint} is undefined`
    );
  }
}
