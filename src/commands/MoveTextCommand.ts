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

    console.log(`oldLocationVector = ${oldLocationVector.toFixed(3)}`);
    console.log(`newLocationVector = ${newLocationVector.toFixed(3)}`);
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
    console.log(`MoveTextCommand.restoreState(): ${this.oldLocationVector.toFixed(3)}`);
    Command.store.moveText({
      textId: this.seText.id,
      location: this.oldLocationVector
    });
    this.seText.shallowUpdate();
  }

  toOpcode(): null | string | Array<string> {
    return null;
  }
}
