import { Command } from "./Command";
import { SELine } from "@/models-spherical/SELine";
import { Vector3 } from "three";
import { toSVGType } from "@/types";

export class MoveLineCommand extends Command {
  private seLine: SELine;
  private oldNormalVector = new Vector3();
  private newNormalVector = new Vector3();

  constructor(
    seLine: SELine,
    oldNormalVector: Vector3,
    newNormalVector: Vector3
  ) {
    super();
    this.seLine = seLine;
    this.oldNormalVector.copy(oldNormalVector);
    this.newNormalVector.copy(newNormalVector);
  }

  do(): void {
    Command.store.changeLineNormalVector({
      lineId: this.seLine.id,
      normal: this.newNormalVector
    });
  }

  saveState(): void {
    this.lastState = this.seLine.id;
  }

  restoreState(): void {
    Command.store.changeLineNormalVector({
      lineId: this.lastState,
      normal: this.oldNormalVector
    });
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
