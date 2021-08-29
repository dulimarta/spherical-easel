import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SETangentLineThruPoint } from "@/models/SETangentLineThruPoint";
import {
  SavedNames,
  SEOneDimensional,
  SEOneDimensionalNotStraight
} from "@/types";
import Line from "@/plottables/Line";
import { DisplayStyle } from "@/plottables/Nodule";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import NonFreePoint from "@/plottables/NonFreePoint";
import NonFreeLine from "@/plottables/NonFreeLine";
import { SEEllipse } from "@/models/SEEllipse";
import { SEParametric } from "@/models/SEParametric";
import { SECircle } from "@/models/SECircle";
import { StyleEditPanels } from "@/types/Styles";
import Point from "@/plottables/Point";
export class AddTangentLineThruPointCommand extends Command {
  private seTangentLineThruPoint: SETangentLineThruPoint;
  private parentSEPoint: SEPoint;
  private parentOneDimensional: SEOneDimensionalNotStraight;
  private seLabel: SELabel;

  constructor(
    seTangentLineThruPoint: SETangentLineThruPoint,
    parentSEPoint: SEPoint,
    parentOneDimensional: SEOneDimensionalNotStraight,
    seLabel: SELabel
  ) {
    super();
    this.seTangentLineThruPoint = seTangentLineThruPoint;
    this.parentSEPoint = parentSEPoint;
    this.parentOneDimensional = parentOneDimensional;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentSEPoint.registerChild(this.seTangentLineThruPoint);
    this.parentOneDimensional.registerChild(this.seTangentLineThruPoint);
    this.seTangentLineThruPoint.registerChild(this.seLabel);
    Command.store.addLine(this.seTangentLineThruPoint);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seTangentLineThruPoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeLine(this.lastState);
    this.seTangentLineThruPoint.unregisterChild(this.seLabel);
    this.parentOneDimensional.unregisterChild(this.seTangentLineThruPoint);
    this.parentSEPoint.unregisterChild(this.seTangentLineThruPoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddTangentLineThruPoint",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" +
        Command.symbolToASCIIDec(this.seTangentLineThruPoint.name),
      "objectExists=" + this.seTangentLineThruPoint.exists,
      "objectShowing=" + this.seTangentLineThruPoint.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seTangentLineThruPoint.ref.currentStyleState(
              StyleEditPanels.Front
            )
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seTangentLineThruPoint.ref.currentStyleState(
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
      "labelVector=" + this.seLabel.ref._locationVector.toFixed(7),
      "labelShowing=" + this.seLabel.showing,
      "labelExists=" + this.seLabel.exists,
      // Object specific attributes
      "tangentLineThruPointParentPointName=" + this.parentSEPoint.name,
      "tangentLineThruPointNormalVector=" +
        this.seTangentLineThruPoint.normalVector.toFixed(7),
      "tangentLineThruPointEndSEPointLocationVector=" +
        this.seTangentLineThruPoint.endSEPoint.locationVector.toFixed(7),
      "tangentLineThruPointParentOneDimensionalName=" +
        this.parentOneDimensional.name,
      "tangentLineThruPointIndex=" + this.seTangentLineThruPoint.index
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
    const tangentLineThruPointParentOneDimensional = objMap.get(
      propMap.get("tangentLineThruPointParentOneDimensionalName") ?? ""
    ) as SEOneDimensionalNotStraight | undefined;

    const tangentLineThruPointParentPoint = objMap.get(
      propMap.get("tangentLineThruPointParentPointName") ?? ""
    ) as SEPoint | undefined;

    const tangentLineThruPointEndSEPointLocation = new Vector3();
    tangentLineThruPointEndSEPointLocation.from(
      propMap.get("tangentLineThruPointEndSEPointLocationVector")
    );

    const tangentLineThruPointNormal = new Vector3();
    tangentLineThruPointNormal.from(
      propMap.get("tangentLineThruPointNormalVector")
    );

    const tangentLineThruPointIndex = Number(
      propMap.get("tangentLineThruPointIndex")
    );

    if (
      tangentLineThruPointParentPoint &&
      tangentLineThruPointParentOneDimensional &&
      tangentLineThruPointNormal.z !== 1 &&
      tangentLineThruPointEndSEPointLocation.z !== 1 &&
      !isNaN(tangentLineThruPointIndex)
    ) {
      //make the tangent Line
      const line = new NonFreeLine();
      // create the non-displayed not in the DAG End Point of the line
      const endPoint = new SEPoint(new Point());
      endPoint.locationVector = tangentLineThruPointEndSEPointLocation;
      endPoint.exists = true; //never changes
      endPoint.showing = false; // never changes

      const tangentLineThruPointLine = new SETangentLineThruPoint(
        line,
        tangentLineThruPointParentOneDimensional,
        tangentLineThruPointParentPoint,
        tangentLineThruPointNormal,
        endPoint,
        tangentLineThruPointIndex
      );
      //style the tangent Line
      const tangentThruPointLineFrontStyleString = propMap.get(
        "objectFrontStyle"
      );
      if (tangentThruPointLineFrontStyleString !== undefined)
        line.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(tangentThruPointLineFrontStyleString)
        );
      const tangentThruPointLineBackStyleString = propMap.get(
        "objectBackStyle"
      );
      if (tangentThruPointLineBackStyleString !== undefined)
        line.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(tangentThruPointLineBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const seLabel = new SELabel(label, tangentLineThruPointLine);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the circle in the object map
      if (propMap.get("objectName") !== undefined) {
        tangentLineThruPointLine.name = propMap.get("objectName") ?? "";
        tangentLineThruPointLine.showing =
          propMap.get("objectShowing") === "true";
        tangentLineThruPointLine.exists =
          propMap.get("objectExists") === "true";
        objMap.set(tangentLineThruPointLine.name, tangentLineThruPointLine);
      } else {
        throw new Error(
          "AddTangentLineThruPoint: Tangent Line Name doesn't exist"
        );
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddTangentLineThruPoint: Label Name doesn't exist");
      }
      return new AddTangentLineThruPointCommand(
        tangentLineThruPointLine,
        tangentLineThruPointParentPoint,
        tangentLineThruPointParentOneDimensional,
        seLabel
      );
    }

    throw new Error(
      `AddTangentLineThruPoint: ${tangentLineThruPointParentPoint}, ${tangentLineThruPointParentOneDimensional}, ${tangentLineThruPointIndex}, ${tangentLineThruPointNormal}, or ${tangentLineThruPointEndSEPointLocation}  is undefined`
    );
  }
}
