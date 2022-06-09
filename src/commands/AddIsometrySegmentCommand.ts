import { Command } from "./Command";
import { SECircle } from "@/models/SECircle";
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
import { SESegment } from "@/models/SESegment";
import { SEIsometrySegment } from "@/models/SEIsometrySegment";
import NonFreeSegment from "@/plottables/NonFreeSegment";

export class AddIsometrySegmentCommand extends Command {
  private preimageSESegment: SESegment;
  private parentIsometry: SEIsometry;
  private isometrySESegment: SEIsometrySegment;
  private isometrySESegmentLabel: SELabel;

  constructor(
    isometrySESegment: SEIsometrySegment,
    isometrySESegmentLabel: SELabel,
    preimageSESegment: SESegment,
    parentIsometry: SEIsometry
  ) {
    super();
    this.preimageSESegment = preimageSESegment;
    this.isometrySESegment = isometrySESegment;
    this.parentIsometry = parentIsometry;
    this.isometrySESegmentLabel = isometrySESegmentLabel;
  }

  do(): void {
    this.preimageSESegment.registerChild(this.isometrySESegment);
    this.parentIsometry.registerChild(this.isometrySESegment);
    this.isometrySESegment.registerChild(this.isometrySESegmentLabel);
    Command.store.addSegment(this.isometrySESegment);
    Command.store.addLabel(this.isometrySESegmentLabel);
  }

  saveState(): void {
    this.lastState = this.isometrySESegment.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.isometrySESegmentLabel.id);
    Command.store.removePoint(this.lastState);
    this.isometrySESegment.unregisterChild(this.isometrySESegmentLabel);
    this.parentIsometry.unregisterChild(this.isometrySESegment);
    this.preimageSESegment.unregisterChild(this.isometrySESegment);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddIsometrySegment",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.isometrySESegment.name),
      "objectExists=" + this.isometrySESegment.exists,
      "objectShowing=" + this.isometrySESegment.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.isometrySESegment.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.isometrySESegment.ref.currentStyleState(StyleEditPanels.Back)
          )
        ),
      // All labels have these attributes
      "labelName=" + Command.symbolToASCIIDec(this.isometrySESegmentLabel.name),
      "labelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.isometrySESegmentLabel.ref.currentStyleState(
              StyleEditPanels.Label
            )
          )
        ),
      "labelVector=" +
        this.isometrySESegmentLabel.ref._locationVector.toFixed(7),
      "labelShowing=" + this.isometrySESegmentLabel.showing,
      "labelExists=" + this.isometrySESegmentLabel.exists,
      // Object specific attributes
      "isometrySegmentParentName=" + this.preimageSESegment.name,
      "isometrySegmentParentIsometryName=" + this.parentIsometry.name,
      "isometrySegmentStartSEPointName=" +
        Command.symbolToASCIIDec(this.isometrySESegment.startSEPoint.name),
      "isometrySegmentEndSEPointName=" +
        Command.symbolToASCIIDec(this.isometrySESegment.endSEPoint.name)
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
    const parentSESegment = objMap.get(
      propMap.get("isometrySegmentParentName") ?? ""
    ) as SESegment | undefined;

    const isometrySegmentParentIsometry = objMap.get(
      propMap.get("isometrySegmentParentIsometryName") ?? ""
    ) as SEIsometry | undefined;

    const isometrySegmentStartPoint = objMap.get(
      propMap.get("isometrySegmentStartSEPointName") ?? ""
    ) as SETransformedPoint | undefined;

    const isometrySegmentEndPoint = objMap.get(
      propMap.get("isometrySegmentEndSEPointName") ?? ""
    ) as SETransformedPoint | undefined;

    if (
      parentSESegment &&
      isometrySegmentParentIsometry &&
      isometrySegmentEndPoint &&
      isometrySegmentStartPoint
    ) {
      //make the segment
      const seg = new NonFreeSegment();
      const isometrySESegment = new SEIsometrySegment(
        seg,
        isometrySegmentStartPoint,
        isometrySegmentParentIsometry.f(parentSESegment.normalVector),
        parentSESegment.arcLength,
        isometrySegmentEndPoint,
        parentSESegment,
        isometrySegmentParentIsometry
      );
      //style the Segment
      const segmentFrontStyleString = propMap.get("objectFrontStyle");
      if (segmentFrontStyleString !== undefined)
        seg.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(segmentFrontStyleString)
        );
      const segmentBackStyleString = propMap.get("objectBackStyle");
      if (segmentBackStyleString !== undefined)
        seg.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(segmentBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const isometrySESegmentLabel = new SELabel(label, isometrySESegment);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      isometrySESegmentLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the segment in the object map
      if (propMap.get("objectName") !== undefined) {
        isometrySESegment.name = propMap.get("objectName") ?? "";
        isometrySESegment.showing = propMap.get("objectShowing") === "true";
        isometrySESegment.exists = propMap.get("objectExists") === "true";
        objMap.set(isometrySESegment.name, isometrySESegment);
      } else {
        throw new Error("AddIsometrySESegment: Segment Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        isometrySESegmentLabel.name = propMap.get("labelName") ?? "";
        isometrySESegmentLabel.showing = propMap.get("labelShowing") === "true";
        isometrySESegmentLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(isometrySESegmentLabel.name, isometrySESegmentLabel);
      } else {
        throw new Error("AddIsometrySESegment: Label Name doesn't exist");
      }
      return new AddIsometrySegmentCommand(
        isometrySESegment,
        isometrySESegmentLabel,
        parentSESegment,
        isometrySegmentParentIsometry
      );
    }
    throw new Error(
      `AddIsometrySegment: ${parentSESegment} or ${isometrySegmentParentIsometry} or ${isometrySegmentStartPoint} or ${isometrySegmentEndPoint} is undefined`
    );
  }
}
