import { Command } from "./Command";
import { SELabel } from "@/models-spherical/SELabel";
import { Vector3 } from "three";
import { SavedNames } from "@/types";
import { SENodule } from "@/models-spherical/SENodule";
import { StyleCategory } from "@/types/Styles";
import { SELongitude } from "@/models-spherical/SELongitude";
import { toSVGType } from "@/types";

export class AddLongitudeCommand extends Command {
  private seLongitude: SELongitude;
  private seLabel: SELabel;
  private longitude: number;

  constructor(seLongitude: SELongitude, seLabel: SELabel) {
    super();
    this.seLongitude = seLongitude;
    this.longitude = this.seLongitude.longitude;
    this.seLabel = seLabel;
  }

  do(): void {
    Command.store.addLabel(this.seLabel);
    this.seLongitude.registerChild(this.seLabel);
    Command.store.addSegment(this.seLongitude);
  }

  saveState(): void {
    this.lastState = this.seLongitude.id;
  }

  restoreState(): void {
    Command.store.removeSegment(this.lastState);
    this.seLongitude.unregisterChild(this.seLabel);
    Command.store.removeLabel(this.seLabel.id);
  }

  getSVGObjectLabelPairs(): [SENodule, SELabel][] {
    return [[this.seLongitude, this.seLabel]];
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddLongitude",
      // Any attribute that could possibly have a "= or "&" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seLongitude.name),
      "objectExists=" + this.seLongitude.exists,
      "objectShowing=" + this.seLongitude.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seLongitude.ref.currentStyleState(StyleCategory.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seLongitude.ref.currentStyleState(StyleCategory.Back)
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
      "earthLongitude=" + this.seLongitude.longitude.toFixed(9)
    ].join("&");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("&");
    const propMap = new Map<SavedNames, string>();
    // load the tokens into the map
    tokens.forEach((token, ind) => {
      if (ind === 0) return; // don't put the command type in the propMap
      const parts = token.split("=");
      propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
    });
    //make the segment
    const pointFrontStyleString = propMap.get("objectFrontStyle");
    const pointBackStyleString = propMap.get("objectBackStyle");
    const longitude = Number(propMap.get("earthLongitude"));
    if (longitude !== undefined) {
      const seLongitude = new SELongitude(longitude);
      // console.debug(`Point front style string ${pointFrontStyleString}`);
      if (pointFrontStyleString !== undefined) {
        seLongitude.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(pointFrontStyleString)
        );
      }
      // console.debug(`Point back style string ${pointBackStyleString}`);
      if (pointBackStyleString !== undefined) {
        seLongitude.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(pointBackStyleString)
        );
      }

      //make the label
      const seLabel = new SELabel("segment", seLongitude);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector = seLabelLocation; // Don't use copy() on a prop
      const labelStyleString = propMap.get("labelStyle");
      // console.debug(`Point label style string ${labelStyleString}`);
      if (labelStyleString !== undefined) {
        seLabel.updatePlottableStyle(
          StyleCategory.Label,
          JSON.parse(labelStyleString)
        );
      }

      //put the circle in the object map
      if (propMap.get("objectName") !== undefined) {
        // console.debug(
        //   `old name ${seEarthPoint.name}, new name ${propMap.get("objectName")}`
        // );
        seLongitude.name = propMap.get("objectName") ?? "";
        seLongitude.showing = propMap.get("objectShowing") === "true";
        seLongitude.exists = propMap.get("objectExists") === "true";
        objMap.set(seLongitude.name, seLongitude);
      } else {
        throw new Error("AddLongitude: Segment name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddLongitude: Label Name doesn't exist");
      }
      return new AddLongitudeCommand(seLongitude, seLabel);
    } else {
      throw new Error("AddLongitudeCommand: Longitude undefined");
    }
  }
}
