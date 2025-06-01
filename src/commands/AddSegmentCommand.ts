import { Command } from "./Command";
import { SESegment } from "@/models/SESegment";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import { SENodule } from "@/models/SENodule";
import { StyleCategory } from "@/types/Styles";
import { CommandReturnType, SavedNames } from "@/types";
import { toSVGType } from "@/types";

export class AddSegmentCommand extends Command {
  private seSegment: SESegment;
  private startSEPoint: SEPoint;
  private endSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(
    seSegment: SESegment,
    startSEPoint: SEPoint,
    endSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seSegment = seSegment;
    this.startSEPoint = startSEPoint;
    this.endSEPoint = endSEPoint;
    this.seLabel = seLabel;
  }

  do(): CommandReturnType {
    this.startSEPoint.registerChild(this.seSegment);
    this.endSEPoint.registerChild(this.seSegment);
    this.seSegment.registerChild(this.seLabel);
    Command.store.addSegment(this.seSegment);
    Command.store.addLabel(this.seLabel);
    return { success: true };
  }

  saveState(): void {
    this.lastState = this.seSegment.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeSegment(this.lastState);
    this.seSegment.unregisterChild(this.seLabel);
    this.startSEPoint.unregisterChild(this.seSegment);
    this.endSEPoint.unregisterChild(this.seSegment);
  }

  getSVGObjectLabelPairs(): [SENodule, SELabel][] {
    return [[this.seSegment, this.seLabel]];
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddSegment",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seSegment.name),
      "objectExists=" + this.seSegment.exists,
      "objectShowing=" + this.seSegment.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seSegment.ref.currentStyleState(StyleCategory.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seSegment.ref.currentStyleState(StyleCategory.Back)
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
      "segmentNormalVector=" + this.seSegment.normalVector.toFixed(9),
      "segmentArcLength=" + this.seSegment.arcLength,
      "segmentStartPointName=" + this.startSEPoint.name,
      "segmentEndPointName=" + this.endSEPoint.name
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
    const segmentStartPoint = objMap.get(
      propMap.get("segmentStartPointName") ?? ""
    ) as SEPoint | undefined;

    const segmentEndPoint = objMap.get(
      propMap.get("segmentEndPointName") ?? ""
    ) as SEPoint | undefined;

    const segmentNormalVector = new Vector3();
    segmentNormalVector.from(propMap.get("segmentNormalVector")); // convert to vector, if .from() fails the vector is set to 0,0,1

    const segmentArcLength = Number(propMap.get("segmentArcLength"));

    if (
      segmentEndPoint &&
      segmentStartPoint &&
      segmentNormalVector.z !== 1 &&
      !isNaN(segmentArcLength)
    ) {
      //make the segment
      const seSegment = new SESegment(
        segmentStartPoint,
        segmentNormalVector,
        segmentArcLength,
        segmentEndPoint
      );
      //style the segment
      const segmentFrontStyleString = propMap.get("objectFrontStyle");
      if (segmentFrontStyleString !== undefined)
        seSegment.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(segmentFrontStyleString)
        );
      const segmentBackStyleString = propMap.get("objectBackStyle");
      if (segmentBackStyleString !== undefined)
        seSegment.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(segmentBackStyleString)
        );

      // SESegment requires a call to its shallowUpdate
      // so its plottable is initialized properly
      // Update: the shallowUpdate call is not needed anymore after
      // adding updateDisplay() call in SESegment constructor
      // seSegment.shallowUpdate()

      //make the label and set its location
      const seLabel = new SELabel("segment", seSegment);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector = seLabelLocation; // Don't use copy() on a prop
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        seLabel.updatePlottableStyle(
          StyleCategory.Label,
          JSON.parse(labelStyleString)
        );

      //put the segment in the object map
      if (propMap.get("objectName") !== undefined) {
        seSegment.name = propMap.get("objectName") ?? "";
        seSegment.showing = propMap.get("objectShowing") === "true";
        seSegment.exists = propMap.get("objectExists") === "true";
        objMap.set(seSegment.name, seSegment);
      } else {
        throw new Error("AddSegment: Segment Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddSegment: Label Name doesn't exist");
      }
      return new AddSegmentCommand(
        seSegment,
        segmentStartPoint,
        segmentEndPoint,
        seLabel
      );
    }
    throw new Error(
      `AddSegment: ${segmentEndPoint}, ${segmentStartPoint}, ${segmentArcLength}, or ${segmentNormalVector}  is undefined`
    );
  }
}
