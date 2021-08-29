import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SavedNames, SEOneOrTwoDimensional } from "@/types";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { SESegment } from "@/models/SESegment";
import { SELine } from "@/models/SELine";
import { SEPolarPoint } from "@/models/SEPolarPoint";
import Point from "@/plottables/Point";
import { DisplayStyle } from "@/plottables/Nodule";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import Label from "@/plottables/Label";
import { SENSectPoint } from "@/models/SENSectPoint";
import NonFreePoint from "@/plottables/NonFreePoint";
import { SENSectLine } from "@/models/SENSectLine";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import NonFreeLine from "@/plottables/NonFreeLine";
import { StyleEditPanels } from "@/types/Styles";
import Line from "@/plottables/Line";

export class AddNSectLineCommand extends Command {
  private seNSectLine: SENSectLine;
  private parentAngle: SEAngleMarker;
  private seLabel: SELabel;
  constructor(
    seNSectLine: SENSectLine,
    parentAngle: SEAngleMarker,
    seLabel: SELabel
  ) {
    super();
    this.seNSectLine = seNSectLine;
    this.parentAngle = parentAngle;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentAngle.registerChild(this.seNSectLine);
    this.seNSectLine.registerChild(this.seLabel);
    if (SETTINGS.line.showLabelsOfNonFreeLinesInitially) {
      this.seLabel.showing = true;
    } else {
      this.seLabel.showing = false;
    }
    Command.store.addLine(this.seNSectLine);
    Command.store.addLabel(this.seLabel);
    this.seNSectLine.markKidsOutOfDate();
    this.seNSectLine.update();
  }

  saveState(): void {
    this.lastState = this.seNSectLine.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeLine(this.lastState);
    this.seNSectLine.unregisterChild(this.seLabel);
    this.parentAngle.unregisterChild(this.seNSectLine);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddNSectLine",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seNSectLine.name),
      "objectExists=" + this.seNSectLine.exists,
      "objectShowing=" + this.seNSectLine.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seNSectLine.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seNSectLine.ref.currentStyleState(StyleEditPanels.Back)
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
      "seNSectLineStartSEPointName=" + this.seNSectLine.startSEPoint.name,
      "seNSectLineEndSEPointLocationVector=" +
        this.seNSectLine.endSEPoint.locationVector.toFixed(7),
      "seNSectLineNormalVector=" + this.seNSectLine.normalVector.toFixed(7),
      "seNSectLineParentAngleName=" + this.parentAngle.name,
      "seNSectLineIndex=" + this.seNSectLine.index,
      "seNSectLineN=" + this.seNSectLine.N
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
    const seNSectLineParentAngle = objMap.get(
      propMap.get("seNSectLineParentAngleName") ?? ""
    ) as SEAngleMarker | undefined;

    const seNSectLineStartSEPoint = objMap.get(
      propMap.get("seNSectLineStartSEPointName") ?? ""
    ) as SEPoint | undefined;

    const seNSectLineEndSEPointLocation = new Vector3();
    seNSectLineEndSEPointLocation.from(
      propMap.get("seNSectLineEndSEPointLocationVector")
    );

    const seNSectLineNormalVector = new Vector3();
    seNSectLineNormalVector.from(propMap.get("seNSectLineNormalVector"));

    const seNSectLineIndex = Number(propMap.get("seNSectLineIndex"));
    const seNSectLineN = Number(propMap.get("seNSectLineN"));

    if (
      seNSectLineParentAngle &&
      seNSectLineStartSEPoint &&
      seNSectLineEndSEPointLocation.z !== 1 &&
      seNSectLineNormalVector.z !== 1 &&
      !isNaN(seNSectLineIndex) &&
      !isNaN(seNSectLineN)
    ) {
      //make the Nsect Line
      const line = new NonFreeLine();
      // create the non-displayed not in the DAG End Point of the line
      const endPoint = new SEPoint(new Point());
      endPoint.locationVector = seNSectLineEndSEPointLocation;
      endPoint.exists = true; //never changes
      endPoint.showing = false; // never changes

      const seNSectLine = new SENSectLine(
        line,
        seNSectLineStartSEPoint,
        seNSectLineNormalVector,
        endPoint,
        seNSectLineParentAngle,
        seNSectLineIndex,
        seNSectLineN
      );
      //style the NSect Line
      const nSectLineFrontStyleString = propMap.get("objectFrontStyle");
      if (nSectLineFrontStyleString !== undefined)
        line.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(nSectLineFrontStyleString)
        );
      const nSectLineBackStyleString = propMap.get("objectBackStyle");
      if (nSectLineBackStyleString !== undefined)
        line.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(nSectLineBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const seLabel = new SELabel(label, seNSectLine);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the circle in the object map
      if (propMap.get("objectName") !== undefined) {
        seNSectLine.name = propMap.get("objectName") ?? "";
        seNSectLine.showing = propMap.get("objectShowing") === "true";
        seNSectLine.exists = propMap.get("objectExists") === "true";
        objMap.set(seNSectLine.name, seNSectLine);
      } else {
        throw new Error("AddNSectLine: NSectLine Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddNSectLine: Label Name doesn't exist");
      }
      return new AddNSectLineCommand(
        seNSectLine,
        seNSectLineParentAngle,
        seLabel
      );
    }
    throw new Error(
      `AddNSectLine: ${seNSectLineEndSEPointLocation}, ${seNSectLineNormalVector}, ${seNSectLineIndex}, ${seNSectLineN}, ${seNSectLineParentAngle} or ${seNSectLineStartSEPoint} is undefined`
    );
  }
}
