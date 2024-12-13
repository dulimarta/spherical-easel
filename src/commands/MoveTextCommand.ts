import { Command } from "./Command";
import { SEText } from "@/models/SEText";
import { Vector2, Vector3 } from "three";

export class MoveTextCommand extends Command {
  private seText: SEText;
  private oldLocationVector = new Vector2;
  private newLocationVector = new Vector2;

  constructor(
    seText: SEText,
    oldLocationVector: Vector2,
    newLocationVector: Vector2
  ) {
    super();
    this.seText = seText;
    this.oldLocationVector.copy(oldLocationVector);
    this.newLocationVector.copy(newLocationVector);

    // console.log(`oldLocationVector = ${oldLocationVector.toFixed(3)}`);
    // console.log(`newLocationVector = ${newLocationVector.toFixed(3)}`);
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
    // console.log(`MoveTextCommand.restoreState(): ${this.oldLocationVector.toFixed(3)}`);
    Command.store.moveText({
      textId: this.seText.id,
      location: this.oldLocationVector
    });
    this.seText.shallowUpdate();
  }

  toOpcode(): null | string | Array<string> {
    // Not needed the current location of the text is exported when dumpOpCode is called.
    return null;
  }
}
