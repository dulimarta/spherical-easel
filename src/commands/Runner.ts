import { SELabel } from "@/models/SELabel";
import { SEPoint } from "@/models/SEPoint";
import Label from "@/plottables/Label";
import Point from "@/plottables/Point";
import { AddPointCommand } from "./AddPointCommand";

function executeIndivitual(commandTokens: Array<string>): void {
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
        const newLabel = new Label();
        const vtx = new SEPoint(newPoint);
        vtx.locationVector.set(location[0], location[1], location[2]);
        const newSELabel = new SELabel(newLabel, vtx);
        new AddPointCommand(vtx, newSELabel).execute();
      }
      break;
    default:
      console.log("Unimplemented", commandTokens[0]);
  }
}

export function interpret(command: string | Array<string>): void {
  console.log("Interpret", command);
  if (typeof command === "string") {
    executeIndivitual(command.split(" "));
  } else {
    command.forEach((c: string) => executeIndivitual(c.split(" ")));
  }
}
