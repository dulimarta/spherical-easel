import { Command } from "./Command";
import { SECircle } from "@/models/SECircle";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Label from "@/plottables/Label";
import { StyleEditPanels } from "@/types/Styles";
import { SavedNames } from "@/types";
import { SEExpression } from "@/models/SEExpression";
import NonFreeCircle from "@/plottables/NonFreeCircle";
import { SEMeasuredCircle } from "@/models/SEMeasuredCircle";
import NonFreePoint from "@/plottables/NonFreePoint";
import { SETransformation } from "@/models/SETransformation";
import { SETransformedPoint } from "@/models/SETransformedPoint";
import { compile } from "vue/types/umd";

export class AddTransformedPointCommand extends Command {
  private preimageSEPoint: SEPoint;
  private parentTransformation: SETransformation;
  private transformedSEPoint: SEPoint;
  private transformedSEPointLabel: SELabel;

  constructor(
    transformedPoint: SETransformedPoint,
    transformedPointLabel: SELabel,
    preimageSEPoint: SEPoint,
    parentTransformation: SETransformation
  ) {
    super();
    this.preimageSEPoint = preimageSEPoint;
    this.transformedSEPoint = transformedPoint;
    this.parentTransformation = parentTransformation;
    this.transformedSEPointLabel = transformedPointLabel;
  }

  do(): void {
    this.preimageSEPoint.registerChild(this.transformedSEPoint);
    this.parentTransformation.registerChild(this.transformedSEPoint);
    this.transformedSEPoint.registerChild(this.transformedSEPointLabel);
    Command.store.addPoint(this.transformedSEPoint);
    Command.store.addLabel(this.transformedSEPointLabel);
  }

  saveState(): void {
    this.lastState = this.transformedSEPoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.transformedSEPointLabel.id);
    Command.store.removePoint(this.lastState);
    this.transformedSEPoint.unregisterChild(this.transformedSEPointLabel);
    this.parentTransformation.unregisterChild(this.transformedSEPoint);
    this.preimageSEPoint.unregisterChild(this.transformedSEPoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddTransformedPoint",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.transformedSEPoint.name),
      "objectExists=" + this.transformedSEPoint.exists,
      "objectShowing=" + this.transformedSEPoint.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.transformedSEPoint.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.transformedSEPoint.ref.currentStyleState(StyleEditPanels.Back)
          )
        ),
      // All labels have these attributes
      "labelName=" +
        Command.symbolToASCIIDec(this.transformedSEPointLabel.name),
      "labelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.transformedSEPointLabel.ref.currentStyleState(
              StyleEditPanels.Label
            )
          )
        ),
      "labelVector=" +
        this.transformedSEPointLabel.ref._locationVector.toFixed(9),
      "labelShowing=" + this.transformedSEPointLabel.showing,
      "labelExists=" + this.transformedSEPointLabel.exists,
      // Object specific attributes
      "transformedPointParentName=" + this.preimageSEPoint.name,
      "transformedPointParentTransformationName=" +
        this.parentTransformation.name
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
    const parentSEPoint = objMap.get(
      propMap.get("transformedPointParentName") ?? ""
    ) as SEPoint | undefined;

    const transformedPointParentTransformation = objMap.get(
      propMap.get("transformedPointParentTransformationName") ?? ""
    ) as SETransformation | undefined;

    if (parentSEPoint && transformedPointParentTransformation) {
      //make the point
      const point = new NonFreePoint();
      const transformedSEPoint = new SETransformedPoint(
        point,
        parentSEPoint,
        transformedPointParentTransformation
      );
      //style the point
      const pointFrontStyleString = propMap.get("objectFrontStyle");
      if (pointFrontStyleString !== undefined)
        point.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(pointFrontStyleString)
        );
      const pointBackStyleString = propMap.get("objectBackStyle");
      if (pointBackStyleString !== undefined)
        point.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(pointBackStyleString)
        );

      //make the label and set its location
      const label = new Label("point", transformedSEPoint.name);
      const transformedSEPointLabel = new SELabel(label, transformedSEPoint);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      transformedSEPointLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the Point in the object map
      if (propMap.get("objectName") !== undefined) {
        transformedSEPoint.name = propMap.get("objectName") ?? "";
        transformedSEPoint.showing = propMap.get("objectShowing") === "true";
        transformedSEPoint.exists = propMap.get("objectExists") === "true";
        objMap.set(transformedSEPoint.name, transformedSEPoint);
      } else {
        throw new Error("AddTransformedPoint: Point Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        transformedSEPointLabel.name = propMap.get("labelName") ?? "";
        transformedSEPointLabel.showing =
          propMap.get("labelShowing") === "true";
        transformedSEPointLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(transformedSEPointLabel.name, transformedSEPointLabel);
      } else {
        throw new Error("AddTransformedPoint: Label Name doesn't exist");
      }
      return new AddTransformedPointCommand(
        transformedSEPoint,
        transformedSEPointLabel,
        parentSEPoint,
        transformedPointParentTransformation
      );
    }
    throw new Error(
      `AddTransformedPoint: ${parentSEPoint} or ${transformedPointParentTransformation} is undefined`
    );
  }
}
