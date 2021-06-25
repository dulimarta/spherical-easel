import { Command } from "./Command";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";

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

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
