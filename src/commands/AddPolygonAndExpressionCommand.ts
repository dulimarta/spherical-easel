import { Command } from "./Command";
import { SELabel } from "@/models/SELabel";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SESegment } from "@/models/SESegment";
import { SENodule } from "@/models/SENodule";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import { Vector3 } from "three";
import { UpdateMode } from "@/types";
import { SEPolygon } from "@/models/SEPolygon";
import Polygon from "@/plottables/Polygon";
import SETTINGS from "@/global-settings";

export class AddPolygonCommand extends Command {
  /**
   * The model SE angle markers that are the parents of this polygon This is never undefined.
   */
  private seAngleMarkerParents: SEAngleMarker[] = [];

  /**
   * The line segments making up this polygon
   */
  private seSegments: SESegment[] = [];

  /**
   * The flipped list for this collection of segments
   */
  private segmentIsFlipped: boolean[] = [];

  //The label of this polygon
  private seLabel: SELabel;

  //The SEPolygon
  private sePolygon: SEPolygon;

  constructor(
    sePolygon: SEPolygon,
    seSegments: SESegment[],
    segmentIsFlipped: boolean[],
    seAngleMarkerParents: SEAngleMarker[],
    seLabel: SELabel
  ) {
    super();
    this.seAngleMarkerParents.push(...seAngleMarkerParents);
    this.seSegments.push(...seSegments);
    this.sePolygon = sePolygon;
    this.seLabel = seLabel;
    this.segmentIsFlipped.push(...segmentIsFlipped);
  }

  do(): void {
    this.seAngleMarkerParents.forEach(angMar =>
      angMar.registerChild(this.sePolygon)
    );
    this.sePolygon.registerChild(this.seLabel);
    Command.store.addPolygonAndExpression(this.sePolygon);
    Command.store.addLabel(this.seLabel);
    this.sePolygon.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }

  saveState(): void {
    this.lastState = this.sePolygon.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removePolygonAndExpression(this.lastState);
    this.sePolygon.unregisterChild(this.seLabel);
    this.seAngleMarkerParents.forEach(angMar =>
      angMar.unregisterChild(this.sePolygon)
    );
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddPolygon",
      /* arg-1 */ this.sePolygon.name,
      /* arg-2 */ this.sePolygon.showing,
      /* arg-3 */ this.sePolygon.exists,
      /* arg-4 */ this.seAngleMarkerParents
        .map((n: SEAngleMarker) => n.name)
        .join("@"),
      /* arg-5 */ this.seLabel.name,
      /* arg-6 */ this.seLabel.exists,
      /* arg-7 */ this.seLabel.showing,
      /* arg-8 */ this.seSegments.map((n: SESegment) => n.name).join("@"),
      /* arg-9 */ this.segmentIsFlipped
        .map((bool: boolean) => String(bool))
        .join("@")
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const seAngleMarkerParents: (SEAngleMarker | undefined)[] = [];
    const angleMarkerParentNames = tokens[4] !== "" ? tokens[4].split("@") : [];
    angleMarkerParentNames.forEach(name =>
      seAngleMarkerParents.push(objMap.get(name) as SEAngleMarker | undefined)
    );
    const seSegments: (SESegment | undefined)[] = [];
    const seSegmentNames = tokens[8] !== "" ? tokens[8].split("@") : [];
    seSegmentNames.forEach(name =>
      seSegments.push(objMap.get(name) as SESegment | undefined)
    );
    const segmentIsFlipped: (boolean | undefined)[] = [];
    const segmentIsFlippedStrings =
      tokens[9] !== "" ? tokens[9].split("@") : [];
    segmentIsFlippedStrings.forEach(string =>
      segmentIsFlipped.push(string === "true")
    );
    // In the following if-statement we don't check the existence
    // of the third parent because it may be undefined
    if (seAngleMarkerParents.every(angMark => angMark?.exists)) {
      if (seSegments.every(seg => seg?.exists)) {
        const polygon = new Polygon(
          seSegments.map(seg => seg as SESegment), //.map(seg => seg.ref),
          segmentIsFlipped.map(bool => bool as boolean)
        );
        // Set the display to the default values
        polygon.stylize(DisplayStyle.ApplyCurrentVariables);
        // Adjust the stroke width to the current zoom magnification factor
        polygon.adjustSize();
        polygon.updateDisplay();

        // Create the plottable and model label
        const newPolygon = new SEPolygon(
          polygon,
          seSegments.map(seg => seg as SESegment),
          segmentIsFlipped.map(bool => bool as boolean),
          seAngleMarkerParents.map(angMar => angMar as SEAngleMarker)
        );
        newPolygon.name = tokens[1];
        objMap.set(tokens[1], newPolygon);
        newPolygon.glowing = false;
        newPolygon.update({
          mode: UpdateMode.DisplayOnly,
          stateArray: []
        });
        newPolygon.showing = tokens[2] === "true";
        newPolygon.exists = tokens[3] === "true";

        const seLabel = new SELabel(new Label(), newPolygon);
        // Set the initial label location at the start of the curve
        const labelPosition = new Vector3();
        labelPosition
          .copy((seSegments[0] as SESegment).startSEPoint.locationVector)
          .add(new Vector3(0, SETTINGS.polygon.initialLabelOffset, 0))
          .normalize();
        seLabel.locationVector = labelPosition;
        seLabel.showing = tokens[7] === "true";
        seLabel.exists = tokens[6] === "true";
        seLabel.name = tokens[5];
        objMap.set(tokens[5], seLabel);
        return new AddPolygonCommand(
          newPolygon,
          seSegments.map(seg => seg as SESegment),
          segmentIsFlipped.map(bool => bool as boolean),
          seAngleMarkerParents.map(angMar => angMar as SEAngleMarker),
          seLabel
        );
      } else
        throw new Error(
          `AddPolygon: At least one of the segments in the polygon, ${seSegmentNames}, is undefined`
        );
    } else
      throw new Error(
        `AddPolygon: At least one of the angle marker parents, ${angleMarkerParentNames}, is undefined`
      );
  }
}
