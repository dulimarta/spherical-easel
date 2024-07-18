import { Command } from "./Command";
import { SELine } from "@/models/SELine";
import { Vector3 } from "three";
import { toSVGReturnType } from "@/types";

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

  toSVG(deletedNoduleIds: Array<number>): null | toSVGReturnType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
  }


  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
