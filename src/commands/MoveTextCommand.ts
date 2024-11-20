import { Command } from "./Command";
import { SEText } from "@/models/SEText";
import { Vector3 } from "three";

export class MoveTextCommand extends Command {
  private seText: SEText;
  private oldLocationVector = new Vector3;
  private newLocationVector = new Vector3;

  constructor(
    seText: SEText,
    oldLocationVector: Vector3,
    newLocationVector: Vector3
  ) {
    super();
    this.seText = seText;
    this.oldLocationVector.copy(oldLocationVector);
    this.newLocationVector.copy(newLocationVector);
  }

  do(): void {
    Command.store.moveText({
      textId: this.seText.id,
      location: this.newLocationVector
    });
  }

  saveState(): void {
    this.lastState = this.seText.id;
  }

  restoreState(): void {
    Command.store.moveText({
      textId: this.lastState,
      location: this.oldLocationVector
    });
  }

  toOpcode(): null | string | Array<string> {
    return null;
  }
}
