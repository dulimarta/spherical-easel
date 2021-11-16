import { Command } from "./Command";
import { SELabel } from "@/models/SELabel";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SESegment } from "@/models/SESegment";
import { SENodule } from "@/models/SENodule";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import { Vector3 } from "three";
import { SavedNames } from "@/types";
import { SEPolygon } from "@/models/SEPolygon";
import Polygon from "@/plottables/Polygon";
import SETTINGS from "@/global-settings";
import { StyleEditPanels } from "@/types/Styles";

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
    this.sePolygon.markKidsOutOfDate();
    this.sePolygon.update();
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
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.sePolygon.name),
      "objectExists=" + this.sePolygon.exists,
      "objectShowing=" + this.sePolygon.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePolygon.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePolygon.ref.currentStyleState(StyleEditPanels.Back)
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
      "polygonAngleMarkerParentsNames=" +
        this.seAngleMarkerParents
          .map((n: SEAngleMarker) => Command.symbolToASCIIDec(n.name))
          .join("@"),
      "polygonSegmentParentsNames=" +
        this.seSegments
          .map((n: SESegment) => Command.symbolToASCIIDec(n.name))
          .join("@"),
      "polygonSegmentFlippedList=" +
        this.segmentIsFlipped.map(bool => bool.toString()).join("@")
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

    const tempPolygonAngleMarkerParents = propMap.get(
      "polygonAngleMarkerParentsNames"
    );
    const polygonAngleMarkerParents: (SEAngleMarker | undefined)[] = [];
    if (tempPolygonAngleMarkerParents) {
      tempPolygonAngleMarkerParents
        .split("@")
        .forEach(name =>
          polygonAngleMarkerParents.push(
            objMap.get(name) as SEAngleMarker | undefined
          )
        );
    }

    const tempPolygonSegmentParents = propMap.get("polygonSegmentParentsNames");
    const polygonSegmentParents: (SESegment | undefined)[] = [];
    if (tempPolygonSegmentParents) {
      tempPolygonSegmentParents
        .split("@")
        .forEach(name =>
          polygonSegmentParents.push(objMap.get(name) as SESegment | undefined)
        );
    }

    const tempPolygonSegmentFlippedList = propMap.get(
      "polygonSegmentFlippedList"
    );
    const polygonSegmentFlippedList: boolean[] = [];
    if (tempPolygonSegmentFlippedList) {
      tempPolygonSegmentFlippedList
        .split("@")
        .forEach(boolString =>
          polygonSegmentFlippedList.push(boolString === "true")
        );
    }

    if (
      polygonAngleMarkerParents.every(
        angleMarker => angleMarker !== undefined
      ) &&
      polygonSegmentParents.every(segment => segment !== undefined)
    ) {
      //make the polygon
      const polygon = new Polygon(
        polygonSegmentParents.map(seg => seg as SESegment),
        polygonSegmentFlippedList
      );
      const sePolygon = new SEPolygon(
        polygon,
        polygonSegmentParents.map(seg => seg as SESegment),
        polygonSegmentFlippedList,
        polygonAngleMarkerParents.map(ang => ang as SEAngleMarker)
      );

      //style the polygon
      const polygonFrontStyleString = propMap.get("objectFrontStyle");
      if (polygonFrontStyleString !== undefined)
        polygon.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(polygonFrontStyleString)
        );
      const polygonBackStyleString = propMap.get("objectBackStyle");
      if (polygonBackStyleString !== undefined)
        polygon.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(polygonBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const seLabel = new SELabel(label, sePolygon);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the Polygon in the object map
      if (propMap.get("objectName") !== undefined) {
        sePolygon.name = propMap.get("objectName") ?? "";
        sePolygon.showing = propMap.get("objectShowing") === "true";
        sePolygon.exists = propMap.get("objectExists") === "true";
        objMap.set(sePolygon.name, sePolygon);
      } else {
        throw new Error("AddPolygonCommand:  Polygon name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddPolygonCommand: Label Name doesn't exist");
      }
      return new AddPolygonCommand(
        sePolygon,
        polygonSegmentParents.map(seg => seg as SESegment),
        polygonSegmentFlippedList,
        polygonAngleMarkerParents.map(ang => ang as SEAngleMarker),
        seLabel
      );
    }
    throw new Error(
      `AddPolygon: 
      ${polygonAngleMarkerParents} or
      ${polygonSegmentParents} 
       is undefined`
    );
  }
}
