// Use the following template as a starter for a new Command
import { SEText } from "@/models/SEText";
import { Command } from "./Command";
import { SavedNames } from "@/types";
import { SELabel, SENodule } from "@/models/internal";
import { Vector2, Vector3 } from "three";
import { StyleCategory } from "@/types/Styles";

export class AddTextCommand extends Command {
  private seText: SEText;
  constructor(txt: SEText) {
    super();
    this.seText = txt;
  }

  do(): void {
    Command.store.addText(this.seText);
  }

  saveState(): void {
    this.lastState = this.seText.id;
  }

  restoreState(): void {
    Command.store.removeText(this.seText.id);
  }
  
  getSVGObjectLabelPairs(): [SENodule, SELabel|null][] {
      return [[this.seText, null]];
    }

  toOpcode(): null | string | Array<string> {
    return [
      "AddText",
      // Any attribute that could possibly have a "= or "&" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seText.name),
      "objectExists=" + this.seText.exists, // should always be true
      "objectShowing=" + this.seText.showing,
      "textStyle=" +
      Command.symbolToASCIIDec(
        JSON.stringify(
          this.seText.ref.currentStyleState(StyleCategory.Label)
        )
        ), //textStyle include the current string that is displayed
      // Object specific attributes
      "pointVector=" + this.seText.locationVector.toFixed(9),
      //"textObjectText=" + Command.symbolToASCIIDec(this.seText.text)//This is now stored in the label style
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
    //make the text
    const seText = new SEText();
    const seTextLocation = new Vector2();
    seTextLocation.from(propMap.get("pointVector")); // convert to vector
    // const pointFrontStyleString = propMap.get("objectFrontStyle");
    // const pointBackStyleString = propMap.get("objectBackStyle");
    seText.locationVector = seTextLocation;
    // const tempText = propMap.get("textObjectText");
    // if (tempText != undefined) {
    //   seText.text = tempText;
    // } else {
    //   throw new Error("AddTextCommand: Undefined text ");
    // }
    // textStyleString stores the text-string of the text object and the styling.
    const textStyleString = propMap.get("textStyle");
    // console.debug(`Point front style string ${pointFrontStyleString}`);
    if (textStyleString !== undefined) {
      seText.updatePlottableStyle(
        StyleCategory.Label,
        JSON.parse(textStyleString)
      ); // this updates the displayed text
    }  else {
      throw new Error("AddTextCommand: No text style string.");
    }

    // text has no children so no need to put the text in the object map
    if (propMap.get("objectName") !== undefined) {
      seText.name = propMap.get("objectName") ?? "";
      seText.showing = propMap.get("objectShowing") === "true";
      seText.exists = propMap.get("objectExists") === "true";
    }  else {
      throw new Error("AddTextCommand: Undefined Object Name");
    }

    return new AddTextCommand(seText);
  }
}
