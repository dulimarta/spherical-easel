import { Vector3 } from "three";
import { Command } from "./Command";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { HELine } from "@/models-hyperbolic/HELine";

export class AddHyperbolicLineCommand extends Command {
  startPoint: HEPoint;
  endPoint: HEPoint;
  line: HELine;
  constructor(startPosition: Vector3, endPosition: Vector3) {
    super();
    this.startPoint = new HEPoint(startPosition);
    this.endPoint = new HEPoint(endPosition);
    this.line = new HELine(startPosition, endPosition, false);
  }
  restoreState(preventGraphicalUpdate?: boolean): void {
    Command.hstore.removeLine(this.line);
    Command.hstore.removePoint(this.endPoint);
    Command.hstore.removePoint(this.startPoint);
  }
  saveState(): void {
    // throw new Error("Method not implemented.");
  }
  do(preventGraphicalUpdate?: boolean): void {
    Command.hstore.addPoint(this.startPoint);
    Command.hstore.addPoint(this.endPoint);
    Command.hstore.addLine(this.line);
  }
  toOpcode(): null | string | Array<string> {
    throw new Error("Method not implemented.");
  }
}
