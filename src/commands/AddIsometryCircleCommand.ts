import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Label from "@/plottables/Label";
import { StyleEditPanels } from "@/types/Styles";
import { SavedNames, SEIsometry } from "@/types";
import { SEExpression } from "@/models/SEExpression";
import NonFreeCircle from "@/plottables/NonFreeCircle";
import { SEMeasuredCircle } from "@/models/SEMeasuredCircle";
import NonFreePoint from "@/plottables/NonFreePoint";
import { SETransformation } from "@/models/SETransformation";
import { SETransformedPoint } from "@/models/SETransformedPoint";
import { compile } from "vue/types/umd";
import { SECircle } from "@/models/SECircle";
import { SEIsometryCircle } from "@/models/SEIsometryCircle";

export class AddIsometryCircleCommand extends Command {
  private preimageSECircle: SECircle;
  private parentIsometry: SEIsometry;
  private isometrySECircle: SEIsometryCircle;
  private isometrySECircleLabel: SELabel;

  constructor(
    isometrySECircle: SEIsometryCircle,
    isometrySECircleLabel: SELabel,
    preimageSECircle: SECircle,
    parentIsometry: SEIsometry
  ) {
    super();
    this.preimageSECircle = preimageSECircle;
    this.isometrySECircle = isometrySECircle;
    this.parentIsometry = parentIsometry;
    this.isometrySECircleLabel = isometrySECircleLabel;
  }

  do(): void {
    this.preimageSECircle.registerChild(this.isometrySECircle);
    this.parentIsometry.registerChild(this.isometrySECircle);
    this.isometrySECircle.registerChild(this.isometrySECircleLabel);
    Command.store.addCircle(this.isometrySECircle);
    Command.store.addLabel(this.isometrySECircleLabel);
  }

  saveState(): void {
    this.lastState = this.isometrySECircle.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.isometrySECircleLabel.id);
    Command.store.removeCircle(this.lastState);
    this.isometrySECircle.unregisterChild(this.isometrySECircleLabel);
    this.parentIsometry.unregisterChild(this.isometrySECircle);
    this.preimageSECircle.unregisterChild(this.isometrySECircle);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddIsometryCircle",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.isometrySECircle.name),
      "objectExists=" + this.isometrySECircle.exists,
      "objectShowing=" + this.isometrySECircle.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.isometrySECircle.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.isometrySECircle.ref.currentStyleState(StyleEditPanels.Back)
          )
        ),
      // All labels have these attributes
      "labelName=" + Command.symbolToASCIIDec(this.isometrySECircleLabel.name),
      "labelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.isometrySECircleLabel.ref.currentStyleState(
              StyleEditPanels.Label
            )
          )
        ),
      "labelVector=" +
        this.isometrySECircleLabel.ref._locationVector.toFixed(7),
      "labelShowing=" + this.isometrySECircleLabel.showing,
      "labelExists=" + this.isometrySECircleLabel.exists,
      // Object specific attributes
      "isometryCircleParentName=" + this.preimageSECircle.name,
      "isometryCircleParentIsometryName=" + this.parentIsometry.name,
      "isometryCircleCenterSEPointName=" +
        Command.symbolToASCIIDec(this.isometrySECircle.centerSEPoint.name),
      "isometryCircleCircleSEPointName=" +
        Command.symbolToASCIIDec(this.isometrySECircle.circleSEPoint.name)
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
    const parentSECircle = objMap.get(
      propMap.get("isometryCircleParentName") ?? ""
    ) as SECircle | undefined;

    const isometryCircleParentIsometry = objMap.get(
      propMap.get("isometryCircleParentIsometryName") ?? ""
    ) as SEIsometry | undefined;

    const isometryCircleCenterPoint = objMap.get(
      propMap.get("isometryCircleCenterSEPointName") ?? ""
    ) as SETransformedPoint | undefined;

    const isometryCircleCirclePoint = objMap.get(
      propMap.get("isometryCircleCircleSEPointName") ?? ""
    ) as SETransformedPoint | undefined;

    if (
      parentSECircle &&
      isometryCircleParentIsometry &&
      isometryCircleCirclePoint &&
      isometryCircleCenterPoint
    ) {
      //make the Circle
      const seg = new NonFreeCircle();
      const isometrySECircle = new SEIsometryCircle(
        seg,
        isometryCircleCenterPoint,
        isometryCircleCirclePoint,
        parentSECircle,
        isometryCircleParentIsometry
      );
      //style the Circle
      const CircleFrontStyleString = propMap.get("objectFrontStyle");
      if (CircleFrontStyleString !== undefined)
        seg.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(CircleFrontStyleString)
        );
      const CircleBackStyleString = propMap.get("objectBackStyle");
      if (CircleBackStyleString !== undefined)
        seg.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(CircleBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const isometrySECircleLabel = new SELabel(label, isometrySECircle);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      isometrySECircleLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the Circle in the object map
      if (propMap.get("objectName") !== undefined) {
        isometrySECircle.name = propMap.get("objectName") ?? "";
        isometrySECircle.showing = propMap.get("objectShowing") === "true";
        isometrySECircle.exists = propMap.get("objectExists") === "true";
        objMap.set(isometrySECircle.name, isometrySECircle);
      } else {
        throw new Error("AddIsometrySECircle: Circle Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        isometrySECircleLabel.name = propMap.get("labelName") ?? "";
        isometrySECircleLabel.showing = propMap.get("labelShowing") === "true";
        isometrySECircleLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(isometrySECircleLabel.name, isometrySECircleLabel);
      } else {
        throw new Error("AddIsometrySECircle: Label Name doesn't exist");
      }
      return new AddIsometryCircleCommand(
        isometrySECircle,
        isometrySECircleLabel,
        parentSECircle,
        isometryCircleParentIsometry
      );
    }
    throw new Error(
      `AddIsometryCircle: ${parentSECircle} or ${isometryCircleParentIsometry} or ${isometryCircleCenterPoint} or ${isometryCircleCirclePoint} is undefined`
    );
  }
}
