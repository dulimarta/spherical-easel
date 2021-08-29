import { Command } from "./Command";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import { SEParametric } from "@/models/SEParametric";
import Parametric from "@/plottables/Parametric";
import { SEExpression } from "@/models/SEExpression";
import {
  CoordExpression,
  MinMaxExpression,
  MinMaxNumber,
  SavedNames
} from "@/types";
import { StyleEditPanels } from "@/types/Styles";

export class AddParametricCommand extends Command {
  private seParametric: SEParametric;
  private seExpressionParents: SEExpression[] = [];
  private seLabel: SELabel;

  constructor(
    seParametric: SEParametric,
    seExpressionParents: SEExpression[],
    seLabel: SELabel
  ) {
    super();
    this.seParametric = seParametric;
    this.seExpressionParents.push(...seExpressionParents);
    this.seLabel = seLabel;
  }

  do(): void {
    this.seExpressionParents.forEach(par =>
      par.registerChild(this.seParametric)
    );
    this.seParametric.registerChild(this.seLabel);
    Command.store.addParametric(this.seParametric);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seParametric.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeParametric(this.lastState);
    this.seParametric.unregisterChild(this.seLabel);
    this.seExpressionParents.forEach(par =>
      par.unregisterChild(this.seParametric)
    );
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddParametric",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seParametric.name),
      "objectExists=" + this.seParametric.exists,
      "objectShowing=" + this.seParametric.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seParametric.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seParametric.ref.currentStyleState(StyleEditPanels.Back)
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
      "parametricXCoordinateExpression=" +
        Command.symbolToASCIIDec(this.seParametric.coordinateExpressions.x),
      "parametricYCoordinateExpression=" +
        Command.symbolToASCIIDec(this.seParametric.coordinateExpressions.y),
      "parametricZCoordinateExpression=" +
        Command.symbolToASCIIDec(this.seParametric.coordinateExpressions.z),
      "parametricMinExpression=" +
        Command.symbolToASCIIDec(this.seParametric.tExpressions.min),
      "parametricMaxExpression=" +
        Command.symbolToASCIIDec(this.seParametric.tExpressions.max),
      "parametricMinNumber=" + this.seParametric.tNumbers.min,
      "parametricMaxNumber=" + this.seParametric.tNumbers.max,
      "parametricCurveClosed=" + this.seParametric.ref.closed,
      "parametricExpressionParentsNames=" +
        this.seParametric.seParentExpressions
          .map((n: SEExpression) => Command.symbolToASCIIDec(n.name))
          .join("@"),
      "parametricCuspParameterValues=" +
        this.seParametric.c1DiscontinuityParameterValues
          .map(num => Command.symbolToASCIIDec(num.toString()))
          .join("@")
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
    const parametricXCoordinateExpression = propMap.get(
      "parametricXCoordinateExpression"
    );
    const parametricYCoordinateExpression = propMap.get(
      "parametricYCoordinateExpression"
    );
    const parametricZCoordinateExpression = propMap.get(
      "parametricZCoordinateExpression"
    );

    const parametricMinExpression = propMap.get("parametricMinExpression"); // this could be ""
    const parametricMaxExpression = propMap.get("parametricMaxExpression"); // this could be ""

    const parametricMinNumber = Number(propMap.get("parametricMinNumber"));
    const parametricMaxNumber = Number(propMap.get("parametricMaxNumber"));
    const parametricCurveClosed = propMap.get("parametricCurveClosed");

    const tempParametricExpressionParents = propMap.get(
      "parametricExpressionParentsNames"
    );
    const parametricExpressionParents: (SEExpression | undefined)[] = [];
    if (tempParametricExpressionParents) {
      tempParametricExpressionParents
        .split("@")
        .forEach(name =>
          parametricExpressionParents.push(
            objMap.get(name) as SEExpression | undefined
          )
        );
    }

    const tempParametricCuspParameterValues = propMap.get(
      "parametricCuspParameterValues"
    );
    const parametricCuspParameterValues: number[] = [];
    if (tempParametricCuspParameterValues) {
      tempParametricCuspParameterValues
        .split("@")
        .forEach(numString =>
          parametricCuspParameterValues.push(
            Number(Command.asciiDecToSymbol(numString))
          )
        );
    }

    if (
      parametricXCoordinateExpression !== undefined &&
      parametricYCoordinateExpression !== undefined &&
      parametricZCoordinateExpression !== undefined &&
      parametricMinExpression !== undefined &&
      parametricMaxExpression !== undefined &&
      !isNaN(parametricMinNumber) &&
      !isNaN(parametricMaxNumber) &&
      parametricExpressionParents.every(
        expression => expression !== undefined
      ) &&
      parametricCuspParameterValues.every(num => !isNaN(num))
    ) {
      //make the parametric
      const coordinateExpressions: CoordExpression = {
        x: parametricXCoordinateExpression,
        y: parametricYCoordinateExpression,
        z: parametricZCoordinateExpression
      };
      const tExpressions: MinMaxExpression = {
        min: parametricMinExpression,
        max: parametricMaxExpression
      };
      const tNumbers: MinMaxNumber = {
        min: parametricMinNumber,
        max: parametricMaxNumber
      };
      const parametric = new Parametric(
        tNumbers.min,
        tNumbers.max,
        tNumbers.min,
        tNumbers.max,
        parametricCurveClosed === "true"
      );
      const seParametric = new SEParametric(
        parametric,
        coordinateExpressions,
        tExpressions,
        tNumbers,
        parametricCuspParameterValues,
        parametricExpressionParents.map(par => par as SEExpression)
      );

      //style the parametric
      const parametricFrontStyleString = propMap.get("objectFrontStyle");
      if (parametricFrontStyleString !== undefined)
        parametric.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(parametricFrontStyleString)
        );
      const parametricBackStyleString = propMap.get("objectBackStyle");
      if (parametricBackStyleString !== undefined)
        parametric.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(parametricBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const seLabel = new SELabel(label, seParametric);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the parametric in the object map
      if (propMap.get("objectName") !== undefined) {
        seParametric.name = propMap.get("objectName") ?? "";
        seParametric.showing = propMap.get("objectShowing") === "true";
        seParametric.exists = propMap.get("objectExists") === "true";
        objMap.set(seParametric.name, seParametric);
      } else {
        throw new Error("AddParametricCommand:  Parametric name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddParametricCommand: Label Name doesn't exist");
      }
      return new AddParametricCommand(
        seParametric,
        parametricExpressionParents.map(par => par as SEExpression),
        seLabel
      );
    }
    throw new Error(
      `AddParametric: 
      ${parametricXCoordinateExpression}, 
      ${parametricYCoordinateExpression}, 
      ${parametricZCoordinateExpression}, 
      ${parametricMinExpression}, 
      ${parametricMaxExpression}, 
      ${parametricMinNumber},
      ${parametricMaxNumber},
      ${parametricExpressionParents},
      or
      ${parametricCuspParameterValues}
       is undefined`
    );
  }
}
