import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import { SavedNames, SEOneDimensional } from "@/types";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { StyleEditPanels } from "@/types/Styles";
export class AddPerpendicularLineThruPointCommand extends Command {
  private sePerpendicularLineThruPoint: SEPerpendicularLineThruPoint;
  private parentSEPoint: SEPoint;
  private parentOneDimensional: SEOneDimensional;
  private seLabel: SELabel;

  constructor(
    sePerpendicularLineThruPoint: SEPerpendicularLineThruPoint,
    parentSEPoint: SEPoint,
    parentOneDimensional: SEOneDimensional,
    seLabel: SELabel
  ) {
    super();
    this.sePerpendicularLineThruPoint = sePerpendicularLineThruPoint;
    this.parentSEPoint = parentSEPoint;
    this.parentOneDimensional = parentOneDimensional;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentSEPoint.registerChild(this.sePerpendicularLineThruPoint);
    this.parentOneDimensional.registerChild(this.sePerpendicularLineThruPoint);
    this.sePerpendicularLineThruPoint.registerChild(this.seLabel);
    Command.store.addLine(this.sePerpendicularLineThruPoint);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.sePerpendicularLineThruPoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeLine(this.lastState);
    this.sePerpendicularLineThruPoint.unregisterChild(this.seLabel);
    this.parentOneDimensional.unregisterChild(
      this.sePerpendicularLineThruPoint
    );
    this.parentSEPoint.unregisterChild(this.sePerpendicularLineThruPoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddPerpendicularLineThruPoint",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" +
        Command.symbolToASCIIDec(this.sePerpendicularLineThruPoint.name),
      "objectExists=" + this.sePerpendicularLineThruPoint.exists,
      "objectShowing=" + this.sePerpendicularLineThruPoint.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePerpendicularLineThruPoint.ref.currentStyleState(
              StyleEditPanels.Front
            )
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePerpendicularLineThruPoint.ref.currentStyleState(
              StyleEditPanels.Back
            )
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
      "labelVector=" + this.seLabel.ref._locationVector.toFixed(9),
      "labelShowing=" + this.seLabel.showing,
      "labelExists=" + this.seLabel.exists,
      // Object specific attributes
      "perpendicularLineThruPointParentPointName=" + this.parentSEPoint.name,
      "perpendicularLineThruPointNormalVector=" +
        this.sePerpendicularLineThruPoint.normalVector.toFixed(9),
      "perpendicularLineThruPointEndSEPointLocationVector=" +
        this.sePerpendicularLineThruPoint.endSEPoint.locationVector.toFixed(9),
      "perpendicularLineThruPointParentOneDimensionalName=" +
        this.parentOneDimensional.name,
      "perpendicularLineThruPointIndex=" +
        this.sePerpendicularLineThruPoint.index
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
    const perpendicularLineThruPointParentOneDimensional = objMap.get(
      propMap.get("perpendicularLineThruPointParentOneDimensionalName") ?? ""
    ) as SEOneDimensional | undefined;

    const perpendicularLineThruPointParentPoint = objMap.get(
      propMap.get("perpendicularLineThruPointParentPointName") ?? ""
    ) as SEPoint | undefined;

    const perpendicularLineThruPointEndSEPointLocation = new Vector3();
    perpendicularLineThruPointEndSEPointLocation.from(
      propMap.get("perpendicularLineThruPointEndSEPointLocationVector")
    );

    const perpendicularLineThruPointNormal = new Vector3();
    perpendicularLineThruPointNormal.from(
      propMap.get("perpendicularLineThruPointNormalVector")
    );

    const perpendicularLineThruPointIndex = Number(
      propMap.get("perpendicularLineThruPointIndex")
    );

    if (
      perpendicularLineThruPointParentPoint &&
      perpendicularLineThruPointParentOneDimensional &&
      perpendicularLineThruPointNormal.z !== 1 &&
      perpendicularLineThruPointEndSEPointLocation.z !== 1 &&
      !isNaN(perpendicularLineThruPointIndex)
    ) {
      //make the perpendicular Line
      // create the non-displayed not in the DAG End Point of the line
      const endPoint = new SEPoint();
      endPoint.locationVector = perpendicularLineThruPointEndSEPointLocation;
      endPoint.exists = true; //never changes
      endPoint.showing = false; // never changes

      const perpendicularLineThruPointLine = new SEPerpendicularLineThruPoint(
        perpendicularLineThruPointParentOneDimensional,
        perpendicularLineThruPointParentPoint,
        perpendicularLineThruPointNormal,
        endPoint,
        perpendicularLineThruPointIndex
      );
      //style the perpendicular Line
      const perpendicularThruPointLineFrontStyleString =
        propMap.get("objectFrontStyle");
      if (perpendicularThruPointLineFrontStyleString !== undefined)
        perpendicularLineThruPointLine.updatePlottableStyle(
          StyleEditPanels.Front,
          JSON.parse(perpendicularThruPointLineFrontStyleString)
        );
      const perpendicularThruPointLineBackStyleString =
        propMap.get("objectBackStyle");
      if (perpendicularThruPointLineBackStyleString !== undefined)
        perpendicularLineThruPointLine.updatePlottableStyle(
          StyleEditPanels.Back,
          JSON.parse(perpendicularThruPointLineBackStyleString)
        );

      //make the label and set its location
      const seLabel = new SELabel("line", perpendicularLineThruPointLine);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        seLabel.updatePlottableStyle(
          StyleEditPanels.Label,
          JSON.parse(labelStyleString)
        );

      //put the circle in the object map
      if (propMap.get("objectName") !== undefined) {
        perpendicularLineThruPointLine.name = propMap.get("objectName") ?? "";
        perpendicularLineThruPointLine.showing =
          propMap.get("objectShowing") === "true";
        perpendicularLineThruPointLine.exists =
          propMap.get("objectExists") === "true";
        objMap.set(
          perpendicularLineThruPointLine.name,
          perpendicularLineThruPointLine
        );
      } else {
        throw new Error(
          "AddPerpendicularLineThruPoint: Perpendicular Line Name doesn't exist"
        );
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error(
          "AddPerpendicularLineThruPoint: Label Name doesn't exist"
        );
      }
      return new AddPerpendicularLineThruPointCommand(
        perpendicularLineThruPointLine,
        perpendicularLineThruPointParentPoint,
        perpendicularLineThruPointParentOneDimensional,
        seLabel
      );
    }

    throw new Error(
      `AddPerpendicularLineThruPoint: ${perpendicularLineThruPointParentPoint}, ${perpendicularLineThruPointParentOneDimensional}, ${perpendicularLineThruPointIndex}, ${perpendicularLineThruPointNormal}, or ${perpendicularLineThruPointEndSEPointLocation}  is undefined`
    );
  }
}
