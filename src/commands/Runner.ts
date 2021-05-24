import { SELabel } from "@/models/SELabel";
import { SEPoint } from "@/models/SEPoint";
import Label from "@/plottables/Label";
import { DisplayStyle } from "@/plottables/Nodule";
import Point from "@/plottables/Point";
import { Vector3 } from "three";
import { AddPointCommand } from "./AddPointCommand";
import SETTINGS from "@/global-settings";
import { UpdateMode } from "@/types";

function executeIndividual(commandTokens: Array<string>): void {
  switch (commandTokens[0] /* First token is ALWAYS the command name */) {
    case "AddPoint":
      {
        // 2nd token: point name
        // 3rd token: 3D location vector
        // 4th token: label info
        console.log("Create point at", commandTokens[2]);
        const location = commandTokens[2]
          .replaceAll(/[()]/g, "") // remove enclosing parentheses
          .split(",") // split the x, y, z coordinates
          .map(Number); // convert to Number
        const newPoint = new Point();
        newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
        newPoint.adjustSize();
        const newLabel = new Label();
        const vtx = new SEPoint(newPoint);
        vtx.locationVector.set(location[0], location[1], location[2]);
        const newSELabel = new SELabel(newLabel, vtx);
        newSELabel.locationVector.copy(vtx.locationVector);
        newSELabel.locationVector
          .add(
            new Vector3(
              2 * SETTINGS.point.initialLabelOffset,
              SETTINGS.point.initialLabelOffset,
              0
            )
          )
          .normalize();

        new AddPointCommand(vtx, newSELabel).execute();
        // Thanks to Will for suggesting the following magic line
        // that makes the objects show up correctly on the canvas
        vtx.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      }
      break;
    default:
      console.log("Unimplemented", commandTokens[0]);
  }
}

/**
 * Reinterpret the command from its script.  The incoming argument
 * is either a string or an array of strings
 *
 * @param command a string that represents a single command or
 *   an array of strings that represents a command group
 */
export function interpret(command: string | Array<string>): void {
  if (typeof command === "string") {
    /* This is an individual command */
    executeIndividual(command.split(" "));
  } else {
    // This is a CommandGroup, interpret each command individually
    command
      // Remove leading and training quotes
      .map((s: string) => s.replace(/^"/, "").replace(/"$/, ""))
      .forEach((c: string, gPos: number) => {
        executeIndividual(c.split(" "));
      });
  }
}
