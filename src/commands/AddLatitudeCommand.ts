import { Command } from "./Command";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import { SavedNames } from "@/types";
import { SENodule } from "@/models/SENodule";
import { StyleCategory } from "@/types/Styles";
import { SELatitude } from "@/models/SELatitude";
import { toSVGType } from "@/types";

export class AddLatitudeCommand extends Command {
  private seLatitude: SELatitude;
  private seLabel: SELabel;
  private latitude: number;

  constructor(seLatitude: SELatitude, seLabel: SELabel) {
    super();
    this.seLatitude = seLatitude;
    this.latitude = this.seLatitude.latitude;
    this.seLabel = seLabel;
  }

  do(): void {
    Command.store.addLabel(this.seLabel);
    this.seLatitude.registerChild(this.seLabel);
    Command.store.addCircle(this.seLatitude);
  }

  saveState(): void {
    this.lastState = this.seLatitude.id;
  }

  restoreState(): void {
    Command.store.removeCircle(this.lastState);
    this.seLatitude.unregisterChild(this.seLabel);
    Command.store.removeLabel(this.seLabel.id);
  }

  getSVGObjectLabelPairs(): [SENodule, SELabel][] {
    return [[this.seLatitude, this.seLabel]];
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddLatitude",
      // Any attribute that could possibly have a "= or "&" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seLatitude.name),
      "objectExists=" + this.seLatitude.exists,
      "objectShowing=" + this.seLatitude.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seLatitude.ref.currentStyleState(StyleCategory.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seLatitude.ref.currentStyleState(StyleCategory.Back)
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
      "earthLatitude=" + this.seLatitude.latitude.toFixed(9)
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
    //make the circle
    const pointFrontStyleString = propMap.get("objectFrontStyle");
    const pointBackStyleString = propMap.get("objectBackStyle");
    const latitude = Number(propMap.get("earthLatitude"));
    if (!Number.isNaN(latitude)) {
      const seLatitude = new SELatitude(latitude);
      // console.debug(`Point front style string ${pointFrontStyleString}`);
      if (pointFrontStyleString !== undefined) {
        seLatitude.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(pointFrontStyleString)
        );
      }
      // console.debug(`Point back style string ${pointBackStyleString}`);
      if (pointBackStyleString !== undefined) {
        seLatitude.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(pointBackStyleString)
        );
      }

      //make the label
      const seLabel = new SELabel("circle", seLatitude);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector = seLabelLocation; // Don't use copy on a prop
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
        seLatitude.name = propMap.get("objectName") ?? "";
        seLatitude.showing = propMap.get("objectShowing") === "true";
        seLatitude.exists = propMap.get("objectExists") === "true";
        objMap.set(seLatitude.name, seLatitude);
      } else {
        throw new Error("AddLatitude: Circle name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddLatitude: Label Name doesn't exist");
      }
      return new AddLatitudeCommand(seLatitude, seLabel);
    } else {
      throw new Error("AddLatitudeCommand: Latitude undefined");
    }
  }
}
