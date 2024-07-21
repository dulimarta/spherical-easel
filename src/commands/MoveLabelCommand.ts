import { Command } from "./Command";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import { toSVGType } from "@/types";

export class MoveLabelCommand extends Command {
  private seLabel: SELabel;
  private oldLocationVector = new Vector3();
  private newLocationVector = new Vector3();

  constructor(
    seLabel: SELabel,
    oldLocationVector: Vector3,
    newLocationVector: Vector3
  ) {
    super();
    this.seLabel = seLabel;
    this.oldLocationVector.copy(oldLocationVector);
    this.newLocationVector.copy(newLocationVector);
  }

  do(): void {
    Command.store.moveLabel({
      labelId: this.seLabel.id,
      location: this.newLocationVector
    });
  }

  saveState(): void {
    this.lastState = this.seLabel.id;
  }

  restoreState(): void {
    Command.store.moveLabel({
      labelId: this.lastState,
      location: this.oldLocationVector
    });
  }

  toSVG(deletedNoduleIds: Array<number>): null | toSVGType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
