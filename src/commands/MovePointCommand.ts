import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { Vector3 } from "three";
import { toSVGReturnType } from "@/types";

export class MovePointCommand extends Command {
  private sePoint: SEPoint;
  private oldLocationVector = new Vector3();
  private newLocationVector = new Vector3();

  constructor(
    sePoint: SEPoint,
    oldLocationVector: Vector3,
    newLocationVector: Vector3
  ) {
    super();
    this.sePoint = sePoint;
    this.oldLocationVector.copy(oldLocationVector);
    this.newLocationVector.copy(newLocationVector);
  }

  do(): void {
    Command.store.movePoint({
      pointId: this.sePoint.id,
      location: this.newLocationVector
    });
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    Command.store.movePoint({
      pointId: this.lastState,
      location: this.oldLocationVector
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
